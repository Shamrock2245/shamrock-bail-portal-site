/**
 * Test_TelegramMessage.js
 * Temporary script to send a test message to the latest user who interacted with the bot.
 */
function SEND_TEST_TELEGRAM() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
        console.error("Could not get active spreadsheet. Please ensure the script is bound to a Google Sheet.");
        // Fallback to TARGET_SPREADSHEET_ID if unbound
        const props = PropertiesService.getScriptProperties();
        const fallbackId = props.getProperty('TARGET_SPREADSHEET_ID');
        if (!fallbackId) return;
        ss = SpreadsheetApp.openById(fallbackId);
    }
    const sheet = ss.getSheetByName('Telegram_Inbound');
    if (!sheet) {
        console.error("Telegram_Inbound sheet not found. Send a message to the bot first to create it!");
        return;
    }
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
        const chatId = sheet.getRange(lastRow, 2).getValue();
        const bot = new TelegramBotAPI();
        bot.sendMessage(chatId, "🍀 SURPRISE! 🍀\n\nYour Telegram Bot & Automation Overhaul has been successfully deployed. I'm ready to rock! 🚀");
        console.log("Test message successfully sent to chat ID: " + chatId);
    } else {
        console.error("No users found in the Telegram_Inbound sheet. Send a message to the bot first!");
    }
}
