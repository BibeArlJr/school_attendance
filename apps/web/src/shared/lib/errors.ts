import axios from 'axios';

/**
 * Pulls the backend's actual error message out of an Axios error, e.g. a
 * blocked-delete's specific reason (ApiResponse::error()'s top-level
 * `message`) — falls back to a generic string only when the response
 * genuinely has nothing usable.
 *
 * One deliberate exception: a request that went out but got no response
 * at all (`error.request` set, `error.response` undefined) is shown a
 * more specific hint than the fully generic fallback. This covers a CORS
 * rejection, the backend being down, or a wrong port — but the browser
 * genuinely does not expose *which* of those it was to JavaScript (a
 * security boundary, not something this app can see past), so the
 * message names the possibilities rather than falsely claiming to know
 * which one occurred.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;

    if (error.request && !error.response) {
      return "Could not reach the server. Check that the backend is running and that you're using the correct URL/port.";
    }
  }
  return 'Something went wrong. Please try again.';
}
