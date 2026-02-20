/**
 * Telegram_IntakeFlow.js
 * 
 * Conversational Intake State Machine for Shamrock Bail Bonds
 * Manages multi-turn Telegram conversations to collect complete bail bond data
 * 
 * FLOW:
 * 1. Greeting → Defendant Info → Indemnitor Info → References → Complete
 * 2. Each step validates input before advancing
 * 3. State persists in CacheService (1 hour timeout)
 * 4. On completion, triggers document generation
 * 
 * Version: 1.0.0
 * Date: 2026-02-19
 */

// =============================================================================
// CONVERSATION STEPS
// =============================================================================

const INTAKE_STEPS = {
  GREETING: 'greeting',
  DEFENDANT_NAME: 'defendant_name',
  DEFENDANT_DOB: 'defendant_dob',
  DEFENDANT_JAIL: 'defendant_jail',
  DEFENDANT_PHONE: 'defendant_phone',
  INDEMNITOR_NAME: 'indemnitor_name',
  INDEMNITOR_CONTACT: 'indemnitor_contact',
  INDEMNITOR_ADDRESS: 'indemnitor_address',
  INDEMNITOR_EMPLOYMENT: 'indemnitor_employment',
  INDEMNITOR_RELATIONSHIP: 'indemnitor_relationship',
  REFERENCE_1: 'reference_1',
  REFERENCE_2: 'reference_2',
  CONFIRM_INFO: 'confirm_info',
  COMPLETE: 'complete'
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

const CONVERSATION_TIMEOUT = 3600; // 1 hour in seconds

/**
 * Get current conversation state for a phone number
 */
function getConversationState(phoneNumber) {
  const cache = CacheService.getScriptCache();
  const key = `intake_${phoneNumber}`;
  const cached = cache.get(key);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse conversation state:', e);
    }
  }

  // New conversation
  return {
    step: INTAKE_STEPS.GREETING,
    data: {},
    startedAt: new Date().toISOString(),
    phoneNumber: phoneNumber
  };
}

/**
 * Update conversation state
 */
function updateConversationState(phoneNumber, newState) {
  const cache = CacheService.getScriptCache();
  const key = `intake_${phoneNumber}`;

  newState.updatedAt = new Date().toISOString();
  newState.phoneNumber = phoneNumber;

  cache.put(key, JSON.stringify(newState), CONVERSATION_TIMEOUT);

  // Also log for debugging
  console.log(`Conversation state updated: ${phoneNumber} → ${newState.step}`);
}

/**
 * Clear conversation state (on completion or timeout)
 */
function clearConversationState(phoneNumber) {
  const cache = CacheService.getScriptCache();
  cache.remove(`intake_${phoneNumber}`);
  console.log(`Conversation state cleared: ${phoneNumber}`);
}

// =============================================================================
// MAIN INTAKE PROCESSOR
// =============================================================================

/**
 * Process incoming message and advance conversation
 * This is called by Manus_Brain.js
 * 
 * @param {string} from - User's phone number
 * @param {string} message - User's message
 * @param {string} userName - User's name from Telegram profile
 * @returns {object} - { text: string, voice_script: string|null, advance: boolean }
 */
