/**
 * Application-wide constants
 */

export const APP_NAME = "Calendly Scheduler";
export const APP_DESCRIPTION = "A modern scheduling application";

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  BOOKINGS: "/bookings",
  SETTINGS: "/settings",
} as const;

export const TIME_FORMATS = {
  "12h": "12-hour",
  "24h": "24-hour",
} as const;

export const DATE_FORMATS = {
  "MM/DD/YYYY": "MM/DD/YYYY",
  "DD/MM/YYYY": "DD/MM/YYYY",
  "YYYY-MM-DD": "YYYY-MM-DD",
} as const;
