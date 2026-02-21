/**
 * Telegram_IntakeFlow.js
 *
 * Conversational Intake State Machine for Shamrock Bail Bonds
 *
 * Manages multi-turn Telegram conversations to collect complete bail bond data
 * from the indemnitor (co-signer). The bot collects ONLY client-facing fields.
 * Agent-internal fields (SSN, bond amount, premium, case number, etc.) are
 * NEVER requested from the client and are handled exclusively by agents.
 *
 * FLOW:
 *   Greeting
 *     → Defendant Name
 *     → Defendant DOB
 *     → Defendant Facility (jail)
 *     → Defendant Phone
 *     → Defendant Email
 *     → Defendant Address
 *     → Defendant Driver's License (optional, skippable)
 *     → Defendant Physical Description
 *     → Indemnitor Name
 *     → Indemnitor DOB
 *     → Indemnitor Relationship to Defendant
 *     → Indemnitor Email
 *     → Indemnitor Address
 *     → Indemnitor Employment
 *     → Reference 1 (Name, Phone, Relationship, Address)
 *     → Reference 2 (Name, Phone, Relationship, Address)
 *     → Confirm All Info
 *     → Complete (saved to IntakeQueue for agent review)
 *
 * FIELD CLASSIFICATION (per approved schema):
 *   CLIENT-FACING:  DefName, DefDOB, DefFacility, DefPhone, DefEmail,
 *                   DefAddress, DefDL (optional), DefPhysical,
 *                   IndName, IndDOB, IndRelation, IndEmail, IndAddress,
 *                   IndEmployer, IndJobTitle,
 *                   Ref1Name, Ref1Phone, Ref1Relation, Ref1Address,
 *                   Ref2Name, Ref2Phone, Ref2Relation, Ref2Address
 *   SYSTEM-GENERATED: DefFirstName, DefLastName, DefCounty, IndFirstName,
 *                     IndLastName, IndPhone (from Telegram), Date fields,
 *                     AgencyName, AgencyAddress
 *   AGENT-INTERNAL: DefSSN, IndSSN, TotalBond, Premium, CaseNum, PowerNum,
 *                   AgentName, AgentLicenseNum, Collateral, PaymentPlan
 *
 * NON-NEGOTIABLES:
 *   - SSN is NEVER collected by the bot.
 *   - Completed intakes go to IntakeQueue sheet (Dashboard queue) for agent review.
 *   - No documents are generated without agent approval.
 *   - SignNow is NOT invoked from this module.
 *
 * Version: 2.0.0
 * Date: 2026-02-20
 */

// =============================================================================
// CONVERSATION STEPS
// =============================================================================

const INTAKE_STEPS = {
  GREETING: 'greeting',
  CONSENT: 'consent',
  // --- Defendant ---
  DEFENDANT_NAME: 'defendant_name',
  DEFENDANT_DOB: 'defendant_dob',
  DEFENDANT_JAIL: 'defendant_jail',
  DEFENDANT_PHONE: 'defendant_phone',
  DEFENDANT_EMAIL: 'defendant_email',
  DEFENDANT_ADDRESS: 'defendant_address',
  DEFENDANT_DL: 'defendant_dl',
  DEFENDANT_PHYSICAL: 'defendant_physical',
  // --- Indemnitor ---
  INDEMNITOR_NAME: 'indemnitor_name',
  INDEMNITOR_DOB: 'indemnitor_dob',
  INDEMNITOR_RELATION: 'indemnitor_relation',
  INDEMNITOR_EMAIL: 'indemnitor_email',
  INDEMNITOR_ADDRESS: 'indemnitor_address',
  INDEMNITOR_EMPLOYMENT: 'indemnitor_employment',
  // --- References ---
  REF1_NAME: 'ref1_name',
  REF1_PHONE: 'ref1_phone',
  REF1_RELATION: 'ref1_relation',
  REF1_ADDRESS: 'ref1_address',
  REF2_NAME: 'ref2_name',
  REF2_PHONE: 'ref2_phone',
  REF2_RELATION: 'ref2_relation',
  REF2_ADDRESS: 'ref2_address',
  // --- Document Uploads ---
  UPLOAD_ID: 'upload_id',
  UPLOAD_UTILITY: 'upload_utility',
  UPLOAD_PAYSTUB: 'upload_paystub',
  // --- Finalization ---
  CONFIRM_INFO: 'confirm_info',
  COMPLETE: 'complete'
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

const CONVERSATION_TIMEOUT = 3600; // 1 hour in seconds

/**
 * Get current conversation state for a Telegram user ID.
 * @param {string|number} userId - Telegram chat ID
 * @returns {object} - Current state object
 */
function getConversationState(userId) {
  const cache = CacheService.getScriptCache();
  const key = 'intake_' + userId;
  const cached = cache.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse conversation state for ' + userId + ':', e);
    }
  }
  // New conversation — initialize with defaults
  return {
    step: INTAKE_STEPS.GREETING,
    data: {},
    startedAt: new Date().toISOString(),
    userId: userId
  };
}

