// Internationalization for Gemini plugin

const translations = {
    "en-US": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "Unread Summary",
        "gemini.button.lastX": "Last X Messages Summary",
        "gemini.button.autoReply": "Auto Reply",

        // Modals
        "gemini.modal.unread.title": "Unread Summary",
        "gemini.modal.lastX.title": "Last Messages Summary",
        "gemini.modal.lastX.label": "Number of messages",
        "gemini.modal.summary.title": "Summary ({count} msgs)",
        "gemini.modal.button.copy": "Copy",
        "gemini.modal.button.summarize": "Summarize",
        "gemini.modal.button.summarizeNoQuota": "Try to Summarize (No Quota Left)",

        // Toast & Messages
        "gemini.toast.generating": "Generating summary...",
        "gemini.toast.generatingReply": "Generating reply...",
        "gemini.toast.copied": "Summary copied",
        "gemini.toast.copyFailed": "Unable to copy",
        "gemini.toast.error": "Error during generation",
        "gemini.toast.noMessage": "No message found to reply to.",
        "gemini.toast.noReply": "Unable to generate a reply.",

        // Rate Limiting
        "gemini.rateLimit.text": "Rate limit: retry in {sec}s",
        "gemini.dailyLimit.reached": "Daily limit reached: {used}/{limit} requests used today",
        "gemini.dailyUsage.text": "Requests today: {used}/{limit} ({remaining} remaining)",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "Reset in {hours}h {minutes}min",

        // Errors
        "gemini.error.noApiKey": "GEMINI_API_KEY not set in settings",
        "gemini.error.generic": "Gemini API error",
        "gemini.response.empty": "[Empty response]",

        // History
        "gemini.history.title": "Recent summaries",
        "gemini.history.empty": "No history yet",
        "gemini.history.entry": "{count} msgs - {date}",

        // Summary messages
        "gemini.summary.noMessages": "No messages to summarize.",
        "gemini.summary.noFilteredMessages": "[No relevant messages after filtering]",
        "gemini.summary.generationError": "Error generating summary: {error}",
        "gemini.summary.noUnreadFound": "No unread messages found.",
        "gemini.summary.noChannelSelected": "No channel selected.",
        "gemini.summary.noMessagesInChannel": "No messages found in this channel.",
        "gemini.summary.attachments": "{count} attachment(s)",

        // Settings
        "gemini.settings.apiKey": "Gemini API Key",
        "gemini.settings.apiKeyPlaceholder": "Your Gemini API key",
        "gemini.settings.model": "Gemini Model",
        "gemini.settings.language": "Language",
        "gemini.settings.show": "Show",
        "gemini.settings.hide": "Hide",
        "gemini.settings.dailyLimit": "Daily Request Limit",
        "gemini.settings.dailyLimitHelp": "Requests per day (20 default, -1 unlimited). Resets at midnight Pacific Time.",
    },

    "fr": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "Résumé non-lus",
        "gemini.button.lastX": "Résumé X derniers messages",
        "gemini.button.autoReply": "Réponse automatique",

        // Modals
        "gemini.modal.unread.title": "Résumé des non-lus",
        "gemini.modal.lastX.title": "Résumé des derniers messages",
        "gemini.modal.lastX.label": "Nombre de messages",
        "gemini.modal.summary.title": "Résumé ({count} msgs)",
        "gemini.modal.button.copy": "Copier",
        "gemini.modal.button.summarize": "Résumer",
        "gemini.modal.button.summarizeNoQuota": "Essayer de résumer (Quota épuisé)",

        // Toast & Messages
        "gemini.toast.generating": "Génération du résumé...",
        "gemini.toast.generatingReply": "Génération de la réponse...",
        "gemini.toast.copied": "Résumé copié",
        "gemini.toast.copyFailed": "Impossible de copier",
        "gemini.toast.error": "Erreur lors de la génération",
        "gemini.toast.noMessage": "Aucun message trouvé pour répondre.",
        "gemini.toast.noReply": "Impossible de générer une réponse.",

        // Rate Limiting
        "gemini.rateLimit.text": "Rate limit: réessaye dans {sec}s",
        "gemini.dailyLimit.reached": "Limite quotidienne atteinte: {used}/{limit} requêtes utilisées aujourd'hui",
        "gemini.dailyUsage.text": "Requêtes aujourd'hui: {used}/{limit} ({remaining} restantes)",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "Reset prévu dans {hours}h {minutes}min",

        // Errors
        "gemini.error.noApiKey": "GEMINI_API_KEY non définie dans les paramètres",
        "gemini.error.generic": "Erreur API Gemini",
        "gemini.response.empty": "[Réponse vide]",

        // History
        "gemini.history.title": "Résumés récents",
        "gemini.history.empty": "Aucun historique",
        "gemini.history.entry": "{count} msgs - {date}",

        // Summary messages
        "gemini.summary.noMessages": "Aucun message à résumer.",
        "gemini.summary.noFilteredMessages": "[Aucun message pertinent après filtrage]",
        "gemini.summary.generationError": "Erreur lors de la génération du résumé: {error}",
        "gemini.summary.noUnreadFound": "Aucun message non lu trouvé.",
        "gemini.summary.noChannelSelected": "Aucun canal sélectionné.",
        "gemini.summary.noMessagesInChannel": "Aucun message trouvé dans ce canal.",
        "gemini.summary.attachments": "{count} pièce(s) jointe(s)",

        // Settings
        "gemini.settings.apiKey": "Clé API Gemini",
        "gemini.settings.apiKeyPlaceholder": "Votre clé API Gemini",
        "gemini.settings.model": "Modèle Gemini",
        "gemini.settings.language": "Langue",
        "gemini.settings.show": "Afficher",
        "gemini.settings.hide": "Masquer",
        "gemini.settings.dailyLimit": "Limite quotidienne de requêtes",
        "gemini.settings.dailyLimitHelp": "Requêtes par jour (20 par défaut, -1 illimité). Réinitialisation à minuit heure du Pacifique.",
    },

    "de": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "Ungelesene Zusammenfassung",
        "gemini.button.lastX": "Letzte X Nachrichten",
        "gemini.button.autoReply": "Automatische Antwort",

        // Modals
        "gemini.modal.unread.title": "Ungelesene Zusammenfassung",
        "gemini.modal.lastX.title": "Letzte Nachrichten Zusammenfassung",
        "gemini.modal.lastX.label": "Anzahl der Nachrichten",
        "gemini.modal.summary.title": "Zusammenfassung ({count} Msgs)",
        "gemini.modal.button.copy": "Kopieren",
        "gemini.modal.button.summarize": "Zusammenfassen",
        "gemini.modal.button.summarizeNoQuota": "Zusammenfassen versuchen (Kein Kontingent)",

        // Toast & Messages
        "gemini.toast.generating": "Zusammenfassung wird erstellt...",
        "gemini.toast.generatingReply": "Antwort wird erstellt...",
        "gemini.toast.copied": "Zusammenfassung kopiert",
        "gemini.toast.copyFailed": "Kopieren fehlgeschlagen",
        "gemini.toast.error": "Fehler bei der Generierung",
        "gemini.toast.noMessage": "Keine Nachricht zum Antworten gefunden.",
        "gemini.toast.noReply": "Antwort konnte nicht erstellt werden.",

        // Rate Limiting
        "gemini.rateLimit.text": "Rate Limit: erneut versuchen in {sec}s",
        "gemini.dailyLimit.reached": "Tageslimit erreicht: {used}/{limit} Anfragen heute verwendet",
        "gemini.dailyUsage.text": "Anfragen heute: {used}/{limit} ({remaining} verbleibend)",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "Zurücksetzung in {hours}h {minutes}min",

        // Errors
        "gemini.error.noApiKey": "GEMINI_API_KEY nicht in den Einstellungen gesetzt",
        "gemini.error.generic": "Gemini API Fehler",
        "gemini.response.empty": "[Leere Antwort]",

        // History
        "gemini.history.title": "Letzte Zusammenfassungen",
        "gemini.history.empty": "Noch kein Verlauf",
        "gemini.history.entry": "{count} Msgs - {date}",

        // Summary messages
        "gemini.summary.noMessages": "Keine Nachrichten zum Zusammenfassen.",
        "gemini.summary.noFilteredMessages": "[Keine relevanten Nachrichten nach Filterung]",
        "gemini.summary.generationError": "Fehler beim Generieren der Zusammenfassung: {error}",
        "gemini.summary.noUnreadFound": "Keine ungelesenen Nachrichten gefunden.",
        "gemini.summary.noChannelSelected": "Kein Kanal ausgewählt.",
        "gemini.summary.noMessagesInChannel": "Keine Nachrichten in diesem Kanal gefunden.",
        "gemini.summary.attachments": "{count} Anhang/Anhänge",

        // Settings
        "gemini.settings.apiKey": "Gemini API-Schlüssel",
        "gemini.settings.apiKeyPlaceholder": "Ihr Gemini API-Schlüssel",
        "gemini.settings.model": "Gemini-Modell",
        "gemini.settings.language": "Sprache",
        "gemini.settings.show": "Anzeigen",
        "gemini.settings.hide": "Verbergen",
        "gemini.settings.dailyLimit": "Tägliches Anfragelimit",
        "gemini.settings.dailyLimitHelp": "Anfragen pro Tag (Standard 20, -1 unbegrenzt). Zurücksetzung um Mitternacht Pacific Time.",
    },

    "es-ES": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "Resumen no leídos",
        "gemini.button.lastX": "Últimos X mensajes",
        "gemini.button.autoReply": "Respuesta automática",

        // Modals
        "gemini.modal.unread.title": "Resumen de no leídos",
        "gemini.modal.lastX.title": "Resumen de últimos mensajes",
        "gemini.modal.lastX.label": "Número de mensajes",
        "gemini.modal.summary.title": "Resumen ({count} msgs)",
        "gemini.modal.button.copy": "Copiar",
        "gemini.modal.button.summarize": "Resumir",
        "gemini.modal.button.summarizeNoQuota": "Intentar resumir (Sin cuota)",

        // Toast & Messages
        "gemini.toast.generating": "Generando resumen...",
        "gemini.toast.generatingReply": "Generando respuesta...",
        "gemini.toast.copied": "Resumen copiado",
        "gemini.toast.copyFailed": "No se pudo copiar",
        "gemini.toast.error": "Error al generar",
        "gemini.toast.noMessage": "No se encontró mensaje para responder.",
        "gemini.toast.noReply": "No se pudo generar una respuesta.",

        // Rate Limiting
        "gemini.rateLimit.text": "Límite de tasa: reintente en {sec}s",
        "gemini.dailyLimit.reached": "Límite diario alcanzado: {used}/{limit} solicitudes usadas hoy",
        "gemini.dailyUsage.text": "Solicitudes hoy: {used}/{limit} ({remaining} restantes)",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "Reinicio en {hours}h {minutes}min",

        // Errors
        "gemini.error.noApiKey": "GEMINI_API_KEY no establecida en configuración",
        "gemini.error.generic": "Error API Gemini",
        "gemini.response.empty": "[Respuesta vacía]",

        // History
        "gemini.history.title": "Resúmenes recientes",
        "gemini.history.empty": "Sin historial",
        "gemini.history.entry": "{count} msgs - {date}",

        // Summary messages
        "gemini.summary.noMessages": "No hay mensajes para resumir.",
        "gemini.summary.noFilteredMessages": "[No hay mensajes relevantes después del filtrado]",
        "gemini.summary.generationError": "Error al generar resumen: {error}",
        "gemini.summary.noUnreadFound": "No se encontraron mensajes no leídos.",
        "gemini.summary.noChannelSelected": "No se seleccionó ningún canal.",
        "gemini.summary.noMessagesInChannel": "No se encontraron mensajes en este canal.",
        "gemini.summary.attachments": "{count} adjunto(s)",

        // Settings
        "gemini.settings.apiKey": "Clave API Gemini",
        "gemini.settings.apiKeyPlaceholder": "Tu clave API Gemini",
        "gemini.settings.model": "Modelo Gemini",
        "gemini.settings.language": "Idioma",
        "gemini.settings.show": "Mostrar",
        "gemini.settings.hide": "Ocultar",
        "gemini.settings.dailyLimit": "Límite diario de solicitudes",
        "gemini.settings.dailyLimitHelp": "Solicitudes por día (20 predeterminado, -1 ilimitado). Se reinicia a medianoche hora del Pacífico.",
    },

    "pt-BR": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "Resumo não lidos",
        "gemini.button.lastX": "Últimas X mensagens",
        "gemini.button.autoReply": "Resposta automática",

        // Modals
        "gemini.modal.unread.title": "Resumo de não lidos",
        "gemini.modal.lastX.title": "Resumo das últimas mensagens",
        "gemini.modal.lastX.label": "Número de mensagens",
        "gemini.modal.summary.title": "Resumo ({count} msgs)",
        "gemini.modal.button.copy": "Copiar",
        "gemini.modal.button.summarize": "Resumir",
        "gemini.modal.button.summarizeNoQuota": "Tentar resumir (Sem cota)",

        // Toast & Messages
        "gemini.toast.generating": "Gerando resumo...",
        "gemini.toast.generatingReply": "Gerando resposta...",
        "gemini.toast.copied": "Resumo copiado",
        "gemini.toast.copyFailed": "Não foi possível copiar",
        "gemini.toast.error": "Erro ao gerar",
        "gemini.toast.noMessage": "Nenhuma mensagem encontrada para responder.",
        "gemini.toast.noReply": "Não foi possível gerar uma resposta.",

        // Rate Limiting
        "gemini.rateLimit.text": "Limite de taxa: tente novamente em {sec}s",
        "gemini.dailyLimit.reached": "Limite diário atingido: {used}/{limit} solicitações usadas hoje",
        "gemini.dailyUsage.text": "Solicitações hoje: {used}/{limit} ({remaining} restantes)",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "Reinicialização em {hours}h {minutes}min",

        // Errors
        "gemini.error.noApiKey": "GEMINI_API_KEY não definida nas configurações",
        "gemini.error.generic": "Erro API Gemini",
        "gemini.response.empty": "[Resposta vazia]",

        // History
        "gemini.history.title": "Resumos recentes",
        "gemini.history.empty": "Sem histórico",
        "gemini.history.entry": "{count} msgs - {date}",

        // Summary messages
        "gemini.summary.noMessages": "Nenhuma mensagem para resumir.",
        "gemini.summary.noFilteredMessages": "[Nenhuma mensagem relevante após filtragem]",
        "gemini.summary.generationError": "Erro ao gerar resumo: {error}",
        "gemini.summary.noUnreadFound": "Nenhuma mensagem não lida encontrada.",
        "gemini.summary.noChannelSelected": "Nenhum canal selecionado.",
        "gemini.summary.noMessagesInChannel": "Nenhuma mensagem encontrada neste canal.",
        "gemini.summary.attachments": "{count} anexo(s)",

        // Settings
        "gemini.settings.apiKey": "Chave API Gemini",
        "gemini.settings.apiKeyPlaceholder": "Sua chave API Gemini",
        "gemini.settings.model": "Modelo Gemini",
        "gemini.settings.language": "Idioma",
        "gemini.settings.show": "Mostrar",
        "gemini.settings.hide": "Ocultar",
        "gemini.settings.dailyLimit": "Limite diário de solicitações",
        "gemini.settings.dailyLimitHelp": "Solicitações por dia (20 padrão, -1 ilimitado). Reinicia à meia-noite horário do Pacífico.",
    },

    "ja": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "未読の要約",
        "gemini.button.lastX": "最後のXメッセージ",
        "gemini.button.autoReply": "自動返信",

        // Modals
        "gemini.modal.unread.title": "未読の要約",
        "gemini.modal.lastX.title": "最後のメッセージの要約",
        "gemini.modal.lastX.label": "メッセージ数",
        "gemini.modal.summary.title": "要約 ({count} msgs)",
        "gemini.modal.button.copy": "コピー",
        "gemini.modal.button.summarize": "要約",
        "gemini.modal.button.summarizeNoQuota": "要約を試す (制限なし)",

        // Toast & Messages
        "gemini.toast.generating": "要約を生成中...",
        "gemini.toast.generatingReply": "返信を生成中...",
        "gemini.toast.copied": "要約をコピーしました",
        "gemini.toast.copyFailed": "コピーできませんでした",
        "gemini.toast.error": "生成中にエラーが発生しました",
        "gemini.toast.noMessage": "返信するメッセージが見つかりません。",
        "gemini.toast.noReply": "返信を生成できませんでした。",

        // Rate Limiting
        "gemini.rateLimit.text": "レート制限: {sec}秒後に再試行",
        "gemini.dailyLimit.reached": "1日の制限に達しました: 今日使用した{used}/{limit}リクエスト",
        "gemini.dailyUsage.text": "今日のリクエスト: {used}/{limit} (残り{remaining})",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "リセットまで{hours}時間{minutes}分",

        // Errors
        "gemini.error.noApiKey": "設定でGEMINI_API_KEYが設定されていません",
        "gemini.error.generic": "Gemini APIエラー",
        "gemini.response.empty": "[空の応答]",

        // History
        "gemini.history.title": "最近の要約",
        "gemini.history.empty": "履歴なし",
        "gemini.history.entry": "{count}件 - {date}",

        // Summary messages
        "gemini.summary.noMessages": "要約するメッセージがありません。",
        "gemini.summary.noFilteredMessages": "[フィルタリング後の関連メッセージなし]",
        "gemini.summary.generationError": "要約生成エラー: {error}",
        "gemini.summary.noUnreadFound": "未読メッセージが見つかりません。",
        "gemini.summary.noChannelSelected": "チャンネルが選択されていません。",
        "gemini.summary.noMessagesInChannel": "このチャンネルにメッセージが見つかりません。",
        "gemini.summary.attachments": "{count}個の添付ファイル",

        // Settings
        "gemini.settings.apiKey": "Gemini APIキー",
        "gemini.settings.apiKeyPlaceholder": "Gemini APIキー",
        "gemini.settings.model": "Geminiモデル",
        "gemini.settings.language": "言語",
        "gemini.settings.show": "表示",
        "gemini.settings.hide": "非表示",
        "gemini.settings.dailyLimit": "日次リクエスト制限",
        "gemini.settings.dailyLimitHelp": "日次リクエスト数（デフォルト20、-1で無制限）。太平洋時間の真夜中にリセット。",
    },

    "it": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "Riepilogo non letti",
        "gemini.button.lastX": "Ultimi X messaggi",
        "gemini.button.autoReply": "Risposta automatica",

        // Modals
        "gemini.modal.unread.title": "Riepilogo non letti",
        "gemini.modal.lastX.title": "Riepilogo ultimi messaggi",
        "gemini.modal.lastX.label": "Numero di messaggi",
        "gemini.modal.summary.title": "Riepilogo ({count} msgs)",
        "gemini.modal.button.copy": "Copia",
        "gemini.modal.button.summarize": "Riassumi",
        "gemini.modal.button.summarizeNoQuota": "Prova a riassumere (Nessuna quota)",

        // Toast & Messages
        "gemini.toast.generating": "Generazione riepilogo...",
        "gemini.toast.generatingReply": "Generazione risposta...",
        "gemini.toast.copied": "Riepilogo copiato",
        "gemini.toast.copyFailed": "Impossibile copiare",
        "gemini.toast.error": "Errore durante la generazione",
        "gemini.toast.noMessage": "Nessun messaggio trovato per rispondere.",
        "gemini.toast.noReply": "Impossibile generare una risposta.",

        // Rate Limiting
        "gemini.rateLimit.text": "Limite di velocità: riprova tra {sec}s",
        "gemini.dailyLimit.reached": "Limite giornaliero raggiunto: {used}/{limit} richieste usate oggi",
        "gemini.dailyUsage.text": "Richieste oggi: {used}/{limit} ({remaining} rimanenti)",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "Reset tra {hours}h {minutes}min",

        // Errors
        "gemini.error.noApiKey": "GEMINI_API_KEY non impostata nelle impostazioni",
        "gemini.error.generic": "Errore API Gemini",
        "gemini.response.empty": "[Risposta vuota]",

        // History
        "gemini.history.title": "Riepiloghi recenti",
        "gemini.history.empty": "Nessuna cronologia",
        "gemini.history.entry": "{count} msgs - {date}",

        // Summary messages
        "gemini.summary.noMessages": "Nessun messaggio da riassumere.",
        "gemini.summary.noFilteredMessages": "[Nessun messaggio rilevante dopo il filtraggio]",
        "gemini.summary.generationError": "Errore nella generazione del riepilogo: {error}",
        "gemini.summary.noUnreadFound": "Nessun messaggio non letto trovato.",
        "gemini.summary.noChannelSelected": "Nessun canale selezionato.",
        "gemini.summary.noMessagesInChannel": "Nessun messaggio trovato in questo canale.",
        "gemini.summary.attachments": "{count} allegato/i",

        // Settings
        "gemini.settings.apiKey": "Chiave API Gemini",
        "gemini.settings.apiKeyPlaceholder": "La tua chiave API Gemini",
        "gemini.settings.model": "Modello Gemini",
        "gemini.settings.language": "Lingua",
        "gemini.settings.show": "Mostra",
        "gemini.settings.hide": "Nascondi",
        "gemini.settings.dailyLimit": "Limite giornaliero di richieste",
        "gemini.settings.dailyLimitHelp": "Richieste al giorno (20 predefinito, -1 illimitato). Si azzera a mezzanotte ora del Pacifico.",
    },

    "ru": {
        // Menu & Headers
        "gemini.menu.title": "Gemini AI",
        "gemini.button.unread": "Сводка непрочитанных",
        "gemini.button.lastX": "Последние X сообщений",
        "gemini.button.autoReply": "Автоответ",

        // Modals
        "gemini.modal.unread.title": "Сводка непрочитанных",
        "gemini.modal.lastX.title": "Сводка последних сообщений",
        "gemini.modal.lastX.label": "Количество сообщений",
        "gemini.modal.summary.title": "Сводка ({count} сообщ.)",
        "gemini.modal.button.copy": "Копировать",
        "gemini.modal.button.summarize": "Создать сводку",
        "gemini.modal.button.summarizeNoQuota": "Попробовать создать сводку (Нет квоты)",

        // Toast & Messages
        "gemini.toast.generating": "Создание сводки...",
        "gemini.toast.generatingReply": "Создание ответа...",
        "gemini.toast.copied": "Сводка скопирована",
        "gemini.toast.copyFailed": "Не удалось скопировать",
        "gemini.toast.error": "Ошибка при создании",
        "gemini.toast.noMessage": "Сообщение для ответа не найдено.",
        "gemini.toast.noReply": "Не удалось создать ответ.",

        // Rate Limiting
        "gemini.rateLimit.text": "Ограничение скорости: повторите через {sec}с",
        "gemini.dailyLimit.reached": "Дневной лимит достигнут: {used}/{limit} запросов использовано сегодня",
        "gemini.dailyUsage.text": "Запросов сегодня: {used}/{limit} (осталось {remaining})",
        "gemini.dailyUsage.short": "{used}/{limit}",
        "gemini.resetIn": "Сброс через {hours}ч {minutes}мин",

        // Errors
        "gemini.error.noApiKey": "GEMINI_API_KEY не установлен в настройках",
        "gemini.error.generic": "Ошибка API Gemini",
        "gemini.response.empty": "[Пустой ответ]",

        // History
        "gemini.history.title": "Недавние сводки",
        "gemini.history.empty": "История пуста",
        "gemini.history.entry": "{count} сообщ. - {date}",

        // Summary messages
        "gemini.summary.noMessages": "Нет сообщений для резюмирования.",
        "gemini.summary.noFilteredMessages": "[Нет релевантных сообщений после фильтрации]",
        "gemini.summary.generationError": "Ошибка при создании сводки: {error}",
        "gemini.summary.noUnreadFound": "Непрочитанные сообщения не найдены.",
        "gemini.summary.noChannelSelected": "Канал не выбран.",
        "gemini.summary.noMessagesInChannel": "Сообщения в этом канале не найдены.",
        "gemini.summary.attachments": "{count} вложение(я)",

        // Settings
        "gemini.settings.apiKey": "API-ключ Gemini",
        "gemini.settings.apiKeyPlaceholder": "Ваш API-ключ Gemini",
        "gemini.settings.model": "Модель Gemini",
        "gemini.settings.language": "Язык",
        "gemini.settings.show": "Показать",
        "gemini.settings.hide": "Скрыть",
        "gemini.settings.dailyLimit": "Ежедневный лимит запросов",
        "gemini.settings.dailyLimitHelp": "Запросов в день (20 по умолчанию, -1 без ограничений). Сброс в полночь тихоокеанского времени.",
    },
};

