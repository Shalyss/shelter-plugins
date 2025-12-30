import { callGemini } from './api.js';

// Function to prepare a reply suggestion (does not send)
export async function prepareReply(message) {
    if (!message || !message.content) {
        return null;
    }

    // Simple condition: if message mentions the user or is in DM
    // This can be expanded
    const stores = shelter && shelter.flux && shelter.flux.stores;
    const currentUserId = stores && stores.UserStore && stores.UserStore.getCurrentUser && stores.UserStore.getCurrentUser().id;
    const isMentioned = message.mentions && message.mentions.some(m => m.id === currentUserId);
    const isDM = message.channel && message.channel.type === 1; // DM channel

    if (!isMentioned && !isDM) {
        return null;
    }

    const prompt = `Génère une réponse appropriée et concise au message suivant dans le contexte Discord:\n\nMessage: ${message.author.username}: ${message.content}\n\nRéponse:`;

    try {
        const replyText = await callGemini(prompt, { temperature: 0.8 });
        return {
            text: replyText,
            channelId: message.channel_id,
            messageId: message.id,
        };
    } catch (error) {
        console.error("Error preparing reply:", error);
        return null;
    }
}

// Function to send the reply (to be called after confirmation)
export async function sendReply(replyData) {
    if (!replyData || !replyData.text || !replyData.channelId) {
        throw new Error("Invalid reply data");
    }

    // Use shelter.http to send message
    await shelter.http.post(`/channels/${replyData.channelId}/messages`, {
        content: replyData.text,
    });
}