
        (function () {
            var dataDiv = document.getElementById('server-data-injection');
            window.INJECTED_DATA = JSON.parse(dataDiv.getAttribute('data-json') || 'null');
        })();
    