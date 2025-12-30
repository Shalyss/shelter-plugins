(function(exports) {

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion

//#region solid-js/web
var require_web = __commonJS({ "solid-js/web"(exports, module) {
	module.exports = shelter.solidWeb;
} });

//#endregion
//#region lib/api.js
let callCount = 0;
let lastReset = Date.now();
const getConfiguredDailyLimit = () => {
	const store$1 = shelter?.plugin?.store;
	const limit = store$1?.geminiDailyLimit ?? 20;
	return limit === -1 ? Infinity : limit;
};
function setRateLimitUntil(untilMs) {
	const store$1 = shelter?.plugin?.store;
	if (!store$1) return;
	store$1.geminiRateLimitUntil = untilMs;
	store$1.geminiRateLimitTick = (store$1.geminiRateLimitTick || 0) + 1;
}
function getTodayDateKey() {
	const pacificDate = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
	const d = new Date(pacificDate);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function checkDailyLimit() {
	const store$1 = shelter?.plugin?.store;
	if (!store$1) return;
	const today = getTodayDateKey();
	const dailyLimit = getConfiguredDailyLimit();
	if (!store$1.geminiUsePacificTime) {
		store$1.geminiUsePacificTime = true;
		store$1.geminiDailyDate = today;
		store$1.geminiDailyCount = 0;
	} else if (!store$1.geminiDailyCount || store$1.geminiDailyDate !== today) {
		store$1.geminiDailyDate = today;
		store$1.geminiDailyCount = 0;
	}
	if (dailyLimit !== Infinity && store$1.geminiDailyCount >= dailyLimit) {
		const err = new Error(`Limite quotidienne atteinte: ${store$1.geminiDailyCount}/${dailyLimit} requêtes utilisées aujourd'hui`);
		err.status = 429;
		err.dailyLimit = true;
		throw err;
	}
}
function incrementDailyCount() {
	const store$1 = shelter?.plugin?.store;
	if (!store$1) return;
	const today = getTodayDateKey();
	if (store$1.geminiDailyDate !== today) {
		store$1.geminiDailyDate = today;
		store$1.geminiDailyCount = 0;
	}
	store$1.geminiDailyCount = (store$1.geminiDailyCount || 0) + 1;
}
function getDailyUsage() {
	const store$1 = shelter?.plugin?.store;
	const dailyLimit = getConfiguredDailyLimit();
	const isUnlimited = dailyLimit === Infinity;
	if (!store$1) return {
		used: 0,
		limit: isUnlimited ? -1 : dailyLimit,
		remaining: isUnlimited ? -1 : dailyLimit
	};
	const today = getTodayDateKey();
	if (store$1.geminiDailyDate !== today) return {
		used: 0,
		limit: isUnlimited ? -1 : dailyLimit,
		remaining: isUnlimited ? -1 : dailyLimit
	};
	const used = store$1.geminiDailyCount || 0;
	return {
		used,
		limit: isUnlimited ? -1 : dailyLimit,
		remaining: isUnlimited ? -1 : Math.max(0, dailyLimit - used)
	};
}
function getTimeUntilReset() {
	const nowPT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
	const nextMidnightPT = new Date(nowPT);
	nextMidnightPT.setHours(24, 0, 0, 0);
	const msUntilReset = nextMidnightPT - nowPT;
	const hours = Math.floor(msUntilReset / 36e5);
	const minutes = Math.floor(msUntilReset % 36e5 / 6e4);
	return {
		hours,
		minutes
	};
}
function checkRateLimit() {
	const now = Date.now();
	if (now - lastReset > 6e4) {
		callCount = 0;
		lastReset = now;
	}
	if (callCount >= 5) {
		const remainingMs = Math.max(0, 6e4 - (now - lastReset));
		const until = now + remainingMs;
		setRateLimitUntil(until);
		const err = new Error(`Rate limit exceeded: please retry in ${Math.ceil(remainingMs / 1e3)} sec`);
		err.status = 429;
		err.retryAfterMs = remainingMs;
		err.rateLimitUntil = until;
		throw err;
	}
	callCount++;
}
function parseRetryAfterMs(response, errorMessage) {
	const header = response?.headers?.get?.("Retry-After");
	if (header) {
		const seconds = Number(header);
		if (Number.isFinite(seconds) && seconds > 0) return seconds * 1e3;
	}
	const msg = String(errorMessage || "");
	const m = msg.match(/retry\s+in\s+([\d.]+)s?e?c?/i);
	if (m) {
		const seconds = Number(m[1]);
		if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1e3);
	}
	return null;
}
function getCandidateModels(requestedModel) {
	const store$1 = shelter?.plugin?.store;
	const configuredModel = store$1?.geminiModel;
	const primary = requestedModel || configuredModel || "gemini-2.5-flash";
	const fallbacks = [
		"gemini-3.0-flash",
		"gemini-3.0-pro",
		"gemini-2.5-flash",
		"gemini-2.5-pro",
		"gemini-2.0-flash",
		"gemini-2.0-pro",
		"gemini-1.5-flash",
		"gemini-1.5-pro"
	];
	const uniq = [];
	for (const m of [primary, ...fallbacks]) if (m && !uniq.includes(m)) uniq.push(m);
	return uniq;
}
async function callGenerateContent(url, body) {
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});
	if (!response.ok) {
		let apiMessage = "";
		try {
			const json = await response.json();
			apiMessage = json?.error?.message || "";
		} catch {}
		let retryAfterMs = response.status === 429 ? parseRetryAfterMs(response, apiMessage) : null;
		if (response.status === 429 && !retryAfterMs) retryAfterMs = 6e4;
		const until = retryAfterMs ? Date.now() + retryAfterMs : null;
		if (until) setRateLimitUntil(until);
		const extra = apiMessage ? ` - ${apiMessage}` : "";
		const retryHint = response.status === 429 && retryAfterMs ? ` (retry in ${Math.ceil(retryAfterMs / 1e3)} sec)` : "";
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
	if (typeof text === "string") return {
		text,
		finishReason
	};
	throw new Error("Unexpected response from Gemini API");
}
async function callGemini(prompt, opts = {}) {
	checkDailyLimit();
	checkRateLimit();
	const store$1 = shelter?.plugin?.store;
	const apiKey = store$1?.geminiKey;
	if (!apiKey) throw new Error("GEMINI_API_KEY not set in settings");
	const body = {
		contents: [{ parts: [{ text: prompt }] }],
		generationConfig: {
			temperature: opts.temperature ?? .7,
			maxOutputTokens: opts.maxTokens ?? 1024
		}
	};
	const candidates = getCandidateModels(opts.model);
	let lastError = null;
	for (const model of candidates) {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
		try {
			const res = await callGenerateContent(url, body);
			incrementDailyCount();
			if (opts.returnMeta) return {
				text: res.text,
				finishReason: res.finishReason,
				model
			};
			return res.text;
		} catch (err) {
			lastError = err;
			if (err?.status !== 404) throw err;
		}
	}
	throw lastError || new Error("Gemini API error");
}

//#endregion
//#region lib/i18n.js
const translations = {
	"en-US": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "Unread Summary",
		"gemini.button.lastX": "Last X Messages Summary",
		"gemini.button.autoReply": "Auto Reply",
		"gemini.modal.unread.title": "Unread Summary",
		"gemini.modal.lastX.title": "Last Messages Summary",
		"gemini.modal.lastX.label": "Number of messages",
		"gemini.modal.summary.title": "Summary ({count} msgs)",
		"gemini.modal.button.copy": "Copy",
		"gemini.modal.button.summarize": "Summarize",
		"gemini.modal.button.summarizeNoQuota": "Try to Summarize (No Quota Left)",
		"gemini.toast.generating": "Generating summary...",
		"gemini.toast.generatingReply": "Generating reply...",
		"gemini.toast.copied": "Summary copied",
		"gemini.toast.copyFailed": "Unable to copy",
		"gemini.toast.error": "Error during generation",
		"gemini.toast.noMessage": "No message found to reply to.",
		"gemini.toast.noReply": "Unable to generate a reply.",
		"gemini.rateLimit.text": "Rate limit: retry in {sec}s",
		"gemini.dailyLimit.reached": "Daily limit reached: {used}/{limit} requests used today",
		"gemini.dailyUsage.text": "Requests today: {used}/{limit} ({remaining} remaining)",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "Reset in {hours}h {minutes}min",
		"gemini.error.noApiKey": "GEMINI_API_KEY not set in settings",
		"gemini.error.generic": "Gemini API error",
		"gemini.response.empty": "[Empty response]",
		"gemini.history.title": "Recent summaries",
		"gemini.history.empty": "No history yet",
		"gemini.history.entry": "{count} msgs - {date}",
		"gemini.summary.noMessages": "No messages to summarize.",
		"gemini.summary.noFilteredMessages": "[No relevant messages after filtering]",
		"gemini.summary.generationError": "Error generating summary: {error}",
		"gemini.summary.noUnreadFound": "No unread messages found.",
		"gemini.summary.noChannelSelected": "No channel selected.",
		"gemini.summary.noMessagesInChannel": "No messages found in this channel.",
		"gemini.summary.attachments": "{count} attachment(s)",
		"gemini.settings.apiKey": "Gemini API Key",
		"gemini.settings.apiKeyPlaceholder": "Your Gemini API key",
		"gemini.settings.model": "Gemini Model",
		"gemini.settings.language": "Language",
		"gemini.settings.show": "Show",
		"gemini.settings.hide": "Hide",
		"gemini.settings.dailyLimit": "Daily Request Limit",
		"gemini.settings.dailyLimitHelp": "Requests per day (20 default, -1 unlimited). Resets at midnight Pacific Time."
	},
	"fr": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "Résumé non-lus",
		"gemini.button.lastX": "Résumé X derniers messages",
		"gemini.button.autoReply": "Réponse automatique",
		"gemini.modal.unread.title": "Résumé des non-lus",
		"gemini.modal.lastX.title": "Résumé des derniers messages",
		"gemini.modal.lastX.label": "Nombre de messages",
		"gemini.modal.summary.title": "Résumé ({count} msgs)",
		"gemini.modal.button.copy": "Copier",
		"gemini.modal.button.summarize": "Résumer",
		"gemini.modal.button.summarizeNoQuota": "Essayer de résumer (Quota épuisé)",
		"gemini.toast.generating": "Génération du résumé...",
		"gemini.toast.generatingReply": "Génération de la réponse...",
		"gemini.toast.copied": "Résumé copié",
		"gemini.toast.copyFailed": "Impossible de copier",
		"gemini.toast.error": "Erreur lors de la génération",
		"gemini.toast.noMessage": "Aucun message trouvé pour répondre.",
		"gemini.toast.noReply": "Impossible de générer une réponse.",
		"gemini.rateLimit.text": "Rate limit: réessaye dans {sec}s",
		"gemini.dailyLimit.reached": "Limite quotidienne atteinte: {used}/{limit} requêtes utilisées aujourd'hui",
		"gemini.dailyUsage.text": "Requêtes aujourd'hui: {used}/{limit} ({remaining} restantes)",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "Reset prévu dans {hours}h {minutes}min",
		"gemini.error.noApiKey": "GEMINI_API_KEY non définie dans les paramètres",
		"gemini.error.generic": "Erreur API Gemini",
		"gemini.response.empty": "[Réponse vide]",
		"gemini.history.title": "Résumés récents",
		"gemini.history.empty": "Aucun historique",
		"gemini.history.entry": "{count} msgs - {date}",
		"gemini.summary.noMessages": "Aucun message à résumer.",
		"gemini.summary.noFilteredMessages": "[Aucun message pertinent après filtrage]",
		"gemini.summary.generationError": "Erreur lors de la génération du résumé: {error}",
		"gemini.summary.noUnreadFound": "Aucun message non lu trouvé.",
		"gemini.summary.noChannelSelected": "Aucun canal sélectionné.",
		"gemini.summary.noMessagesInChannel": "Aucun message trouvé dans ce canal.",
		"gemini.summary.attachments": "{count} pièce(s) jointe(s)",
		"gemini.settings.apiKey": "Clé API Gemini",
		"gemini.settings.apiKeyPlaceholder": "Votre clé API Gemini",
		"gemini.settings.model": "Modèle Gemini",
		"gemini.settings.language": "Langue",
		"gemini.settings.show": "Afficher",
		"gemini.settings.hide": "Masquer",
		"gemini.settings.dailyLimit": "Limite quotidienne de requêtes",
		"gemini.settings.dailyLimitHelp": "Requêtes par jour (20 par défaut, -1 illimité). Réinitialisation à minuit heure du Pacifique."
	},
	"de": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "Ungelesene Zusammenfassung",
		"gemini.button.lastX": "Letzte X Nachrichten",
		"gemini.button.autoReply": "Automatische Antwort",
		"gemini.modal.unread.title": "Ungelesene Zusammenfassung",
		"gemini.modal.lastX.title": "Letzte Nachrichten Zusammenfassung",
		"gemini.modal.lastX.label": "Anzahl der Nachrichten",
		"gemini.modal.summary.title": "Zusammenfassung ({count} Msgs)",
		"gemini.modal.button.copy": "Kopieren",
		"gemini.modal.button.summarize": "Zusammenfassen",
		"gemini.modal.button.summarizeNoQuota": "Zusammenfassen versuchen (Kein Kontingent)",
		"gemini.toast.generating": "Zusammenfassung wird erstellt...",
		"gemini.toast.generatingReply": "Antwort wird erstellt...",
		"gemini.toast.copied": "Zusammenfassung kopiert",
		"gemini.toast.copyFailed": "Kopieren fehlgeschlagen",
		"gemini.toast.error": "Fehler bei der Generierung",
		"gemini.toast.noMessage": "Keine Nachricht zum Antworten gefunden.",
		"gemini.toast.noReply": "Antwort konnte nicht erstellt werden.",
		"gemini.rateLimit.text": "Rate Limit: erneut versuchen in {sec}s",
		"gemini.dailyLimit.reached": "Tageslimit erreicht: {used}/{limit} Anfragen heute verwendet",
		"gemini.dailyUsage.text": "Anfragen heute: {used}/{limit} ({remaining} verbleibend)",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "Zurücksetzung in {hours}h {minutes}min",
		"gemini.error.noApiKey": "GEMINI_API_KEY nicht in den Einstellungen gesetzt",
		"gemini.error.generic": "Gemini API Fehler",
		"gemini.response.empty": "[Leere Antwort]",
		"gemini.history.title": "Letzte Zusammenfassungen",
		"gemini.history.empty": "Noch kein Verlauf",
		"gemini.history.entry": "{count} Msgs - {date}",
		"gemini.summary.noMessages": "Keine Nachrichten zum Zusammenfassen.",
		"gemini.summary.noFilteredMessages": "[Keine relevanten Nachrichten nach Filterung]",
		"gemini.summary.generationError": "Fehler beim Generieren der Zusammenfassung: {error}",
		"gemini.summary.noUnreadFound": "Keine ungelesenen Nachrichten gefunden.",
		"gemini.summary.noChannelSelected": "Kein Kanal ausgewählt.",
		"gemini.summary.noMessagesInChannel": "Keine Nachrichten in diesem Kanal gefunden.",
		"gemini.summary.attachments": "{count} Anhang/Anhänge",
		"gemini.settings.apiKey": "Gemini API-Schlüssel",
		"gemini.settings.apiKeyPlaceholder": "Ihr Gemini API-Schlüssel",
		"gemini.settings.model": "Gemini-Modell",
		"gemini.settings.language": "Sprache",
		"gemini.settings.show": "Anzeigen",
		"gemini.settings.hide": "Verbergen",
		"gemini.settings.dailyLimit": "Tägliches Anfragelimit",
		"gemini.settings.dailyLimitHelp": "Anfragen pro Tag (Standard 20, -1 unbegrenzt). Zurücksetzung um Mitternacht Pacific Time."
	},
	"es-ES": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "Resumen no leídos",
		"gemini.button.lastX": "Últimos X mensajes",
		"gemini.button.autoReply": "Respuesta automática",
		"gemini.modal.unread.title": "Resumen de no leídos",
		"gemini.modal.lastX.title": "Resumen de últimos mensajes",
		"gemini.modal.lastX.label": "Número de mensajes",
		"gemini.modal.summary.title": "Resumen ({count} msgs)",
		"gemini.modal.button.copy": "Copiar",
		"gemini.modal.button.summarize": "Resumir",
		"gemini.modal.button.summarizeNoQuota": "Intentar resumir (Sin cuota)",
		"gemini.toast.generating": "Generando resumen...",
		"gemini.toast.generatingReply": "Generando respuesta...",
		"gemini.toast.copied": "Resumen copiado",
		"gemini.toast.copyFailed": "No se pudo copiar",
		"gemini.toast.error": "Error al generar",
		"gemini.toast.noMessage": "No se encontró mensaje para responder.",
		"gemini.toast.noReply": "No se pudo generar una respuesta.",
		"gemini.rateLimit.text": "Límite de tasa: reintente en {sec}s",
		"gemini.dailyLimit.reached": "Límite diario alcanzado: {used}/{limit} solicitudes usadas hoy",
		"gemini.dailyUsage.text": "Solicitudes hoy: {used}/{limit} ({remaining} restantes)",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "Reinicio en {hours}h {minutes}min",
		"gemini.error.noApiKey": "GEMINI_API_KEY no establecida en configuración",
		"gemini.error.generic": "Error API Gemini",
		"gemini.response.empty": "[Respuesta vacía]",
		"gemini.history.title": "Resúmenes recientes",
		"gemini.history.empty": "Sin historial",
		"gemini.history.entry": "{count} msgs - {date}",
		"gemini.summary.noMessages": "No hay mensajes para resumir.",
		"gemini.summary.noFilteredMessages": "[No hay mensajes relevantes después del filtrado]",
		"gemini.summary.generationError": "Error al generar resumen: {error}",
		"gemini.summary.noUnreadFound": "No se encontraron mensajes no leídos.",
		"gemini.summary.noChannelSelected": "No se seleccionó ningún canal.",
		"gemini.summary.noMessagesInChannel": "No se encontraron mensajes en este canal.",
		"gemini.summary.attachments": "{count} adjunto(s)",
		"gemini.settings.apiKey": "Clave API Gemini",
		"gemini.settings.apiKeyPlaceholder": "Tu clave API Gemini",
		"gemini.settings.model": "Modelo Gemini",
		"gemini.settings.language": "Idioma",
		"gemini.settings.show": "Mostrar",
		"gemini.settings.hide": "Ocultar",
		"gemini.settings.dailyLimit": "Límite diario de solicitudes",
		"gemini.settings.dailyLimitHelp": "Solicitudes por día (20 predeterminado, -1 ilimitado). Se reinicia a medianoche hora del Pacífico."
	},
	"pt-BR": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "Resumo não lidos",
		"gemini.button.lastX": "Últimas X mensagens",
		"gemini.button.autoReply": "Resposta automática",
		"gemini.modal.unread.title": "Resumo de não lidos",
		"gemini.modal.lastX.title": "Resumo das últimas mensagens",
		"gemini.modal.lastX.label": "Número de mensagens",
		"gemini.modal.summary.title": "Resumo ({count} msgs)",
		"gemini.modal.button.copy": "Copiar",
		"gemini.modal.button.summarize": "Resumir",
		"gemini.modal.button.summarizeNoQuota": "Tentar resumir (Sem cota)",
		"gemini.toast.generating": "Gerando resumo...",
		"gemini.toast.generatingReply": "Gerando resposta...",
		"gemini.toast.copied": "Resumo copiado",
		"gemini.toast.copyFailed": "Não foi possível copiar",
		"gemini.toast.error": "Erro ao gerar",
		"gemini.toast.noMessage": "Nenhuma mensagem encontrada para responder.",
		"gemini.toast.noReply": "Não foi possível gerar uma resposta.",
		"gemini.rateLimit.text": "Limite de taxa: tente novamente em {sec}s",
		"gemini.dailyLimit.reached": "Limite diário atingido: {used}/{limit} solicitações usadas hoje",
		"gemini.dailyUsage.text": "Solicitações hoje: {used}/{limit} ({remaining} restantes)",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "Reinicialização em {hours}h {minutes}min",
		"gemini.error.noApiKey": "GEMINI_API_KEY não definida nas configurações",
		"gemini.error.generic": "Erro API Gemini",
		"gemini.response.empty": "[Resposta vazia]",
		"gemini.history.title": "Resumos recentes",
		"gemini.history.empty": "Sem histórico",
		"gemini.history.entry": "{count} msgs - {date}",
		"gemini.summary.noMessages": "Nenhuma mensagem para resumir.",
		"gemini.summary.noFilteredMessages": "[Nenhuma mensagem relevante após filtragem]",
		"gemini.summary.generationError": "Erro ao gerar resumo: {error}",
		"gemini.summary.noUnreadFound": "Nenhuma mensagem não lida encontrada.",
		"gemini.summary.noChannelSelected": "Nenhum canal selecionado.",
		"gemini.summary.noMessagesInChannel": "Nenhuma mensagem encontrada neste canal.",
		"gemini.summary.attachments": "{count} anexo(s)",
		"gemini.settings.apiKey": "Chave API Gemini",
		"gemini.settings.apiKeyPlaceholder": "Sua chave API Gemini",
		"gemini.settings.model": "Modelo Gemini",
		"gemini.settings.language": "Idioma",
		"gemini.settings.show": "Mostrar",
		"gemini.settings.hide": "Ocultar",
		"gemini.settings.dailyLimit": "Limite diário de solicitações",
		"gemini.settings.dailyLimitHelp": "Solicitações por dia (20 padrão, -1 ilimitado). Reinicia à meia-noite horário do Pacífico."
	},
	"ja": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "未読の要約",
		"gemini.button.lastX": "最後のXメッセージ",
		"gemini.button.autoReply": "自動返信",
		"gemini.modal.unread.title": "未読の要約",
		"gemini.modal.lastX.title": "最後のメッセージの要約",
		"gemini.modal.lastX.label": "メッセージ数",
		"gemini.modal.summary.title": "要約 ({count} msgs)",
		"gemini.modal.button.copy": "コピー",
		"gemini.modal.button.summarize": "要約",
		"gemini.modal.button.summarizeNoQuota": "要約を試す (制限なし)",
		"gemini.toast.generating": "要約を生成中...",
		"gemini.toast.generatingReply": "返信を生成中...",
		"gemini.toast.copied": "要約をコピーしました",
		"gemini.toast.copyFailed": "コピーできませんでした",
		"gemini.toast.error": "生成中にエラーが発生しました",
		"gemini.toast.noMessage": "返信するメッセージが見つかりません。",
		"gemini.toast.noReply": "返信を生成できませんでした。",
		"gemini.rateLimit.text": "レート制限: {sec}秒後に再試行",
		"gemini.dailyLimit.reached": "1日の制限に達しました: 今日使用した{used}/{limit}リクエスト",
		"gemini.dailyUsage.text": "今日のリクエスト: {used}/{limit} (残り{remaining})",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "リセットまで{hours}時間{minutes}分",
		"gemini.error.noApiKey": "設定でGEMINI_API_KEYが設定されていません",
		"gemini.error.generic": "Gemini APIエラー",
		"gemini.response.empty": "[空の応答]",
		"gemini.history.title": "最近の要約",
		"gemini.history.empty": "履歴なし",
		"gemini.history.entry": "{count}件 - {date}",
		"gemini.summary.noMessages": "要約するメッセージがありません。",
		"gemini.summary.noFilteredMessages": "[フィルタリング後の関連メッセージなし]",
		"gemini.summary.generationError": "要約生成エラー: {error}",
		"gemini.summary.noUnreadFound": "未読メッセージが見つかりません。",
		"gemini.summary.noChannelSelected": "チャンネルが選択されていません。",
		"gemini.summary.noMessagesInChannel": "このチャンネルにメッセージが見つかりません。",
		"gemini.summary.attachments": "{count}個の添付ファイル",
		"gemini.settings.apiKey": "Gemini APIキー",
		"gemini.settings.apiKeyPlaceholder": "Gemini APIキー",
		"gemini.settings.model": "Geminiモデル",
		"gemini.settings.language": "言語",
		"gemini.settings.show": "表示",
		"gemini.settings.hide": "非表示",
		"gemini.settings.dailyLimit": "日次リクエスト制限",
		"gemini.settings.dailyLimitHelp": "日次リクエスト数（デフォルト20、-1で無制限）。太平洋時間の真夜中にリセット。"
	},
	"it": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "Riepilogo non letti",
		"gemini.button.lastX": "Ultimi X messaggi",
		"gemini.button.autoReply": "Risposta automatica",
		"gemini.modal.unread.title": "Riepilogo non letti",
		"gemini.modal.lastX.title": "Riepilogo ultimi messaggi",
		"gemini.modal.lastX.label": "Numero di messaggi",
		"gemini.modal.summary.title": "Riepilogo ({count} msgs)",
		"gemini.modal.button.copy": "Copia",
		"gemini.modal.button.summarize": "Riassumi",
		"gemini.modal.button.summarizeNoQuota": "Prova a riassumere (Nessuna quota)",
		"gemini.toast.generating": "Generazione riepilogo...",
		"gemini.toast.generatingReply": "Generazione risposta...",
		"gemini.toast.copied": "Riepilogo copiato",
		"gemini.toast.copyFailed": "Impossibile copiare",
		"gemini.toast.error": "Errore durante la generazione",
		"gemini.toast.noMessage": "Nessun messaggio trovato per rispondere.",
		"gemini.toast.noReply": "Impossibile generare una risposta.",
		"gemini.rateLimit.text": "Limite di velocità: riprova tra {sec}s",
		"gemini.dailyLimit.reached": "Limite giornaliero raggiunto: {used}/{limit} richieste usate oggi",
		"gemini.dailyUsage.text": "Richieste oggi: {used}/{limit} ({remaining} rimanenti)",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "Reset tra {hours}h {minutes}min",
		"gemini.error.noApiKey": "GEMINI_API_KEY non impostata nelle impostazioni",
		"gemini.error.generic": "Errore API Gemini",
		"gemini.response.empty": "[Risposta vuota]",
		"gemini.history.title": "Riepiloghi recenti",
		"gemini.history.empty": "Nessuna cronologia",
		"gemini.history.entry": "{count} msgs - {date}",
		"gemini.summary.noMessages": "Nessun messaggio da riassumere.",
		"gemini.summary.noFilteredMessages": "[Nessun messaggio rilevante dopo il filtraggio]",
		"gemini.summary.generationError": "Errore nella generazione del riepilogo: {error}",
		"gemini.summary.noUnreadFound": "Nessun messaggio non letto trovato.",
		"gemini.summary.noChannelSelected": "Nessun canale selezionato.",
		"gemini.summary.noMessagesInChannel": "Nessun messaggio trovato in questo canale.",
		"gemini.summary.attachments": "{count} allegato/i",
		"gemini.settings.apiKey": "Chiave API Gemini",
		"gemini.settings.apiKeyPlaceholder": "La tua chiave API Gemini",
		"gemini.settings.model": "Modello Gemini",
		"gemini.settings.language": "Lingua",
		"gemini.settings.show": "Mostra",
		"gemini.settings.hide": "Nascondi",
		"gemini.settings.dailyLimit": "Limite giornaliero di richieste",
		"gemini.settings.dailyLimitHelp": "Richieste al giorno (20 predefinito, -1 illimitato). Si azzera a mezzanotte ora del Pacifico."
	},
	"ru": {
		"gemini.menu.title": "Gemini AI",
		"gemini.button.unread": "Сводка непрочитанных",
		"gemini.button.lastX": "Последние X сообщений",
		"gemini.button.autoReply": "Автоответ",
		"gemini.modal.unread.title": "Сводка непрочитанных",
		"gemini.modal.lastX.title": "Сводка последних сообщений",
		"gemini.modal.lastX.label": "Количество сообщений",
		"gemini.modal.summary.title": "Сводка ({count} сообщ.)",
		"gemini.modal.button.copy": "Копировать",
		"gemini.modal.button.summarize": "Создать сводку",
		"gemini.modal.button.summarizeNoQuota": "Попробовать создать сводку (Нет квоты)",
		"gemini.toast.generating": "Создание сводки...",
		"gemini.toast.generatingReply": "Создание ответа...",
		"gemini.toast.copied": "Сводка скопирована",
		"gemini.toast.copyFailed": "Не удалось скопировать",
		"gemini.toast.error": "Ошибка при создании",
		"gemini.toast.noMessage": "Сообщение для ответа не найдено.",
		"gemini.toast.noReply": "Не удалось создать ответ.",
		"gemini.rateLimit.text": "Ограничение скорости: повторите через {sec}с",
		"gemini.dailyLimit.reached": "Дневной лимит достигнут: {used}/{limit} запросов использовано сегодня",
		"gemini.dailyUsage.text": "Запросов сегодня: {used}/{limit} (осталось {remaining})",
		"gemini.dailyUsage.short": "{used}/{limit}",
		"gemini.resetIn": "Сброс через {hours}ч {minutes}мин",
		"gemini.error.noApiKey": "GEMINI_API_KEY не установлен в настройках",
		"gemini.error.generic": "Ошибка API Gemini",
		"gemini.response.empty": "[Пустой ответ]",
		"gemini.history.title": "Недавние сводки",
		"gemini.history.empty": "История пуста",
		"gemini.history.entry": "{count} сообщ. - {date}",
		"gemini.summary.noMessages": "Нет сообщений для резюмирования.",
		"gemini.summary.noFilteredMessages": "[Нет релевантных сообщений после фильтрации]",
		"gemini.summary.generationError": "Ошибка при создании сводки: {error}",
		"gemini.summary.noUnreadFound": "Непрочитанные сообщения не найдены.",
		"gemini.summary.noChannelSelected": "Канал не выбран.",
		"gemini.summary.noMessagesInChannel": "Сообщения в этом канале не найдены.",
		"gemini.summary.attachments": "{count} вложение(я)",
		"gemini.settings.apiKey": "API-ключ Gemini",
		"gemini.settings.apiKeyPlaceholder": "Ваш API-ключ Gemini",
		"gemini.settings.model": "Модель Gemini",
		"gemini.settings.language": "Язык",
		"gemini.settings.show": "Показать",
		"gemini.settings.hide": "Скрыть",
		"gemini.settings.dailyLimit": "Ежедневный лимит запросов",
		"gemini.settings.dailyLimitHelp": "Запросов в день (20 по умолчанию, -1 без ограничений). Сброс в полночь тихоокеанского времени."
	}
};
const fallbackLocale = "en-US";
function getDiscordLocale() {
	try {
		const stores = shelter?.flux?.stores;
		if (stores?.UserSettingsStore) {
			const locale = stores.UserSettingsStore.getLocale?.() || stores.UserSettingsStore.locale;
			if (locale && typeof locale === "string") return locale;
		}
		const navLang = navigator.language || navigator.userLanguage;
		return navLang || fallbackLocale;
	} catch {
		return fallbackLocale;
	}
}
function normalizeLocale(locale) {
	if (!locale) return fallbackLocale;
	if (translations[locale]) return locale;
	const baseLang = locale.split("-")[0];
	if (translations[baseLang]) return baseLang;
	const variants = {
		"en": "en-US",
		"pt": "pt-BR",
		"es": "es-ES"
	};
	if (variants[baseLang]) return variants[baseLang];
	return fallbackLocale;
}
function t(key, params = {}) {
	const store$1 = shelter?.plugin?.store;
	const storedLocale = store$1?.geminiLanguage;
	const currentLocale$1 = storedLocale ? normalizeLocale(storedLocale) : normalizeLocale(getDiscordLocale());
	const localeData = translations[currentLocale$1] || translations[fallbackLocale];
	let text = localeData[key] || translations[fallbackLocale][key] || key;
	Object.keys(params).forEach((param) => {
		text = text.replace(new RegExp(`\\{${param}\\}`, "g"), params[param]);
	});
	return text;
}
function getLocale() {
	const store$1 = shelter?.plugin?.store;
	const storedLocale = store$1?.geminiLanguage;
	return storedLocale ? normalizeLocale(storedLocale) : normalizeLocale(getDiscordLocale());
}
function setLocale(locale) {
	const store$1 = shelter?.plugin?.store;
	if (store$1) store$1.geminiLanguage = locale;
}
function formatDate(date) {
	try {
		const d = typeof date === "number" ? new Date(date) : new Date(date);
		if (isNaN(d.getTime())) return String(date);
		const locale = getLocale().replace("_", "-");
		return d.toLocaleDateString(locale, {
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit"
		});
	} catch (e) {
		console.error("formatDate error:", e, date);
		return String(date);
	}
}