function processIntakeConversation(from, message, userName) {
  const state = getConversationState(from);

  // Store user name if not already stored
  if (!state.data.userName && userName) {
    state.data.userName = userName;
  }

  let response;

  switch (state.step) {
    case INTAKE_STEPS.GREETING:
      response = handleGreeting(state, message);
      break;

    case INTAKE_STEPS.DEFENDANT_NAME:
      response = handleDefendantName(state, message);
      break;

    case INTAKE_STEPS.DEFENDANT_DOB:
      response = handleDefendantDOB(state, message);
      break;

    case INTAKE_STEPS.DEFENDANT_JAIL:
      response = handleDefendantJail(state, message);
      break;

    case INTAKE_STEPS.DEFENDANT_PHONE:
      response = handleDefendantPhone(state, message);
      break;

    case INTAKE_STEPS.INDEMNITOR_NAME:
      response = handleIndemnitorName(state, message);
      break;

    case INTAKE_STEPS.INDEMNITOR_CONTACT:
      response = handleIndemnitorContact(state, message);
      break;

    case INTAKE_STEPS.INDEMNITOR_ADDRESS:
      response = handleIndemnitorAddress(state, message);
      break;

    case INTAKE_STEPS.INDEMNITOR_EMPLOYMENT:
      response = handleIndemnitorEmployment(state, message);
      break;

    case INTAKE_STEPS.INDEMNITOR_RELATIONSHIP:
      response = handleIndemnitorRelationship(state, message);
      break;

    case INTAKE_STEPS.REFERENCE_1:
      response = handleReference1(state, message);
      break;

    case INTAKE_STEPS.REFERENCE_2:
      response = handleReference2(state, message);
      break;

    case INTAKE_STEPS.CONFIRM_INFO:
      response = handleConfirmation(state, message);
      break;

    case INTAKE_STEPS.COMPLETE:
      response = handleComplete(state, message);
      break;

    default:
      response = {
        text: "I'm sorry, something went wrong. Let's start over. Type 'restart' to begin again.",
        nextStep: INTAKE_STEPS.GREETING
      };
  }

  // Update state if step changed
  if (response.nextStep) {
    state.step = response.nextStep;
    updateConversationState(from, state);
  }

  // If complete, trigger document generation
  if (response.triggerDocuments) {
    try {
      const docResult = triggerDocumentGenerationFromTelegram(state.data, from);
      response.documentResult = docResult;
    } catch (e) {
      console.error('Document generation failed:', e);
      response.text += "\n\n⚠️ There was an issue generating your documents. A staff member will assist you shortly.";
    }
  }

  return {
    text: response.text,
    voice_script: response.voice_script || null,
    advance: !!response.nextStep
  };
}

// =============================================================================
// STEP HANDLERS
// =============================================================================

function handleGreeting(state, message) {
  const lowerMsg = message.toLowerCase();

  // Check if user is asking for help or starting intake
  if (lowerMsg.includes('bail') || lowerMsg.includes('arrested') || lowerMsg.includes('help') || lowerMsg.includes('bond')) {
    return {
      text: `Hi! I'm Manus, Shamrock's digital assistant. I'll help you get your loved one released quickly. 🏃‍♂️

First, I need information about the defendant (the person in jail):

**What is their full legal name?**
(First and Last, as shown on booking)`,
      voice_script: "Hi! I'm Manus, Shamrock's digital assistant. I'll help you get your loved one released quickly. First, I need the defendant's full legal name - that's their first and last name as shown on the booking paperwork.",
      nextStep: INTAKE_STEPS.DEFENDANT_NAME
    };
  }

  // User said something else
  return {
    text: `Hi! I'm Manus from Shamrock Bail Bonds. 👋

Are you looking to:
1. Bail someone out of jail
2. Check on an existing case
3. Ask a question

Reply with 1, 2, or 3, or just tell me what you need!`,
    nextStep: INTAKE_STEPS.GREETING // Stay on greeting
  };
}

function handleDefendantName(state, message) {
  // Parse name (simple validation: at least 2 words)
  const nameParts = message.trim().split(/\s+/);

  if (nameParts.length < 2) {
    return {
      text: "I need the defendant's **full name** (first and last). For example: 'John Smith'\n\nPlease try again:",
      nextStep: null // Stay on same step
    };
  }

  // Store name
  state.data.defendantFirstName = nameParts[0];
  state.data.defendantLastName = nameParts.slice(1).join(' ');
  state.data.defendantName = message.trim();

  return {
    text: `Got it! **${state.data.defendantName}**

**What is their date of birth?**
(Format: MM/DD/YYYY or just type it naturally like "May 15, 1990")`,
    nextStep: INTAKE_STEPS.DEFENDANT_DOB
  };
}

function handleDefendantDOB(state, message) {
  // Parse date (flexible)
  const parsedDate = parseDateFlexible(message);

  if (!parsedDate) {
    return {
      text: "I couldn't understand that date. Please try again.\n\nExamples:\n- 05/15/1990\n- May 15, 1990\n- 5-15-1990",
      nextStep: null
    };
  }

  // Validate age (must be at least 18)
  const age = calculateAge(parsedDate);
  if (age < 18) {
    return {
      text: "The defendant must be at least 18 years old. Please verify the date of birth and try again:",
      nextStep: null
    };
  }

  if (age > 100) {
    return {
      text: "That date seems incorrect. Please verify and try again:",
      nextStep: null
    };
  }

  state.data.defendantDOB = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD
  state.data.defendantAge = age;

  return {
    text: `Perfect! DOB: **${formatDate(parsedDate)}** (Age: ${age})

**Which jail is ${state.data.defendantFirstName} in?**

Common options:
- Lee County Jail
- Collier County Jail
- Charlotte County Jail
- Hendry County Jail
- Glades County Jail

(Or type the name of another jail)`,
    nextStep: INTAKE_STEPS.DEFENDANT_JAIL
  };
}