/**
 * Persist conversation state for a Telegram user ID.
 * @param {string|number} userId - Telegram chat ID
 * @param {object} newState - Updated state object
 */
function updateConversationState(userId, newState) {
  const cache = CacheService.getScriptCache();
  const key = 'intake_' + userId;
  newState.updatedAt = new Date().toISOString();
  newState.userId = userId;
  try {
    cache.put(key, JSON.stringify(newState), CONVERSATION_TIMEOUT);
    console.log('State updated: ' + userId + ' → ' + newState.step);
  } catch (e) {
    console.error('Failed to persist state for ' + userId + ':', e.message);
  }
}

/**
 * Clear conversation state (on completion or user restart).
 * @param {string|number} userId - Telegram chat ID
 */
function clearConversationState(userId) {
  const cache = CacheService.getScriptCache();
  cache.remove('intake_' + userId);
  console.log('Conversation state cleared: ' + userId);
}

// =============================================================================
// MAIN INTAKE PROCESSOR
// =============================================================================

/**
 * Process an incoming Telegram message and advance the conversation.
 * Called by Telegram_Webhook.js or Manus_Brain.js.
 *
 * @param {string|number} userId - Telegram chat ID (used as the unique key)
 * @param {string} message - The user's message text
 * @param {string} [firstName] - User's Telegram first name (optional)
 * @returns {object} - { text: string, voice_script?: string, intakeId?: string }
 */
function processIntakeMessage(userId, message, firstName) {
  const state = getConversationState(userId);
  const msg = (message || '').trim();

  // --- Global Commands (work at any step) ---
  if (msg.toLowerCase() === 'restart' || msg.toLowerCase() === '/restart') {
    clearConversationState(userId);
    return {
      text: '🔄 Restarting your intake. Let\'s begin again.\n\n' + _greetingText(firstName)
    };
  }
  if (msg.toLowerCase() === '/start' || msg.toLowerCase() === 'start') {
    if (state.step === INTAKE_STEPS.GREETING || state.step === INTAKE_STEPS.COMPLETE || state.step === INTAKE_STEPS.CONSENT) {
      clearConversationState(userId);
      const newState = getConversationState(userId);
      newState.step = INTAKE_STEPS.CONSENT;
      updateConversationState(userId, newState);
      return { text: _consentText(firstName) };
    }
  }
  if (msg.toLowerCase() === '/status') {
    return {
      text: '📋 Current step: *' + state.step.replace(/_/g, ' ') + '*\n\nType *restart* to start over, or continue answering the current question.'
    };
  }

  // --- Route to the correct step handler ---
  let response;
  switch (state.step) {
    case INTAKE_STEPS.GREETING:
      state.step = INTAKE_STEPS.CONSENT;
      updateConversationState(userId, state);
      return { text: _consentText(firstName) };

    case INTAKE_STEPS.CONSENT:
      response = _handleConsent(state, msg); break;

    case INTAKE_STEPS.DEFENDANT_NAME:
      response = _handleDefendantName(state, msg); break;
    case INTAKE_STEPS.DEFENDANT_DOB:
      response = _handleDefendantDOB(state, msg); break;
    case INTAKE_STEPS.DEFENDANT_JAIL:
      response = _handleDefendantJail(state, msg); break;
    case INTAKE_STEPS.DEFENDANT_PHONE:
      response = _handleDefendantPhone(state, msg); break;
    case INTAKE_STEPS.DEFENDANT_EMAIL:
      response = _handleDefendantEmail(state, msg); break;
    case INTAKE_STEPS.DEFENDANT_ADDRESS:
      response = _handleDefendantAddress(state, msg); break;
    case INTAKE_STEPS.DEFENDANT_DL:
      response = _handleDefendantDL(state, msg); break;
    case INTAKE_STEPS.DEFENDANT_PHYSICAL:
      response = _handleDefendantPhysical(state, msg); break;

    case INTAKE_STEPS.INDEMNITOR_NAME:
      response = _handleIndemnitorName(state, msg); break;
    case INTAKE_STEPS.INDEMNITOR_DOB:
      response = _handleIndemnitorDOB(state, msg); break;
    case INTAKE_STEPS.INDEMNITOR_RELATION:
      response = _handleIndemnitorRelation(state, msg); break;
    case INTAKE_STEPS.INDEMNITOR_EMAIL:
      response = _handleIndemnitorEmail(state, msg); break;
    case INTAKE_STEPS.INDEMNITOR_ADDRESS:
      response = _handleIndemnitorAddress(state, msg); break;
    case INTAKE_STEPS.INDEMNITOR_EMPLOYMENT:
      response = _handleIndemnitorEmployment(state, msg); break;

    case INTAKE_STEPS.REF1_NAME:
      response = _handleRef1Name(state, msg); break;
    case INTAKE_STEPS.REF1_PHONE:
      response = _handleRef1Phone(state, msg); break;
    case INTAKE_STEPS.REF1_RELATION:
      response = _handleRef1Relation(state, msg); break;
    case INTAKE_STEPS.REF1_ADDRESS:
      response = _handleRef1Address(state, msg); break;
    case INTAKE_STEPS.REF2_NAME:
      response = _handleRef2Name(state, msg); break;
    case INTAKE_STEPS.REF2_PHONE:
      response = _handleRef2Phone(state, msg); break;
    case INTAKE_STEPS.REF2_RELATION:
      response = _handleRef2Relation(state, msg); break;
    case INTAKE_STEPS.REF2_ADDRESS:
      response = _handleRef2Address(state, msg); break;

    case INTAKE_STEPS.UPLOAD_ID:
      response = _handleUploadID(state, msg); break;
    case INTAKE_STEPS.UPLOAD_UTILITY:
      response = _handleUploadUtility(state, msg); break;
    case INTAKE_STEPS.UPLOAD_PAYSTUB:
      response = _handleUploadPaystub(state, msg); break;

    case INTAKE_STEPS.CONFIRM_INFO:
      response = _handleConfirmation(state, msg); break;
    case INTAKE_STEPS.COMPLETE:
      response = _handleComplete(state, msg); break;

    default:
      clearConversationState(userId);
      return { text: 'Something went wrong. Let\'s start over.\n\n' + _greetingText(firstName) };
  }

  // --- Advance state if a next step was returned ---
  if (response.nextStep) {
    state.step = response.nextStep;
    updateConversationState(userId, state);
  } else if (response.nextStep === null) {
    // Stay on current step (validation failed or complete)
    updateConversationState(userId, state);
  }

  // --- Save to IntakeQueue when intake is confirmed ---
  if (response.saveToQueue) {
    try {
      const queueResult = saveTelegramIntakeToQueue(state.data, userId);
      response.intakeId = queueResult.intakeId;
      console.log('✅ Intake saved to queue: ' + queueResult.intakeId);
    } catch (e) {
      console.error('❌ Queue save failed:', e.message);
      response.text += '\n\n⚠️ There was an issue saving your information. A staff member will be in touch shortly.';
    }
  }

  return {
    text: response.text,
    voice_script: response.voice_script || null,
    intakeId: response.intakeId || null
  };
}