//#endregion
//#region lib/summary.js
function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}
function chooseSummaryMaxTokens(messageCount) {
	if (messageCount >= 80) return 6144;
	if (messageCount >= 60) return 5120;
	if (messageCount >= 30) return 4096;
	return 3072;
}
function seemsTruncated(text) {
	const t$1 = (text ?? "").toString().trim();
	if (!t$1) return false;
	return !/[\.!\?…\)]\s*$/.test(t$1);
}
function formatTimestampForPrompt(msg) {
	const ts = msg?.timestamp ?? msg?.editedTimestamp;
	if (!ts) return null;
	if (typeof ts === "string") return ts;
	if (typeof ts === "number") try {
		return new Date(ts).toISOString();
	} catch {
		return String(ts);
	}
	if (typeof ts?.toISOString === "function") try {
		return ts.toISOString();
	} catch {}
	if (typeof ts?.toDate === "function") try {
		return ts.toDate().toISOString();
	} catch {}
	return String(ts);
}
function isNoiseContent(text) {
	const t$1 = (text ?? "").toString().trim();
	if (!t$1) return true;
	const lower = t$1.toLowerCase();
	const commonNoise = [
		"salut",
		"yo",
		"hello",
		"hey",
		"coucou",
		"ok",
		"okay",
		"oki",
		"kk",
		"k",
		"merci",
		"thx",
		"thanks",
		"mdr",
		"lol"
	];
	if (commonNoise.includes(lower)) return true;
	if (!/[\p{L}\p{N}]/u.test(t$1)) return true;
	return false;
}
let userDisplayNames = {};
function getUserDisplayNames() {
	return userDisplayNames;
}
function getDisplayName(msg) {
	const stores = shelter?.flux?.stores;
	const author = msg?.author;
	if (!author) return "Utilisateur";
	const username = author.username || "Utilisateur";
	const channelId = stores?.SelectedChannelStore?.getChannelId?.();
	const channel = stores?.ChannelStore?.getChannel?.(channelId);
	const guildId = channel?.guild_id;
	if (guildId && stores?.GuildMemberStore) {
		const member = stores.GuildMemberStore.getMember(guildId, author.id);
		if (member?.nick) {
			userDisplayNames[username] = {
				displayName: member.nick,
				userId: author.id
			};
			return member.nick;
		}
	}
	const displayName = author.globalName || author.global_name || username;
	userDisplayNames[username] = {
		displayName,
		userId: author.id
	};
	return displayName;
}
function getCurrentUserInfo() {
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
	const username = msg?.author?.username || "Utilisateur";
	const atUser = `@${displayName}`;
	const raw = (msg?.content ?? "").toString();
	const content = raw.trim();
	const attachmentsCount = Array.isArray(msg?.attachments) ? msg.attachments.length : msg?.attachments?.size ?? 0;
	const embeds = Array.isArray(msg?.embeds) ? msg.embeds : [];
	const embedTexts = [];
	for (const embed of embeds) {
		const parts = [];
		if (embed.title) parts.push(embed.url ? `[${embed.title}](${embed.url})` : embed.title);
else if (embed.url) parts.push(`[Lien: ${embed.url}]`);
		if (embed.author?.name) parts.push(`par ${embed.author.name}`);
		if (embed.description) {
			const desc = embed.description.length > 200 ? embed.description.slice(0, 200) + "…" : embed.description;
			parts.push(desc);
		}
		if (embed.fields?.length) {
			for (const field of embed.fields.slice(0, 3)) if (field.name && field.value) {
				const val = field.value.length > 100 ? field.value.slice(0, 100) + "…" : field.value;
				parts.push(`${field.name}: ${val}`);
			}
		}
		if (parts.length) embedTexts.push(`[Embed: ${parts.join(" | ")}]`);
	}
	let text = content;
	if (embedTexts.length) text = text ? `${text} ${embedTexts.join(" ")}` : embedTexts.join(" ");
	if (!text) {
		const extras = [];
		if (attachmentsCount) extras.push(t("gemini.summary.attachments", { count: attachmentsCount }));
		text = extras.length ? `[${extras.join(", ")}]` : "[message sans texte]";
	}
	if (isNoiseContent(text)) return null;
	const maxLen = 600;
	if (text.length > maxLen) text = `${text.slice(0, maxLen)}…`;
	const ts = formatTimestampForPrompt(msg);
	const tsPart = ts ? `[${ts}] ` : "";
	return `${tsPart}${atUser}: ${text}`;
}
async function summarizeMessages(messages, opts = {}) {
	if (!messages || messages.length === 0) return t("gemini.summary.noMessages");
	userDisplayNames = {};
	const lines = messages.map(formatMessageForPrompt).filter(Boolean);
	const bulletTarget = clamp(Math.ceil(lines.length / 8), 4, 10);
	const maxTokens = opts.maxTokens ?? chooseSummaryMaxTokens(lines.length);
	const currentUser = getCurrentUserInfo();
	const currentUserContext = currentUser ? `\n# CONTEXTE: L'utilisateur qui demande ce résumé est @${currentUser.username}. Mentionne explicitement quand quelqu'un parle de lui/elle ou lui répond.\n` : "";
	const locale = getLocale();
	const isEnglish = locale.startsWith("en");
	const currentUserContextEN = currentUser ? `\n# CONTEXT: The user requesting this summary is @${currentUser.username}. Explicitly mention when someone talks about them or replies to them.\n` : "";
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
		lines.length ? lines.join("\n") : t("gemini.summary.noFilteredMessages"),
		"```"
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
		"```"
	].join("\n");
	try {
		const first = await callGemini(prompt, {
			temperature: opts.temperature ?? .2,
			maxTokens,
			model: opts.model,
			returnMeta: true
		});
		let summary = first?.text ?? "";
		const finishReason = first?.finishReason;
		if (finishReason === "MAX_TOKENS" || seemsTruncated(summary)) {
			const tail = summary.slice(Math.max(0, summary.length - 450));
			const continuationPrompt = [
				"Tu as été interrompu par une limite de longueur.",
				"Continue immédiatement APRÈS la dernière portion ci-dessous, sans la répéter.",
				"Ne rajoute pas d'introduction. Reste en Markdown. Termine proprement.",
				"",
				"Dernière portion :",
				tail || "[vide]"
			].join("\n");
			try {
				const more = await callGemini(continuationPrompt, {
					temperature: opts.temperature ?? .2,
					maxTokens: 1024,
					model: opts.model
				});
				if (typeof more === "string" && more.trim()) summary = `${summary}\n${more}`;
			} catch {}
		}
		return summary;
	} catch (error) {
		return `Erreur lors de la génération du résumé: ${error.message}`;
	}
}
async function summarizeLastX(x = 10) {
	const stores = shelter && shelter.flux && shelter.flux.stores;
	if (!stores) return t("gemini.summary.noMessagesInChannel");
	const selectedChannelId = stores.SelectedChannelStore && stores.SelectedChannelStore.getChannelId && stores.SelectedChannelStore.getChannelId();
	if (!selectedChannelId) return t("gemini.summary.noChannelSelected");
	const messages = stores.MessageStore.getMessages(selectedChannelId).toArray().slice(-x);
	if (messages.length === 0) return t("gemini.summary.noMessagesInChannel");
	return await summarizeMessages(messages);
}

