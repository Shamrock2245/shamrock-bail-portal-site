
        function openMediaLibrary() {
            document.getElementById('media-library-modal').style.display = 'flex';
            loadDriveMedia();
        }

        function closeMediaLibrary() {
            document.getElementById('media-library-modal').style.display = 'none';
        }

        function switchMediaTab(tabId) {
            document.querySelectorAll('.media-tab-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('#media-library-modal .tab').forEach(el => {
                el.style.borderBottom = 'none';
                el.style.color = 'var(--text-secondary)';
                el.style.fontWeight = 'normal';
            });

            document.getElementById('media-content-' + tabId).style.display = 'block';
            const activeTab = document.getElementById('tab-' + tabId);
            activeTab.style.borderBottom = '2px solid var(--primary)';
            activeTab.style.color = 'var(--primary)';
            activeTab.style.fontWeight = '600';

            if (tabId === 'drive') loadDriveMedia();
        }

        function loadDriveMedia() {
            const grid = document.getElementById('drive-media-grid');
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading media from Google Drive...</div>';

            google.script.run
                .withSuccessHandler(function (files) {
                    if (!files || files.length === 0) {
                        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px;">No media found in the "shamrock-social-media" folder.</div>';
                        return;
                    }

                    grid.innerHTML = files.map(f => {
                        const isVideo = f.mimeType.startsWith('video/');
                        const icon = isVideo ? '<i class="fas fa-video"></i>' : '<i class="fas fa-image"></i>';
                        return '<div class="media-item" onclick="selectMediaFile(\'' + f.id + '\', \'' + f.name.replace(/'/g, "\\'") + '\', \'' + f.mimeType + '\')" style="border: 1px solid var(--border-medium); border-radius: 6px; padding: 10px; cursor: pointer; text-align: center; background: rgba(0,0,0,0.1); transition: all 0.2s ease;">' +
                            '<div style="height: 100px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--text-muted); background: var(--bg-main); border-radius: 4px; margin-bottom: 10px;">' +
                            icon +
                            '</div>' +
                            '<div style="font-size: 11px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; mix-blend-mode: difference;">' +
                            f.name +
                            '</div>' +
                            '</div>';
                    }).join('');
                })
                .withFailureHandler(function (err) {
                    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 40px;">Error loading media: ' + err.message + '</div>';
                })
                .client_getSocialMediaFiles();
        }

        let currentSelectedMedia = null;

        function selectMediaFile(id, name, mimeType) {
            currentSelectedMedia = { id, name, mimeType };
            document.getElementById('social-media-drive-id').value = id;
            document.getElementById('social-media').value = ''; // clear local file if picked from drive

            const preview = document.getElementById('selected-media-preview');
            const previewName = document.getElementById('selected-media-name');
            const icon = mimeType.startsWith('video/') ? '<i class="fas fa-video"></i> ' : '<i class="fas fa-image"></i> ';
            previewName.innerHTML = icon + name;
            preview.style.display = 'block';

            closeMediaLibrary();
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast("Media selected from Drive.", "success");
            }
        }

        function clearSelectedMedia() {
            currentSelectedMedia = null;
            document.getElementById('social-media-drive-id').value = '';
            document.getElementById('social-media').value = '';
            document.getElementById('selected-media-preview').style.display = 'none';
        }

        // Listen for standard file uploads to clear drive selection
        document.getElementById('social-media').addEventListener('change', function (e) {
            if (e.target.files.length > 0) {
                document.getElementById('social-media-drive-id').value = '';
                document.getElementById('selected-media-preview').style.display = 'none';
                currentSelectedMedia = null;
            }
        });
    