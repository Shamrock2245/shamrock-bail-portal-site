/**
 * AI Concierge Frontend Controller
 * 
 * Usage:
 * import { initAIChat } from 'public/ai-concierge';
 * 
 * $w.onReady(function () {
 *   initAIChat({
 *     chatBox: $w('#boxAIChat'),
 *     repeater: $w('#repChatMessages'),
 *     inputMap: {
 *       input: $w('#inputAIMessage'),
 *       sendBtn: $w('#btnAISend'),
 *       minimizeBtn: $w('#btnAIMinimize'),
 *       openBtn: $w('#btnAIOpen') 
 *     }
 *   });
 * });
 */

import { chatWithAgent } from 'backend/ai-service.jsw';
import wixWindow from 'wix-window';
import { getOrSetSessionId, getSessionToken } from 'public/session-manager';

let chatHistory = [];
let isProcessing = false;

export function initAIChat({ chatBox, repeater, inputMap }) {
    const { input, sendBtn, minimizeBtn, openBtn } = inputMap;

    // 0. Default Welcome Message
    if (chatHistory.length === 0) {
        chatHistory.push({
            role: 'assistant',
            content: "Hello! I'm the Shamrock AI Concierge. How can I help you regarding bail bonds, court dates, or warrant checks today?",
            _id: 'welcome_msg'
        });
    }

    // 1. Setup Repeater
    repeater.onItemReady(($item, itemData) => {
        const content = itemEl($item, '#txtChatContent');
        if (content) {
            try { content.text = itemData.content; } catch (e) { /* not a text element */ }
        }

        const box = itemEl($item, '#boxChatMessage');
        const role = itemEl($item, '#txtChatRole');
        if (itemData.role === 'user') {
            if (box && box.style) {
                try {
                    box.style.backgroundColor = "#E6F4EA";
                    box.style.borderRadius = "20px 20px 0px 20px";
                } catch (e) { /* style not writable */ }
            }
            if (role) {
                try {
                    if (role.valid) {
                        role.text = "You";
                        role.hide();
                    }
                } catch (e) { /* optional role label */ }
            }
        } else {
            if (box && box.style) {
                try {
                    box.style.backgroundColor = "#F1F3F4";
                    box.style.borderRadius = "20px 20px 20px 0px";
                } catch (e) { /* style not writable */ }
            }
            if (role) {
                try {
                    if (role.valid) {
                        role.text = "Shamrock AI";
                        role.show();
                    }
                } catch (e) { /* optional role label */ }
            }
        }
    });

    // Load initial data
    repeater.data = chatHistory;

    // 2. Event Listeners
    sendBtn.onClick(() => sendMessage(input, repeater));
    input.onKeyPress((event) => {
        if (event.key === 'Enter') {
            sendMessage(input, repeater);
        }
    });

    if (minimizeBtn) {
        minimizeBtn.onClick(() => {
            chatBox.collapse();
            if (openBtn) openBtn.expand();
        });
    }

    if (openBtn) {
        openBtn.onClick(() => {
            if (openBtn) openBtn.collapse();
            chatBox.expand();
        });
    }

    // Initial State: Hidden or Minimized?
    // chatBox.collapse(); 
}

function itemEl($item, id) {
    try {
        return $item(id) || null;
    } catch (e) {
        return null;
    }
}

async function sendMessage(inputElement, repeater) {
    if (isProcessing) return;

    const text = inputElement.value;
    if (!text || text.trim().length === 0) return;

    // Optimistic UI Update
    isProcessing = true;
    inputElement.value = "";

    // Add User Message
    chatHistory.push({ role: 'user', content: text, _id: Date.now().toString() });
    updateRepeater(repeater);

    // Context (Auth)
    // We try to get auth token if available (e.g. from local storage or session)
    const sessionId = getOrSetSessionId(); // getOrSetSessionId is the correct export from session-manager.js
    const authToken = getSessionToken(); // New import needed

    const context = {
        authToken: authToken,
        sessionId: sessionId
    };

    try {
        // Send to Backend
        // We only send the message history content, not the IDs
        const historyPayload = chatHistory.map(h => ({ role: h.role, content: h.content }));

        const response = await chatWithAgent(historyPayload, context);

        // Add Assistant Message
        chatHistory.push({
            role: 'assistant',
            content: response.content,
            _id: (Date.now() + 1).toString()
        });

    } catch (err) {
        console.error("Chat Error:", err);
        chatHistory.push({
            role: 'assistant',
            content: "Sorry, I'm having trouble connecting right now.",
            _id: (Date.now() + 2).toString()
        });
    } finally {
        isProcessing = false;
        updateRepeater(repeater);
    }
}

function updateRepeater(repeater) {
    repeater.data = chatHistory;
}