//#endregion
//#region ui/Settings.jsx
var import_web$12 = __toESM(require_web(), 1);
var import_web$13 = __toESM(require_web(), 1);
var import_web$14 = __toESM(require_web(), 1);
var import_web$15 = __toESM(require_web(), 1);
var import_web$16 = __toESM(require_web(), 1);
var import_web$17 = __toESM(require_web(), 1);
var import_web$18 = __toESM(require_web(), 1);
var import_web$19 = __toESM(require_web(), 1);
const _tmpl$$1 = /*#__PURE__*/ (0, import_web$12.template)(`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>`, 4), _tmpl$2$1 = /*#__PURE__*/ (0, import_web$12.template)(`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"></path></svg>`, 4), _tmpl$3$1 = /*#__PURE__*/ (0, import_web$12.template)(`<div class="gemini-settings-section"><!#><!/><div><div></div><!#><!/></div></div>`, 10), _tmpl$4$1 = /*#__PURE__*/ (0, import_web$12.template)(`<div class="gemini-settings-section"><!#><!/><select class="gemini-model-select"></select></div>`, 6), _tmpl$5$1 = /*#__PURE__*/ (0, import_web$12.template)(`<div class="gemini-settings-section"><!#><!/><!#><!/><!#><!/></div>`, 8), _tmpl$6$1 = /*#__PURE__*/ (0, import_web$12.template)(`<div></div>`, 2), _tmpl$7$1 = /*#__PURE__*/ (0, import_web$12.template)(`<option></option>`, 2);
const { plugin: { store }, ui: { TextBox: TextBox$1, Text, Button: Button$1, Modal, ModalHeader: ModalHeader$1, ModalContent, ModalFooter: ModalFooter$1, ButtonColors: ButtonColors$1, ButtonSizes: ButtonSizes$1 }, solid: { createSignal } } = shelter;
const GEMINI_MODELS = [
	"gemini-2.5-flash",
	"gemini-2.0-flash-exp",
	"gemini-1.5-flash",
	"gemini-1.5-flash-8b",
	"gemini-1.5-pro",
	"gemini-exp-1206"
];
const AVAILABLE_LANGUAGES = [
	{
		code: "en-US",
		name: "English"
	},
	{
		code: "fr",
		name: "Français"
	},
	{
		code: "de",
		name: "Deutsch"
	},
	{
		code: "es-ES",
		name: "Español"
	},
	{
		code: "pt-BR",
		name: "Português"
	},
	{
		code: "ja",
		name: "日本語"
	},
	{
		code: "it",
		name: "Italiano"
	},
	{
		code: "ru",
		name: "Русский"
	}
];
const EyeIcon = () => (0, import_web$19.getNextElement)(_tmpl$$1);
const EyeSlashIcon = () => (0, import_web$19.getNextElement)(_tmpl$2$1);
var Settings_default = () => {
	const [showPassword, setShowPassword] = createSignal(false);
	if (!store.geminiModel) store.geminiModel = "gemini-2.5-flash";
	if (!store.geminiLanguage) store.geminiLanguage = getLocale();
	return [
		(() => {
			const _el$3 = (0, import_web$19.getNextElement)(_tmpl$3$1), _el$8 = _el$3.firstChild, [_el$9, _co$2] = (0, import_web$15.getNextMarker)(_el$8.nextSibling), _el$4 = _el$9.nextSibling, _el$5 = _el$4.firstChild, _el$6 = _el$5.nextSibling, [_el$7, _co$] = (0, import_web$15.getNextMarker)(_el$6.nextSibling);
			(0, import_web$16.insert)(_el$3, (0, import_web$18.createComponent)(Text, {
				"class": "gemini-settings-label",
				get children() {
					return t("gemini.settings.apiKey");
				}
			}), _el$9, _co$2);
			_el$4.style.setProperty("display", "flex");
			_el$4.style.setProperty("gap", "8px");
			_el$4.style.setProperty("alignItems", "flex-end");
			_el$5.style.setProperty("flex", "1");
			(0, import_web$16.insert)(_el$5, (0, import_web$18.createComponent)(TextBox$1, {
				get type() {
					return showPassword() ? "text" : "password";
				},
				get placeholder() {
					return t("gemini.settings.apiKeyPlaceholder");
				},
				get value() {
					return store.geminiKey || "";
				},
				onInput: (value) => {
					store.geminiKey = value;
				}
			}));
			(0, import_web$16.insert)(_el$4, (0, import_web$18.createComponent)(Button$1, {
				get size() {
					return ButtonSizes$1.MEDIUM;
				},
				get color() {
					return ButtonColors$1.SECONDARY;
				},
				onClick: () => setShowPassword(!showPassword()),
				style: { minWidth: "80px" },
				get children() {
					return (0, import_web$17.memo)(() => !!showPassword())() ? (0, import_web$18.createComponent)(EyeSlashIcon, {}) : (0, import_web$18.createComponent)(EyeIcon, {});
				}
			}), _el$7, _co$);
			return _el$3;
		})(),
		(() => {
			const _el$0 = (0, import_web$19.getNextElement)(_tmpl$4$1), _el$10 = _el$0.firstChild, [_el$11, _co$3] = (0, import_web$15.getNextMarker)(_el$10.nextSibling), _el$1 = _el$11.nextSibling;
			(0, import_web$16.insert)(_el$0, (0, import_web$18.createComponent)(Text, {
				"class": "gemini-settings-label",
				get children() {
					return t("gemini.settings.model");
				}
			}), _el$11, _co$3);
			_el$1.addEventListener("change", (e) => {
				store.geminiModel = e.target.value;
			});
			(0, import_web$16.insert)(_el$1, () => GEMINI_MODELS.map((model) => (() => {
				const _el$24 = (0, import_web$19.getNextElement)(_tmpl$7$1);
				(0, import_web$13.setAttribute)(_el$24, "key", model);
				_el$24.value = model;
				(0, import_web$16.insert)(_el$24, model);
				return _el$24;
			})()));
			(0, import_web$14.effect)(() => _el$1.value = store.geminiModel || "gemini-2.5-flash");
			return _el$0;
		})(),
		(() => {
			const _el$12 = (0, import_web$19.getNextElement)(_tmpl$4$1), _el$14 = _el$12.firstChild, [_el$15, _co$4] = (0, import_web$15.getNextMarker)(_el$14.nextSibling), _el$13 = _el$15.nextSibling;
			(0, import_web$16.insert)(_el$12, (0, import_web$18.createComponent)(Text, {
				"class": "gemini-settings-label",
				get children() {
					return t("gemini.settings.language");
				}
			}), _el$15, _co$4);
			_el$13.addEventListener("change", (e) => {
				store.geminiLanguage = e.target.value;
				setLocale(e.target.value);
			});
			(0, import_web$16.insert)(_el$13, () => AVAILABLE_LANGUAGES.map((lang) => (() => {
				const _el$25 = (0, import_web$19.getNextElement)(_tmpl$7$1);
				(0, import_web$16.insert)(_el$25, () => lang.name);
				(0, import_web$14.effect)(() => (0, import_web$13.setAttribute)(_el$25, "key", lang.code));
				(0, import_web$14.effect)(() => _el$25.value = lang.code);
				return _el$25;
			})()));
			(0, import_web$14.effect)(() => _el$13.value = store.geminiLanguage || getLocale());
			return _el$12;
		})(),
		(() => {
			const _el$16 = (0, import_web$19.getNextElement)(_tmpl$5$1), _el$17 = _el$16.firstChild, [_el$18, _co$5] = (0, import_web$15.getNextMarker)(_el$17.nextSibling), _el$19 = _el$18.nextSibling, [_el$20, _co$6] = (0, import_web$15.getNextMarker)(_el$19.nextSibling), _el$21 = _el$20.nextSibling, [_el$22, _co$7] = (0, import_web$15.getNextMarker)(_el$21.nextSibling);
			(0, import_web$16.insert)(_el$16, (0, import_web$18.createComponent)(Text, {
				"class": "gemini-settings-label",
				get children() {
					return t("gemini.settings.dailyLimit");
				}
			}), _el$18, _co$5);
			(0, import_web$16.insert)(_el$16, (0, import_web$18.createComponent)(TextBox$1, {
				type: "number",
				placeholder: "20",
				get value() {
					return store.geminiDailyLimit ?? 20;
				},
				onInput: (value) => {
					const num = parseInt(value);
					store.geminiDailyLimit = isNaN(num) ? 20 : num;
				}
			}), _el$20, _co$6);
			(0, import_web$16.insert)(_el$16, (0, import_web$18.createComponent)(Text, {
				style: {
					fontSize: "12px",
					color: "var(--text-muted)",
					marginTop: "4px"
				},
				get children() {
					return t("gemini.settings.dailyLimitHelp");
				}
			}), _el$22, _co$7);
			return _el$16;
		})(),
		(() => {
			const _el$23 = (0, import_web$19.getNextElement)(_tmpl$6$1);
			_el$23.style.setProperty("height", "20px");
			return _el$23;
		})()
	];
};

