#!/usr/bin/env node
/**
 * Google Calendar notification mail must not become an admin-calendar event.
 * Loads the GAS court email files in a vm. No Gmail, Calendar, or network.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const processorSrc = fs.readFileSync(path.join(ROOT, 'backend-gas/CourtEmailProcessor.js'), 'utf8');
const automationSrc = fs.readFileSync(path.join(ROOT, 'backend-gas/CourtDateAutomation.js'), 'utf8');

const logs = [];
const ctx = {
  console,
  logs,
  CalendarApp: {
    EventColor: { BLUE: 'blue', RED: 'red', ORANGE: 'orange', GREEN: 'green' },
    getCalendarById() {
      return {
        getEventsForDay() {
          return [];
        },
        createEvent() {
          throw new Error('createEvent should not run in this test');
        },
        createAllDayEvent() {
          return { setColor() {} };
        }
      };
    }
  },
  Logger: {
    log(...args) {
      logs.push(args.map(String).join(' '));
    }
  },
  Utilities: {
    formatDate() {
      return '2026/10/01';
    }
  },
  GmailApp: {
    getUserLabelByName(name) {
      return { getName: () => name };
    },
    createLabel(name) {
      return { getName: () => name };
    },
    search() {
      return [];
    }
  },
  NotificationService: {
    sendSlack() {},
    sendSms() {},
    sendEmail() {}
  },
  CONFIG: {
    EMAIL_SEARCH_QUERIES: [
      'from:clerk@leeclerk.org subject:(court OR hearing OR appearance)',
      'subject:"Notice of Hearing"'
    ],
    BUSINESS_HOURS: { START: 0, END: 24, WORK_DAYS: [0, 1, 2, 3, 4, 5, 6] },
    SLACK_CHANNELS: { COURT_DATES: '#court-dates' }
  }
};

vm.createContext(ctx);
vm.runInContext(processorSrc, ctx, { filename: 'CourtEmailProcessor.js' });
vm.runInContext(automationSrc, ctx, { filename: 'CourtDateAutomation.js' });

function message(from, subject) {
  const labels = [];
  const thread = {
    getId() {
      return from + '|' + subject;
    },
    getLabels() {
      return labels;
    },
    addLabel(label) {
      labels.push(label);
    },
    getMessages() {
      return [api];
    }
  };
  const api = {
    getFrom: () => from,
    getSubject: () => subject,
    getPlainBody: () => '',
    getAttachments: () => [],
    getThread: () => thread,
    thread
  };
  return api;
}

const CLERK = 'Lee County Clerk <infocriminalbonds@leeclerk.org>';
const GOOGLE = 'Google Calendar <calendar-notification@google.com>';
const SUBSCRIBED = 'You are receiving this email because you are subscribed to calendar notifications';

test.describe('court email Google Calendar notification skip', () => {
test('known Google Calendar notification senders and the subscribed subject match', () => {
  assert.equal(
    ctx.googleCalendarNotificationSkipReason(GOOGLE, 'Invitation: Notice of Hearing'),
    'sender calendar-notification@google.com'
  );
  assert.equal(
    ctx.googleCalendarNotificationSkipReason('calendar-noreply@google.com', 'Daily agenda'),
    'sender calendar-noreply@google.com'
  );
  assert.equal(
    ctx.googleCalendarNotificationSkipReason('calendar-daemon@google.com', 'Notification'),
    'sender calendar-daemon@google.com'
  );
  assert.equal(
    ctx.googleCalendarNotificationSkipReason('CALENDAR-SERVER@GOOGLE.COM', 'Notification'),
    'sender calendar-server@google.com'
  );
  assert.equal(
    ctx.googleCalendarNotificationSkipReason(
      '"admin@shamrockbailbonds.biz" <calendar-notification@google.com>',
      'Notice of Hearing'
    ),
    'sender calendar-notification@google.com'
  );
  assert.equal(
    ctx.googleCalendarNotificationSkipReason(CLERK, SUBSCRIBED),
    'subject'
  );
  assert.equal(
    ctx.googleCalendarNotificationSkipReason(
      CLERK,
      'receiving this email because you are subscribed to calendar'
    ),
    'subject'
  );
});

test('clerk court, forfeiture, and discharge subjects are not notification mail', () => {
  assert.equal(ctx.googleCalendarNotificationSkipReason(CLERK, 'Notice of Hearing'), '');
  assert.equal(ctx.googleCalendarNotificationSkipReason(CLERK, 'Notice of Forfeiture'), '');
  assert.equal(ctx.googleCalendarNotificationSkipReason(CLERK, 'Bond Discharge'), '');
  assert.equal(ctx.googleCalendarNotificationSkipReason(CLERK, 'Release of surety'), '');
  assert.equal(ctx.googleCalendarNotificationSkipReason('', ''), '');
  assert.equal(ctx.googleCalendarNotificationSkipReason('somebody@gmail.com', 'Hello'), '');
});

test('search exclusion lists the notification senders and the subject phrase', () => {
  const exclusion = ctx.googleCalendarNotificationSearchExclusion();
  assert.match(exclusion, /-from:calendar-notification@google\.com/);
  assert.match(exclusion, /-from:calendar-noreply@google\.com/);
  assert.match(exclusion, /-subject:"receiving this email because you are subscribed to"/);
});

test('classification keywords and the admin calendar id are unchanged', () => {
  assert.match(processorSrc, /calendarId: 'admin@shamrockbailbonds\.biz'/);
  assert.ok(processorSrc.includes(`keywords: {
    courtDate: [
      'SERVICE OF COURT DOCUMENT for Case Number',
      'Notice of Appearance',
      'Court Date Notice',
      'Notice of Hearing'
    ],
    forfeiture: [
      'Notice of Forfeiture',
      'FORFEITURE'
    ],
    discharge: [
      'Discharge',
      'Release',
      'Power of Attorney Discharge',
      'Bond Discharge',
      'Certificate of Discharge'
    ]
  }`));
});

test('processEmail skips notification mail before court, forfeiture, or discharge routing', () => {
  logs.length = 0;
  const hearing = ctx.processEmail(message(GOOGLE, 'Invitation: Notice of Hearing @ Thu Nov 5, 2026 9am'));
  assert.equal(hearing.skipped, true);
  assert.match(hearing.reason, /sender calendar-notification@google.com/);
  assert.equal(logs.some(line => line.includes('Type: Court Date')), false);
  assert.equal(logs.some(line => line.includes('Skipping Google Calendar notification')), true);

  logs.length = 0;
  const forfeiture = ctx.processEmail(message('calendar-noreply@google.com', 'FORFEITURE notice'));
  assert.equal(forfeiture.skipped, true);
  assert.equal(logs.some(line => line.includes('Type: Forfeiture')), false);

  logs.length = 0;
  const quoted = ctx.processEmail(message(
    CLERK,
    'Notice of Hearing — You are receiving this email because you are subscribed to calendar notifications'
  ));
  assert.equal(quoted.skipped, true);
  assert.match(quoted.reason, /subject/);
  assert.equal(logs.some(line => line.includes('Type: Court Date')), false);
});

test('processEmail still routes real clerk mail by the existing subject keywords', () => {
  logs.length = 0;
  const court = ctx.processEmail(message(CLERK, 'Notice of Hearing for 26-CF-0001'));
  assert.equal(court.success, false);
  assert.equal(court.error, 'Extraction failed');
  assert.equal(logs.some(line => line.includes('Type: Court Date')), true);

  logs.length = 0;
  const forfeiture = ctx.processEmail(message(CLERK, 'Notice of Forfeiture'));
  assert.equal(forfeiture.success, false);
  assert.equal(logs.some(line => line.includes('Type: Forfeiture')), true);

  logs.length = 0;
  const discharge = ctx.processEmail(message(CLERK, 'Certificate of Discharge'));
  assert.equal(discharge.success, true);
  assert.equal(logs.some(line => line.includes('Type: Discharge')), true);
});

test('getUnprocessedEmails drops notification mail and keeps a whitelisted clerk message', () => {
  logs.length = 0;
  const googleMsg = message(GOOGLE, 'Invitation: Notice of Hearing');
  const clerkMsg = message(CLERK, 'Notice of Hearing');
  let query = '';
  ctx.GmailApp.search = (q) => {
    query = q;
    return [{ getMessages: () => [googleMsg, clerkMsg] }];
  };

  const messages = ctx.getUnprocessedEmails(30);
  assert.equal(messages.length, 1);
  assert.equal(messages[0], clerkMsg);
  assert.match(query, /has:attachment after:2026\/10\/01/);
  assert.match(query, /-from:calendar-notification@google\.com/);
  assert.match(query, /-from:calendar-noreply@google\.com/);
  assert.equal(logs.some(line => line.includes('Skipping Google Calendar notification')), true);
  assert.equal(
    googleMsg.thread.getLabels().some(label => label.getName() === 'Skipped - Google Calendar Notification'),
    true
  );

  logs.length = 0;
  ctx.getUnprocessedEmails(30);
  assert.equal(logs.some(line => line.includes('Skipping Google Calendar notification (sender')), false);
});

test('scheduled court-date parser skips notification threads before creating an event', () => {
  let parsed = 0;
  let created = 0;
  ctx.parseCourtDateEmail = () => {
    parsed += 1;
    return { caseNumber: '26-CF-1234', courtDate: '2026-11-05', courtTime: '9:00 AM' };
  };
  ctx.createCourtCalendarEvent = () => {
    created += 1;
    return 'event-id';
  };
  ctx.updateSheetWithCourtDate = () => ({ defendantName: 'Jane Doe', caseNumber: '26-CF-1234' });

  const googleThread = message(GOOGLE, 'Invitation: Notice of Hearing @ Thu Nov 5, 2026 9am').thread;
  const queries = [];
  ctx.GmailApp.search = (q) => {
    queries.push(q);
    return [googleThread];
  };

  logs.length = 0;
  ctx.processCourtDateEmails();

  assert.equal(parsed, 0);
  assert.equal(created, 0);
  assert.equal(logs.some(line => line.includes('Skipping Google Calendar notification')), true);
  assert.equal(googleThread.getLabels().length > 0, true);
  assert.equal(queries.length, ctx.CONFIG.EMAIL_SEARCH_QUERIES.length);
  queries.forEach((q) => {
    assert.match(q, /-from:calendar-notification@google\.com/);
    assert.match(q, /-from:calendar-noreply@google\.com/);
    assert.match(q, /-subject:"receiving this email because you are subscribed to"/);
    assert.match(q, /-label:CourtDate\/Processed/);
  });
});

test('scheduled parser still parses a clerk Notice of Hearing thread', () => {
  let parsed = 0;
  let created = 0;
  ctx.parseCourtDateEmail = () => {
    parsed += 1;
    return null;
  };
  ctx.createCourtCalendarEvent = () => {
    created += 1;
  };
  const clerkThread = message(CLERK, 'Notice of Hearing').thread;
  ctx.GmailApp.search = () => [clerkThread];

  ctx.processCourtDateEmails();
  assert.equal(parsed, 1);
  assert.equal(created, 0);
});
});
