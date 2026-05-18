const calendarProviders = new Map();
const videoProviders = new Map();
const smsProviders = new Map();
export function registerCalendarProvider(p) {
    calendarProviders.set(p.kind, p);
}
export function registerVideoProvider(p) {
    videoProviders.set(p.kind, p);
}
export function registerSmsProvider(p) {
    smsProviders.set(p.kind, p);
}
export function getCalendarProvider(kind) {
    return calendarProviders.get(kind);
}
export function getVideoProvider(kind) {
    return videoProviders.get(kind);
}
export function getSmsProvider(kind) {
    return smsProviders.get(kind);
}
export function listCalendarProviders() {
    return Array.from(calendarProviders.values());
}
export function listVideoProviders() {
    return Array.from(videoProviders.values());
}
//# sourceMappingURL=registry.js.map