function handleDefendantJail(state, message) {
  // Store jail name
  state.data.defendantJail = message.trim();
  state.data.county = extractCountyFromJail(message);

  return {
    text: `Got it! **${state.data.defendantJail}**

**What is ${state.data.defendantFirstName}'s phone number?**
(We'll use this to send them their signing link after release)`,
    nextStep: INTAKE_STEPS.DEFENDANT_PHONE
  };
}

function handleDefendantPhone(state, message) {
  const phone = parsePhoneNumber(message);

  if (!phone) {
    return {
      text: "I need a valid phone number. Examples:\n- (239) 555-1234\n- 239-555-1234\n- 2395551234\n\nPlease try again:",
      nextStep: null
    };
  }

  state.data.defendantPhone = phone;

  return {
    text: `Perfect! ${phone}

Now I need **YOUR information** as the indemnitor (co-signer):

**What is your full legal name?**`,
    nextStep: INTAKE_STEPS.INDEMNITOR_NAME
  };
}

function handleIndemnitorName(state, message) {
  const nameParts = message.trim().split(/\s+/);

  if (nameParts.length < 2) {
    return {
      text: "I need your **full name** (first and last). Please try again:",
      nextStep: null
    };
  }

  state.data.indemnitorFirstName = nameParts[0];
  state.data.indemnitorLastName = nameParts.slice(1).join(' ');
  state.data.indemnitorName = message.trim();

  return {
    text: `Thank you, **${state.data.indemnitorName}**!

**What is your email address?**
(We'll send you a copy of the signed documents)`,
    nextStep: INTAKE_STEPS.INDEMNITOR_CONTACT
  };
}

function handleIndemnitorContact(state, message) {
  const email = parseEmail(message);

  if (!email) {
    return {
      text: "I need a valid email address. Example: john@email.com\n\nPlease try again:",
      nextStep: null
    };
  }

  state.data.indemnitorEmail = email;
  state.data.indemnitorPhone = state.phoneNumber; // They're texting from this number

  return {
    text: `Perfect! ${email}

**What is your current home address?**
(Street, City, State, ZIP)`,
    nextStep: INTAKE_STEPS.INDEMNITOR_ADDRESS
  };
}

function handleIndemnitorAddress(state, message) {
  // Basic validation: must have at least 10 characters
  if (message.trim().length < 10) {
    return {
      text: "Please provide your complete address (Street, City, State, ZIP):",
      nextStep: null
    };
  }

  state.data.indemnitorAddress = message.trim();

  return {
    text: `Got it!

**Employment information:**

Please provide:
1. Your employer's name
2. Your job title
3. Your approximate annual income

You can type it all at once or one at a time.`,
    nextStep: INTAKE_STEPS.INDEMNITOR_EMPLOYMENT
  };
}

function handleIndemnitorEmployment(state, message) {
  // Store employment info (we'll parse it flexibly)
  state.data.indemnitorEmployment = message.trim();

  // Try to extract employer, title, income
  const lines = message.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length >= 1) state.data.indemnitorEmployer = lines[0];
  if (lines.length >= 2) state.data.indemnitorJobTitle = lines[1];
  if (lines.length >= 3) state.data.indemnitorIncome = lines[2];

  return {
    text: `Thank you!

**What is your relationship to ${state.data.defendantFirstName}?**

Examples: Mother, Father, Sister, Brother, Spouse, Friend, etc.`,
    nextStep: INTAKE_STEPS.INDEMNITOR_RELATIONSHIP
  };
}

function handleIndemnitorRelationship(state, message) {
  state.data.indemnitorRelationship = message.trim();

  return {
    text: `Perfect!

**Personal References:**

For compliance, I need 2 personal references (not family members).

**Reference #1:**
Please provide:
- Name
- Phone number
- Relationship to you

(You can type it all at once)`,
    nextStep: INTAKE_STEPS.REFERENCE_1
  };
}

function handleReference1(state, message) {
  state.data.reference1 = message.trim();

  // Try to parse name and phone
  const parsed = parseReference(message);
  if (parsed) {
    state.data.reference1Name = parsed.name;
    state.data.reference1Phone = parsed.phone;
    state.data.reference1Relationship = parsed.relationship;
  }

  return {
    text: `Got it!

**Reference #2:**
Please provide:
- Name
- Phone number
- Relationship to you`,
    nextStep: INTAKE_STEPS.REFERENCE_2
  };
}

