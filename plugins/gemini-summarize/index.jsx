const {
    observeDom,
    ui: {
        injectCss,
        Button,
        openModal,
        ModalRoot,
        ModalHeader,
        ModalBody,
        ModalFooter,
        ModalSizes,
        ButtonColors,
        ButtonSizes,
        TextArea,
        TextBox,
        niceScrollbarsClass,
        showToast,
    },
} = shelter;

import { summarizeLastX, getUserDisplayNames, getCurrentUserInfo } from "./lib/summary.js";
import { prepareReply } from "./lib/autoReply.js";
import { getDailyUsage, getTimeUntilReset } from "./lib/api.js";
import { t, formatDate } from "./lib/i18n.js";
import Settings from "./ui/Settings.jsx";

export { Settings as settings };

// History storage: { channelId: [{ count, date, summary }, ...] }
const MAX_HISTORY_PER_CHANNEL = 5;

function getChannelId() {
    const stores = shelter?.flux?.stores;
    return stores?.SelectedChannelStore?.getChannelId?.() || 'unknown';
}

function getSummaryHistory(channelId) {
    const store = shelter.plugin.store;
    if (!store.summaryHistory) store.summaryHistory = {};
    return store.summaryHistory[channelId] || [];
}

function addToSummaryHistory(channelId, count, summary) {
    const store = shelter.plugin.store;
    if (!store.summaryHistory) store.summaryHistory = {};
    if (!store.summaryHistory[channelId]) store.summaryHistory[channelId] = [];

    store.summaryHistory[channelId].unshift({
        count,
        date: Date.now(),
        summary,
    });

    // Keep only last 5
    if (store.summaryHistory[channelId].length > MAX_HISTORY_PER_CHANNEL) {
        store.summaryHistory[channelId] = store.summaryHistory[channelId].slice(0, MAX_HISTORY_PER_CHANNEL);
    }
}

const GeminiIcon = () => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path
            d="M50 0C50 27.6142 72.3858 50 100 50C72.3858 50 50 72.3858 50 100C50 72.3858 27.6142 50 0 50C27.6142 50 50 27.6142 50 0Z"
            fill="url(#gemini_gradient)"
        />
        <defs>
            <linearGradient id="gemini_gradient" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4E85EB" />
                <stop offset="1" stop-color="#9BB6EC" />
            </linearGradient>
        </defs>
    </svg>
);

const isSafeLink = (href) => /^https?:\/\//i.test(href);

// Get user role color from Discord stores using display name
const getUserRoleColor = (displayName) => {
    try {
        const stores = shelter?.flux?.stores;
        if (!stores) return null;

        const channelId = stores.SelectedChannelStore?.getChannelId?.();
        const channel = stores.ChannelStore?.getChannel?.(channelId);
        const guildId = channel?.guild_id;
        if (!guildId) return null;

        const searchName = displayName.toLowerCase();
        let userId = null;

        // 1. Try our displayNames mapping first
        const displayNameMap = getUserDisplayNames();
        for (const [, data] of Object.entries(displayNameMap)) {
            if (data.displayName?.toLowerCase() === searchName) {
                userId = data.userId;
                break;
            }
        }

        // 2. Search in message cache
        if (!userId) {
            const messages = stores.MessageStore?.getMessages?.(channelId)?.toArray?.() || [];
            for (const msg of messages) {
                const author = msg?.author;
                if (!author) continue;

                // Check guild nickname
                const member = stores.GuildMemberStore?.getMember?.(guildId, author.id);
                if (member?.nick?.toLowerCase() === searchName) {
                    userId = author.id;
                    break;
                }

                // Check global display name
                const globalName = author.globalName || author.global_name;
                if (globalName?.toLowerCase() === searchName) {
                    userId = author.id;
                    break;
                }

                // Check username
                if (author.username?.toLowerCase() === searchName) {
                    userId = author.id;
                    break;
                }
            }
        }

        // 3. Try to find by iterating guild members directly
        if (!userId && stores.GuildMemberStore) {
            // Get all cached members for this guild
            const memberIds = Object.keys(stores.GuildMemberStore.getMemberIds?.(guildId) || {});
            for (const uid of memberIds) {
                const member = stores.GuildMemberStore.getMember(guildId, uid);
                const user = stores.UserStore?.getUser?.(uid);

                if (member?.nick?.toLowerCase() === searchName) {
                    userId = uid;
                    break;
                }
                if (user?.globalName?.toLowerCase() === searchName ||
                    user?.global_name?.toLowerCase() === searchName) {
                    userId = uid;
                    break;
                }
                if (user?.username?.toLowerCase() === searchName) {
                    userId = uid;
                    break;
                }
            }
        }

        if (!userId) return null;

        // Get member's role color
        const member = stores.GuildMemberStore?.getMember?.(guildId, userId);
        if (!member?.roles?.length) return null;

        // Get the highest role with a color
        const guild = stores.GuildStore?.getGuild?.(guildId);
        const roles = guild?.roles || {};
        let highestColorRole = null;
        let highestPosition = -1;

        for (const roleId of member.roles) {
            const role = roles[roleId];
            if (role?.color && role.position > highestPosition) {
                highestPosition = role.position;
                highestColorRole = role;
            }
        }

        if (highestColorRole?.color) {
            const hex = highestColorRole.color.toString(16).padStart(6, '0');
            return `#${hex}`;
        }

        return null;
    } catch (e) {
        console.error('[Gemini] getUserRoleColor error:', e);
        return null;
    }
};

