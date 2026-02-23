
        setTimeout(function () {
            const ov = document.getElementById('progress-overlay');
            if (ov) {
                console.warn("⚠️ Fail-Safe: Hiding Overlay");
                ov.style.display = 'none';
            }

            // Force Tab Visibility
            const activeTab = document.querySelector('.tab-content.active');
            if (!activeTab || activeTab.style.display === 'none') {
                console.warn("⚠️ Fail-Safe: No active tab visible, forcing Scrapers tab.");
                const scrapers = document.getElementById('scrapers-tab');
                if (scrapers) {
                    scrapers.style.display = 'block';
                    scrapers.classList.add('active');
                    // Add debug border to see if it's rendering but empty
                    scrapers.style.border = "4px solid red";
                } else {
                    console.error("❌ CRITCAL: #scrapers-tab element NOT FOUND in DOM");
                    alert("CRITICAL ERROR: Dashboard HTML is corrupt. Missing #scrapers-tab");
                }
            } else {
                console.log("✅ Tab is visible:", activeTab.id);
            }

            // Debug Node Count
            const cards = document.querySelectorAll('.county-card');
            console.log("Found " + cards.length + " county cards.");
            if (cards.length === 0) alert("Diagnostic: 0 County Cards found. HTML is truncated?");

        }, 3000);
    