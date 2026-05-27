export const SESSION_COOKIE = "maatiilink_session";

/** Absolute session lifetime (8 hours). */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 8;

/** Idle timeout — no activity revokes session (30 minutes). */
export const SESSION_IDLE_TIMEOUT_SEC = 60 * 30;

/** Failed login attempts before account lock. */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** Account lock duration after max failed attempts. */
export const ACCOUNT_LOCK_DURATION_MS = 30 * 60 * 1000;
