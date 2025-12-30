import { callGemini } from './api.js';
import { t, getLocale } from './i18n.js';

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function chooseSummaryMaxTokens(messageCount) {
    // More input generally needs more output tokens to avoid unfinished bullets.
    // Keep within common limits across models.
    if (messageCount >= 80) return 6144;
    if (messageCount >= 60) return 5120;
    if (messageCount >= 30) return 4096;
    return 3072;
}

function seemsTruncated(text) {
    const t = (text ?? '').toString().trim();
    if (!t) return false;
    // Heuristic: if it doesn't end with punctuation or a closing bracket, it may be cut.
    return !/[\.!\?…\)]\s*$/.test(t);
}

function formatTimestampForPrompt(msg) {
    const ts = msg?.timestamp ?? msg?.editedTimestamp;
    if (!ts) return null;

    // Discord clients sometimes use Date-like objects.
    if (typeof ts === 'string') return ts;
    if (typeof ts === 'number') {
        try { return new Date(ts).toISOString(); } catch { return String(ts); }
    }
    if (typeof ts?.toISOString === 'function') {
        try { return ts.toISOString(); } catch { /* ignore */ }
    }
    if (typeof ts?.toDate === 'function') {
        try { return ts.toDate().toISOString(); } catch { /* ignore */ }
    }
    return String(ts);
}

function isNoiseContent(text) {
    const t = (text ?? '').toString().trim();
    if (!t) return true;

    // Simple “noise” rules: greetings/acknowledgements and emoji-only.
    const lower = t.toLowerCase();
    const commonNoise = [
        'salut', 'yo', 'hello', 'hey', 'coucou',
        'ok', 'okay', 'oki', 'kk', 'k',
        'merci', 'thx', 'thanks',
        'mdr', 'lol',
    ];
    if (commonNoise.includes(lower)) return true;

    // Emoji-only / punctuation-only
    // This is intentionally permissive; we only drop when there are no letters/numbers.
    if (!/[\p{L}\p{N}]/u.test(t)) return true;

    return false;
}

// Store username -> displayName mapping for rendering
let userDisplayNames = {};

export function getUserDisplayNames() {
    return userDisplayNames;
}

function getDisplayName(msg) {
    const stores = shelter?.flux?.stores;
    const author = msg?.author;
    if (!author) return 'Utilisateur';

    const username = author.username || 'Utilisateur';

    // Try to get guild-specific nickname
    const channelId = stores?.SelectedChannelStore?.getChannelId?.();
    const channel = stores?.ChannelStore?.getChannel?.(channelId);
    const guildId = channel?.guild_id;

    if (guildId && stores?.GuildMemberStore) {
        const member = stores.GuildMemberStore.getMember(guildId, author.id);
        if (member?.nick) {
            userDisplayNames[username] = { displayName: member.nick, userId: author.id };
            return member.nick;
        }
    }

    // Fallback to global display name or username
    const displayName = author.globalName || author.global_name || username;
    userDisplayNames[username] = { displayName, userId: author.id };
    return displayName;
}

export function getCurrentUserInfo() {
    const stores = shelter?.flux?.stores;
    const currentUser = stores?.UserStore?.getCurrentUser?.();
    if (!currentUser) return null;

    const channelId = stores?.SelectedChannelStore?.getChannelId?.();
    const channel = stores?.ChannelStore?.getChannel?.(channelId);
    const guildId = channel?.guild_id;

    let displayName = currentUser.globalName || currentUser.global_name || currentUser.username;

    if (guildId && stores?.GuildMemberStore) {
        const member = stores.GuildMemberStore.getMember(guildId, currentUser.id);
        if (member?.nick) displayName = member.nick;
    }

    return {
        username: currentUser.username,
        displayName,
        id: currentUser.id
    };
}

function formatMessageForPrompt(msg) {
    const displayName = getDisplayName(msg);
    const username = msg?.author?.username || 'Utilisateur';
    const atUser = `@${displayName}`;
    const raw = (msg?.content ?? '').toString();
    const content = raw.trim();

    const attachmentsCount = Array.isArray(msg?.attachments) ? msg.attachments.length : (msg?.attachments?.size ?? 0);
    const embeds = Array.isArray(msg?.embeds) ? msg.embeds : [];

    // Extract embed content
    const embedTexts = [];
    for (const embed of embeds) {
        const parts = [];

        // Title with URL
        if (embed.title) {
            parts.push(embed.url ? `[${embed.title}](${embed.url})` : embed.title);
        } else if (embed.url) {
            parts.push(`[Lien: ${embed.url}]`);
        }

        // Author
        if (embed.author?.name) {
            parts.push(`par ${embed.author.name}`);
        }

        // Description (truncate if too long)
        if (embed.description) {
            const desc = embed.description.length > 200
                ? embed.description.slice(0, 200) + '…'
                : embed.description;
            parts.push(desc);
        }

        // Fields (for rich embeds like tweets, articles)
        if (embed.fields?.length) {
            for (const field of embed.fields.slice(0, 3)) { // Max 3 fields
                if (field.name && field.value) {
                    const val = field.value.length > 100 ? field.value.slice(0, 100) + '…' : field.value;
                    parts.push(`${field.name}: ${val}`);
                }
            }
        }

        if (parts.length) {
            embedTexts.push(`[Embed: ${parts.join(' | ')}]`);
        }
    }

    let text = content;

    // Append embed content to message
    if (embedTexts.length) {
        text = text ? `${text} ${embedTexts.join(' ')}` : embedTexts.join(' ');
    }

    if (!text) {
        const extras = [];
        if (attachmentsCount) extras.push(t('gemini.summary.attachments', { count: attachmentsCount }));
        text = extras.length ? `[${extras.join(', ')}]` : '[message sans texte]';
    }

    if (isNoiseContent(text)) return null;

    // Avoid blowing up token usage with huge pastes
    const maxLen = 600; // Increased slightly for embed content
    if (text.length > maxLen) text = `${text.slice(0, maxLen)}…`;

    const ts = formatTimestampForPrompt(msg);
    const tsPart = ts ? `[${ts}] ` : '';
    return `${tsPart}${atUser}: ${text}`;
}

