const BASE_COMPOSER_DRAFT_KEY = "an-composer-draft";
export function getComposerDraftKey(scope) {
    const trimmed = scope?.trim();
    if (!trimmed)
        return BASE_COMPOSER_DRAFT_KEY;
    return `${BASE_COMPOSER_DRAFT_KEY}:${encodeURIComponent(trimmed)}`;
}
//# sourceMappingURL=draft-key.js.map