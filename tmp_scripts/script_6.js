
        (function () {
            try {
                // Auto-redirect to Mobile/Tablet if not already set
                var params = new URLSearchParams(window.location.search);
                if (!params.has('page')) {
                    var ua = navigator.userAgent.toLowerCase();
                    var width = window.innerWidth;
                    var targetPage = null;

                    // Priority 1: User Agent Detection (most reliable for device type)
                    if (/iphone|ipod|android.*mobile|windows phone|blackberry|bb10|mobile/i.test(ua)) {
                        targetPage = 'mobile';
                    } else if (/ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/i.test(ua)) {
                        targetPage = 'tablet';
                    }
                    // Priority 2: Screen Width (fallback for unrecognized devices)
                    else if (width <= 600) {
                        targetPage = 'mobile';
                    } else if (width <= 1024) {
                        targetPage = 'tablet';
                    }
                    // Priority 3: Desktop (default)
                    else {
                        targetPage = null; // Stay on desktop
                    }

                    // Redirect if mobile or tablet detected
                    if (targetPage) {
                        console.log('📱 Auto-detected device:', targetPage, '| UA:', ua.substring(0, 50), '| Width:', width);
                        params.set('page', targetPage);
                        window.location.search = params.toString();
                    } else {
                        console.log('💻 Desktop version loaded | Width:', width);
                    }
                }
            } catch (e) {
                console.warn("Device detection failed:", e);
            }
        })();
    