// Render a @mention with role color
const renderMention = (displayName, isCurrentUser = false) => {
    const color = isCurrentUser ? '#43b581' : getUserRoleColor(displayName); // Green for current user
    const style = {
        color: color || 'var(--text-link)',
        backgroundColor: color ? `${color}20` : 'var(--background-modifier-accent)',
        padding: '0 4px',
        borderRadius: '3px',
        fontWeight: isCurrentUser ? '700' : '500',
    };
    return <span style={style}>@{displayName}</span>;
};

const renderInlineMarkdown = (text, currentUserDisplayName = null) => {
    const input = String(text ?? "");
    const parts = [];
    let i = 0;

    const pushText = (t) => {
        if (t) parts.push(t);
    };

    while (i < input.length) {
        const rest = input.slice(i);

        // @mention pattern - support special chars, accents, spaces
        if (rest[0] === "@") {
            // Match @username: allow letters, numbers, accents, underscores, dots, hyphens, and spaces
            // Stop at: punctuation, OR a space followed by a lowercase word (likely not part of name)
            const match = rest.match(/^@([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9._\-]*(?:\s+[A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9._\-]*)*)/);
            if (match) {
                const username = match[1].trim();
                const isCurrentUser = currentUserDisplayName && username.toLowerCase() === currentUserDisplayName.toLowerCase();
                parts.push(renderMention(username, isCurrentUser));
                i += match[0].length;
                continue;
            }
        }

        // Link: [label](href)
        if (rest[0] === "[") {
            const endLabel = rest.indexOf("]");
            if (endLabel > 0 && rest[endLabel + 1] === "(") {
                const endHref = rest.indexOf(")", endLabel + 2);
                if (endHref > endLabel + 2) {
                    const label = rest.slice(1, endLabel);
                    const href = rest.slice(endLabel + 2, endHref).trim();
                    if (isSafeLink(href)) {
                        parts.push(
                            <a href={href} target="_blank" rel="noopener noreferrer">
                                {label}
                            </a>
                        );
                    } else {
                        pushText(label);
                    }
                    i += endHref + 1;
                    continue;
                }
            }
        }

        // Bold: **text**
        if (rest.startsWith("**")) {
            const end = rest.indexOf("**", 2);
            if (end > 2) {
                const strongText = rest.slice(2, end);
                parts.push(<strong>{strongText}</strong>);
                i += end + 2;
                continue;
            }
        }

        // Inline code: `code`
        if (rest[0] === "`") {
            const end = rest.indexOf("`", 1);
            if (end > 1) {
                const code = rest.slice(1, end);
                parts.push(<code>{code}</code>);
                i += end + 1;
                continue;
            }
        }

        // Plain char
        pushText(input[i]);
        i += 1;
    }

    // Merge adjacent strings for fewer nodes
    const merged = [];
    for (const p of parts) {
        const last = merged[merged.length - 1];
        if (typeof p === "string" && typeof last === "string") {
            merged[merged.length - 1] = last + p;
        } else {
            merged.push(p);
        }
    }
    return merged;
};

