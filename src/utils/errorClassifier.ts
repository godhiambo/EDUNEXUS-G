export const CLASSIFIED_ERRORS = {
  GEMINI_UNAVAILABLE: "⚠️ EduNexus AI is temporarily busy. Please try again in a moment.",
  ROLE_NOT_SELECTED: "👋 Please choose your role first: 1️⃣ Student, 2️⃣ Teacher, 3️⃣ Parent.",
  SESSION_EXPIRED: "🔄 Your previous session has expired. Let's continue by selecting your role again.",
  INTERNAL_ERROR: "⚠️ We encountered an unexpected problem while processing your request. Please try again shortly."
} as const;

export type ErrorType = keyof typeof CLASSIFIED_ERRORS;

export function classifyError(error: any): string {
  if (!error) return CLASSIFIED_ERRORS.INTERNAL_ERROR;
  const msg = typeof error === 'string' ? error : (error.message || String(error));
  const lower = msg.toLowerCase();

  if (
    lower.includes('role not selected') ||
    lower.includes('choose your role') ||
    lower.includes('role required') ||
    lower.includes('role_not_selected') ||
    lower.includes('select a role') ||
    lower.includes('select your role')
  ) {
    return CLASSIFIED_ERRORS.ROLE_NOT_SELECTED;
  }

  if (
    lower.includes('session expired') ||
    lower.includes('previous session has expired') ||
    lower.includes('session_expired') ||
    lower.includes('session timeout') ||
    lower.includes('token expired')
  ) {
    return CLASSIFIED_ERRORS.SESSION_EXPIRED;
  }

  if (
    lower.includes('gemini') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('busy') ||
    lower.includes('temporarily busy') ||
    lower.includes('unavailable') ||
    lower.includes('resource_exhausted') ||
    lower.includes('api_key') ||
    lower.includes('api key') ||
    lower.includes('connection surge') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('overloaded') ||
    lower.includes('service_unavailable')
  ) {
    return CLASSIFIED_ERRORS.GEMINI_UNAVAILABLE;
  }

  return CLASSIFIED_ERRORS.INTERNAL_ERROR;
}
