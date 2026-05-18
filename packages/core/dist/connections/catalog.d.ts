export type WorkspaceConnectionCapability = "search" | "import" | "messages" | "meetings" | "crm" | "code" | "docs";
export type WorkspaceConnectionTemplateUse = "analytics" | "brain" | "calendar" | "clips" | "content" | "design" | "dispatch" | "forms" | "mail" | "slides" | "videos";
export type WorkspaceConnectionProviderId = "slack" | "github" | "notion" | "gmail" | "google_drive" | "hubspot" | "granola" | "clips" | "generic";
export interface WorkspaceConnectionCredentialKey {
    key: string;
    label: string;
    description?: string;
    required?: boolean;
}
export interface WorkspaceConnectionProvider {
    id: WorkspaceConnectionProviderId;
    label: string;
    description: string;
    credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    capabilities: readonly WorkspaceConnectionCapability[];
    recommendedTemplateUses: readonly WorkspaceConnectionTemplateUse[];
}
export interface ListWorkspaceConnectionProvidersOptions {
    capability?: WorkspaceConnectionCapability;
    templateUse?: WorkspaceConnectionTemplateUse;
}
export declare function defineWorkspaceConnectionProvider<const T extends WorkspaceConnectionProvider>(provider: T): T;
export declare const WORKSPACE_CONNECTION_PROVIDERS: readonly [{
    readonly id: "slack";
    readonly label: "Slack";
    readonly description: "Workspace conversations and channel history for company memory, support workflows, and messaging automations.";
    readonly credentialKeys: readonly [{
        readonly key: "SLACK_BOT_TOKEN";
        readonly label: "Slack bot token";
        readonly description: "Bot token with the smallest channel and history scopes needed by the template.";
        readonly required: true;
    }];
    readonly capabilities: readonly ["search", "import", "messages"];
    readonly recommendedTemplateUses: readonly ["brain", "dispatch", "analytics"];
}, {
    readonly id: "github";
    readonly label: "GitHub";
    readonly description: "Repository, issue, pull request, and code context for product memory, engineering workflows, and analytics.";
    readonly credentialKeys: readonly [{
        readonly key: "GITHUB_TOKEN";
        readonly label: "GitHub token";
        readonly description: "Fine-grained token or app credential scoped to the repositories the workspace should access.";
        readonly required: true;
    }];
    readonly capabilities: readonly ["search", "import", "code", "docs"];
    readonly recommendedTemplateUses: readonly ["brain", "analytics", "dispatch"];
}, {
    readonly id: "notion";
    readonly label: "Notion";
    readonly description: "Workspace docs, wikis, pages, and databases for knowledge capture and search.";
    readonly credentialKeys: readonly [{
        readonly key: "NOTION_API_KEY";
        readonly label: "Notion API key";
        readonly description: "Integration secret with access to the pages or databases shared with the integration.";
        readonly required: true;
    }];
    readonly capabilities: readonly ["search", "import", "docs"];
    readonly recommendedTemplateUses: readonly ["brain", "content", "dispatch"];
}, {
    readonly id: "gmail";
    readonly label: "Gmail";
    readonly description: "Mailbox messages and threads for search, triage, customer context, and agent replies.";
    readonly credentialKeys: readonly [{
        readonly key: "GOOGLE_CLIENT_ID";
        readonly label: "Google OAuth client ID";
        readonly required: true;
    }, {
        readonly key: "GOOGLE_CLIENT_SECRET";
        readonly label: "Google OAuth client secret";
        readonly required: true;
    }];
    readonly capabilities: readonly ["search", "import", "messages"];
    readonly recommendedTemplateUses: readonly ["mail", "brain", "dispatch"];
}, {
    readonly id: "google_drive";
    readonly label: "Google Drive";
    readonly description: "Drive files, Docs, Sheets, and Slides for document search and import workflows.";
    readonly credentialKeys: readonly [{
        readonly key: "GOOGLE_CLIENT_ID";
        readonly label: "Google OAuth client ID";
        readonly required: true;
    }, {
        readonly key: "GOOGLE_CLIENT_SECRET";
        readonly label: "Google OAuth client secret";
        readonly required: true;
    }];
    readonly capabilities: readonly ["search", "import", "docs"];
    readonly recommendedTemplateUses: readonly ["brain", "content", "slides", "dispatch"];
}, {
    readonly id: "hubspot";
    readonly label: "HubSpot";
    readonly description: "CRM records, companies, contacts, deals, and engagement history for customer-aware apps.";
    readonly credentialKeys: readonly [{
        readonly key: "HUBSPOT_PRIVATE_APP_TOKEN";
        readonly label: "HubSpot private app token";
        readonly description: "Private app token scoped to the CRM objects the workspace needs.";
        readonly required: true;
    }];
    readonly capabilities: readonly ["search", "import", "crm"];
    readonly recommendedTemplateUses: readonly ["analytics", "brain", "mail", "dispatch"];
}, {
    readonly id: "granola";
    readonly label: "Granola";
    readonly description: "Meeting notes and transcripts for company memory and follow-up workflows.";
    readonly credentialKeys: readonly [{
        readonly key: "GRANOLA_API_KEY";
        readonly label: "Granola API key";
        readonly description: "API key for accessible team notes; templates should respect Granola's workspace visibility.";
        readonly required: true;
    }];
    readonly capabilities: readonly ["search", "import", "meetings", "docs"];
    readonly recommendedTemplateUses: readonly ["brain", "calendar", "dispatch"];
}, {
    readonly id: "clips";
    readonly label: "Clips";
    readonly description: "Agent-native Clips exports and recordings for transcript import and searchable meeting context.";
    readonly credentialKeys: readonly [];
    readonly capabilities: readonly ["search", "import", "meetings"];
    readonly recommendedTemplateUses: readonly ["brain", "clips", "videos"];
}, {
    readonly id: "generic";
    readonly label: "Generic";
    readonly description: "Custom webhooks, CSV exports, transcript drops, and one-off sources that do not need a first-class provider yet.";
    readonly credentialKeys: readonly [];
    readonly capabilities: readonly ["search", "import", "docs"];
    readonly recommendedTemplateUses: readonly ["brain", "analytics", "content", "dispatch", "forms"];
}];
export declare function listWorkspaceConnectionProviders(options?: ListWorkspaceConnectionProvidersOptions): WorkspaceConnectionProvider[];
export declare function getWorkspaceConnectionProvider(id: string): WorkspaceConnectionProvider | undefined;
export declare function isWorkspaceConnectionProviderId(id: string): id is WorkspaceConnectionProviderId;
export declare function listWorkspaceConnectionProvidersForTemplate(templateUse: WorkspaceConnectionTemplateUse): WorkspaceConnectionProvider[];
export declare function listWorkspaceConnectionProvidersForCapability(capability: WorkspaceConnectionCapability): WorkspaceConnectionProvider[];
export declare function workspaceConnectionProviderSupports(providerOrId: WorkspaceConnectionProvider | string, capability: WorkspaceConnectionCapability): boolean;
//# sourceMappingURL=catalog.d.ts.map