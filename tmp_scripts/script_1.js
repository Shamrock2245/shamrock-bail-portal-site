
        window.onerror = function (msg, url, line, col, error) {
            const box = document.getElementById('debug-error-box');
            if (box) {
                box.style.display = 'block';
                box.innerHTML += '<div><strong>Error:</strong> ' + msg + '<br>Line: ' + line + '</div><hr>';
            }
            // Also force overlay hide just in case
            const overlay = document.getElementById('progress-overlay');
            if (overlay) overlay.style.display = 'none';
        };
    