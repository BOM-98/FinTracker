import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import ChatSidebar from '@/components/layout/chat-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { requireAuthRedirect } from '@/lib/auth/server-auth';
import {
  DASHBOARD_LAYOUT,
  type SidebarStates
} from '@/components/layout/constants';

export const metadata: Metadata = {
  title: 'FinTracker',
  description: 'Financial Tracking Dashboard'
};

async function getSidebarStates(): Promise<SidebarStates> {
  const cookieStore = await cookies();
  const sidebarStatesValue = cookieStore.get(
    DASHBOARD_LAYOUT.COOKIE_NAME
  )?.value;

  if (sidebarStatesValue) {
    try {
      return JSON.parse(sidebarStatesValue);
    } catch {
      // If JSON parse fails, fall back to legacy format
      const legacyState =
        cookieStore.get(DASHBOARD_LAYOUT.LEGACY_COOKIE_NAME)?.value === 'true';
      return {
        app: { open: legacyState, openMobile: false }
      };
    }
  }

  // Check for legacy single-sidebar cookie
  const legacyValue = cookieStore.get(
    DASHBOARD_LAYOUT.LEGACY_COOKIE_NAME
  )?.value;
  if (legacyValue !== undefined) {
    return {
      app: { open: legacyValue === 'true', openMobile: false }
    };
  }

  return DASHBOARD_LAYOUT.DEFAULT_STATES;
}

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Protect all dashboard routes - redirect to /login if not authenticated
  await requireAuthRedirect();

  // Load multi-sidebar states from cookies
  const sidebarStates = await getSidebarStates();

  return (
    <KBar>
      <SidebarProvider defaultStates={sidebarStates}>
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
          <Header />
          {/* page main content - scrollable container */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          {/* page main content ends */}
        </SidebarInset>
        <ChatSidebar />
      </SidebarProvider>
    </KBar>
  );
}