// =============================================================================
// CONSENT AND GREETING
// =============================================================================

function _consentText(firstName) {
  const name = firstName ? (', ' + firstName) : '';
  return `🍀 *Welcome to Shamrock Bail Bonds${name}!*

I'm here to help you start the bail process. I'll ask you a few questions to get everything ready for one of our agents.

*Before we begin, please review our terms:*

By continuing, you agree to:
• Sign documents electronically (legally binding)
• Allow us to capture your location at signing time
• Receive necessary text/voice communications about this case
• Authorize Shamrock Bail Bonds to use this data for underwriting purposes.

Do you agree to these terms?
*(Please type exactly: "I agree" or "Yes")*`;
}

function _handleConsent(state, text) {
  const answer = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (answer === 'i agree' || answer === 'yes' || answer === 'agree' || answer === 'y') {
    state.data.consentGiven = true;
    state.data.consentTimestamp = new Date().toISOString();
    return {
      text: 'Thank you. Your consent has been recorded.\n\nLet\'s start with the person who has been arrested.\n\n*What is their full legal name?*\n_(First and Last name, as it appears on their ID)_',
      nextStep: INTAKE_STEPS.DEFENDANT_NAME
    };
  } else {
    return {
      text: '⚠️ You must agree to the terms to proceed. If you do not agree, we cannot process your bail bond electronically.\n\nPlease type *"I agree"* or *"Yes"* when you are ready to proceed.'
    };
  }
}

// =============================================================================
// DEFENDANT STEP HANDLERS
// =============================================================================

function _handleDefendantName(state, msg) {
  const parts = msg.trim().split(/\s+/);
  if (parts.length < 2) {
    return {
      text: 'I need their *full legal name* (first and last name).\n\nPlease try again:',
      nextStep: null
    };
  }
  state.data.DefName = msg.trim();
  state.data.DefFirstName = parts[0];
  state.data.DefLastName = parts.slice(1).join(' ');
  return {
    text: `Got it — *${state.data.DefName}*.

*What is their date of birth?*
_(Format: MM/DD/YYYY)_`,
    nextStep: INTAKE_STEPS.DEFENDANT_DOB
  };
}

function _handleDefendantDOB(state, msg) {
  const dob = _parseDOB(msg);
  if (!dob) {
    return {
      text: 'I need a valid date of birth in MM/DD/YYYY format.\n\nExample: 03/15/1985\n\nPlease try again:',
      nextStep: null
    };
  }
  state.data.DefDOB = dob;
  return {
    text: `Thank you.

*Which jail or detention facility are they currently in?*
_(For example: "Lee County Jail", "Naples Jail Center", "Charlotte CI")_`,
    nextStep: INTAKE_STEPS.DEFENDANT_JAIL
  };
}

