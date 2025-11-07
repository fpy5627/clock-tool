/**
 * Logger utility for development and production
 * In development: logs are printed to console
 * In production: logs are removed at build time
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logger object with different log levels
 * Usage: logger.log('message'), logger.error('error'), etc.
 */
export const logger = {
  /**
   * General log (console.log)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info log (console.info)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Warning log (console.warn)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Error log (console.error)
   * Note: Errors are always logged, even in production
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Debug log (console.debug)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Group logs (console.group)
   */
  group: (...args: any[]) => {
    if (isDevelopment) {
      console.group(...args);
    }
  },

  /**
   * Group end (console.groupEnd)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Table log (console.table)
   */
  table: (...args: any[]) => {
    if (isDevelopment) {
      console.table(...args);
    }
  },
};

/**
 * Client-side logger (for use in browser)
 * Checks both NODE_ENV and window object
 */
export const clientLogger = {
  log: (...args: any[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (typeof window !== 'undefined') {
      console.error(...args);
    }
  },

  debug: (...args: any[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.debug(...args);
    }
  },

  group: (...args: any[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.group(...args);
    }
  },

  groupEnd: () => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.groupEnd();
    }
  },

  table: (...args: any[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.table(...args);
    }
  },
};

