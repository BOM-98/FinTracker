'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
// import { SignOutButton } from '';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { logoutAction } from '@/app/(auth)/login/actions';
import { Button } from '../ui/button';
import { APP_SIDEBAR, COMPANY, TENANTS } from './constants';
import { cn } from '@/lib/utils';

// Re-export for backward compatibility
export const company = COMPANY;

// Selectors for dynamically updating width
const SELECTORS = {
  GAP: `[data-sidebar-id="${APP_SIDEBAR.ID}"] [data-slot="sidebar-gap"]`,
  CONTAINER: `[data-sidebar-id="${APP_SIDEBAR.ID}"] [data-slot="sidebar-container"]`
} as const;

// Custom hook for persisting sidebar width
const usePersistedWidth = (): [
  number,
  React.Dispatch<React.SetStateAction<number>>
] => {
  const [width, setWidth] = React.useState<number>(APP_SIDEBAR.WIDTH.DEFAULT);

  // Load persisted width on mount
  React.useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(APP_SIDEBAR.STORAGE_KEY);
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (
          !isNaN(parsedWidth) &&
          parsedWidth >= APP_SIDEBAR.WIDTH.MIN &&
          parsedWidth <= APP_SIDEBAR.WIDTH.MAX
        ) {
          setWidth(parsedWidth);
        }
      }
    } catch (error) {
      // Silently handle localStorage errors (e.g., private browsing)
    }
  }, []);

  // Persist width changes
  React.useEffect(() => {
    try {
      localStorage.setItem(APP_SIDEBAR.STORAGE_KEY, width.toString());
    } catch (error) {
      // Silently handle localStorage errors
    }
  }, [width]);

  return [width, setWidth];
};

// Custom hook for handling resize interactions
const useResizeHandler = (
  setWidth: React.Dispatch<React.SetStateAction<number>>
) => {
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate from left edge
      const newWidth = e.clientX;
      const clampedWidth = Math.min(
        Math.max(newWidth, APP_SIDEBAR.WIDTH.MIN),
        APP_SIDEBAR.WIDTH.MAX
      );
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection while resizing
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [isResizing, setWidth]);

  return { isResizing, handleMouseDown };
};

// Custom hook to sync sidebar width with DOM elements
const useSidebarWidthSync = (width: number, isExpanded: boolean, isResizing: boolean) => {
  React.useEffect(() => {
    const updateElementWidth = (element: Element | null, width: string, disableTransition: boolean) => {
      if (element instanceof HTMLElement) {
        element.style.width = width;
        element.style.setProperty('--sidebar-width', width);
        // Disable transition during resize for instant updates
        if (disableTransition) {
          element.style.transition = 'none';
        } else {
          element.style.removeProperty('transition');
        }
      }
    };

    const removeElementWidth = (element: Element | null) => {
      if (element instanceof HTMLElement) {
        element.style.removeProperty('width');
        element.style.removeProperty('--sidebar-width');
        element.style.removeProperty('transition');
      }
    };

    const gapElement = document.querySelector(SELECTORS.GAP);
    const containerElement = document.querySelector(SELECTORS.CONTAINER);

    if (isExpanded) {
      const widthValue = `${width}px`;
      updateElementWidth(gapElement, widthValue, isResizing);
      updateElementWidth(containerElement, widthValue, isResizing);
    } else {
      removeElementWidth(gapElement);
      removeElementWidth(containerElement);
    }
  }, [width, isExpanded, isResizing]);
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { state } = useSidebar();
  const isExpanded = state(APP_SIDEBAR.ID) === 'expanded';
  const [width, setWidth] = usePersistedWidth();
  const { isResizing, handleMouseDown } = useResizeHandler(setWidth);

  // const { user } = useUser();
  const router = useRouter();
  const handleSwitchTenant = (_tenantId: string) => {
    // Tenant switching functionality would be implemented here
  };

  const activeTenant = TENANTS[0];

  // Sync sidebar width with DOM elements
  useSidebarWidthSync(width, isExpanded, isResizing);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <>
      <Sidebar
        id={APP_SIDEBAR.ID}
        collapsible={APP_SIDEBAR.COLLAPSIBLE as 'icon'}
        variant={APP_SIDEBAR.VARIANT as 'inset'}
      >
      <SidebarHeader>
        <OrgSwitcher
          tenants={[...TENANTS]}
          defaultTenant={activeTenant}
          onTenantSwitch={handleSwitchTenant}
        />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {/* {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )} */}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {/* {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )} */}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/settings')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logoutAction();
                    router.push('/login');
                  }}
                >
                  <IconLogout className='mr-2 h-4 w-4' />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail sidebarId={APP_SIDEBAR.ID} />
    </Sidebar>

    {/* Resize handle - only shown when expanded */}
    {isExpanded && (
      <>
        {/* Resize handle */}
        <div
          className={cn(
            'fixed top-8 bottom-8 z-50 w-[1px] cursor-col-resize',
            'bg-border hover:bg-primary/30 transition-colors',
            "after:absolute after:inset-y-0 after:-right-2 after:-left-2 after:content-['']",
            isResizing && 'bg-primary/50'
          )}
          style={{ left: `${width}px` }}
          onMouseDown={handleMouseDown}
          role='separator'
          aria-label='Resize app sidebar'
          aria-valuenow={width}
          aria-valuemin={APP_SIDEBAR.WIDTH.MIN}
          aria-valuemax={APP_SIDEBAR.WIDTH.MAX}
        />
        {/* Visual feedback for resize area */}
        <div
          className={cn(
            'fixed top-0 bottom-0 z-40 w-4 cursor-col-resize',
            'hover:bg-primary/10'
          )}
          style={{ left: `${width - 2}px` }}
          onMouseDown={handleMouseDown}
          aria-hidden='true'
        />
      </>
    )}
  </>
  );
}