// Function to summarize a list of messages
export async function summarizeMessages(messages, opts = {}) {
    if (!messages || messages.length === 0) {
        return t('gemini.summary.noMessages');
    }

    // Reset display names mapping
    userDisplayNames = {};

    const lines = messages
        .map(formatMessageForPrompt)
        .filter(Boolean);

    const bulletTarget = clamp(Math.ceil(lines.length / 8), 4, 10);
    const maxTokens = opts.maxTokens ?? chooseSummaryMaxTokens(lines.length);

    // Get current user info
    const currentUser = getCurrentUserInfo();
    const currentUserContext = currentUser
        ? `\n# CONTEXTE: L'utilisateur qui demande ce résumé est @${currentUser.username}. Mentionne explicitement quand quelqu'un parle de lui/elle ou lui répond.\n`
        : '';

    // Get localized prompt parts
    const locale = getLocale();
    const isEnglish = locale.startsWith('en');

    const currentUserContextEN = currentUser
        ? `\n# CONTEXT: The user requesting this summary is @${currentUser.username}. Explicitly mention when someone talks about them or replies to them.\n`
        : '';

    const prompt = isEnglish ? [
        "You are an AI that creates SYNTHETIC summaries of Discord conversations.",
        currentUserContextEN,
        "# YOUR GOAL",
        "Help someone who missed the conversation QUICKLY understand what was discussed.",
        "DO NOT list what each person said. SYNTHESIZE the topics and conclusions.",
        "",
        "# CRITICAL RULES",
        "1. NAME THE SUBJECTS: Always include specific names (game titles, people, events)",
        "2. SYNTHESIZE, DON'T LIST: Summarize the GROUP CONSENSUS or DEBATE, not individual reactions",
        "3. HIGHLIGHT WHAT MATTERS: Key info, decisions, questions that need answers",
        "4. BE CONCISE: 2-3 sentences per topic max",
        "",
        "# OUTPUT FORMAT",
        "",
        "**TL;DR:** [One sentence: main subjects discussed + key takeaway]",
        "",
        "## 🎮 [Specific Subject Name]",
        "[2-3 sentences synthesizing what was said, the consensus, or the debate. Mention key contributors with @name only when their contribution is distinctive.]",
        "",
        "## 📰 [Another Subject]",
        "[Synthesis paragraph]",
        "",
        "# BAD vs GOOD EXAMPLES",
        "",
        "❌ BAD (listing reactions):",
        "## 🎮 Helldivers 2",
        "- 💬 @alice → Asks about the game",
        "- 💬 @bob → Says it's fun",
        "- 💬 @charlie → Agrees",
        "- 💬 @dave → Mentions the price",
        "",
        "✅ GOOD (synthesis):",
        "## 🎮 Helldivers 2 - Positive reception",
        "The group is enthusiastic about Helldivers 2. @alice asked for opinions and everyone agrees the coop gameplay is excellent. @dave notes the economic model is fairer than competitors. Question raised: will the hype last?",
        "",
        "# EMOJI GUIDE (for titles)",
        "🎮 Games | 📰 News/Articles | 📅 Events/Dates | 💬 General chat | ❓ Open questions | 🔗 Shared links",
        "",
        "# MESSAGES TO ANALYZE",
        "```",
        lines.length ? lines.join("\n") : t('gemini.summary.noFilteredMessages'),
        "```",
    ].join("\n") : [
        "Tu es une IA qui crée des résumés SYNTHÉTIQUES de conversations Discord.",
        currentUserContext,
        "# TON OBJECTIF",
        "Aider quelqu'un qui a raté la conversation à RAPIDEMENT comprendre ce qui s'est dit.",
        "NE LISTE PAS ce que chaque personne a dit. SYNTHÉTISE les sujets et conclusions.",
        "",
        "# RÈGLES CRITIQUES",
        "1. NOMME LES SUJETS : Toujours inclure les noms spécifiques (titres de jeux, personnes, événements)",
        "2. SYNTHÉTISE, NE LISTE PAS : Résume le CONSENSUS ou le DÉBAT du groupe, pas les réactions individuelles",
        "3. METS EN AVANT L'IMPORTANT : Infos clés, décisions, questions en suspens",
        "4. SOIS CONCIS : 2-3 phrases par sujet max",
        "",
        "# FORMAT DE SORTIE",
        "",
        "**TL;DR:** [Une phrase : sujets principaux + conclusion clé]",
        "",
        "## 🎮 [Nom précis du sujet]",
        "[2-3 phrases qui synthétisent ce qui a été dit, le consensus ou le débat. Mentionne les contributeurs clés avec @pseudo seulement quand leur contribution est distinctive.]",
        "",
        "## 📰 [Autre sujet]",
        "[Paragraphe de synthèse]",
        "",
        "# EXEMPLES MAUVAIS vs BON",
        "",
        "❌ MAUVAIS (liste de réactions) :",
        "## 🎮 Helldivers 2",
        "- 💬 @alice → Demande des avis sur le jeu",
        "- 💬 @bob → Dit que c'est fun",
        "- 💬 @charlie → Est d'accord",
        "- 💬 @dave → Parle du prix",
        "",
        "✅ BON (synthèse) :",
        "## 🎮 Helldivers 2 - Accueil positif",
        "Le groupe est enthousiaste sur Helldivers 2. @alice a demandé des avis et tout le monde s'accorde sur l'excellence du gameplay coop. @dave note que le modèle économique est plus fair-play que la concurrence. Question en suspens : est-ce que le hype va durer ?",
        "",
        "# GUIDE EMOJI (pour les titres)",
        "🎮 Jeux | 📰 News/Articles | 📅 Événements/Dates | 💬 Discussion générale | ❓ Questions ouvertes | 🔗 Liens partagés",
        "",
        "# MESSAGES À ANALYSER",
        "```",
        lines.length ? lines.join("\n") : "[Aucun message pertinent après filtrage]",
        "```",
    ].join("\n");

    try {
        const first = await callGemini(prompt, {
            temperature: opts.temperature ?? 0.2,
            maxTokens,
            model: opts.model,
            returnMeta: true,
        });

        let summary = first?.text ?? '';
        const finishReason = first?.finishReason;

        // If Gemini hit the token limit, try to fetch the missing tail.
        if (finishReason === 'MAX_TOKENS' || seemsTruncated(summary)) {
            const tail = summary.slice(Math.max(0, summary.length - 450));
            const continuationPrompt = [
                "Tu as été interrompu par une limite de longueur.",
                "Continue immédiatement APRÈS la dernière portion ci-dessous, sans la répéter.",
                "Ne rajoute pas d'introduction. Reste en Markdown. Termine proprement.",
                "",
                "Dernière portion :",
                tail || "[vide]",
            ].join("\n");

            try {
                const more = await callGemini(continuationPrompt, {
                    temperature: opts.temperature ?? 0.2,
                    maxTokens: 1024,
                    model: opts.model,
                });
                if (typeof more === 'string' && more.trim()) {
                    summary = `${summary}\n${more}`;
                }
            } catch {
                // Ignore continuation failures; we still return the first part.
            }
        }

        return summary;
    } catch (error) {
        return `Erreur lors de la génération du résumé: ${error.message}`;
    }
}

