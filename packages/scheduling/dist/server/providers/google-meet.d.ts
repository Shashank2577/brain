/**
 * Google Meet — piggy-backs on Google Calendar credentials. The meeting link
 * is created as part of the calendar event (conferenceData). This provider
 * exists so we can list Google Meet as an installable conferencing option in
 * the UI; the actual meeting creation happens in `google-calendar.createEvent`
 * when `includeConference` is true.
 */
import type { VideoProvider } from "./types.js";
export declare const googleMeetProvider: VideoProvider;
//# sourceMappingURL=google-meet.d.ts.map