const renderMarkdown = (markdown) => {
    const md = String(markdown ?? "");
    if (!md.trim()) return <div>{t("gemini.response.empty")}</div>;

    // Get current user display name for highlighting
    const currentUser = getCurrentUserInfo();
    const currentUserDisplayName = currentUser?.displayName;

    const lines = md.split(/\r?\n/);
    const nodes = [];

    let paragraph = [];
    let listType = null; // 'ul' | 'ol'
    let listItems = [];
    let inCode = false;
    let codeLines = [];

    const flushParagraph = () => {
        if (!paragraph.length) return;
        const content = [];
        paragraph.forEach((line, idx) => {
            if (idx) content.push(<br />);
            content.push(...renderInlineMarkdown(line, currentUserDisplayName));
        });
        nodes.push(<p>{content}</p>);
        paragraph = [];
    };

    const flushList = () => {
        if (!listType || !listItems.length) {
            listType = null;
            listItems = [];
            return;
        }
        if (listType === "ul") nodes.push(<ul>{listItems}</ul>);
        else nodes.push(<ol>{listItems}</ol>);
        listType = null;
        listItems = [];
    };

    const flushCode = () => {
        if (!codeLines.length) {
            nodes.push(
                <pre>
                    <code></code>
                </pre>
            );
        } else {
            nodes.push(
                <pre>
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
        }
        codeLines = [];
    };

    for (const rawLine of lines) {
        const line = rawLine ?? "";

        if (line.trim().startsWith("```")) {
            if (inCode) {
                inCode = false;
                flushCode();
            } else {
                flushParagraph();
                flushList();
                inCode = true;
                codeLines = [];
            }
            continue;
        }

        if (inCode) {
            codeLines.push(line);
            continue;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            const content = renderInlineMarkdown(headingMatch[2], currentUserDisplayName);
            if (level <= 2) nodes.push(<h2>{content}</h2>);
            else if (level === 3) nodes.push(<h3>{content}</h3>);
            else nodes.push(<h4>{content}</h4>);
            continue;
        }

        const ulMatch = line.match(/^\-\s+(.*)$/);
        if (ulMatch) {
            flushParagraph();
            if (listType && listType !== "ul") flushList();
            listType = "ul";
            listItems.push(<li>{renderInlineMarkdown(ulMatch[1], currentUserDisplayName)}</li>);
            continue;
        }

        const olMatch = line.match(/^\d+\.\s+(.*)$/);
        if (olMatch) {
            flushParagraph();
            if (listType && listType !== "ol") flushList();
            listType = "ol";
            listItems.push(<li>{renderInlineMarkdown(olMatch[1], currentUserDisplayName)}</li>);
            continue;
        }

        if (/^\s*$/.test(line)) {
            flushParagraph();
            flushList();
            continue;
        }

        flushList();
        paragraph.push(line);
    }

    if (inCode) flushCode();
    flushParagraph();
    flushList();

    return <div>{nodes}</div>;
};

const copyToClipboard = async (text) => {
    const value = String(text ?? "");
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
        }
    } catch {
        // fall back below
    }

    try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.left = "-1000px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
    } catch {
        return false;
    }
};

const showLoadingToast = (label) => {
    // showToast returns a close() function (see shelter-defs)
    return showToast({
        title: "Gemini",
        content: (
            <div className="gemini-toast-loading">
                <span className="gemini-toast-icon" aria-hidden="true">
                    <GeminiIcon />
                </span>
                <span>{label}</span>
            </div>
        ),
        duration: 10 * 60 * 1000,
        class: "gemini-toast",
    });
};