function _handleDefendantJail(state, msg) {
  if (msg.trim().length < 3) {
    return {
      text: 'Please provide the name of the jail or detention facility:',
      nextStep: null
    };
  }
  state.data.DefFacility = msg.trim();
  // Auto-detect county from facility name
  state.data.DefCounty = _detectCountyFromFacility(msg.trim());
  return {
    text: `Got it — *${state.data.DefFacility}*.

*What is their phone number?*
_(This is used to contact them after release. Type "skip" if you don't know it.)_`,
    nextStep: INTAKE_STEPS.DEFENDANT_PHONE
  };
}

function _handleDefendantPhone(state, msg) {
  if (msg.toLowerCase() === 'skip') {
    state.data.DefPhone = '';
    return {
      text: `No problem.

*What is their email address?*
_(Type "skip" if you don't have it.)_`,
      nextStep: INTAKE_STEPS.DEFENDANT_EMAIL
    };
  }
  const phone = _parsePhone(msg);
  if (!phone) {
    return {
      text: 'I need a valid phone number.\n\nExamples:\n• (239) 332-2245\n• 239-332-2245\n• 2393322245\n\nOr type *skip* to continue:',
      nextStep: null
    };
  }
  state.data.DefPhone = phone;
  return {
    text: `Got it.

*What is their email address?*
_(Type "skip" if you don't have it.)_`,
    nextStep: INTAKE_STEPS.DEFENDANT_EMAIL
  };
}

function _handleDefendantEmail(state, msg) {
  if (msg.toLowerCase() === 'skip') {
    state.data.DefEmail = '';
  } else {
    const email = _parseEmail(msg);
    if (!email) {
      return {
        text: 'That doesn\'t look like a valid email address.\n\nExample: john@email.com\n\nOr type *skip* to continue:',
        nextStep: null
      };
    }
    state.data.DefEmail = email;
  }
  return {
    text: `Thank you.

*What is their last known home address?*
_(Street, City, State, ZIP — type "skip" if unknown)_`,
    nextStep: INTAKE_STEPS.DEFENDANT_ADDRESS
  };
}

function _handleDefendantAddress(state, msg) {
  if (msg.toLowerCase() === 'skip') {
    state.data.DefAddress = '';
  } else {
    if (msg.trim().length < 5) {
      return {
        text: 'Please provide a more complete address, or type *skip* to continue:',
        nextStep: null
      };
    }
    state.data.DefAddress = msg.trim();
  }
  return {
    text: `Got it.

Do you have their *Driver's License or State ID number?*
_(This helps with identity verification. Type "skip" to continue.)_`,
    nextStep: INTAKE_STEPS.DEFENDANT_DL
  };
}

function _handleDefendantDL(state, msg) {
  if (msg.toLowerCase() === 'skip') {
    state.data.DefDL = '';
  } else {
    state.data.DefDL = msg.trim().toUpperCase();
  }
  return {
    text: `Thank you.

Can you briefly *describe ${state.data.DefFirstName}*?
_(Height, weight, hair color, eye color, any distinguishing features)_
_(Type "skip" if you'd prefer not to.)_`,
    nextStep: INTAKE_STEPS.DEFENDANT_PHYSICAL
  };
}

function _handleDefendantPhysical(state, msg) {
  state.data.DefPhysical = msg.toLowerCase() === 'skip' ? '' : msg.trim();
  return {
    text: `Perfect. Now I need *your information* as the co-signer (indemnitor).

*What is your full legal name?*
_(First and Last name)_`,
    nextStep: INTAKE_STEPS.INDEMNITOR_NAME
  };
}

// =============================================================================
// INDEMNITOR STEP HANDLERS
// =============================================================================

function _handleIndemnitorName(state, msg) {
  const parts = msg.trim().split(/\s+/);
  if (parts.length < 2) {
    return {
      text: 'I need your *full legal name* (first and last name).\n\nPlease try again:',
      nextStep: null
    };
  }
  state.data.IndName = msg.trim();
  state.data.IndFirstName = parts[0];
  state.data.IndLastName = parts.slice(1).join(' ');
  return {
    text: `Nice to meet you, *${state.data.IndFirstName}*!

*What is your date of birth?*
_(Format: MM/DD/YYYY)_`,
    nextStep: INTAKE_STEPS.INDEMNITOR_DOB
  };
}

function _handleIndemnitorDOB(state, msg) {
  const dob = _parseDOB(msg);
  if (!dob) {
    return {
      text: 'I need a valid date of birth in MM/DD/YYYY format.\n\nExample: 07/22/1980\n\nPlease try again:',
      nextStep: null
    };
  }
  state.data.IndDOB = dob;
  return {
    text: `Thank you.

*What is your relationship to ${state.data.DefFirstName}?*
_(Examples: Mother, Father, Spouse, Sibling, Friend, Employer)_`,
    nextStep: INTAKE_STEPS.INDEMNITOR_RELATION
  };
}