function handleReference2(state, message) {
  state.data.reference2 = message.trim();

  // Try to parse name and phone
  const parsed = parseReference(message);
  if (parsed) {
    state.data.reference2Name = parsed.name;
    state.data.reference2Phone = parsed.phone;
    state.data.reference2Relationship = parsed.relationship;
  }

  return {
    text: `Excellent! Let me confirm everything:

**DEFENDANT:**
- Name: ${state.data.defendantName}
- DOB: ${state.data.defendantDOB} (Age: ${state.data.defendantAge})
- Jail: ${state.data.defendantJail}
- Phone: ${state.data.defendantPhone}

**INDEMNITOR (YOU):**
- Name: ${state.data.indemnitorName}
- Email: ${state.data.indemnitorEmail}
- Phone: ${state.data.indemnitorPhone}
- Address: ${state.data.indemnitorAddress}
- Relationship: ${state.data.indemnitorRelationship}

**Is this information correct?**
Reply "YES" to continue, or "NO" to make changes.`,
    voice_script: "Let me confirm all the information I've collected. Please review it carefully and reply YES if everything is correct, or NO if you need to make any changes.",
    nextStep: INTAKE_STEPS.CONFIRM_INFO
  };
}

function handleConfirmation(state, message) {
  const lowerMsg = message.toLowerCase().trim();

  if (lowerMsg === 'yes' || lowerMsg === 'y' || lowerMsg === 'correct' || lowerMsg === 'confirm') {
    return {
      text: `✅ Perfect! All information confirmed.

I'm now generating your bail bond paperwork. This takes about 30 seconds...

📄 Documents being prepared:
- Indemnity Agreement
- Defendant Application
- Promissory Note
- Disclosure Forms
- Master Waiver

Please wait...`,
      voice_script: "Perfect! All information confirmed. I'm now generating your bail bond paperwork. This will take about 30 seconds. Please wait while I prepare all the necessary documents.",
      nextStep: INTAKE_STEPS.COMPLETE,
      triggerDocuments: true
    };
  } else if (lowerMsg === 'no' || lowerMsg === 'n' || lowerMsg === 'incorrect') {
    return {
      text: `No problem! Let's start over to ensure everything is correct.

Type 'restart' when you're ready to begin again.`,
      nextStep: INTAKE_STEPS.GREETING
    };
  } else {
    return {
      text: `Please reply **YES** to confirm, or **NO** to make changes.`,
      nextStep: null // Stay on confirmation
    };
  }
}

function handleComplete(state, message) {
  // Conversation is complete, documents should be generated
  // This step handles any follow-up questions

  return {
    text: `Your paperwork has been generated! You should receive your signing link shortly.

💳 **Payment Options:**
You can pay the bail premium securely online here:
https://swipesimple.com/links/lnk_07a13eb404d7f3057a56d56d8bb488c8

If you have any questions, just ask! I'm here to help. 😊`,
    nextStep: null // Stay on complete
  };
}

// =============================================================================
// DOCUMENT GENERATION TRIGGER
// =============================================================================

/**
 * Trigger document generation from Telegram conversation data
 * This calls the existing generateAndSendWithWixPortal function
 */
