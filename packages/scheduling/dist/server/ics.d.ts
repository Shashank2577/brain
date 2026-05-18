/**
 * Minimal iCalendar (RFC 5545) generator for booking confirmation emails and
 * the `/booking/:uid.ics` download endpoint.
 *
 * Not exhaustive — just enough for Apple Mail / Outlook / Gmail to render
 * the event card correctly and for Add-to-Calendar buttons to work.
 */
import type { Booking } from "../shared/index.js";
export declare function buildIcs(booking: Booking, organizerName: string): string;
export declare function addToGoogleCalendarUrl(booking: Booking): string;
export declare function addToOutlookWebUrl(booking: Booking): string;
//# sourceMappingURL=ics.d.ts.map