function _handleIndemnitorRelation(state, msg) {
  if (msg.trim().length < 2) {
    return {
      text: 'Please describe your relationship to the defendant:',
      nextStep: null
    };
  }
  state.data.IndRelation = msg.trim();
  return {
    text: `Got it.

*What is your email address?*
_(We'll send you copies of any signed documents here.)_`,
    nextStep: INTAKE_STEPS.INDEMNITOR_EMAIL
  };
}

function _handleIndemnitorEmail(state, msg) {
  const email = _parseEmail(msg);
  if (!email) {
    return {
      text: 'I need a valid email address.\n\nExample: jane@email.com\n\nPlease try again:',
      nextStep: null
    };
  }
  state.data.IndEmail = email;
  // Phone is auto-captured from Telegram
  state.data.IndPhone = state.userId ? state.userId.toString() : '';
  return {
    text: `Perfect — *${email}*.

*What is your current home address?*
_(Street, City, State, ZIP)_`,
    nextStep: INTAKE_STEPS.INDEMNITOR_ADDRESS
  };
}

function _handleIndemnitorAddress(state, msg) {
  if (msg.trim().length < 10) {
    return {
      text: 'Please provide your complete address (Street, City, State, ZIP):\n\nExample: 123 Main St, Fort Myers, FL 33901',
      nextStep: null
    };
  }
  state.data.IndAddress = msg.trim();
  return {
    text: `Got it.

*Employment information:*
Please tell me:
1. Your employer's name
2. Your job title

_(You can type both on separate lines, or together. Type "unemployed" or "self-employed" if applicable.)_`,
    nextStep: INTAKE_STEPS.INDEMNITOR_EMPLOYMENT
  };
}

function _handleIndemnitorEmployment(state, msg) {
  const lines = msg.trim().split(/\n/).map(l => l.trim()).filter(l => l);
  state.data.IndEmployer = lines[0] || msg.trim();
  state.data.IndJobTitle = lines[1] || '';
  return {
    text: `Thank you!

Now I need *two personal references* (not immediate family members).

*Reference #1 — What is their name?*`,
    nextStep: INTAKE_STEPS.REF1_NAME
  };
}

// =============================================================================
// REFERENCE 1 STEP HANDLERS
// =============================================================================

function _handleRef1Name(state, msg) {
  if (msg.trim().length < 2) {
    return { text: 'Please provide the reference\'s full name:', nextStep: null };
  }
  state.data.Ref1Name = msg.trim();
  return {
    text: `*What is ${state.data.Ref1Name}'s phone number?*`,
    nextStep: INTAKE_STEPS.REF1_PHONE
  };
}

function _handleRef1Phone(state, msg) {
  const phone = _parsePhone(msg);
  if (!phone) {
    return {
      text: 'I need a valid phone number for this reference.\n\nExample: (239) 555-1234\n\nPlease try again:',
      nextStep: null
    };
  }
  state.data.Ref1Phone = phone;
  return {
    text: `*What is their relationship to you?*
_(Examples: Friend, Coworker, Neighbor, Church member)_`,
    nextStep: INTAKE_STEPS.REF1_RELATION
  };
}

function _handleRef1Relation(state, msg) {
  if (msg.trim().length < 2) {
    return { text: 'Please describe their relationship to you:', nextStep: null };
  }
  state.data.Ref1Relation = msg.trim();
  return {
    text: `*What is ${state.data.Ref1Name}'s address?*
_(Street, City, State, ZIP — type "skip" if you don't know it)_`,
    nextStep: INTAKE_STEPS.REF1_ADDRESS
  };
}

function _handleRef1Address(state, msg) {
  state.data.Ref1Address = msg.toLowerCase() === 'skip' ? '' : msg.trim();
  return {
    text: `Great!

*Reference #2 — What is their name?*`,
    nextStep: INTAKE_STEPS.REF2_NAME
  };
}

// =============================================================================
// REFERENCE 2 STEP HANDLERS
// =============================================================================

function _handleRef2Name(state, msg) {
  if (msg.trim().length < 2) {
    return { text: 'Please provide the second reference\'s full name:', nextStep: null };
  }
  state.data.Ref2Name = msg.trim();
  return {
    text: `*What is ${state.data.Ref2Name}'s phone number?*`,
    nextStep: INTAKE_STEPS.REF2_PHONE
  };
}

function _handleRef2Phone(state, msg) {
  const phone = _parsePhone(msg);
  if (!phone) {
    return {
      text: 'I need a valid phone number for this reference.\n\nExample: (239) 555-5678\n\nPlease try again:',
      nextStep: null
    };
  }
  state.data.Ref2Phone = phone;
  return {
    text: `*What is their relationship to you?*`,
    nextStep: INTAKE_STEPS.REF2_RELATION
  };
}

function _handleRef2Relation(state, msg) {
  if (msg.trim().length < 2) {
    return { text: 'Please describe their relationship to you:', nextStep: null };
  }
  state.data.Ref2Relation = msg.trim();
  return {
    text: `*What is ${state.data.Ref2Name}'s address?*
_(Street, City, State, ZIP — type "skip" if you don't know it)_`,
    nextStep: INTAKE_STEPS.REF2_ADDRESS
  };
}

