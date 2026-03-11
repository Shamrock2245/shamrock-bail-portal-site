function addBondsMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Bonds Automation')
    .addItem('One-time Setup','oneTimeSetup')
    .addSeparator()
    .addItem('Append/Update Bond (JSON prompt)','appendBondPrompt')
    .addItem('Sync Court Emails','syncCourtEmails')
    .addItem('Send Court Reminders','sendCourtReminders')
    .addToUi();
}