// Function to get unread messages summary
export async function summarizeUnread() {
    const stores = shelter && shelter.flux && shelter.flux.stores;
    if (!stores) return "Les données du client ne sont pas prêtes.";
    const channels = stores.ChannelStore.getChannels();
    const unreadChannels = Object.values(channels).filter(channel => {
        const readState = stores.ReadStateStore.getReadState(channel.id);
        return readState && readState.lastMessageId && readState.lastMessageId !== channel.lastMessageId;
    });

    let allUnreadMessages = [];
    for (const channel of unreadChannels.slice(0, 5)) { // Limit to 5 channels
        const messages = stores.MessageStore.getMessages(channel.id).toArray().slice(-20); // Last 20 messages
        allUnreadMessages.push(...messages);
    }

    if (allUnreadMessages.length === 0) {
        return t('gemini.summary.noUnreadFound');
    }

    return await summarizeMessages(allUnreadMessages);
}

// Function to summarize last X messages in current channel
export async function summarizeLastX(x = 10) {
    const stores = shelter && shelter.flux && shelter.flux.stores;
    if (!stores) return t('gemini.summary.noMessagesInChannel');
    const selectedChannelId = stores.SelectedChannelStore && stores.SelectedChannelStore.getChannelId && stores.SelectedChannelStore.getChannelId();
    if (!selectedChannelId) {
        return t('gemini.summary.noChannelSelected');
    }

    const messages = stores.MessageStore.getMessages(selectedChannelId).toArray().slice(-x);
    if (messages.length === 0) {
        return t('gemini.summary.noMessagesInChannel');
    }

    return await summarizeMessages(messages);
}