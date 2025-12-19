/**
 * Shamrock Bail Bonds - Integration HTTP Functions
 * Handles external integrations: SignNow, Google Sheets, Slack, Arrest Scrapers
 */

import wixData from 'wix-data';
import { fetch } from 'wix-fetch';
import wixSecretsBackend from 'wix-secrets-backend';

// ============================================
// PENDING DOCUMENTS (SignNow Integration)
// ============================================

/**
 * Add a pending document from Google Apps Script
 * POST /_functions/documentsAdd
 */
export async function post_documentsAdd(request) {
  try {
    const body = await request.body.json();
    
    const {
      signerEmail,
      signerName,
      signerPhone,
      signerRole,
      signingLink,
      documentId,
      defendantName,
      caseNumber,
      documentName,
      expiresAt
    } = body;
    
    // Validate required fields
    if (!signerEmail || !signingLink || !documentId || !defendantName) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Missing required fields'
        }
      };
    }
    
    // Insert into PendingDocuments collection
    const result = await wixData.insert('PendingDocuments', {
      signerEmail: signerEmail,
      signerName: signerName || '',
      signerPhone: signerPhone || '',
      signerRole: signerRole || 'defendant',
      signingLink: signingLink,
      documentId: documentId,
      defendantName: defendantName,
      caseNumber: caseNumber || '',
      documentName: documentName || 'Bail Bond Packet',
      status: 'pending',
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // Send Slack notification
    await notifySlack({
      text: `📄 *New Document Ready for Signing*\n\n👤 Defendant: ${defendantName}\n✍️ Signer: ${signerName} (${signerRole})\n📧 Email: ${signerEmail}\n📋 Document: ${documentName}`,
      channel: '#bail-documents'
    });
    
    return {
      status: 200,
      body: {
        success: true,
        documentId: result._id,
        message: 'Document added successfully'
      }
    };
    
  } catch (error) {
    console.error('Error adding document:', error);
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
 * Batch add multiple documents
 * POST /_functions/documentsBatch
 */
export async function post_documentsBatch(request) {
  try {
    const body = await request.body.json();
    const { documents } = body;
    
    if (!documents || !Array.isArray(documents)) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Invalid documents array'
        }
      };
    }
    
    const results = [];
    
    for (const doc of documents) {
      try {
        const result = await wixData.insert('PendingDocuments', {
          signerEmail: doc.signerEmail,
          signerName: doc.signerName || '',
          signerPhone: doc.signerPhone || '',
          signerRole: doc.signerRole || 'defendant',
          signingLink: doc.signingLink,
          documentId: doc.documentId,
          defendantName: doc.defendantName,
          caseNumber: doc.caseNumber || '',
          documentName: doc.documentName || 'Bail Bond Packet',
          status: 'pending',
          expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        
        results.push({ success: true, id: result._id });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      status: 200,
      body: {
        success: true,
        total: documents.length,
        successful: successCount,
        failed: documents.length - successCount,
        results: results
      }
    };
    
  } catch (error) {
    console.error('Error batch adding documents:', error);
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
 * Update document status (called by SignNow webhook)
 * POST /_functions/documentsStatus
 */
export async function post_documentsStatus(request) {
  try {
    const body = await request.body.json();
    const { documentId, status, signedAt } = body;
    
    if (!documentId || !status) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Missing documentId or status'
        }
      };
    }
    
    // Find document by SignNow documentId
    const results = await wixData.query('PendingDocuments')
      .eq('documentId', documentId)
      .find();
    
    if (results.items.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          error: 'Document not found'
        }
      };
    }
    
    const doc = results.items[0];
    
    // Update status
    await wixData.update('PendingDocuments', {
      _id: doc._id,
      status: status,
      signedAt: signedAt ? new Date(signedAt) : new Date()
    });
    
    // Send Slack notification for completed documents
    if (status === 'signed' || status === 'completed') {
      await notifySlack({
        text: `✅ *Document Signed!*\n\n👤 Defendant: ${doc.defendantName}\n✍️ Signer: ${doc.signerName}\n📋 Document: ${doc.documentName}\n⏰ Signed: ${new Date().toLocaleString()}`,
        channel: '#bail-documents'
      });
    }
    
    return {
      status: 200,
      body: {
        success: true,
        message: 'Status updated successfully'
      }
    };
    
  } catch (error) {
    console.error('Error updating document status:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
}

// ============================================
// ARREST LEADS (Scraper Integration)
// ============================================

/**
 * Add qualified arrest leads from scrapers
 * POST /_functions/arrestLeadsAdd
 */
export async function post_arrestLeadsAdd(request) {
  try {
    const body = await request.body.json();
    const { leads, apiKey } = body;
    
    // Verify API key
    const validApiKey = await wixSecretsBackend.getSecret('ARREST_SCRAPER_API_KEY');
    if (apiKey !== validApiKey) {
      return {
        status: 401,
        body: {
          success: false,
          error: 'Invalid API key'
        }
      };
    }
    
    if (!leads || !Array.isArray(leads)) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Invalid leads array'
        }
      };
    }
    
    const results = [];
    let hotLeadsCount = 0;
    
    for (const lead of leads) {
      try {
        // Check if lead already exists
        const existing = await wixData.query('ArrestLeads')
          .eq('bookingNumber', lead.bookingNumber)
          .eq('county', lead.county)
          .find();
        
        if (existing.items.length > 0) {
          // Update existing lead
          await wixData.update('ArrestLeads', {
            _id: existing.items[0]._id,
            ...lead,
            contacted: existing.items[0].contacted // Preserve contacted status
          });
          results.push({ success: true, action: 'updated', bookingNumber: lead.bookingNumber });
        } else {
          // Insert new lead
          await wixData.insert('ArrestLeads', {
            ...lead,
            contacted: false
          });
          results.push({ success: true, action: 'inserted', bookingNumber: lead.bookingNumber });
          
          // Count hot leads for notification
          if (lead.leadStatus === 'Hot' || lead.leadScore >= 70) {
            hotLeadsCount++;
          }
        }
      } catch (error) {
        results.push({ success: false, error: error.message, bookingNumber: lead.bookingNumber });
      }
    }
    
    // Send Slack notification for hot leads
    if (hotLeadsCount > 0) {
      const hotLeads = leads.filter(l => l.leadStatus === 'Hot' || l.leadScore >= 70);
      const leadsText = hotLeads.slice(0, 5).map(l => 
        `• ${l.fullName} - ${l.county} County - $${l.bondAmount} - Score: ${l.leadScore}`
      ).join('\n');
      
      await notifySlack({
        text: `🔥 *${hotLeadsCount} New HOT Lead${hotLeadsCount > 1 ? 's' : ''}!*\n\n${leadsText}${hotLeadsCount > 5 ? `\n\n...and ${hotLeadsCount - 5} more` : ''}`,
        channel: '#hot-leads'
      });
    }
    
    return {
      status: 200,
      body: {
        success: true,
        total: leads.length,
        inserted: results.filter(r => r.action === 'inserted').length,
        updated: results.filter(r => r.action === 'updated').length,
        failed: results.filter(r => !r.success).length,
        hotLeads: hotLeadsCount
      }
    };
    
  } catch (error) {
    console.error('Error adding arrest leads:', error);
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
 * Get qualified arrest leads for staff dashboard
 * GET /_functions/arrestLeadsGet
 */
export async function get_arrestLeadsGet(request) {
  try {
    const { query } = request;
    const limit = parseInt(query.limit) || 50;
    const status = query.status || 'Hot';
    const county = query.county;
    
    let queryBuilder = wixData.query('ArrestLeads')
      .descending('arrestDate')
      .limit(limit);
    
    if (status) {
      queryBuilder = queryBuilder.eq('leadStatus', status);
    }
    
    if (county) {
      queryBuilder = queryBuilder.eq('county', county);
    }
    
    const results = await queryBuilder.find();
    
    return {
      status: 200,
      body: {
        success: true,
        leads: results.items,
        count: results.items.length,
        totalCount: results.totalCount
      }
    };
    
  } catch (error) {
    console.error('Error getting arrest leads:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
}

// ============================================
// GOOGLE SHEETS SYNC
// ============================================

/**
 * Sync form submission to Google Sheets
 * POST /_functions/sheetsSync
 */
export async function post_sheetsSync(request) {
  try {
    const body = await request.body.json();
    const { formData, formType } = body;
    
    // Get Google Sheets webhook URL from secrets
    const webhookUrl = await wixSecretsBackend.getSecret('GOOGLE_SHEETS_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.log('Google Sheets webhook not configured');
      return {
        status: 200,
        body: {
          success: true,
          message: 'Sync skipped - webhook not configured'
        }
      };
    }
    
    // Send to Google Sheets via Apps Script webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formType: formType,
        data: formData,
        timestamp: new Date().toISOString(),
        source: 'wix'
      })
    });
    
    if (response.ok) {
      return {
        status: 200,
        body: {
          success: true,
          message: 'Synced to Google Sheets'
        }
      };
    } else {
      throw new Error('Google Sheets sync failed');
    }
    
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
}