function _handleRef2Address(state, msg) {
  state.data.Ref2Address = msg.toLowerCase() === 'skip' ? '' : msg.trim();
  return {
    text: `Great! We have almost everything.\n\nNow, please upload a clear photo of your *Government-Issued ID (Front)*.\n\n_(Tap the paperclip or camera icon to upload. Type "skip" to provide this later.)_`,
    nextStep: INTAKE_STEPS.UPLOAD_ID
  };
}

// =============================================================================
// DOCUMENT UPLOAD STEP HANDLERS
// =============================================================================

function _handleUploadID(state, msg) {
  if (msg.toLowerCase() === 'skip') {
    state.data.Doc_ID_Front = '';
    return {
      text: `Skipped ID upload.\n\nNext, please upload a recent *Utility Bill* (Electric, Water, etc.) to verify your address.\n\n_(Type "skip" to provide this later.)_`,
      nextStep: INTAKE_STEPS.UPLOAD_UTILITY
    };
  }

  if (msg.startsWith('__DOC__')) {
    const parts = msg.split('__');
    const fileId = parts[2];
    const fileName = parts[3];
    const mimeType = parts[4] || 'image/jpeg';

    // Download to drive
    let url = '';
    if (typeof _downloadTelegramFileToDrive === 'function') {
      try {
        const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.jpg';
        url = _downloadTelegramFileToDrive(fileId, `ID_Front_${state.userId}_${Date.now()}${ext}`, 'ID_Verification');
      } catch (e) { console.error('Failed ID upload', e); }
    }
    state.data.Doc_ID_Front = url;

    return {
      text: `✅ ID received!\n\nNext, please upload a recent *Utility Bill* (Electric, Water, etc.) to verify your address.\n\n_(Type "skip" to provide this later.)_`,
      nextStep: INTAKE_STEPS.UPLOAD_UTILITY
    };
  }

  return { text: `Please upload your ID as a photo or document, or type "skip".`, nextStep: null };
}

function _handleUploadUtility(state, msg) {
  if (msg.toLowerCase() === 'skip') {
    state.data.Doc_Utility = '';
    return {
      text: `Skipped Utility Bill.\n\nFinally, please upload your most recent *Pay Stub*.\n\n_(Type "skip" to provide this later.)_`,
      nextStep: INTAKE_STEPS.UPLOAD_PAYSTUB
    };
  }

  if (msg.startsWith('__DOC__')) {
    const parts = msg.split('__');
    const fileId = parts[2];
    const fileName = parts[3];
    const mimeType = parts[4] || 'application/pdf';

    // Download to drive
    let url = '';
    if (typeof _downloadTelegramFileToDrive === 'function') {
      try {
        const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.pdf';
        url = _downloadTelegramFileToDrive(fileId, `Utility_${state.userId}_${Date.now()}${ext}`, 'SupportingDocuments');
      } catch (e) { console.error('Failed Utility upload', e); }
    }
    state.data.Doc_Utility = url;

    return {
      text: `✅ Utility Bill received!\n\nFinally, please upload your most recent *Pay Stub*.\n\n_(Type "skip" to provide this later.)_`,
      nextStep: INTAKE_STEPS.UPLOAD_PAYSTUB
    };
  }

  return { text: `Please upload your Utility Bill as a photo or document, or type "skip".`, nextStep: null };
}

function _handleUploadPaystub(state, msg) {
  if (msg.toLowerCase() === 'skip') {
    state.data.Doc_Paystub = '';
  } else if (msg.startsWith('__DOC__')) {
    const parts = msg.split('__');
    const fileId = parts[2];
    const fileName = parts[3];
    const mimeType = parts[4] || 'application/pdf';

    // Download to drive
    let url = '';
    if (typeof _downloadTelegramFileToDrive === 'function') {
      try {
        const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.pdf';
        url = _downloadTelegramFileToDrive(fileId, `Paystub_${state.userId}_${Date.now()}${ext}`, 'SupportingDocuments');
      } catch (e) { console.error('Failed Paystub upload', e); }
    }
    state.data.Doc_Paystub = url;
  } else {
    return { text: `Please upload your Pay Stub as a photo or document, or type "skip".`, nextStep: null };
  }

  return {
    text: _buildConfirmationSummary(state.data),
    voice_script: 'Please review the information and documents I have collected. Reply YES if everything looks correct, or NO to start over.',
    nextStep: INTAKE_STEPS.CONFIRM_INFO
  };
}

// =============================================================================
// CONFIRMATION
// =============================================================================