// Fallback to English
const fallbackLocale = "en-US";

// Get user's Discord locale
function getDiscordLocale() {
    try {
        // Try to get locale from Discord's UserSettingsStore
        const stores = shelter?.flux?.stores;
        if (stores?.UserSettingsStore) {
            // Try getLocale method first
            const locale = stores.UserSettingsStore.getLocale?.() || stores.UserSettingsStore.locale;
            if (locale && typeof locale === 'string') return locale;
        }

        // Fallback to navigator language (system language)
        const navLang = navigator.language || navigator.userLanguage;
        return navLang || fallbackLocale;
    } catch {
        return fallbackLocale;
    }
}

// Normalize locale (e.g., "en-GB" -> "en-US", "fr-FR" -> "fr")
function normalizeLocale(locale) {
    if (!locale) return fallbackLocale;

    // Direct match
    if (translations[locale]) return locale;

    // Try base language (e.g., "fr-FR" -> "fr")
    const baseLang = locale.split('-')[0];
    if (translations[baseLang]) return baseLang;

    // Try common variants
    const variants = {
        'en': 'en-US',
        'pt': 'pt-BR',
        'es': 'es-ES',
    };

    if (variants[baseLang]) return variants[baseLang];

    return fallbackLocale;
}

// Translation function
export function t(key, params = {}) {
    // Use stored language preference, fallback to Discord's locale
    const store = shelter?.plugin?.store;
    const storedLocale = store?.geminiLanguage;
    const currentLocale = storedLocale ? normalizeLocale(storedLocale) : normalizeLocale(getDiscordLocale());
    const localeData = translations[currentLocale] || translations[fallbackLocale];
    let text = localeData[key] || translations[fallbackLocale][key] || key;

    // Replace parameters like {sec}, {count}, etc.
    Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });

    return text;
}

// Get current locale
export function getLocale() {
    const store = shelter?.plugin?.store;
    const storedLocale = store?.geminiLanguage;
    return storedLocale ? normalizeLocale(storedLocale) : normalizeLocale(getDiscordLocale());
}

// Set locale and store preference
export function setLocale(locale) {
    const store = shelter?.plugin?.store;
    if (store) {
        store.geminiLanguage = locale;
    }
}

// Format a date for display (localized)
export function formatDate(date) {
    try {
        // Handle both Date objects and timestamps
        const d = typeof date === 'number' ? new Date(date) : new Date(date);
        
        // Check if date is valid
        if (isNaN(d.getTime())) {
            return String(date);
        }
        
        const locale = getLocale().replace('_', '-');
        return d.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        console.error('formatDate error:', e, date);
        return String(date);
    }
}

// Re-detect locale (call this if user changes Discord language)
export function refreshLocale() {
    currentLocale = normalizeLocale(getDiscordLocale());
    return currentLocale;
}