function triggerDocumentGenerationFromTelegram(conversationData, phoneNumber) {
  console.log('Triggering document generation from Telegram intake...');

  // Transform conversation data to Dashboard.html formData format
  const formData = {
    // Defendant fields
    'defendant-first-name': conversationData.defendantFirstName || '',
    'defendant-last-name': conversationData.defendantLastName || '',
    'defendant-dob': conversationData.defendantDOB || '',
    'defendant-phone': conversationData.defendantPhone || '',
    defendantName: conversationData.defendantName || '',
    defendantEmail: conversationData.defendantEmail || '',
    defendantPhone: conversationData.defendantPhone || '',
    defendantDOB: conversationData.defendantDOB || '',
    defendantAge: conversationData.defendantAge || '',
    defendantJail: conversationData.defendantJail || '',
    county: conversationData.county || '',

    // Indemnitor fields
    'indemnitor-first-name': conversationData.indemnitorFirstName || '',
    'indemnitor-last-name': conversationData.indemnitorLastName || '',
    'indemnitor-email': conversationData.indemnitorEmail || '',
    'indemnitor-phone': conversationData.indemnitorPhone || phoneNumber,
    'indemnitor-address': conversationData.indemnitorAddress || '',
    'indemnitor-employer': conversationData.indemnitorEmployer || '',
    'indemnitor-job-title': conversationData.indemnitorJobTitle || '',
    'indemnitor-income': conversationData.indemnitorIncome || '',
    'indemnitor-relationship': conversationData.indemnitorRelationship || '',
    indemnitorName: conversationData.indemnitorName || '',
    indemnitorEmail: conversationData.indemnitorEmail || '',
    indemnitorPhone: conversationData.indemnitorPhone || phoneNumber,
    indemnitorAddress: conversationData.indemnitorAddress || '',
    indemnitorRelationship: conversationData.indemnitorRelationship || '',

    // References
    'reference1-name': conversationData.reference1Name || '',
    'reference1-phone': conversationData.reference1Phone || '',
    'reference1-relationship': conversationData.reference1Relationship || '',
    'reference2-name': conversationData.reference2Name || '',
    'reference2-phone': conversationData.reference2Phone || '',
    'reference2-relationship': conversationData.reference2Relationship || '',

    // Case metadata
    caseNumber: generateCaseNumber(),
    'case-number': generateCaseNumber(),
    receiptNumber: generateReceiptNumber(),

    // Document selection (all standard docs)
    selectedDocs: [
      'indemnity-agreement',
      'defendant-application',
      'promissory-note',
      'disclosure-form',
      'surety-terms',
      'master-waiver'
    ],

    // Signing method: Telegram (tells system to send links via Telegram)
    signingMethod: 'telegram',

    // Source tracking
    source: 'telegram_intake',
    intakeTimestamp: new Date().toISOString()
  };

  // Call existing document generation function
  if (typeof generateAndSendWithWixPortal === 'function') {
    try {
      const result = generateAndSendWithWixPortal(formData);
      console.log('Document generation result:', JSON.stringify(result));
      return result;
    } catch (e) {
      console.error('Document generation error:', e);
      throw e;
    }
  } else {
    throw new Error('generateAndSendWithWixPortal function not found');
  }
}

// =============================================================================
// VALIDATION & PARSING UTILITIES
// =============================================================================

/**
 * Parse date from flexible input
 */
function parseDateFlexible(input) {
  // Try standard formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/ // YYYY-MM-DD
  ];

  for (const regex of formats) {
    const match = input.match(regex);
    if (match) {
      let month, day, year;
      if (regex === formats[2]) {
        // YYYY-MM-DD
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else {
        // MM/DD/YYYY or MM-DD-YYYY
        month = parseInt(match[1]);
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try natural language parsing
  try {
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Ignore
  }

  return null;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format date for display
 */
function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Parse phone number (flexible)
 */
function parsePhoneNumber(input) {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '');

  // Must be 10 digits (US phone number)
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }

  return null;
}

/**
 * Parse email (basic validation)
 */
function parseEmail(input) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = input.trim().toLowerCase();

  if (emailRegex.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Extract county from jail name
 */
function extractCountyFromJail(jailName) {
  const lowerJail = jailName.toLowerCase();

  const counties = [
    'lee', 'collier', 'charlotte', 'hendry', 'glades',
    'sarasota', 'manatee', 'desoto', 'hardee', 'highlands'
  ];

  for (const county of counties) {
    if (lowerJail.includes(county)) {
      return county.charAt(0).toUpperCase() + county.slice(1);
    }
  }

  return 'Unknown';
}

/**
 * Parse reference information
 */
function parseReference(input) {
  // Try to extract name, phone, relationship
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);

  let name = null;
  let phone = null;
  let relationship = null;

  // Look for phone number pattern
  for (const line of lines) {
    if (!phone && /\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(line)) {
      phone = parsePhoneNumber(line);
    } else if (!name && line.length > 3 && !line.includes('@')) {
      name = line;
    } else if (!relationship && line.length > 2) {
      relationship = line;
    }
  }

  // If only one line, assume it's the name
  if (lines.length === 1) {
    name = lines[0];
  }

  return { name, phone, relationship };
}

/**
 * Generate case number
 */
function generateCaseNumber() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `SBB-${timestamp}-${random}`;
}

/**
 * Generate receipt number
 */
function generateReceiptNumber() {
  const props = PropertiesService.getScriptProperties();
  let current = parseInt(props.getProperty('CURRENT_RECEIPT_NUMBER') || '201204');
  current++;
  props.setProperty('CURRENT_RECEIPT_NUMBER', String(current));
  return String(current);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Main function called by Manus_Brain.js
// (No explicit exports needed in GAS - functions are global)