//#endregion
//#region index.jsx
var import_web = __toESM(require_web(), 1);
var import_web$1 = __toESM(require_web(), 1);
var import_web$2 = __toESM(require_web(), 1);
var import_web$3 = __toESM(require_web(), 1);
var import_web$4 = __toESM(require_web(), 1);
var import_web$5 = __toESM(require_web(), 1);
var import_web$6 = __toESM(require_web(), 1);
var import_web$7 = __toESM(require_web(), 1);
var import_web$8 = __toESM(require_web(), 1);
var import_web$9 = __toESM(require_web(), 1);
var import_web$10 = __toESM(require_web(), 1);
var import_web$11 = __toESM(require_web(), 1);
const _tmpl$ = /*#__PURE__*/ (0, import_web.template)(`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M50 0C50 27.6142 72.3858 50 100 50C72.3858 50 50 72.3858 50 100C50 72.3858 27.6142 50 0 50C27.6142 50 50 27.6142 50 0Z" fill="url(#gemini_gradient)"></path><defs><linearGradient id="gemini_gradient" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse"><stop stop-color="#4E85EB"></stop><stop offset="1" stop-color="#9BB6EC"></stop></linearGradient></defs></svg>`, 12), _tmpl$2 = /*#__PURE__*/ (0, import_web.template)(`<span>@<!#><!/></span>`, 4), _tmpl$3 = /*#__PURE__*/ (0, import_web.template)(`<a target="_blank" rel="noopener noreferrer"></a>`, 2), _tmpl$4 = /*#__PURE__*/ (0, import_web.template)(`<strong></strong>`, 2), _tmpl$5 = /*#__PURE__*/ (0, import_web.template)(`<code></code>`, 2), _tmpl$6 = /*#__PURE__*/ (0, import_web.template)(`<div></div>`, 2), _tmpl$7 = /*#__PURE__*/ (0, import_web.template)(`<br>`, 1), _tmpl$8 = /*#__PURE__*/ (0, import_web.template)(`<p></p>`, 2), _tmpl$9 = /*#__PURE__*/ (0, import_web.template)(`<ul></ul>`, 2), _tmpl$0 = /*#__PURE__*/ (0, import_web.template)(`<ol></ol>`, 2), _tmpl$1 = /*#__PURE__*/ (0, import_web.template)(`<pre><code></code></pre>`, 4), _tmpl$10 = /*#__PURE__*/ (0, import_web.template)(`<h2></h2>`, 2), _tmpl$11 = /*#__PURE__*/ (0, import_web.template)(`<h3></h3>`, 2), _tmpl$12 = /*#__PURE__*/ (0, import_web.template)(`<h4></h4>`, 2), _tmpl$13 = /*#__PURE__*/ (0, import_web.template)(`<li></li>`, 2), _tmpl$14 = /*#__PURE__*/ (0, import_web.template)(`<div class="gemini-toast-loading"><span class="gemini-toast-icon" aria-hidden="true"></span><span></span></div>`, 6), _tmpl$15 = /*#__PURE__*/ (0, import_web.template)(`<div class="gemini-modal-content gemini-markdown"></div>`, 2), _tmpl$16 = /*#__PURE__*/ (0, import_web.template)(`<div class="gemini-settings-section"><label class="gemini-settings-label"></label><!#><!/></div>`, 6), _tmpl$17 = /*#__PURE__*/ (0, import_web.template)(`<div class="gemini-daily-usage"><!#><!/><div class="gemini-reset-time"></div></div>`, 6), _tmpl$18 = /*#__PURE__*/ (0, import_web.template)(`<div class="gemini-rate-limit"></div>`, 2), _tmpl$19 = /*#__PURE__*/ (0, import_web.template)(`<div class="gemini-history"><div class="gemini-history-title"></div><div class="gemini-history-list"></div></div>`, 6), _tmpl$20 = /*#__PURE__*/ (0, import_web.template)(`<button class="gemini-history-entry"></button>`, 2), _tmpl$21 = /*#__PURE__*/ (0, import_web.template)(`<div id="gemini-button"><div role="button" tabindex="0" aria-label="Gemini AI"></div></div>`, 4);
const { observeDom, ui: { injectCss, Button, openModal, ModalRoot, ModalHeader, ModalBody, ModalFooter, ModalSizes, ButtonColors, ButtonSizes, TextArea, TextBox, niceScrollbarsClass, showToast } } = shelter;
const MAX_HISTORY_PER_CHANNEL = 5;
function getChannelId() {
	const stores = shelter?.flux?.stores;
	return stores?.SelectedChannelStore?.getChannelId?.() || "unknown";
}
function getSummaryHistory(channelId) {
	const store$1 = shelter.plugin.store;
	if (!store$1.summaryHistory) store$1.summaryHistory = {};
	return store$1.summaryHistory[channelId] || [];
}
function addToSummaryHistory(channelId, count, summary) {
	const store$1 = shelter.plugin.store;
	if (!store$1.summaryHistory) store$1.summaryHistory = {};
	if (!store$1.summaryHistory[channelId]) store$1.summaryHistory[channelId] = [];
	store$1.summaryHistory[channelId].unshift({
		count,
		date: Date.now(),
		summary
	});
	if (store$1.summaryHistory[channelId].length > MAX_HISTORY_PER_CHANNEL) store$1.summaryHistory[channelId] = store$1.summaryHistory[channelId].slice(0, MAX_HISTORY_PER_CHANNEL);
}
const GeminiIcon = () => (0, import_web$11.getNextElement)(_tmpl$);
const isSafeLink = (href) => /^https?:\/\//i.test(href);
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
		const displayNameMap = getUserDisplayNames();
		for (const [, data] of Object.entries(displayNameMap)) if (data.displayName?.toLowerCase() === searchName) {
			userId = data.userId;
			break;
		}
		if (!userId) {
			const messages = stores.MessageStore?.getMessages?.(channelId)?.toArray?.() || [];
			for (const msg of messages) {
				const author = msg?.author;
				if (!author) continue;
				const member$1 = stores.GuildMemberStore?.getMember?.(guildId, author.id);
				if (member$1?.nick?.toLowerCase() === searchName) {
					userId = author.id;
					break;
				}
				const globalName = author.globalName || author.global_name;
				if (globalName?.toLowerCase() === searchName) {
					userId = author.id;
					break;
				}
				if (author.username?.toLowerCase() === searchName) {
					userId = author.id;
					break;
				}
			}
		}
		if (!userId && stores.GuildMemberStore) {
			const memberIds = Object.keys(stores.GuildMemberStore.getMemberIds?.(guildId) || {});
			for (const uid of memberIds) {
				const member$1 = stores.GuildMemberStore.getMember(guildId, uid);
				const user = stores.UserStore?.getUser?.(uid);
				if (member$1?.nick?.toLowerCase() === searchName) {
					userId = uid;
					break;
				}
				if (user?.globalName?.toLowerCase() === searchName || user?.global_name?.toLowerCase() === searchName) {
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
		const member = stores.GuildMemberStore?.getMember?.(guildId, userId);
		if (!member?.roles?.length) return null;
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
			const hex = highestColorRole.color.toString(16).padStart(6, "0");
			return `#${hex}`;
		}
		return null;
	} catch (e) {
		console.error("[Gemini] getUserRoleColor error:", e);
		return null;
	}
};
const renderMention = (displayName, isCurrentUser = false) => {
	const color = isCurrentUser ? "#43b581" : getUserRoleColor(displayName);
	const style = {
		color: color || "var(--text-link)",
		backgroundColor: color ? `${color}20` : "var(--background-modifier-accent)",
		padding: "0 4px",
		borderRadius: "3px",
		fontWeight: isCurrentUser ? "700" : "500"
	};
	return (() => {
		const _el$2 = (0, import_web$11.getNextElement)(_tmpl$2), _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, [_el$5, _co$] = (0, import_web$9.getNextMarker)(_el$4.nextSibling);
		(0, import_web$10.insert)(_el$2, displayName, _el$5, _co$);
		(0, import_web$8.effect)((_$p) => (0, import_web$7.style)(_el$2, style, _$p));
		return _el$2;
	})();
};
const renderInlineMarkdown = (text, currentUserDisplayName = null) => {
	const input = String(text ?? "");
	const parts = [];
	let i = 0;
	const pushText = (t$1) => {
		if (t$1) parts.push(t$1);
	};
	while (i < input.length) {
		const rest = input.slice(i);
		if (rest[0] === "@") {
			const match = rest.match(/^@([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9._\-]*(?:\s+[A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9._\-]*)*)/);
			if (match) {
				const username = match[1].trim();
				const isCurrentUser = currentUserDisplayName && username.toLowerCase() === currentUserDisplayName.toLowerCase();
				parts.push(renderMention(username, isCurrentUser));
				i += match[0].length;
				continue;
			}
		}
		if (rest[0] === "[") {
			const endLabel = rest.indexOf("]");
			if (endLabel > 0 && rest[endLabel + 1] === "(") {
				const endHref = rest.indexOf(")", endLabel + 2);
				if (endHref > endLabel + 2) {
					const label = rest.slice(1, endLabel);
					const href = rest.slice(endLabel + 2, endHref).trim();
					if (isSafeLink(href)) parts.push((() => {
						const _el$6 = (0, import_web$11.getNextElement)(_tmpl$3);
						(0, import_web$6.setAttribute)(_el$6, "href", href);
						(0, import_web$10.insert)(_el$6, label);
						return _el$6;
					})());
else pushText(label);
					i += endHref + 1;
					continue;
				}
			}
		}
		if (rest.startsWith("**")) {
			const end = rest.indexOf("**", 2);
			if (end > 2) {
				const strongText = rest.slice(2, end);
				parts.push((() => {
					const _el$7 = (0, import_web$11.getNextElement)(_tmpl$4);
					(0, import_web$10.insert)(_el$7, strongText);
					return _el$7;
				})());
				i += end + 2;
				continue;
			}
		}
		if (rest[0] === "`") {
			const end = rest.indexOf("`", 1);
			if (end > 1) {
				const code = rest.slice(1, end);
				parts.push((() => {
					const _el$8 = (0, import_web$11.getNextElement)(_tmpl$5);
					(0, import_web$10.insert)(_el$8, code);
					return _el$8;
				})());
				i += end + 1;
				continue;
			}
		}
		pushText(input[i]);
		i += 1;
	}
	const merged = [];
	for (const p of parts) {
		const last = merged[merged.length - 1];
		if (typeof p === "string" && typeof last === "string") merged[merged.length - 1] = last + p;
else merged.push(p);
	}
	return merged;
};
const renderMarkdown = (markdown) => {
	const md = String(markdown ?? "");
	if (!md.trim()) return (() => {
		const _el$9 = (0, import_web$11.getNextElement)(_tmpl$6);
		(0, import_web$10.insert)(_el$9, () => t("gemini.response.empty"));
		return _el$9;
	})();
	const currentUser = getCurrentUserInfo();
	const currentUserDisplayName = currentUser?.displayName;
	const lines = md.split(/\r?\n/);
	const nodes = [];
	let paragraph = [];
	let listType = null;
	let listItems = [];
	let inCode = false;
	let codeLines = [];
	const flushParagraph = () => {
		if (!paragraph.length) return;
		const content = [];
		paragraph.forEach((line, idx) => {
			if (idx) content.push((0, import_web$11.getNextElement)(_tmpl$7));
			content.push(...renderInlineMarkdown(line, currentUserDisplayName));
		});
		nodes.push((() => {
			const _el$1 = (0, import_web$11.getNextElement)(_tmpl$8);
			(0, import_web$10.insert)(_el$1, content);
			return _el$1;
		})());
		paragraph = [];
	};
	const flushList = () => {
		if (!listType || !listItems.length) {
			listType = null;
			listItems = [];
			return;
		}
		if (listType === "ul") nodes.push((() => {
			const _el$10 = (0, import_web$11.getNextElement)(_tmpl$9);
			(0, import_web$10.insert)(_el$10, listItems);
			return _el$10;
		})());
else nodes.push((() => {
			const _el$11 = (0, import_web$11.getNextElement)(_tmpl$0);
			(0, import_web$10.insert)(_el$11, listItems);
			return _el$11;
		})());
		listType = null;
		listItems = [];
	};
	const flushCode = () => {
		if (!codeLines.length) nodes.push((0, import_web$11.getNextElement)(_tmpl$1));
else nodes.push((() => {
			const _el$13 = (0, import_web$11.getNextElement)(_tmpl$1), _el$14 = _el$13.firstChild;
			(0, import_web$10.insert)(_el$14, () => codeLines.join("\n"));
			return _el$13;
		})());
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
			if (level <= 2) nodes.push((() => {
				const _el$15 = (0, import_web$11.getNextElement)(_tmpl$10);
				(0, import_web$10.insert)(_el$15, content);
				return _el$15;
			})());
else if (level === 3) nodes.push((() => {
				const _el$16 = (0, import_web$11.getNextElement)(_tmpl$11);
				(0, import_web$10.insert)(_el$16, content);
				return _el$16;
			})());
else nodes.push((() => {
				const _el$17 = (0, import_web$11.getNextElement)(_tmpl$12);
				(0, import_web$10.insert)(_el$17, content);
				return _el$17;
			})());
			continue;
		}
		const ulMatch = line.match(/^\-\s+(.*)$/);
		if (ulMatch) {
			flushParagraph();
			if (listType && listType !== "ul") flushList();
			listType = "ul";
			listItems.push((() => {
				const _el$18 = (0, import_web$11.getNextElement)(_tmpl$13);
				(0, import_web$10.insert)(_el$18, () => renderInlineMarkdown(ulMatch[1], currentUserDisplayName));
				return _el$18;
			})());
			continue;
		}
		const olMatch = line.match(/^\d+\.\s+(.*)$/);
		if (olMatch) {
			flushParagraph();
			if (listType && listType !== "ol") flushList();
			listType = "ol";
			listItems.push((() => {
				const _el$19 = (0, import_web$11.getNextElement)(_tmpl$13);
				(0, import_web$10.insert)(_el$19, () => renderInlineMarkdown(olMatch[1], currentUserDisplayName));
				return _el$19;
			})());
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
	return (() => {
		const _el$20 = (0, import_web$11.getNextElement)(_tmpl$6);
		(0, import_web$10.insert)(_el$20, nodes);
		return _el$20;
	})();
};
const copyToClipboard = async (text) => {
	const value = String(text ?? "");
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(value);
			return true;
		}
	} catch {}
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
	return showToast({
		title: "Gemini",
		content: (() => {
			const _el$21 = (0, import_web$11.getNextElement)(_tmpl$14), _el$22 = _el$21.firstChild, _el$23 = _el$22.nextSibling;
			(0, import_web$10.insert)(_el$22, (0, import_web$5.createComponent)(GeminiIcon, {}));
			(0, import_web$10.insert)(_el$23, label);
			return _el$21;
		})(),
		duration: 6e5,
		class: "gemini-toast"
	});
};
let geminiButton = null;
let rateLimitInterval = null;
function ensureRateLimitTicker() {
	if (rateLimitInterval) return;
	rateLimitInterval = setInterval(() => {
		const store$1 = shelter?.plugin?.store;
		if (!store$1) return;
		const until = store$1.geminiRateLimitUntil || 0;
		if (until && until > Date.now()) store$1.geminiRateLimitTick = (store$1.geminiRateLimitTick || 0) + 1;
	}, 1e3);
}
function getRateLimitRemainingSec() {
	const store$1 = shelter?.plugin?.store;
	void store$1?.geminiRateLimitTick;
	const until = store$1?.geminiRateLimitUntil || 0;
	const remainingMs = Math.max(0, until - Date.now());
	return remainingMs ? Math.ceil(remainingMs / 1e3) : 0;
}
const openSummarizeModal = () => {
	openModal((props) => {
		let count = 100;
		const dailyUsage = getDailyUsage();
		const channelId = getChannelId();
		const history = getSummaryHistory(channelId);
		const openHistoryEntry = (entry) => {
			openModal((p) => (0, import_web$5.createComponent)(ModalRoot, (0, import_web$4.mergeProps)(p, {
				get size() {
					return ModalSizes.LARGE;
				},
				get children() {
					return [
						(0, import_web$5.createComponent)(ModalHeader, {
							get close() {
								return p.close;
							},
							get children() {
								return t("gemini.modal.summary.title", { count: entry.count });
							}
						}),
						(0, import_web$5.createComponent)(ModalBody, { get children() {
							const _el$24 = (0, import_web$11.getNextElement)(_tmpl$15);
							(0, import_web$10.insert)(_el$24, () => renderMarkdown(entry.summary));
							return _el$24;
						} }),
						(0, import_web$5.createComponent)(ModalFooter, { get children() {
							return (0, import_web$5.createComponent)(Button, {
								get color() {
									return ButtonColors.BRAND;
								},
								grow: true,
								onClick: async () => {
									const ok = await copyToClipboard(entry.summary);
									showToast({
										title: "Gemini",
										content: ok ? t("gemini.toast.copied") : t("gemini.toast.copyFailed"),
										duration: 2e3
									});
								},
								get children() {
									return t("gemini.modal.button.copy");
								}
							});
						} })
					];
				}
			})));
		};
		return (0, import_web$5.createComponent)(ModalRoot, (0, import_web$4.mergeProps)(props, {
			get size() {
				return ModalSizes.MEDIUM;
			},
			get children() {
				return [
					(0, import_web$5.createComponent)(ModalHeader, {
						get close() {
							return props.close;
						},
						get children() {
							return t("gemini.modal.lastX.title");
						}
					}),
					(0, import_web$5.createComponent)(ModalBody, { get children() {
						return [
							(() => {
								const _el$25 = (0, import_web$11.getNextElement)(_tmpl$16), _el$26 = _el$25.firstChild, _el$27 = _el$26.nextSibling, [_el$28, _co$2] = (0, import_web$9.getNextMarker)(_el$27.nextSibling);
								(0, import_web$10.insert)(_el$26, () => t("gemini.modal.lastX.label"));
								(0, import_web$10.insert)(_el$25, (0, import_web$5.createComponent)(TextBox, {
									type: "number",
									value: count,
									onInput: (v) => count = parseInt(v)
								}), _el$28, _co$2);
								return _el$25;
							})(),
							(() => {
								const _el$29 = (0, import_web$11.getNextElement)(_tmpl$17), _el$31 = _el$29.firstChild, [_el$32, _co$3] = (0, import_web$9.getNextMarker)(_el$31.nextSibling), _el$30 = _el$32.nextSibling;
								(0, import_web$10.insert)(_el$29, () => t("gemini.dailyUsage.text", {
									used: dailyUsage.used,
									limit: dailyUsage.limit,
									remaining: dailyUsage.remaining
								}), _el$32, _co$3);
								(0, import_web$10.insert)(_el$30, () => {
									const resetTime = getTimeUntilReset();
									return t("gemini.resetIn", {
										hours: resetTime.hours,
										minutes: resetTime.minutes
									});
								});
								return _el$29;
							})(),
							(0, import_web$3.memo)(() => (0, import_web$3.memo)(() => getRateLimitRemainingSec() > 0)() ? (() => {
								const _el$33 = (0, import_web$11.getNextElement)(_tmpl$18);
								(0, import_web$10.insert)(_el$33, () => t("gemini.rateLimit.text", { sec: getRateLimitRemainingSec() }));
								return _el$33;
							})() : null),
							(0, import_web$3.memo)(() => (0, import_web$3.memo)(() => history.length > 0)() && (() => {
								const _el$34 = (0, import_web$11.getNextElement)(_tmpl$19), _el$35 = _el$34.firstChild, _el$36 = _el$35.nextSibling;
								(0, import_web$10.insert)(_el$35, () => t("gemini.history.title"));
								(0, import_web$10.insert)(_el$36, () => history.map((entry, idx) => (() => {
									const _el$37 = (0, import_web$11.getNextElement)(_tmpl$20);
									_el$37.$$click = () => openHistoryEntry(entry);
									(0, import_web$6.setAttribute)(_el$37, "key", idx);
									(0, import_web$10.insert)(_el$37, () => t("gemini.history.entry", {
										count: entry.count,
										date: formatDate(entry.date)
									}));
									(0, import_web$2.runHydrationEvents)();
									return _el$37;
								})()));
								return _el$34;
							})())
						];
					} }),
					(0, import_web$5.createComponent)(ModalFooter, { get children() {
						return (0, import_web$5.createComponent)(Button, {
							get disabled() {
								return getRateLimitRemainingSec() > 0;
							},
							grow: true,
							onClick: async () => {
								const rl = getRateLimitRemainingSec();
								if (rl > 0) {
									showToast({
										title: "Gemini",
										content: t("gemini.rateLimit.text", { sec: rl }),
										duration: 3e3
									});
									return;
								}
								props.close();
								const closeToast = showLoadingToast(t("gemini.toast.generating"));
								try {
									const summary = await summarizeLastX(count);
									closeToast();
									if (typeof summary === "string" && summary.startsWith("Erreur")) {
										showToast({
											title: "Gemini",
											content: summary,
											duration: 5e3
										});
										return;
									}
									addToSummaryHistory(channelId, count, summary);
									openModal((p) => (0, import_web$5.createComponent)(ModalRoot, (0, import_web$4.mergeProps)(p, {
										get size() {
											return ModalSizes.LARGE;
										},
										get children() {
											return [
												(0, import_web$5.createComponent)(ModalHeader, {
													get close() {
														return p.close;
													},
													get children() {
														return t("gemini.modal.summary.title", { count });
													}
												}),
												(0, import_web$5.createComponent)(ModalBody, { get children() {
													const _el$38 = (0, import_web$11.getNextElement)(_tmpl$15);
													(0, import_web$10.insert)(_el$38, () => renderMarkdown(summary));
													return _el$38;
												} }),
												(0, import_web$5.createComponent)(ModalFooter, { get children() {
													return (0, import_web$5.createComponent)(Button, {
														get color() {
															return ButtonColors.BRAND;
														},
														grow: true,
														onClick: async () => {
															const ok = await copyToClipboard(summary);
															showToast({
																title: "Gemini",
																content: ok ? t("gemini.toast.copied") : t("gemini.toast.copyFailed"),
																duration: 2e3
															});
														},
														get children() {
															return t("gemini.modal.button.copy");
														}
													});
												} })
											];
										}
									})));
								} catch (e) {
									closeToast();
									showToast({
										title: "Gemini",
										content: e?.message || t("gemini.toast.error"),
										duration: 5e3
									});
								}
							},
							get children() {
								return (0, import_web$3.memo)(() => dailyUsage.remaining === 0)() ? t("gemini.modal.button.summarizeNoQuota") : t("gemini.modal.button.summarize");
							}
						});
					} })
				];
			}
		}));
	});
};
let unobserve = null;
function onLoad() {
	const store$1 = shelter.plugin.store;
	if (!store$1.geminiRateLimitTick) store$1.geminiRateLimitTick = 0;
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
	unobserve = observeDom("[class*=\"channelTextArea\"] [class*=\"buttons\"]", (node) => {
		if (document.getElementById("gemini-button")) return;
		const lastButton = node.querySelector("[class*=\"buttonContainer\"]:last-of-type");
		if (!lastButton) return;
		const buttonClass = lastButton.className;
		geminiButton = (() => {
			const _el$39 = (0, import_web$11.getNextElement)(_tmpl$21), _el$40 = _el$39.firstChild;
			_el$39.className = buttonClass;
			_el$40.$$click = openSummarizeModal;
			_el$40.style.setProperty("cursor", "pointer");
			_el$40.style.setProperty("display", "flex");
			_el$40.style.setProperty("alignItems", "center");
			_el$40.style.setProperty("justifyContent", "center");
			(0, import_web$10.insert)(_el$40, (0, import_web$5.createComponent)(GeminiIcon, {}));
			(0, import_web$2.runHydrationEvents)();
			return _el$39;
		})();
		const hiddenAnchor = node.querySelector("[class*=\"hiddenAppLauncherAnchor\"]");
		if (hiddenAnchor) node.insertBefore(geminiButton, hiddenAnchor);
else node.appendChild(geminiButton);
	});
}
function onUnload() {
	unobserve();
	document.getElementById("gemini-button")?.remove();
	if (rateLimitInterval) {
		clearInterval(rateLimitInterval);
		rateLimitInterval = null;
	}
}
(0, import_web$1.delegateEvents)(["click"]);

//#endregion
exports.onLoad = onLoad
exports.onUnload = onUnload
exports.settings = Settings_default
return exports;
})({});