// ============================================
// SLACK NOTIFICATIONS
// ============================================

/**
 * Send notification to Slack
 * @param {Object} options - Notification options
 */
async function notifySlack(options) {
  try {
    const webhookUrl = await wixSecretsBackend.getSecret('SLACK_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.log('Slack webhook not configured');
      return;
    }
    
    const payload = {
      text: options.text,
      username: options.username || 'Shamrock Bail Bonds',
      icon_emoji: options.icon_emoji || ':shamrock:',
      channel: options.channel
    };
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
  } catch (error) {
    console.error('Slack notification error:', error);
  }
}

/**
 * Manual Slack notification endpoint
 * POST /_functions/slackNotify
 */
export async function post_slackNotify(request) {
  try {
    const body = await request.body.json();
    const { message, channel, username, icon_emoji } = body;
    
    if (!message) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Message is required'
        }
      };
    }
    
    await notifySlack({
      text: message,
      channel: channel,
      username: username,
      icon_emoji: icon_emoji
    });
    
    return {
      status: 200,
      body: {
        success: true,
        message: 'Notification sent'
      }
    };
    
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
}

// ============================================
// CONTACT FORM HANDLER
// ============================================

/**
 * Handle contact form submissions
 * POST /_functions/contactFormSubmit
 */
export async function post_contactFormSubmit(request) {
  try {
    const body = await request.body.json();
    const { name, email, phone, message, county, urgency } = body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Missing required fields'
        }
      };
    }
    
    // Sync to Google Sheets
    await post_sheetsSync({
      body: {
        json: async () => ({
          formType: 'contact',
          formData: { name, email, phone, message, county, urgency }
        })
      }
    });
    
    // Send Slack notification
    const urgencyEmoji = urgency === 'urgent' ? '🚨' : urgency === 'high' ? '⚠️' : '📧';
    await notifySlack({
      text: `${urgencyEmoji} *New Contact Form Submission*\n\n👤 Name: ${name}\n📧 Email: ${email}\n📞 Phone: ${phone || 'N/A'}\n📍 County: ${county || 'N/A'}\n💬 Message: ${message}`,
      channel: '#website-leads'
    });
    
    return {
      status: 200,
      body: {
        success: true,
        message: 'Form submitted successfully'
      }
    };
    
  } catch (error) {
    console.error('Error handling contact form:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
}
