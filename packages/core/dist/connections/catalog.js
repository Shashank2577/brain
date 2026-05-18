export function defineWorkspaceConnectionProvider(provider) {
    return provider;
}
export const WORKSPACE_CONNECTION_PROVIDERS = [
    defineWorkspaceConnectionProvider({
        id: "slack",
        label: "Slack",
        description: "Workspace conversations and channel history for company memory, support workflows, and messaging automations.",
        credentialKeys: [
            {
                key: "SLACK_BOT_TOKEN",
                label: "Slack bot token",
                description: "Bot token with the smallest channel and history scopes needed by the template.",
                required: true,
            },
        ],
        capabilities: ["search", "import", "messages"],
        recommendedTemplateUses: ["brain", "dispatch", "analytics"],
    }),
    defineWorkspaceConnectionProvider({
        id: "github",
        label: "GitHub",
        description: "Repository, issue, pull request, and code context for product memory, engineering workflows, and analytics.",
        credentialKeys: [
            {
                key: "GITHUB_TOKEN",
                label: "GitHub token",
                description: "Fine-grained token or app credential scoped to the repositories the workspace should access.",
                required: true,
            },
        ],
        capabilities: ["search", "import", "code", "docs"],
        recommendedTemplateUses: ["brain", "analytics", "dispatch"],
    }),
    defineWorkspaceConnectionProvider({
        id: "notion",
        label: "Notion",
        description: "Workspace docs, wikis, pages, and databases for knowledge capture and search.",
        credentialKeys: [
            {
                key: "NOTION_API_KEY",
                label: "Notion API key",
                description: "Integration secret with access to the pages or databases shared with the integration.",
                required: true,
            },
        ],
        capabilities: ["search", "import", "docs"],
        recommendedTemplateUses: ["brain", "content", "dispatch"],
    }),
    defineWorkspaceConnectionProvider({
        id: "gmail",
        label: "Gmail",
        description: "Mailbox messages and threads for search, triage, customer context, and agent replies.",
        credentialKeys: [
            {
                key: "GOOGLE_CLIENT_ID",
                label: "Google OAuth client ID",
                required: true,
            },
            {
                key: "GOOGLE_CLIENT_SECRET",
                label: "Google OAuth client secret",
                required: true,
            },
        ],
        capabilities: ["search", "import", "messages"],
        recommendedTemplateUses: ["mail", "brain", "dispatch"],
    }),
    defineWorkspaceConnectionProvider({
        id: "google_drive",
        label: "Google Drive",
        description: "Drive files, Docs, Sheets, and Slides for document search and import workflows.",
        credentialKeys: [
            {
                key: "GOOGLE_CLIENT_ID",
                label: "Google OAuth client ID",
                required: true,
            },
            {
                key: "GOOGLE_CLIENT_SECRET",
                label: "Google OAuth client secret",
                required: true,
            },
        ],
        capabilities: ["search", "import", "docs"],
        recommendedTemplateUses: ["brain", "content", "slides", "dispatch"],
    }),
    defineWorkspaceConnectionProvider({
        id: "hubspot",
        label: "HubSpot",
        description: "CRM records, companies, contacts, deals, and engagement history for customer-aware apps.",
        credentialKeys: [
            {
                key: "HUBSPOT_PRIVATE_APP_TOKEN",
                label: "HubSpot private app token",
                description: "Private app token scoped to the CRM objects the workspace needs.",
                required: true,
            },
        ],
        capabilities: ["search", "import", "crm"],
        recommendedTemplateUses: ["analytics", "brain", "mail", "dispatch"],
    }),
    defineWorkspaceConnectionProvider({
        id: "granola",
        label: "Granola",
        description: "Meeting notes and transcripts for company memory and follow-up workflows.",
        credentialKeys: [
            {
                key: "GRANOLA_API_KEY",
                label: "Granola API key",
                description: "API key for accessible team notes; templates should respect Granola's workspace visibility.",
                required: true,
            },
        ],
        capabilities: ["search", "import", "meetings", "docs"],
        recommendedTemplateUses: ["brain", "calendar", "dispatch"],
    }),
    defineWorkspaceConnectionProvider({
        id: "clips",
        label: "Clips",
        description: "Agent-native Clips exports and recordings for transcript import and searchable meeting context.",
        credentialKeys: [],
        capabilities: ["search", "import", "meetings"],
        recommendedTemplateUses: ["brain", "clips", "videos"],
    }),
    defineWorkspaceConnectionProvider({
        id: "generic",
        label: "Generic",
        description: "Custom webhooks, CSV exports, transcript drops, and one-off sources that do not need a first-class provider yet.",
        credentialKeys: [],
        capabilities: ["search", "import", "docs"],
        recommendedTemplateUses: [
            "brain",
            "analytics",
            "content",
            "dispatch",
            "forms",
        ],
    }),
];
const PROVIDERS_BY_ID = new Map(WORKSPACE_CONNECTION_PROVIDERS.map((provider) => [provider.id, provider]));
export function listWorkspaceConnectionProviders(options = {}) {
    return WORKSPACE_CONNECTION_PROVIDERS.filter((provider) => {
        if (options.capability &&
            !includesWorkspaceConnectionCapability(provider.capabilities, options.capability)) {
            return false;
        }
        if (options.templateUse &&
            !includesWorkspaceConnectionTemplateUse(provider.recommendedTemplateUses, options.templateUse)) {
            return false;
        }
        return true;
    }).map((provider) => ({ ...provider }));
}
export function getWorkspaceConnectionProvider(id) {
    const provider = PROVIDERS_BY_ID.get(id);
    return provider ? { ...provider } : undefined;
}
export function isWorkspaceConnectionProviderId(id) {
    return PROVIDERS_BY_ID.has(id);
}
export function listWorkspaceConnectionProvidersForTemplate(templateUse) {
    return listWorkspaceConnectionProviders({ templateUse });
}
export function listWorkspaceConnectionProvidersForCapability(capability) {
    return listWorkspaceConnectionProviders({ capability });
}
export function workspaceConnectionProviderSupports(providerOrId, capability) {
    const provider = typeof providerOrId === "string"
        ? getWorkspaceConnectionProvider(providerOrId)
        : providerOrId;
    return provider?.capabilities.includes(capability) ?? false;
}
function includesWorkspaceConnectionCapability(capabilities, capability) {
    return capabilities.includes(capability);
}
function includesWorkspaceConnectionTemplateUse(templateUses, templateUse) {
    return templateUses.includes(templateUse);
}
//# sourceMappingURL=catalog.js.map