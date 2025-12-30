const {
    plugin: { store },
    ui: { TextBox, Text, Button, Modal, ModalHeader, ModalContent, ModalFooter, ButtonColors, ButtonSizes },
    solid: { createSignal },
} = shelter;

import { t, getLocale, setLocale } from '../lib/i18n.js';

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-exp-1206',
];

const AVAILABLE_LANGUAGES = [
    { code: 'en-US', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es-ES', name: 'Español' },
    { code: 'pt-BR', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'it', name: 'Italiano' },
    { code: 'ru', name: 'Русский' },
];

// Simple eye icons as SVG
const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
);

// Function to show summary in a modal
function showSummaryModal(summary) {
    shelter.ui.showModal(() => (
        <Modal>
            <ModalHeader>Résumé</ModalHeader>
            <ModalContent>
                <Text>{summary}</Text>
            </ModalContent>
            <ModalFooter>
                <Button onClick={() => shelter.ui.closeModal()}>Fermer</Button>
            </ModalFooter>
        </Modal>
    ));
}

export default () => {
    const [showPassword, setShowPassword] = createSignal(false);

    // Ensure default model is set
    if (!store.geminiModel) {
        store.geminiModel = "gemini-2.5-flash";
    }

    // Ensure default language is set to Discord's locale or fallback
    if (!store.geminiLanguage) {
        store.geminiLanguage = getLocale();
    }

    return (
        <>
            <div class="gemini-settings-section">
                <Text class="gemini-settings-label">{t("gemini.settings.apiKey")}</Text>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                        <TextBox
                            type={showPassword() ? "text" : "password"}
                            placeholder={t("gemini.settings.apiKeyPlaceholder")}
                            value={store.geminiKey || ""}
                            onInput={(value) => {
                                store.geminiKey = value;
                            }}
                        />
                    </div>
                    <Button
                        size={ButtonSizes.MEDIUM}
                        color={ButtonColors.SECONDARY}
                        onClick={() => setShowPassword(!showPassword())}
                        style={{ minWidth: "80px" }}
                    >
                        {showPassword() ? <EyeSlashIcon /> : <EyeIcon />}
                    </Button>
                </div>
            </div>

            <div class="gemini-settings-section">
                <Text class="gemini-settings-label">{t("gemini.settings.model")}</Text>
                <select
                    class="gemini-model-select"
                    value={store.geminiModel || "gemini-2.5-flash"}
                    onChange={(e) => {
                        store.geminiModel = e.target.value;
                    }}
                >
                    {GEMINI_MODELS.map((model) => (
                        <option key={model} value={model}>
                            {model}
                        </option>
                    ))}
                </select>
            </div>

            <div class="gemini-settings-section">
                <Text class="gemini-settings-label">{t("gemini.settings.language")}</Text>
                <select
                    class="gemini-model-select"
                    value={store.geminiLanguage || getLocale()}
                    onChange={(e) => {
                        store.geminiLanguage = e.target.value;
                        setLocale(e.target.value);
                    }}
                >
                    {AVAILABLE_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>

            <div class="gemini-settings-section">
                <Text class="gemini-settings-label">{t("gemini.settings.dailyLimit")}</Text>
                <TextBox
                    type="number"
                    placeholder="20"
                    value={store.geminiDailyLimit ?? 20}
                    onInput={(value) => {
                        const num = parseInt(value);
                        store.geminiDailyLimit = isNaN(num) ? 20 : num;
                    }}
                />
                <Text style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {t("gemini.settings.dailyLimitHelp")}
                </Text>
            </div>
            <div style={{ height: "20px" }}></div>
        </>
    );
};