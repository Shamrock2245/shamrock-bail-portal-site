function api_researchEmails(query) {
    try {
        const ss = SpreadsheetApp.create('Email Research Output - ' + new Date().toLocaleDateString());
        const sheet = ss.getActiveSheet();
        sheet.appendRow(['Subject', 'Date', 'Body']);

        const threads = GmailApp.search(query, 0, 15);
        for (let i = 0; i < threads.length; i++) {
            const msgs = threads[i].getMessages();
            const lastMsg = msgs[msgs.length - 1];
            sheet.appendRow([
                lastMsg.getSubject(),
                lastMsg.getDate().toISOString(),
                lastMsg.getPlainBody().substring(0, 2000)
            ]);
        }

        // Also log the URL to Cloud Logging for easy finding
        console.log("RESEARCH SPREADSHEET URL: " + ss.getUrl());
        return { success: true, url: ss.getUrl() };
    } catch (e) {
        return { success: false, error: e.message };
    }
}
