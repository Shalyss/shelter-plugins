// Simple rate limiter: max 5 calls per minute
let callCount = 0;
let lastReset = Date.now();

// Daily limit: configurable in settings (default 20, -1 for unlimited)
const getConfiguredDailyLimit = () => {
    const store = shelter?.plugin?.store;
    const limit = store?.geminiDailyLimit ?? 20;
    return limit === -1 ? Infinity : limit;
};

function setRateLimitUntil(untilMs) {
    const store = shelter?.plugin?.store;
    if (!store) return;
    store.geminiRateLimitUntil = untilMs;
    store.geminiRateLimitTick = (store.geminiRateLimitTick || 0) + 1;
}

function getTodayDateKey() {
    // Use Pacific Time (PST/PDT) as Google resets quota at midnight PT
    const pacificDate = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const d = new Date(pacificDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkDailyLimit() {
    const store = shelter?.plugin?.store;
    if (!store) return;

    const today = getTodayDateKey();
    const dailyLimit = getConfiguredDailyLimit();

    // Migrate old data: if stored date doesn't match Pacific Time format or is old, reset
    // Also check if we've switched to Pacific Time (add marker)
    if (!store.geminiUsePacificTime) {
        // First time using Pacific Time - reset counter to avoid confusion with old local time data
        store.geminiUsePacificTime = true;
        store.geminiDailyDate = today;
        store.geminiDailyCount = 0;
    } else if (!store.geminiDailyCount || store.geminiDailyDate !== today) {
        // Normal reset: new day in Pacific Time
        store.geminiDailyDate = today;
        store.geminiDailyCount = 0;
    }

    // Check if limit exceeded (skip if unlimited)
    if (dailyLimit !== Infinity && store.geminiDailyCount >= dailyLimit) {
        const err = new Error(`Limite quotidienne atteinte: ${store.geminiDailyCount}/${dailyLimit} requêtes utilisées aujourd'hui`);
        err.status = 429;
        err.dailyLimit = true;
        throw err;
    }
}

function incrementDailyCount() {
    const store = shelter?.plugin?.store;
    if (!store) return;

    const today = getTodayDateKey();
    if (store.geminiDailyDate !== today) {
        store.geminiDailyDate = today;
        store.geminiDailyCount = 0;
    }
    store.geminiDailyCount = (store.geminiDailyCount || 0) + 1;
}

export function getDailyUsage() {
    const store = shelter?.plugin?.store;
    const dailyLimit = getConfiguredDailyLimit();
    const isUnlimited = dailyLimit === Infinity;

    if (!store) return { used: 0, limit: isUnlimited ? -1 : dailyLimit, remaining: isUnlimited ? -1 : dailyLimit };

    const today = getTodayDateKey();
    if (store.geminiDailyDate !== today) {
        return { used: 0, limit: isUnlimited ? -1 : dailyLimit, remaining: isUnlimited ? -1 : dailyLimit };
    }

    const used = store.geminiDailyCount || 0;
    return {
        used,
        limit: isUnlimited ? -1 : dailyLimit,
        remaining: isUnlimited ? -1 : Math.max(0, dailyLimit - used)
    };
}

export function getTimeUntilReset() {
    // Get current time in Pacific Time
    const nowPT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

    // Calculate next midnight Pacific Time
    const nextMidnightPT = new Date(nowPT);
    nextMidnightPT.setHours(24, 0, 0, 0);

    // Calculate difference in milliseconds
    const msUntilReset = nextMidnightPT - nowPT;

    // Convert to hours and minutes
    const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
}

function checkRateLimit() {
    const now = Date.now();
    if (now - lastReset > 60000) { // 1 minute
        callCount = 0;
        lastReset = now;
    }
    if (callCount >= 5) {
        const remainingMs = Math.max(0, 60000 - (now - lastReset));
        const until = now + remainingMs;
        setRateLimitUntil(until);
        const err = new Error(`Rate limit exceeded: please retry in ${Math.ceil(remainingMs / 1000)} sec`);
        err.status = 429;
        err.retryAfterMs = remainingMs;
        err.rateLimitUntil = until;
        throw err;
    }
    callCount++;
}

function parseRetryAfterMs(response, errorMessage) {
    const header = response?.headers?.get?.('Retry-After');
    if (header) {
        const seconds = Number(header);
        if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
    }

    const msg = String(errorMessage || '');
    // Common Gemini message: "Please retry in X sec" or "Please retry in X.XXs"
    const m = msg.match(/retry\s+in\s+([\d.]+)s?e?c?/i);
    if (m) {
        const seconds = Number(m[1]);
        if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000);
    }

    return null;
}

function getCandidateModels(requestedModel) {
    const store = shelter?.plugin?.store;
    const configuredModel = store?.geminiModel;

    const primary = requestedModel || configuredModel || "gemini-2.5-flash";

    // If the user's key doesn't have access to a specific model (404), we fall back.
    // This list intentionally includes a few common "modern" model IDs.
    const fallbacks = [
        "gemini-3.0-flash",
        "gemini-3.0-pro",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ];

    const uniq = [];
    for (const m of [primary, ...fallbacks]) {
        if (m && !uniq.includes(m)) uniq.push(m);
    }
    return uniq;
}

async function callGenerateContent(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        // Keep the body around for debugging; it often contains useful info.
        let apiMessage = "";
        try {
            const json = await response.json();
            apiMessage = json?.error?.message || "";
        } catch {
            // ignore
        }

        let retryAfterMs = response.status === 429 ? parseRetryAfterMs(response, apiMessage) : null;

        // If we got a 429 but couldn't parse the retry delay, use a default (60s)
        if (response.status === 429 && !retryAfterMs) {
            retryAfterMs = 60000;
        }

        const until = retryAfterMs ? Date.now() + retryAfterMs : null;
        if (until) setRateLimitUntil(until);

        const extra = apiMessage ? ` - ${apiMessage}` : "";
        const retryHint = response.status === 429 && retryAfterMs
            ? ` (retry in ${Math.ceil(retryAfterMs / 1000)} sec)`
            : "";

        const err = new Error(`Gemini API error: ${response.status} ${response.statusText}${extra}${retryHint}`);
        err.status = response.status;
        if (retryAfterMs) err.retryAfterMs = retryAfterMs;
        if (until) err.rateLimitUntil = until;
        throw err;
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    const finishReason = candidate?.finishReason;
    if (typeof text === "string") return { text, finishReason };
    throw new Error("Unexpected response from Gemini API");
}

// Function to call Gemini API
export async function callGemini(prompt, opts = {}) {
    checkDailyLimit();
    checkRateLimit();

    const store = shelter?.plugin?.store;
    const apiKey = store?.geminiKey;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not set in settings");
    }

    const body = {
        contents: [
            {
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: opts.temperature ?? 0.7,
            maxOutputTokens: opts.maxTokens ?? 1024,
        },
    };

    const candidates = getCandidateModels(opts.model);
    let lastError = null;

    for (const model of candidates) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
            const res = await callGenerateContent(url, body);
            // Success! Increment daily counter
            incrementDailyCount();
            if (opts.returnMeta) {
                return {
                    text: res.text,
                    finishReason: res.finishReason,
                    model,
                };
            }
            return res.text;
        } catch (err) {
            lastError = err;
            // Only fallback on 404 (most commonly: model not found / not available for your key).
            if (err?.status !== 404) {
                throw err;
            }
        }
    }

    throw lastError || new Error("Gemini API error");
}