let geminiButton = null;

let rateLimitInterval = null;

function ensureRateLimitTicker() {
    if (rateLimitInterval) return;
    rateLimitInterval = setInterval(() => {
        const store = shelter?.plugin?.store;
        if (!store) return;
        const until = store.geminiRateLimitUntil || 0;
        if (until && until > Date.now()) {
            store.geminiRateLimitTick = (store.geminiRateLimitTick || 0) + 1;
        }
    }, 1000);
}

function getRateLimitRemainingSec() {
    const store = shelter?.plugin?.store;
    // Read tick to create a reactive dependency (so the modal re-renders each second)
    void store?.geminiRateLimitTick;
    const until = store?.geminiRateLimitUntil || 0;
    const remainingMs = Math.max(0, until - Date.now());
    return remainingMs ? Math.ceil(remainingMs / 1000) : 0;
}

const openSummarizeModal = () => {
    openModal((props) => {
        let count = 100;
        const dailyUsage = getDailyUsage();
        const channelId = getChannelId();
        const history = getSummaryHistory(channelId);

        const openHistoryEntry = (entry) => {
            // Don't close, open new modal directly - Shelter will handle the stack
            openModal((p) => (
                <ModalRoot {...p} size={ModalSizes.LARGE}>
                    <ModalHeader close={p.close}>{t("gemini.modal.summary.title", { count: entry.count })}</ModalHeader>
                    <ModalBody>
                        <div className="gemini-modal-content gemini-markdown">{renderMarkdown(entry.summary)}</div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color={ButtonColors.BRAND}
                            grow={true}
                            onClick={async () => {
                                const ok = await copyToClipboard(entry.summary);
                                showToast({
                                    title: "Gemini",
                                    content: ok ? t("gemini.toast.copied") : t("gemini.toast.copyFailed"),
                                    duration: 2000,
                                });
                            }}
                        >
                            {t("gemini.modal.button.copy")}
                        </Button>
                    </ModalFooter>
                </ModalRoot>
            ));
        };

        return (
            <ModalRoot {...props} size={ModalSizes.MEDIUM}>
                <ModalHeader close={props.close}>{t("gemini.modal.lastX.title")}</ModalHeader>
                <ModalBody>
                    <div className="gemini-settings-section">
                        <label className="gemini-settings-label">{t("gemini.modal.lastX.label")}</label>
                        <TextBox
                            type="number"
                            value={count}
                            onInput={(v) => (count = parseInt(v))}
                        />
                    </div>

                    <div className="gemini-daily-usage">
                        {t("gemini.dailyUsage.text", { used: dailyUsage.used, limit: dailyUsage.limit, remaining: dailyUsage.remaining })}
                        <div className="gemini-reset-time">
                            {(() => {
                                const resetTime = getTimeUntilReset();
                                return t("gemini.resetIn", { hours: resetTime.hours, minutes: resetTime.minutes });
                            })()}
                        </div>
                    </div>

                    {getRateLimitRemainingSec() > 0 ? (
                        <div className="gemini-rate-limit">{t("gemini.rateLimit.text", { sec: getRateLimitRemainingSec() })}</div>
                    ) : null}

                    {history.length > 0 && (
                        <div className="gemini-history">
                            <div className="gemini-history-title">{t("gemini.history.title")}</div>
                            <div className="gemini-history-list">
                                {history.map((entry, idx) => (
                                    <button
                                        key={idx}
                                        className="gemini-history-entry"
                                        onClick={() => openHistoryEntry(entry)}
                                    >
                                        {t("gemini.history.entry", {
                                            count: entry.count,
                                            date: formatDate(entry.date)
                                        })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        disabled={getRateLimitRemainingSec() > 0}
                        grow={true}
                        onClick={async () => {
                            const rl = getRateLimitRemainingSec();
                            if (rl > 0) {
                                showToast({ title: "Gemini", content: t("gemini.rateLimit.text", { sec: rl }), duration: 3000 });
                                return;
                            }
                            props.close();
                            const closeToast = showLoadingToast(t("gemini.toast.generating"));
                            try {
                                const summary = await summarizeLastX(count);
                                closeToast();

                                if (typeof summary === "string" && summary.startsWith("Erreur")) {
                                    showToast({ title: "Gemini", content: summary, duration: 5000 });
                                    return;
                                }

                                // Save to history
                                addToSummaryHistory(channelId, count, summary);

                                openModal((p) => (
                                    <ModalRoot {...p} size={ModalSizes.LARGE}>
                                        <ModalHeader close={p.close}>{t("gemini.modal.summary.title", { count })}</ModalHeader>
                                        <ModalBody>
                                            <div className="gemini-modal-content gemini-markdown">{renderMarkdown(summary)}</div>
                                        </ModalBody>
                                        <ModalFooter>
                                            <Button
                                                color={ButtonColors.BRAND}
                                                grow={true}
                                                onClick={async () => {
                                                    const ok = await copyToClipboard(summary);
                                                    showToast({
                                                        title: "Gemini",
                                                        content: ok ? t("gemini.toast.copied") : t("gemini.toast.copyFailed"),
                                                        duration: 2000,
                                                    });
                                                }}
                                            >
                                                {t("gemini.modal.button.copy")}
                                            </Button>
                                        </ModalFooter>
                                    </ModalRoot>
                                ));
                            } catch (e) {
                                closeToast();
                                showToast({ title: "Gemini", content: e?.message || t("gemini.toast.error"), duration: 5000 });
                            }
                        }}
                    >
                        {dailyUsage.remaining === 0 ? t("gemini.modal.button.summarizeNoQuota") : t("gemini.modal.button.summarize")}
                    </Button>
                </ModalFooter>
            </ModalRoot>
        );
    });
};

let unobserve = null;
export function onLoad() {
    const store = shelter.plugin.store;
    if (!store.geminiRateLimitTick) store.geminiRateLimitTick = 0;
    ensureRateLimitTicker();

    injectCss(`
.buttons-container {
  display: flex;
  gap: .5rem;
}

  .send-responses {
    max-height: 200px;
    overflow-y: auto;
  }
.response .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .25rem;
}

.gemini-settings-section {
  margin-bottom: 20px !important;
}

.gemini-settings-section:last-child {
  margin-bottom: 0 !important;
}

.gemini-settings-label {
  display: block;
  margin-bottom: 8px !important;
}

.gemini-model-select {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--background-modifier-accent);
  background: var(--input-background);
  color: var(--text-normal);
  font-size: 14px;
  cursor: pointer;
}

.gemini-model-select option {
  background: var(--background-secondary);
  color: #000;
  padding: 8px;
  font-weight: 500;
}

.gemini-model-select option:checked {
  background: var(--background-modifier-selected);
  color: #000;
}

.gemini-menu-body {
  display: flex;
    flex-direction: row;
    gap: 0.5rem;
    margin-top: 0;
}

.gemini-popout .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-8);
    padding-bottom: 0;
}

.gemini-daily-usage-header {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
}

.gemini-daily-usage {
    margin-top: 12px;
    color: var(--text-muted);
    font-size: 12px;
}

.gemini-rate-limit {
    margin-top: 12px;
    color: var(--text-muted);
    font-size: 12px;
}

.gemini-history {
    margin-top: 24px;
    border-top: 1px solid var(--background-modifier-accent);
    padding-top: 16px;
}

.gemini-history-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--header-secondary);
    margin-bottom: var(--spacing-8);
    text-transform: uppercase;
}

.gemini-history-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.gemini-history-entry {
    background: var(--background-secondary);
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    color: var(--text-normal);
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
}

.gemini-history-entry:hover {
    background: var(--background-modifier-hover);
}

.gemini-popout .body {
    margin-top: 0;
}

.gemini-popout .gemini-menu-body > * {
    flex: 1;
}

.gemini-popout {
    padding: var(--spacing-8);
}

.gemini-toast-loading {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.gemini-toast {
    position: fixed !important;
    bottom: 80px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    z-index: 100000 !important;
}

.gemini-toast-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.gemini-toast-icon svg {
    width: 16px;
    height: 16px;
    animation: gemini-spin 1.9s linear infinite;
    transform-origin: 50% 50%;
}

.gemini-rate-limit {
    margin-top: var(--spacing-8);
    color: var(--text-muted);
    font-size: 12px;
}

@keyframes gemini-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.gemini-modal-content {
  background: var(--background-secondary);
  padding: var(--spacing-16);
  border-radius: 4px;
  color: var(--text-normal);
  word-wrap: break-word;
    max-height: 75vh;
    min-height: 50vh;
  overflow-y: auto;
    line-height: 1.7;
    font-size: 16px;
}

.gemini-modal-content.gemini-markdown {
    white-space: normal;
}

.gemini-modal-content.gemini-markdown p {
    margin: 0 0 var(--spacing-12) 0;
}

.gemini-modal-content.gemini-markdown ul,
.gemini-modal-content.gemini-markdown ol {
    margin: 0 0 var(--spacing-12) 1.25rem;
    padding: 0;
}

.gemini-modal-content.gemini-markdown li {
    margin: 0.35rem 0;
    line-height: 1.5;
}

.gemini-modal-content.gemini-markdown pre {
    margin: 0 0 var(--spacing-12) 0;
    padding: var(--spacing-12);
    background: var(--background-tertiary);
    border-radius: 4px;
    overflow: auto;
}

.gemini-modal-content.gemini-markdown h2 {
    margin: 24px 0 var(--spacing-12) 0;
    font-weight: 700;
    font-size: 1.3em;
    color: var(--header-primary);
    border-bottom: 1px solid var(--background-modifier-accent);
    padding-bottom: var(--spacing-8);
}

.gemini-modal-content.gemini-markdown h2:first-child {
    margin-top: 0;
}

.gemini-modal-content.gemini-markdown h3 {
    margin: 20px 0 var(--spacing-8) 0;
    font-weight: 600;
    font-size: 1.15em;
    color: var(--header-primary);
}

.gemini-modal-content.gemini-markdown h4 {
    margin: var(--spacing-8) 0 var(--spacing-8) 0;
    font-weight: 600;
    font-size: 1.05em;
}

.gemini-modal-content.gemini-markdown strong {
    font-weight: 700;
    color: var(--header-primary);
}

.gemini-modal-content.gemini-markdown code {
    font-family: var(--font-code);
    font-size: 0.9em;
}

.gemini-modal-content.gemini-markdown a {
    color: var(--text-link);
}
`);

    unobserve = observeDom(
        '[class*="channelTextArea"] [class*="buttons"]',
        (node) => {
            if (document.getElementById("gemini-button")) return;

            // Find the last child before the hidden anchor
            const lastButton = node.querySelector('[class*="buttonContainer"]:last-of-type');
            if (!lastButton) return;

            const buttonClass = lastButton.className;

            geminiButton = (
                <div className={buttonClass} id="gemini-button">
                    <div
                        role="button"
                        tabindex="0"
                        aria-label="Gemini AI"
                        onClick={openSummarizeModal}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <GeminiIcon />
                    </div>
                </div>
            );

            // Insert before the hidden anchor or as last child
            const hiddenAnchor = node.querySelector('[class*="hiddenAppLauncherAnchor"]');
            if (hiddenAnchor) {
                node.insertBefore(geminiButton, hiddenAnchor);
            } else {
                node.appendChild(geminiButton);
            }
        }
    );
}

export function onUnload() {
    unobserve();
    document.getElementById("gemini-button")?.remove();

    if (rateLimitInterval) {
        clearInterval(rateLimitInterval);
        rateLimitInterval = null;
    }
}