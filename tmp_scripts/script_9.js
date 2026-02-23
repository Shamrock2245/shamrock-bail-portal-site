
        var SocialHub = (function () {
            var LIMITS = { facebook: 63206, instagram: 2200, threads: 500, twitter: 280, linkedin: 3000, gbp: 1500, telegram: 4096, youtube: 5000, tiktok: 2200, skool: 10000, patreon: 10000 };
            var LABELS = { facebook: 'Facebook', instagram: 'Instagram', threads: 'Threads', twitter: 'X (Twitter)', linkedin: 'LinkedIn', gbp: 'Google Business', telegram: 'Telegram', youtube: 'YouTube', tiktok: 'TikTok', skool: 'Skool', patreon: 'Patreon' };
            // Using HTML entities to match style
            var ICONS = { facebook: '&#128216;', instagram: '&#128248;', threads: '&#128172;', twitter: 'X', linkedin: '&#128188;', gbp: '&#128205;', telegram: '&#128233;', youtube: '&#9654;&#65039;', tiktok: '&#127925;', skool: '&#127979;', patreon: '&#127912;' };


            var currentVariants = {};

            function setStatus(msg, type) {
                var container = document.getElementById('social-variants-container');
                if (container && type === 'loading') {
                    container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:var(--muted); border: 2px dashed var(--border); border-radius:var(--radius-sm);"><i>&#9203; ' + msg + '</i></div>';
                } else if (container && type === 'error') {
                    container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:var(--error); border: 2px dashed var(--error); border-radius:var(--radius-sm);"><i>&#10007; ' + msg + '</i></div>';
                }
            }

            function getSelectedPlatforms() {
                var checkboxes = document.querySelectorAll('.social-platform:checked');
                var platforms = [];
                checkboxes.forEach(function (cb) { platforms.push(cb.value); });
                return platforms;
            }

            function renderVariants() {
                var container = document.getElementById('social-variants-container');
                if (!container) return;
                container.innerHTML = '';

                var platforms = Object.keys(currentVariants);
                if (platforms.length === 0) {
                    setStatus('No variants generated.', 'loading');
                    return;
                }

                platforms.forEach(function (p) {
                    var content = currentVariants[p];
                    var limit = LIMITS[p] || 2000;

                    var card = document.createElement('div');
                    card.className = 'card';
                    card.style.cssText = 'border-left: 4px solid var(--accent); padding: 0; overflow: hidden; margin-bottom: 16px;';

                    var header = document.createElement('div');
                    header.style.cssText = 'padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;';
                    header.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
                        '<span style="font-size:18px;">' + (ICONS[p] || '') + '</span>' +
                        '<span style="font-weight: 700;">' + (LABELS[p] || p) + '</span>' +
                        '</div>' +
                        '<label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">' +
                        '<input type="checkbox" class="social-variant-approve" data-platform="' + p + '" checked> Approve' +
                        '</label>';

                    var body = document.createElement('div');
                    body.style.cssText = 'padding: 12px 16px;';

                    var textarea = document.createElement('textarea');
                    textarea.id = 'social-content-' + p;
                    textarea.className = 'input';
                    textarea.rows = 5;
                    textarea.maxLength = limit;
                    textarea.style.cssText = 'width: 100%; resize: vertical; font-size: 13px;';
                    textarea.value = content;
                    textarea.oninput = function () { SocialHub.updateCounter(p, limit); };

                    var controls = document.createElement('div');
                    controls.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 6px;';

                    var counter = document.createElement('span');
                    counter.id = 'social-counter-' + p;
                    counter.style.cssText = 'font-size: 11px; color: var(--muted);';
                    counter.textContent = content.length + ' / ' + limit;

                    var btnGroup = document.createElement('div');
                    btnGroup.style.cssText = 'display: flex; gap: 8px;';

                    var copyBtn = document.createElement('button');
                    copyBtn.className = 'btn btn-secondary btn-sm';
                    copyBtn.innerHTML = '&#128203; Copy';
                    copyBtn.onclick = function () {
                        var text = document.getElementById('social-content-' + p).value;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(text);
                            var orig = this.innerHTML;
                            this.innerHTML = '&#10003; Copied!';
                            var btn = this;
                            setTimeout(function () { btn.innerHTML = orig; }, 2000);
                        } else {
                            // fallback for older browsers
                            var txtArea = document.getElementById('social-content-' + p);
                            txtArea.select();
                            document.execCommand('copy');
                            alert('Copied to clipboard');
                        }
                    };

                    var publishBtn = document.createElement('button');
                    publishBtn.id = 'social-publish-' + p;
                    publishBtn.className = 'btn btn-primary btn-sm';
                    publishBtn.innerHTML = '&#128640; Post to ' + (LABELS[p] || p);
                    publishBtn.onclick = function () { SocialHub.publishOne(p); };

                    btnGroup.appendChild(copyBtn);
                    btnGroup.appendChild(publishBtn);

                    controls.appendChild(counter);
                    controls.appendChild(btnGroup);

                    var resultDiv = document.createElement('div');
                    resultDiv.id = 'social-result-' + p;
                    resultDiv.style.cssText = 'display: none; margin-top: 8px; font-size: 12px;';

                    body.appendChild(textarea);
                    body.appendChild(controls);
                    body.appendChild(resultDiv);
                    card.appendChild(header);
                    card.appendChild(body);

                    container.appendChild(card);
                });

                document.getElementById('btn-broadcast-social').disabled = false;
            }

            function setResultBadge(platform, success, message) {
                var el = document.getElementById('social-result-' + platform);
                if (!el) return;
                el.style.display = 'block';
                el.style.color = success ? 'var(--success)' : 'var(--error)';

                var actionHtml = '';
                if (!success) {
                    var links = {
                        twitter: 'https://twitter.com/compose/tweet',
                        linkedin: 'https://www.linkedin.com/post/new',
                        facebook: 'https://www.facebook.com/',
                        instagram: 'https://www.instagram.com/',
                        threads: 'https://www.threads.net/',
                        gbp: 'https://business.google.com/locations'
                    };
                    if (links[platform]) {
                        actionHtml = ' <a href="' + links[platform] + '" target="_blank" style="color:var(--primary);text-decoration:underline;margin-left:8px;">Post manually &rarr;</a>';
                    }
                }

                el.innerHTML = (success ? '&#10003; ' : '&#10007; ') + message + actionHtml;
            }

            function setPublishBtnState(platform, loading) {
                var btn = document.getElementById('social-publish-' + platform);
                if (!btn) return;
                btn.disabled = loading;
                btn.innerHTML = loading ? '&#9203; Posting...' : '&#128640; Post to ' + (LABELS[platform] || platform);
            }

            return {
                init: function () {
                    // init logic if needed
                },

                updateCounter: function (platform, limit) {
                    var textarea = document.getElementById('social-content-' + platform);
                    var counter = document.getElementById('social-counter-' + platform);
                    if (!textarea || !counter) return;
                    var len = textarea.value.length;
                    counter.textContent = len + ' / ' + limit;
                    counter.style.color = len > limit * 0.9 ? (len >= limit ? 'var(--error)' : 'var(--warning)') : 'var(--muted)';
                },

                generate: function () {
                    var basePostEl = document.getElementById('social-base-post');
                    var basePost = basePostEl ? basePostEl.value.trim() : '';
                    if (!basePost) {
                        alert("Please enter a base post or idea first.");
                        return;
                    }

                    var platforms = getSelectedPlatforms();
                    if (platforms.length === 0) {
                        alert("Please select at least one target platform.");
                        return;
                    }

                    var useOpus = document.getElementById('social-opus-clips') ? document.getElementById('social-opus-clips').checked : false;

                    var btn = document.getElementById('btn-generate-social');
                    if (btn) { btn.disabled = true; btn.innerHTML = '&#9203; Generating...'; }
                    document.getElementById('btn-broadcast-social').disabled = true;

                    setStatus('Generating AI variants for ' + platforms.join(', ') + '...', 'loading');

                    google.script.run
                        .withSuccessHandler(function (res) {
                            if (btn) { btn.disabled = false; btn.innerHTML = '&#129302; Generate with Grok'; }
                            if (res.success) {
                                currentVariants = res.variants;
                                renderVariants();
                            } else {
                                setStatus('Generation failed: ' + res.error, 'error');
                            }
                        })
                        .withFailureHandler(function (err) {
                            if (btn) { btn.disabled = false; btn.innerHTML = '&#129302; Generate with Grok'; }
                            setStatus('Communication failed: ' + err.message, 'error');
                        })
                        .client_generateSocialPosts(basePost, platforms, useOpus);
                },

                publishOne: function (platform) {
                    // We check if it's supported by backend right now
                    // Backend SocialPublisher supports twitter, linkedin, gbp, tiktok, youtube, telegram, facebook, instagram, threads, skool, patreon
                    var supported = ['twitter', 'linkedin', 'gbp', 'tiktok', 'youtube', 'telegram', 'facebook', 'instagram', 'threads', 'skool', 'patreon'];

                    var contentEl = document.getElementById('social-content-' + platform);
                    if (!contentEl || !contentEl.value.trim()) return;
                    var content = contentEl.value.trim();
                    var driveFileId = document.getElementById('social-media-drive-id') ? document.getElementById('social-media-drive-id').value : '';

                    if (supported.indexOf(platform) === -1) {
                        setResultBadge(platform, false, 'API integration for ' + LABELS[platform] + ' is not yet complete.');
                        return;
                    }

                    setPublishBtnState(platform, true);
                    setResultBadge(platform, true, 'Posting...');

                    google.script.run
                        .withSuccessHandler(function (res) {
                            setPublishBtnState(platform, false);
                            if (res.success) {
                                setResultBadge(platform, true, 'Posted successfully!');
                            } else {
                                setResultBadge(platform, false, res.note || res.error || 'Failed.');
                            }
                        })
                        .withFailureHandler(function (err) {
                            setPublishBtnState(platform, false);
                            setResultBadge(platform, false, 'Error: ' + err.message);
                        })
                        .publishPost(platform, content, { driveFileId: driveFileId });
                },

                broadcastAll: function () {
                    var posts = {};
                    var approvedCheckboxes = document.querySelectorAll('.social-variant-approve:checked');
                    var driveFileId = document.getElementById('social-media-drive-id') ? document.getElementById('social-media-drive-id').value : '';
                    approvedCheckboxes.forEach(function (cb) {
                        var p = cb.getAttribute('data-platform');
                        var contentEl = document.getElementById('social-content-' + p);
                        if (contentEl && contentEl.value.trim()) {
                            posts[p] = { content: contentEl.value.trim(), driveFileId: driveFileId };
                        }
                    });

                    if (Object.keys(posts).length === 0) {
                        alert("No approved variants with content to broadcast.");
                        return;
                    }

                    var btn = document.getElementById('btn-broadcast-social');
                    if (btn) { btn.disabled = true; btn.innerHTML = '&#9203; Broadcasting...'; }

                    Object.keys(posts).forEach(function (p) {
                        // Only set status to posting if making API request
                        var supported = ['twitter', 'linkedin', 'gbp', 'tiktok', 'youtube'];
                        if (supported.indexOf(p) !== -1) {
                            setPublishBtnState(p, true);
                            setResultBadge(p, true, 'Posting...');
                        }
                    });

                    google.script.run
                        .withSuccessHandler(function (res) {
                            if (btn) { btn.disabled = false; btn.innerHTML = '&#128640; Broadcast Approved Posts'; }

                            // Process the backend results
                            Object.keys(res.results).forEach(function (p) {
                                var r = res.results[p];
                                setPublishBtnState(p, false);
                                if (r.success) {
                                    setResultBadge(p, true, 'Posted successfully!');
                                } else {
                                    setResultBadge(p, false, r.note || r.error || 'Failed.');
                                }
                            });

                            // Handle any unsupported platforms that were approved but not sent
                            Object.keys(posts).forEach(function (p) {
                                if (!res.results[p]) {
                                    setPublishBtnState(p, false);
                                    setResultBadge(p, false, 'Platform not yet supported by backend API.');
                                }
                            });
                        })
                        .withFailureHandler(function (err) {
                            if (btn) { btn.disabled = false; btn.innerHTML = '&#128640; Broadcast Approved Posts'; }
                            Object.keys(posts).forEach(function (p) {
                                setPublishBtnState(p, false);
                            });
                            alert("Broadcast failed: " + err.message);
                        })
                        .publishAll(posts);
                }
            };
        })();

        function generateSocialPosts() {
            SocialHub.generate();
        }

        function broadcastSocialPosts() {
            SocialHub.broadcastAll();
        }

        function scheduleSocialPosts() {
            var posts = {};
            var approvedCheckboxes = document.querySelectorAll('.social-variant-approve:checked');
            var driveFileId = document.getElementById('social-media-drive-id') ? document.getElementById('social-media-drive-id').value : '';
            approvedCheckboxes.forEach(function (cb) {
                var p = cb.getAttribute('data-platform');
                var contentEl = document.getElementById('social-content-' + p);
                if (contentEl && contentEl.value.trim()) {
                    posts[p] = { content: contentEl.value.trim(), driveFileId: driveFileId };
                }
            });

            if (Object.keys(posts).length === 0) {
                alert("No approved variants with content to schedule.");
                return;
            }

            var scheduledDate = prompt("Enter schedule date (e.g. YYYY-MM-DD or YYYY-MM-DD HH:MM) for these posts:");
            if (!scheduledDate) return;

            var btn = document.getElementById('btn-schedule-social');
            if (btn) { btn.disabled = true; btn.innerHTML = '&#9203; Scheduling...'; }

            google.script.run
                .withSuccessHandler(function (res) {
                    if (btn) { btn.disabled = false; btn.innerHTML = '📆 Schedule'; }
                    if (res.success) {
                        alert("Successfully scheduled posts!");
                        syncGoogleCalendar();
                    } else {
                        alert("Failed to schedule: " + res.error);
                    }
                })
                .withFailureHandler(function (err) {
                    if (btn) { btn.disabled = false; btn.innerHTML = '📆 Schedule'; }
                    alert("Communication failed: " + err.message);
                })
                .client_scheduleSocialPosts(posts, scheduledDate);
        }

        function syncGoogleCalendar() {
            var container = document.getElementById('calendar-events-container');
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted); grid-column: 1 / -1;">⏳ Syncing with Calendar...</div>';

            google.script.run
                .withSuccessHandler(function (res) {
                    if (res.success && res.events && res.events.length > 0) {
                        var html = '';
                        res.events.forEach(function (ev) {
                            html += `<div style="padding: 16px; background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius-sm);">
                                <div style="font-weight: 600; margin-bottom: 8px; color: var(--primary);">${new Date(ev.date).toLocaleString()}</div>
                                <div style="font-size: 13px; color: var(--text); font-style: italic;">"${ev.title}"</div>
                                <div style="font-size: 12px; color: var(--muted); margin-top: 8px; text-transform: capitalize;">Platforms: ${ev.platforms.join(', ')}</div>
                            </div>`;
                        });
                        container.innerHTML = html;
                    } else {
                        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted); grid-column: 1 / -1;">No upcoming scheduled posts found in the next 60 days.</div>';
                    }
                })
                .withFailureHandler(function (err) {
                    container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--error); grid-column: 1 / -1;">Error: ${err.message}</div>`;
                })
                .client_getScheduledPosts();
        }

        function fetchTrendingNews() {
            var topic = document.getElementById('news-topic').value.trim();
            var btn = document.getElementById('btn-fetch-news');
            if (btn) { btn.disabled = true; btn.innerText = 'Fetching...'; }

            google.script.run
                .withSuccessHandler(function (res) {
                    if (btn) { btn.disabled = false; btn.innerText = 'Fetch Trending'; }
                    if (res.success) {
                        document.getElementById('social-base-post').value = res.draft;
                    } else {
                        alert('Failed to fetch news: ' + res.error);
                    }
                })
                .withFailureHandler(function (err) {
                    if (btn) { btn.disabled = false; btn.innerText = 'Fetch Trending'; }
                    alert('Communication failed: ' + err.message);
                })
                .client_fetchTrendingNews(topic);
        }
    