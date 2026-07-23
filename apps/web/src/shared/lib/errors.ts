import axios from 'axios';

/**
 * Pulls the backend's actual error message out of an Axios error, e.g. a
 * blocked-delete's specific reason (ApiResponse::error()'s top-level
 * `message`) — falls back to a generic string only when the response
 * genuinely has nothing usable.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return 'Something went wrong. Please try again.';
}
