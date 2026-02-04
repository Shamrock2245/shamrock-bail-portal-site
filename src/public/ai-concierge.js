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
import { getSessionId, getSessionToken } from 'public/session-manager';

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
        $item('#txtChatContent').text = itemData.content;

        // Simple styling based on role
        if (itemData.role === 'user') {
            $item('#boxChatMessage').style.backgroundColor = "#E6F4EA"; // Light Green
            $item('#boxChatMessage').style.borderRadius = "20px 20px 0px 20px"; // Rounded corners

            // Safety check for role text
            if ($item('#txtChatRole').valid) {
                $item('#txtChatRole').text = "You";
                $item('#txtChatRole').hide(); // Often cleaner to hide "You" role label
            }
        } else {
            $item('#boxChatMessage').style.backgroundColor = "#F1F3F4"; // Gray
            $item('#boxChatMessage').style.borderRadius = "20px 20px 20px 0px"; // Rounded corners

            if ($item('#txtChatRole').valid) {
                $item('#txtChatRole').text = "Shamrock AI";
                $item('#txtChatRole').show();
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
    const sessionId = getSessionId(); // From existing import
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
