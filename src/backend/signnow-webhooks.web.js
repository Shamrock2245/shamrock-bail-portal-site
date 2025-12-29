/**
 * Shamrock Bail Bonds - SignNow Webhook Handler
 * Handles SignNow events and triggers Google Drive uploads
 */

import { fetch } from 'wix-fetch';
import wixSecretsBackend from 'wix-secrets-backend';
import wixData from 'wix-data';

/**
 * SignNow webhook endpoint
 * POST /_functions/signnowWebhook
 * 
 * Events:
 * - document.create
 * - document.update
 * - document.fieldinvite
 * - document.sign
 * - document.complete
 */
export async function post_signnowWebhook(request) {
  try {
    const body = await request.body.json();

    console.log('SignNow webhook received:', body);

    const { event, document_id, user_id, timestamp } = body;

    // Handle different event types
    switch (event) {
      case 'document.sign':
        await handleDocumentSigned(body);
        break;

      case 'document.complete':
        await handleDocumentCompleted(body);
        break;

      case 'document.fieldinvite':
        await handleFieldInvite(body);
        break;

      default:
        console.log('Unhandled SignNow event:', event);
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Webhook processed'
      }
    };

  } catch (error) {
    console.error('SignNow webhook error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
}

/**
 * Handle document signed event
 */
async function handleDocumentSigned(webhookData) {
  const { document_id, signer_email } = webhookData;

  console.log(`Document ${document_id} signed by ${signer_email}`);

  // Update PendingDocuments status
  const results = await wixData.query('PendingDocuments')
    .eq('documentId', document_id)
    .eq('signerEmail', signer_email)
    .find();

  if (results.items.length > 0) {
    await wixData.update('PendingDocuments', {
      _id: results.items[0]._id,
      status: 'signed',
      signedAt: new Date()
    });
  }

  // Send Slack notification
  await notifySlack({
    text: `✍️ *Document Signed*\n\nDocument ID: ${document_id}\nSigner: ${signer_email}`,
    channel: '#bail-documents'
  });
}

/**
 * Handle document completed event (all signatures collected)
 * This triggers the Google Drive upload
 */
async function handleDocumentCompleted(webhookData) {
  const { document_id, document_name } = webhookData;

  console.log(`Document ${document_id} completed - triggering Google Drive upload`);

  try {
    // Download completed PDF from SignNow
    const pdfUrl = await downloadSignedDocument(document_id);

    if (pdfUrl) {
      // Upload to Google Drive via Apps Script
      await uploadToGoogleDrive({
        documentId: document_id,
        documentName: document_name || 'Bail Bond Packet',
        pdfUrl: pdfUrl
      });

      // Update all related PendingDocuments to completed
      const results = await wixData.query('PendingDocuments')
        .eq('documentId', document_id)
        .find();

      for (const doc of results.items) {
        await wixData.update('PendingDocuments', {
          _id: doc._id,
          status: 'completed',
          signedAt: new Date()
        });
      }

      // Send Slack notification
      await notifySlack({
        text: `✅ *Document Completed & Saved to Drive*\n\nDocument: ${document_name}\nID: ${document_id}\n\nAll signatures collected and filed.`,
        channel: '#bail-documents',
        icon_emoji: ':white_check_mark:'
      });
    }

  } catch (error) {
    console.error('Error processing completed document:', error);

    // Send error notification
    await notifySlack({
      text: `❌ *Error Processing Completed Document*\n\nDocument ID: ${document_id}\nError: ${error.message}`,
      channel: '#bail-documents',
      icon_emoji: ':x:'
    });
  }
}

/**
 * Handle field invite event (signing link sent)
 */
async function handleFieldInvite(webhookData) {
  const { document_id, signer_email } = webhookData;

  console.log(`Signing invite sent for document ${document_id} to ${signer_email}`);

  // Send Slack notification
  await notifySlack({
    text: `📧 *Signing Invite Sent*\n\nDocument ID: ${document_id}\nRecipient: ${signer_email}`,
    channel: '#bail-documents'
  });
}

/**
 * Download signed document from SignNow
 * @param {string} documentId - SignNow document ID
 * @returns {Promise<string>} URL to download PDF
 */
async function downloadSignedDocument(documentId) {
  try {
    const signNowToken = await wixSecretsBackend.getSecret('SIGNNOW_ACCESS_TOKEN');

    if (!signNowToken) {
      throw new Error('SignNow access token not configured');
    }

    // Get document download link from SignNow API
    const response = await fetch(`https://api.signnow.com/document/${documentId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${signNowToken}`
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      // Return the blob URL or upload directly
      return response.url;
    } else {
      throw new Error('Failed to download document from SignNow');
    }

  } catch (error) {
    console.error('Error downloading signed document:', error);
    throw error;
  }
}

/**
 * Upload completed document to Google Drive via Apps Script
 * @param {Object} params - Upload parameters
 */
async function uploadToGoogleDrive(params) {
  try {
    const { documentId, documentName, pdfUrl } = params;

    // Get Google Apps Script webhook URL
    const gasWebhookUrl = await wixSecretsBackend.getSecret('GAS_WEB_APP_URL');

    if (!gasWebhookUrl) {
      console.log('Google Apps Script webhook not configured');
      return;
    }

    // Send to Apps Script for Drive upload
    const response = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'uploadToDrive',
        documentId: documentId,
        documentName: documentName,
        pdfUrl: pdfUrl,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Google Drive');
    }

    const result = await response.json();
    console.log('Document uploaded to Google Drive:', result);

    return result;

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

/**
 * Send Slack notification
 */
async function notifySlack(options) {
  try {
    const webhookUrl = await wixSecretsBackend.getSecret('SLACK_WEBHOOK_URL');

    if (!webhookUrl) {
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: options.text,
        username: options.username || 'Shamrock Bail Bonds',
        icon_emoji: options.icon_emoji || ':shamrock:',
        channel: options.channel
      })
    });

  } catch (error) {
    console.error('Slack notification error:', error);
  }
}

/**
 * Get SignNow document status
 * GET /_functions/signnowStatus?documentId=xxx
 */
export async function get_signnowStatus(request) {
  try {
    const { query } = request;
    const documentId = query.documentId;

    if (!documentId) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'documentId is required'
        }
      };
    }

    const signNowToken = await wixSecretsBackend.getSecret('SIGNNOW_ACCESS_TOKEN');

    if (!signNowToken) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'SignNow not configured'
        }
      };
    }

    // Get document status from SignNow API
    const response = await fetch(`https://api.signnow.com/document/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${signNowToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();

      return {
        status: 200,
        body: {
          success: true,
          documentId: documentId,
          status: data.status,
          signatures: data.signatures || [],
          completed: data.status === 'completed'
        }
      };
    } else {
      throw new Error('Failed to get document status');
    }

  } catch (error) {
    console.error('Error getting SignNow status:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
}
