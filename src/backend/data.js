import wixData from 'wix-data';
import { sendMemberNotification, sendAdminNotification, NOTIFICATION_TYPES } from 'backend/notificationService';
import { COLLECTIONS } from 'public/collectionIds';
import { notifyGASOfNewIntake } from './gasIntegration.jsw';

/**
 * Hook: Cases - After Insert
 * Trigger "Welcome" notification to new defendants.
 */
export async function Cases_afterInsert(item, context) {
    try {
        console.log(`🪝 Hook: Cases_afterInsert for Case ${item.caseNumber}`);

        if (item.email) {
            await sendMemberNotification(NOTIFICATION_TYPES.WELCOME, {
                memberId: item.memberId,
                memberEmail: item.email,
                memberName: item.defendantName,
                memberPhone: item.defendantPhone,
                variables: {
                    caseNumber: item.caseNumber,
                    county: item.county
                }
            });
            console.log(`✅ Welcome notification triggered for ${item.email}`);
        }
    } catch (error) {
        console.error('❌ Cases_afterInsert failed:', error);
    }

    return item;
}

/**
 * Hook: IntakeQueue - Before Insert
 * Validates data before insertion
 */
export function IntakeQueue_beforeInsert(item, context) {
    console.log('🪝 Hook: IntakeQueue_beforeInsert for case:', item.caseId);

    // Ensure required fields are present
    if (!item.caseId) {
        return Promise.reject('Case ID is required');
    }

    if (!item.indemnitorName || !item.indemnitorEmail) {
        return Promise.reject('Indemnitor name and email are required');
    }

    if (!item.defendantName) {
        return Promise.reject('Defendant name is required');
    }

    // Set default values if not provided
    item.status = item.status || 'intake';
    item.documentStatus = item.documentStatus || 'pending';
    item.gasSyncStatus = item.gasSyncStatus || 'pending';

    return item;
}

/**
 * Hook: IntakeQueue - After Insert
 * Triggers notifications after successful insertion
 */
export function IntakeQueue_afterInsert(item, context) {
    console.log('🪝 Hook: IntakeQueue_afterInsert for case:', item.caseId);

    // Notify GAS asynchronously (non-blocking)
    notifyGASOfNewIntake(item.caseId)
        .then(() => {
            console.log('✅ GAS notified successfully for case:', item.caseId);
        })
        .catch(err => {
            console.error('❌ GAS notification failed for case:', item.caseId, err);
        });

    // Send email notification to staff
    sendAdminNotification(NOTIFICATION_TYPES.NEW_INTAKE, {
        memberName: item.indemnitorName,
        defendantName: item.defendantName,
        county: item.county,
        caseId: item.caseId
    }).catch(err => {
        console.error('❌ Staff notification failed:', err);
    });

    return item;
}

/**
 * Hook: IntakeQueue - After Update
 * Triggers when intake status changes
 */
export function IntakeQueue_afterUpdate(item, context) {
    console.log('🪝 Hook: IntakeQueue_afterUpdate for case:', item.caseId);

    // If status changed to 'completed', send completion notifications
    if (item.status === 'completed' && item.gasSyncStatus === 'synced') {
        sendAdminNotification(NOTIFICATION_TYPES.INTAKE_COMPLETED, {
            caseId: item.caseId,
            defendantName: item.defendantName,
            indemnitorName: item.indemnitorName
        }).catch(err => {
            console.error('❌ Completion notification failed:', err);
        });
    }

    // If SignNow documents were sent, notify indemnitor
    if (item.documentStatus === 'sent_for_signature' && item.signNowIndemnitorLink) {
        sendMemberNotification(NOTIFICATION_TYPES.PAPERWORK_READY, {
            memberEmail: item.indemnitorEmail,
            memberName: item.indemnitorName,
            memberPhone: item.indemnitorPhone,
            variables: {
                signingLink: item.signNowIndemnitorLink,
                defendantName: item.defendantName
            }
        }).catch(err => {
            console.error('❌ Signing notification failed:', err);
        });
    }

    return item;
}

/**
 * Hook: Signing Sessions - After Update
 * Trigger actions when documents are signed.
 * Collection ID: "Signing Sessions" -> Function Name: "Signing_Sessions_afterUpdate"
 */
export async function Signing_Sessions_afterUpdate(item, context) {
    try {
        // Check if status transitioned to completed
        if (item.status === 'completed' || item.status === 'Signed') {
            console.log(`🪝 Hook: Signing_Sessions_afterUpdate - Session ${item._id} is COMPLETE`);

            // 1. Update the parent Case status
            if (item.caseId) {
                // Fetch the case first to preserve other fields? update() requires full object or partial?
                // data.update() replaces. data.get() then update is safer.
                // OR use bulkUpdate if partial? No.

                const caseItem = await wixData.get(COLLECTIONS.CASES, item.caseId);
                if (caseItem) {
                    caseItem.paperworkStatus = 'Signed';
                    // Don't overwrite main status if it's already Active/Discharged? 
                    // Maybe just update paperworkStatus.
                    await wixData.update(COLLECTIONS.CASES, caseItem);
                    console.log(`✅ Updated Case ${item.caseId} paperworkStatus to 'Signed'`);
                }
            }

            // 2. Notify Admin
            await sendAdminNotification(NOTIFICATION_TYPES.PAPERWORK_SIGNED, {
                memberName: item.signerName || 'Unknown Signer',
                caseId: item.caseId,
                documentId: item.documentId
            });

            // 3. Notify Member
            if (item.signerEmail) {
                await sendMemberNotification(NOTIFICATION_TYPES.PAPERWORK_SIGNED, {
                    memberEmail: item.signerEmail, // Might not have memberId if guest
                    memberName: item.signerName,
                    memberPhone: item.signerPhone,
                    variables: {
                        documentName: 'Bail Bond Agreement'
                    }
                });
            }
        }
    } catch (error) {
        console.error('❌ Signing_Sessions_afterUpdate failed:', error);
    }

    return item;
}