function _buildConfirmationSummary(data) {
  return `📋 *Please review your information:*

*DEFENDANT:*
• Name: ${data.DefName || '—'}
• DOB: ${data.DefDOB || '—'}
• Facility: ${data.DefFacility || '—'}${data.DefCounty ? ' (' + data.DefCounty + ' County)' : ''}
• Phone: ${data.DefPhone || '—'}
• Email: ${data.DefEmail || '—'}
• Address: ${data.DefAddress || '—'}
• DL/ID: ${data.DefDL || '—'}
• Description: ${data.DefPhysical || '—'}

*CO-SIGNER (YOU):*
• Name: ${data.IndName || '—'}
• DOB: ${data.IndDOB || '—'}
• Relationship: ${data.IndRelation || '—'}
• Email: ${data.IndEmail || '—'}
• Address: ${data.IndAddress || '—'}
• Employer: ${data.IndEmployer || '—'}${data.IndJobTitle ? ' / ' + data.IndJobTitle : ''}

*REFERENCE 1:*
• Name: ${data.Ref1Name || '—'}
• Phone: ${data.Ref1Phone || '—'}
• Relationship: ${data.Ref1Relation || '—'}
• Address: ${data.Ref1Address || '—'}

*REFERENCE 2:*
• Name: ${data.Ref2Name || '—'}
• Phone: ${data.Ref2Phone || '—'}
• Relationship: ${data.Ref2Relation || '—'}
• Address: ${data.Ref2Address || '—'}

*DOCUMENTS UPLOADED:*
• ID: ${data.Doc_ID_Front ? '✅ Provided' : '❌ Skipped'}
• Utility Bill: ${data.Doc_Utility ? '✅ Provided' : '❌ Skipped'}
• Pay Stub: ${data.Doc_Paystub ? '✅ Provided' : '❌ Skipped'}

Is this information correct?
Reply *YES* to submit, or *NO* to start over.`;
}

function _handleConfirmation(state, msg) {
  const lower = msg.toLowerCase().trim();
  if (lower === 'yes' || lower === 'y' || lower === 'correct' || lower === 'confirm') {
    return {
      text: `✅ *Thank you! Your information has been received.*

📋 A Shamrock agent will review your intake and prepare your paperwork shortly.

📞 You will receive a call or message from our team to confirm the details and walk you through the next steps.

_We're available 24/7 at (239) 332-2245 if you need anything right away._

🍀 *Shamrock Bail Bonds — We'll get them home.*`,
      voice_script: "Thank you! Your information has been received. A Shamrock agent will review your intake and prepare your paperwork shortly. You will receive a call or message from our team to confirm the details. We're available 24 hours a day, 7 days a week.",
      nextStep: INTAKE_STEPS.COMPLETE,
      saveToQueue: true
    };
  }
  if (lower === 'no' || lower === 'n' || lower === 'incorrect' || lower === 'wrong') {
    clearConversationState(state.userId);
    return {
      text: `No problem! Let's start over to make sure everything is correct.\n\nType *start* when you're ready to begin again.`,
      nextStep: INTAKE_STEPS.GREETING
    };
  }
  return {
    text: 'Please reply *YES* to submit your information, or *NO* to start over.',
    nextStep: null
  };
}

function _handleComplete(state, msg) {
  return {
    text: `Your intake has already been submitted and is being reviewed by a Shamrock agent.

If you have an urgent question, please call us directly at *(239) 332-2245*. 
For texts and Telegram messages, use *(239) 955-0178*.
Para Español, llame al *(239) 955-0301*. 

We're available 24/7. 🍀`,
    nextStep: null
  };
}

// =============================================================================
// DOCUMENT GENERATION TRIGGER (DEPRECATED — Now routes to Queue)
// =============================================================================
// NOTE: Direct document generation from the bot is intentionally disabled.
// All completed intakes are saved to the IntakeQueue sheet via
// saveTelegramIntakeToQueue() (in Telegram_IntakeQueue.js) and must be
// reviewed and approved by an agent in Dashboard.html before any documents
// are created. This ensures agents remain in control of the paperwork process.
//
// The old triggerDocumentGenerationFromTelegram() function has been removed.
// =============================================================================

// =============================================================================
// VALIDATION & PARSING UTILITIES
// =============================================================================

/**
 * Parse and normalize a phone number string.
 * Returns a formatted (XXX) XXX-XXXX string or null if invalid.
 * @param {string} input
 * @returns {string|null}
 */
function _parsePhone(input) {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) {
    return '(' + digits.substring(0, 3) + ') ' + digits.substring(3, 6) + '-' + digits.substring(6);
  }
  if (digits.length === 11 && digits[0] === '1') {
    return '(' + digits.substring(1, 4) + ') ' + digits.substring(4, 7) + '-' + digits.substring(7);
  }
  return null;
}

/**
 * Parse and validate an email address.
 * @param {string} input
 * @returns {string|null}
 */
