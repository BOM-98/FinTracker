/**
 * Centralized Layout Constants
 *
 * This file contains all layout-related configuration values for the application.
 * Using `as const` ensures type safety and prevents accidental modifications.
 *
 * Benefits:
 * - Single source of truth for all layout values
 * - Easy to modify behavior globally
 * - Type-safe with `as const`
 * - Clear documentation of all configurable values
 */

import { IconPhotoUp } from '@tabler/icons-react';

// ============================================================================
// SIDEBAR TYPES
// ============================================================================

export type SidebarState = {
  open: boolean;
  openMobile: boolean;
};

export type SidebarStates = Record<string, SidebarState>;

// ============================================================================
// APP SIDEBAR CONSTANTS
// ============================================================================

export const APP_SIDEBAR = {
  ID: 'app',
  VARIANT: 'inset',
  COLLAPSIBLE: 'icon',
  SIDE: 'left',
  WIDTH: {
    EXPANDED: '16rem', // 256px - for CSS variable
    COLLAPSED: '3rem', // 48px - for CSS variable
    MOBILE: '20rem', // 320px - for CSS variable
    DEFAULT: 256, // Default width in pixels for resizing
    MIN: 200, // Minimum width in pixels
    MAX: 400 // Maximum width in pixels
  },
  STORAGE_KEY: 'app-sidebar-width',
  KEYBOARD_SHORTCUT: 'b'
} as const;

// ============================================================================
// HEADER CONSTANTS
// ============================================================================

export const HEADER = {
  HEIGHT: {
    DEFAULT: 'h-16', // 64px normally
    COLLAPSED: 'h-12' // 48px when sidebar is collapsed
  },
  CLASSES: {
    CONTAINER:
      'flex shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear',
    DEFAULT_HEIGHT: 'h-16',
    COLLAPSED_TRIGGER: 'group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
  }
} as const;

// ============================================================================
// DASHBOARD LAYOUT CONSTANTS
// ============================================================================

export const DASHBOARD_LAYOUT = {
  COOKIE_NAME: 'sidebar_states', // Stores all sidebar states as JSON
  LEGACY_COOKIE_NAME: 'sidebar_state', // For migration from boolean format
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days in seconds
  DEFAULT_STATES: {
    app: { open: true, openMobile: false },
    chat: { open: false, openMobile: false }
  } as SidebarStates
} as const;

// ============================================================================
// PAGE CONTAINER CONSTANTS
// ============================================================================

export const PAGE_CONTAINER = {
  PADDING: {
    BASE: 'p-4',
    MD: 'md:px-6'
  }
} as const;

// ============================================================================
// CHAT SIDEBAR CONSTANTS
// ============================================================================

export const CHAT_SIDEBAR = {
  ID: 'chat',
  SIDE: 'right',
  VARIANT: 'floating',
  COLLAPSIBLE: 'offcanvas',
  WIDTH: {
    DEFAULT: 320,
    MIN: 280,
    MAX: 600
  },
  STORAGE_KEY: 'chat-sidebar-width',
  LABELS: {
    HEADER_TITLE: 'Chat',
    NEW_CHAT_ARIA: 'New Chat'
  }
} as const;

// ============================================================================
// COMPANY/BRAND CONSTANTS
// ============================================================================

export const COMPANY = {
  NAME: 'Acme Inc',
  LOGO: IconPhotoUp,
  PLAN: 'Enterprise'
} as const;

// ============================================================================
// TENANT CONSTANTS (For Multi-Tenancy)
// ============================================================================

export const TENANTS = [
  { id: '1', name: 'Acme Inc' },
  { id: '2', name: 'Beta Corp' },
  { id: '3', name: 'Gamma Ltd' }
] as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AppSidebarConfig = typeof APP_SIDEBAR;
export type ChatSidebarConfig = typeof CHAT_SIDEBAR;
export type HeaderConfig = typeof HEADER;
export type DashboardLayoutConfig = typeof DASHBOARD_LAYOUT;
export type CompanyConfig = typeof COMPANY;
export type Tenant = (typeof TENANTS)[number];
