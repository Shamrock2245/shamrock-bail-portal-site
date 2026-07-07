import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { getStudentAuditLogs } from 'backend/bailSchoolMongo';

$w.onReady(async function () {
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        wixLocation.to('/bail-school-login');
        return;
    }
    
    const role = await user.getRoles();
    const isAuditor = role.some(r => r.name === 'Auditor' || r.name === 'Admin');
    
    if (!isAuditor) {
        $w('#errorText').text = "Unauthorized Access. This area is restricted to FLDFS Auditors.";
        $w('#errorText').show();
        return;
    }

    // Bind UI elements
    $w('#searchButton').onClick(() => searchStudentLogs());
    $w('#studentEmailInput').onKeyPress((event) => {
        if (event.key === 'Enter') searchStudentLogs();
    });
    $w('#exportCsvButton').onClick(() => exportLogsToCsv());
    $w('#exportCsvButton').hide(); // Hide until data is loaded
});

let currentLogs = [];

async function searchStudentLogs() {
    const studentEmail = $w('#studentEmailInput').value;
    
    if (!studentEmail) {
        $w('#errorText').text = "Please enter a student email to search.";
        $w('#errorText').show();
        return;
    }
    
    $w('#errorText').hide();
    $w('#loadingSpinner').show();
    $w('#logsTable').hide();
    
    try {
        const logs = await getStudentAuditLogs(studentEmail);
        
        if (!logs || logs.length === 0) {
            $w('#errorText').text = "No audit logs found for this student.";
            $w('#errorText').show();
        } else {
            renderLogsTable(logs);
        }
    } catch (e) {
        console.error("Audit Dashboard Error:", e);
        $w('#errorText').text = "Failed to fetch logs. Please try again.";
        $w('#errorText').show();
    } finally {
        $w('#loadingSpinner').hide();
    }
}

function renderLogsTable(logs) {
    const tableData = logs.map(log => ({
        timestamp: new Date(log.timestamp).toLocaleString(),
        action: log.action,
        lessonId: log.lessonId || "N/A",
        ipAddress: log.ipAddress || "Unknown",
        details: JSON.stringify(log.extraData || {})
    }));
    
    // Using a native Wix Table element
    $w('#logsTable').columns = [
        { id: 'col1', dataPath: 'timestamp', label: 'Timestamp', type: 'string', width: 200 },
        { id: 'col2', dataPath: 'action', label: 'Action', type: 'string', width: 150 },
        { id: 'col3', dataPath: 'lessonId', label: 'Lesson', type: 'string', width: 150 },
        { id: 'col4', dataPath: 'ipAddress', label: 'IP Address', type: 'string', width: 120 },
        { id: 'col5', dataPath: 'details', label: 'Details', type: 'string', width: 300 }
    ];
    
    $w('#logsTable').rows = tableData;
    $w('#logsTable').show();
    $w('#exportCsvButton').show();
    
    currentLogs = tableData;
}

function exportLogsToCsv() {
    if (!currentLogs || currentLogs.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Action,Lesson,IP Address,Details\n";
    
    currentLogs.forEach(row => {
        const rowStr = `"${row.timestamp}","${row.action}","${row.lessonId}","${row.ipAddress}","${row.details.replace(/"/g, '""')}"`;
        csvContent += rowStr + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    wixLocation.to(encodedUri);
}
