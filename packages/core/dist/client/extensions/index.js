export { ExtensionsSidebarSection } from "./ExtensionsSidebarSection.js";
export { ExtensionViewer, } from "./ExtensionViewer.js";
export { ExtensionEditor, } from "./ExtensionEditor.js";
export { ExtensionsListPage } from "./ExtensionsListPage.js";
export { ExtensionViewerPage } from "./ExtensionViewerPage.js";
export { EmbeddedExtension, } from "./EmbeddedExtension.js";
export { ExtensionSlot } from "./ExtensionSlot.js";
export { AgentNativeExtensionFrame, AgentNativeExtensionSlot, } from "./AgentNativeExtensionFrame.js";
export { AGENT_NATIVE_EXTENSION_MESSAGE_TYPES, buildAgentNativeExtensionHtml, createHttpAgentNativeExtensionStorage, createLocalStorageAgentNativeExtensionStorage, getAgentNativeExtensionManifest, isAgentNativeExtensionAllowedInSlot, normalizeAgentNativeExtensionSandbox, } from "./portable-extension.js";
// ─────────────────────────────────────────────────────────────────────────────
// Legacy aliases — these names predate the Tools → Extensions rename. Keep
// exporting them so deployed templates that haven't been updated still
// resolve. Use the canonical `Extension*` names in new code.
// ─────────────────────────────────────────────────────────────────────────────
export { ExtensionsSidebarSection as ToolsSidebarSection } from "./ExtensionsSidebarSection.js";
export { ExtensionViewer as ToolViewer, } from "./ExtensionViewer.js";
export { ExtensionEditor as ToolEditor, } from "./ExtensionEditor.js";
export { ExtensionsListPage as ToolsListPage } from "./ExtensionsListPage.js";
export { ExtensionViewerPage as ToolViewerPage } from "./ExtensionViewerPage.js";
export { EmbeddedExtension as EmbeddedTool, } from "./EmbeddedExtension.js";
//# sourceMappingURL=index.js.map