function _parseEmail(input) {
  if (!input) return null;
  const email = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/**
 * Parse and normalize a date of birth string.
 * Accepts MM/DD/YYYY, MM-DD-YYYY, MMDDYYYY, and common variants.
 * @param {string} input
 * @returns {string|null} - Normalized MM/DD/YYYY or null
 */
function _parseDOB(input) {
  if (!input) return null;
  const clean = input.trim().replace(/[-\.]/g, '/');
  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const parts = clean.split('/');
    const m = parseInt(parts[0]), d = parseInt(parts[1]), y = parseInt(parts[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear()) {
      return (m < 10 ? '0' + m : m) + '/' + (d < 10 ? '0' + d : d) + '/' + y;
    }
  }
  // MMDDYYYY (8 digits)
  if (/^\d{8}$/.test(clean.replace(/\//g, ''))) {
    const digits = clean.replace(/\//g, '');
    const m = parseInt(digits.substring(0, 2));
    const d = parseInt(digits.substring(2, 4));
    const y = parseInt(digits.substring(4, 8));
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear()) {
      return (m < 10 ? '0' + m : m) + '/' + (d < 10 ? '0' + d : d) + '/' + y;
    }
  }
  return null;
}

/**
 * Attempt to detect the Florida county from a jail/facility name.
 * @param {string} facilityName
 * @returns {string} - County name or empty string
 */
function _detectCountyFromFacility(facilityName) {
  if (!facilityName) return '';
  const lower = facilityName.toLowerCase();
  const countyMap = {
    'lee': ['lee county', 'lcso', 'naples jail', 'fort myers'],
    'collier': ['collier', 'naples jail center', 'immokalee'],
    'charlotte': ['charlotte', 'punta gorda'],
    'sarasota': ['sarasota'],
    'manatee': ['manatee', 'bradenton'],
    'hillsborough': ['hillsborough', 'tampa', 'orient road'],
    'pinellas': ['pinellas', 'st. pete', 'clearwater'],
    'orange': ['orange county', 'orlando'],
    'miami-dade': ['miami', 'dade', 'tgk', 'pre-trial detention'],
    'broward': ['broward', 'fort lauderdale', 'main jail'],
    'palm beach': ['palm beach', 'west palm'],
    'alachua': ['alachua', 'gainesville'],
    'duval': ['duval', 'jacksonville', 'pretrial detention facility'],
    'volusia': ['volusia', 'daytona'],
    'brevard': ['brevard', 'melbourne', 'titusville'],
    'polk': ['polk', 'lakeland', 'bartow'],
    'seminole': ['seminole', 'sanford'],
    'lake': ['lake county', 'tavares'],
    'osceola': ['osceola', 'kissimmee'],
    'pasco': ['pasco', 'new port richey', 'dade city'],
    'hernando': ['hernando', 'brooksville'],
    'citrus': ['citrus', 'inverness'],
    'marion': ['marion', 'ocala'],
    'st. johns': ['st. johns', 'saint johns', 'st johns'],
    'st. lucie': ['st. lucie', 'saint lucie', 'port st. lucie'],
    'indian river': ['indian river', 'vero beach'],
    'martin': ['martin county', 'stuart'],
    'monroe': ['monroe', 'key west', 'stock island'],
    'hendry': ['hendry', 'labelle', 'clewiston'],
    'glades': ['glades', 'moore haven'],
    'desoto': ['desoto', 'arcadia'],
    'hardee': ['hardee', 'wauchula'],
    'highlands': ['highlands', 'sebring'],
    'okeechobee': ['okeechobee'],
    'flagler': ['flagler', 'bunnell'],
    'putnam': ['putnam', 'palatka'],
    'clay': ['clay county', 'green cove'],
    'nassau': ['nassau', 'fernandina'],
    'columbia': ['columbia', 'lake city'],
    'baker': ['baker county', 'macclenny'],
    'union': ['union county', 'lake butler'],
    'bradford': ['bradford', 'starke'],
    'gilchrist': ['gilchrist', 'trenton'],
    'levy': ['levy', 'bronson'],
    'dixie': ['dixie', 'cross city'],
    'lafayette': ['lafayette', 'mayo'],
    'suwannee': ['suwannee', 'live oak'],
    'hamilton': ['hamilton', 'jasper'],
    'madison': ['madison county', 'madison fl'],
    'taylor': ['taylor', 'perry fl'],
    'jefferson': ['jefferson', 'monticello'],
    'leon': ['leon', 'tallahassee'],
    'wakulla': ['wakulla', 'crawfordville'],
    'franklin': ['franklin', 'apalachicola'],
    'gulf': ['gulf county', 'port st. joe'],
    'calhoun': ['calhoun', 'blountstown'],
    'jackson': ['jackson county', 'marianna'],
    'washington': ['washington county', 'chipley'],
    'holmes': ['holmes', 'bonifay'],
    'walton': ['walton', 'defuniak'],
    'okaloosa': ['okaloosa', 'fort walton', 'crestview'],
    'santa rosa': ['santa rosa', 'milton fl'],
    'escambia': ['escambia', 'pensacola']
  };

  for (const [county, keywords] of Object.entries(countyMap)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return county.charAt(0).toUpperCase() + county.slice(1);
    }
  }
  return '';
}

// =============================================================================
// BACKWARD COMPATIBILITY ALIASES
// =============================================================================
// These allow Telegram_Webhook.js and Manus_Brain.js to call the old function
// names without modification.

/**
 * @deprecated Use processIntakeMessage() instead.
 */
function processIntake(userId, message, firstName) {
  return processIntakeMessage(userId, message, firstName);
}
