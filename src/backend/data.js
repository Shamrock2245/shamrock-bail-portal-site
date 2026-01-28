import wixData from 'wix-data';
import { sendMemberNotification, sendAdminNotification, NOTIFICATION_TYPES } from 'backend/notificationService';
import { COLLECTIONS } from 'public/collectionIds';

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
