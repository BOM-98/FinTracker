# Sidebar and Layout Implementation Plan

## Overview

This document outlines the plan to improve the sidebar and main layout styling in our app based on the qrious app implementation. The qrious app uses shadcn/ui's Sidebar component with excellent spacing, animations, and collapsible behavior.

## Current State Analysis

### What We Have
- **Layout Structure**: Dashboard layout with `SidebarProvider`, `AppSidebar`, and `SidebarInset`
- **Components**:
  - `src/app/dashboard/layout.tsx` - Dashboard layout wrapper
  - `src/components/layout/app-sidebar.tsx` - Main sidebar component
  - `src/components/layout/header.tsx` - Header with sidebar trigger
  - `src/components/ui/sidebar.tsx` - shadcn Sidebar component
- **Current Issues**:
  - Need to verify spacing consistency
  - May need to adjust transitions and animations
  - Need to ensure collapsible behavior matches qrious quality

### What Qrious Has (Target State)
- Smooth 200ms transitions with `ease-linear` easing
- Icon-only collapsed state (48px width vs 256px expanded)
- Consistent spacing patterns using 8px (p-2) and 4px (gap-1) units
- Height transitions in header (64px → 48px when sidebar collapsed)
- Cookie persistence for sidebar state (7 days)
- Keyboard shortcut (Cmd+B / Ctrl+B)
- Proper mobile behavior with Sheet drawer at <768px
- CSS custom properties for theming and dynamic sizing

## Key Learnings from Qrious

### 1. Width Management
```typescript
// CSS Variables (in sidebar component)
--sidebar-width: 16rem;        /* 256px - expanded */
--sidebar-width-icon: 3rem;    /* 48px - collapsed to icons */
--sidebar-width-mobile: 18rem; /* 288px - mobile sheet */
```

**Application**:
- Verify our sidebar uses these exact widths
- Ensure smooth transitions between states

### 2. Collapsible Behavior
```typescript
// Sidebar prop
<Sidebar collapsible='icon'>
```

**Key CSS Classes When Collapsed**:
- Labels: `group-data-[collapsible=icon]:opacity-0`
- Submenus: `group-data-[collapsible=icon]:hidden`
- Badges: `group-data-[collapsible=icon]:hidden`
- Buttons: `group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!`
- Tooltips: Only shown when `state === 'collapsed'`

**Application**:
- Verify our sidebar has `collapsible='icon'` prop
- Check all menu items hide labels/badges when collapsed
- Ensure tooltips show on hover in collapsed state

### 3. Layout Structure
```typescript
// Dashboard Layout Pattern
<SidebarProvider defaultOpen={defaultOpen}>
  <AppSidebar />
  <SidebarInset className="flex flex-col overflow-hidden">
    <Header />
    <div className="flex-1 overflow-y-auto">
      {children}
    </div>
  </SidebarInset>
</SidebarProvider>
```

**Application**:
- ✅ We already have this structure in `src/app/dashboard/layout.tsx`
- Verify overflow handling is correct

### 4. Spacing Patterns

**Sidebar Internal Spacing**:
- Header/Footer: `flex flex-col gap-2 p-2` (8px padding, 8px gap)
- Groups: `p-2` (8px padding)
- Menu items: `gap-1` (4px gap between items)
- Menu buttons: `p-2` (8px padding)
- Group labels: `h-8 px-2` (32px height, 8px horizontal padding)

**Page Content Spacing**:
- Mobile: `p-4` (16px padding)
- Desktop: `px-6` (24px horizontal padding)

**Application**:
- Audit our sidebar spacing to match these patterns
- Update `page-container.tsx` if needed

### 5. Transitions and Animations

**Key Animations**:
```typescript
// Width/position transitions
'transition-[left,right,width] duration-200 ease-linear'
'transition-[width,height] duration-200 ease-linear'

// Chevron rotation (collapsible items)
'transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90'

// Header height adjustment
'transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
```

**Application**:
- Verify all transitions use `duration-200 ease-linear`
- Check header height transitions (h-16 → h-12 when collapsed)

### 6. Header Behavior
```typescript
<header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
```

**Key Points**:
- Height: `h-16` (64px) normally, `h-12` (48px) when sidebar collapsed
- Uses `shrink-0` to prevent header from shrinking
- Smooth height transition with `transition-[width,height]`

**Application**:
- Check our header has height transitions
- Verify it responds to sidebar state changes

### 7. Mobile Behavior

**Breakpoint**: 768px (Tailwind `md:`)

**Desktop (≥768px)**:
- Fixed sidebar on left
- Icon-only collapse mode available
- Smooth width transitions

**Mobile (<768px)**:
- Sidebar hidden by default: `hidden md:block`
- Sheet drawer overlay when opened
- Wider drawer: 288px vs 256px desktop
- Full overlay with backdrop

**Application**:
- Verify mobile breakpoint handling
- Test sheet drawer behavior on mobile

### 8. State Persistence

**Cookie Management**:
```typescript
const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;  // 7 days

// In dashboard layout
const cookieStore = await cookies();
const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
```

**Application**:
- ✅ We already have cookie persistence
- Verify it's working correctly

### 9. Keyboard Shortcuts

**Toggle Sidebar**: Cmd+B (Mac) / Ctrl+B (Windows/Linux)

```typescript
React.useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'b' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      toggleSidebar();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [toggleSidebar]);
```

**Application**:
- Check if keyboard shortcut is implemented
- Add if missing (should be in sidebar.tsx provider)

### 10. Color System (Optional Enhancement)

**CSS Variables for Sidebar**:
```css
--sidebar: oklch(0.985 0 0);                    /* Background */
--sidebar-foreground: oklch(0.145 0 0);         /* Text */
--sidebar-primary: oklch(0.205 0 0);            /* Primary color */
--sidebar-primary-foreground: oklch(0.985 0 0); /* Primary text */
--sidebar-accent: oklch(0.97 0 0);              /* Accent background */
--sidebar-accent-foreground: oklch(0.205 0 0);  /* Accent text */
--sidebar-border: oklch(0.922 0 0);             /* Borders */
--sidebar-ring: oklch(0.708 0 0);               /* Focus rings */
```

**Application**:
- Review our sidebar color variables
- Consider if we want to use OKLCh color space (more consistent across themes)

## Implementation Plan

### Phase 1: Audit Current Implementation (1-2 hours)

**Tasks**:
1. ✅ Compare our `src/app/dashboard/layout.tsx` with qrious pattern
2. ✅ Compare our `src/components/layout/app-sidebar.tsx` with qrious
3. ✅ Compare our `src/components/ui/sidebar.tsx` with qrious version
4. Check sidebar prop: `collapsible='icon'` is set
5. Check header height transitions
6. Verify keyboard shortcut (Cmd+B) works
7. Test mobile behavior (sheet drawer at <768px)
8. Test cookie persistence across page reloads

**Acceptance Criteria**:
- Document all differences between our implementation and qrious
- Create list of specific styling adjustments needed

### Phase 2: Spacing Adjustments (1 hour)

**Tasks**:
1. Update sidebar header/footer spacing to `gap-2 p-2`
2. Update sidebar groups to use `p-2`
3. Update menu item gaps to `gap-1`
4. Update menu button padding to `p-2`
5. Update group label styling to `h-8 px-2`
6. Review page container spacing (`p-4 md:px-6`)

**Files to Update**:
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/page-container.tsx` (if needed)
- Any custom menu components

**Acceptance Criteria**:
- Sidebar spacing matches qrious patterns exactly
- Visual consistency across all sidebar sections
- Content area has appropriate padding

### Phase 3: Transitions and Animations (1 hour)

**Tasks**:
1. Verify all width transitions use `duration-200 ease-linear`
2. Add header height transition (h-16 → h-12 when collapsed)
3. Check chevron rotation animations on collapsible items
4. Verify smooth sidebar expand/collapse
5. Test all transitions feel natural (not too fast/slow)

**Files to Update**:
- `src/components/layout/header.tsx`
- `src/components/ui/sidebar.tsx` (if needed)
- Any custom collapsible components

**Acceptance Criteria**:
- All transitions use consistent 200ms timing
- Header height adjusts smoothly with sidebar state
- No janky or abrupt animations

### Phase 4: Collapsible Behavior (1-2 hours)

**Tasks**:
1. Verify `collapsible='icon'` prop on Sidebar component
2. Check labels hide/fade in collapsed state
3. Check submenus are hidden in collapsed state
4. Check badges are hidden in collapsed state
5. Verify button sizing in collapsed state (size-8, p-2)
6. Ensure tooltips show on hover when collapsed
7. Test nested collapsible menu items

**Files to Update**:
- `src/components/layout/app-sidebar.tsx`
- `src/components/ui/sidebar.tsx` (verify classes are present)

**Acceptance Criteria**:
- Sidebar collapses to clean icon-only view (48px width)
- All text labels disappear smoothly
- Tooltips appear on hover in collapsed state
- Icons remain visible and properly sized

### Phase 5: Mobile Behavior (1 hour)

**Tasks**:
1. Test sidebar on mobile (<768px)
2. Verify sheet drawer opens with proper width (288px)
3. Check backdrop overlay works correctly
4. Test swipe-to-close gesture (if supported)
5. Verify sidebar trigger button works on mobile
6. Test navigation and close behavior

**Files to Update**:
- Usually no changes needed if using shadcn sidebar correctly
- May need to adjust `src/components/layout/header.tsx` mobile trigger

**Acceptance Criteria**:
- Sidebar hidden by default on mobile
- Sheet drawer opens smoothly from left
- Backdrop overlay appears behind drawer
- Navigation items work correctly in drawer
- Drawer closes when clicking backdrop or navigation item

### Phase 6: Polish and Testing (1 hour)

**Tasks**:
1. Test keyboard shortcut (Cmd+B / Ctrl+B)
2. Test cookie persistence across browser sessions
3. Test in light and dark modes
4. Test with different sidebar states on page load
5. Test all navigation items (with and without submenus)
6. Check focus states and accessibility
7. Test on different screen sizes (mobile, tablet, desktop, ultrawide)

**Acceptance Criteria**:
- Keyboard shortcut toggles sidebar reliably
- Sidebar state persists after page refresh
- Works perfectly in both light and dark themes
- No visual bugs across screen sizes
- Meets accessibility standards (keyboard navigation, focus states)

### Phase 7: Optional Enhancements (2-3 hours)

**Tasks**:
1. Consider implementing OKLCh color system for better theme consistency
2. Add theme variants (scaled mode for compact layouts)
3. Add sidebar rail (resize handle) if desired
4. Implement custom animations (reveal, slide, etc.)
5. Add sidebar width preference (user-customizable)

**Note**: These are optional and can be deferred to future iterations.

## Success Criteria

### Visual Quality
- Sidebar spacing matches qrious quality
- Smooth, professional animations (200ms, ease-linear)
- Clean icon-only collapsed state
- Proper mobile drawer behavior
- Consistent styling across all states

### Functionality
- ✅ Sidebar toggles with button and keyboard shortcut
- ✅ State persists across page reloads (cookie)
- Icon-only collapse mode works perfectly
- Mobile sheet drawer works on small screens
- All navigation items work in both states

### Performance
- No layout shifts during transitions
- Smooth 60fps animations
- Fast state changes (<200ms)
- No janky behavior on mobile

### Accessibility
- Keyboard navigation works correctly
- Focus states are visible
- ARIA labels are appropriate
- Screen reader compatible

## Timeline

**Total Estimated Time**: 7-10 hours

- Phase 1 (Audit): 1-2 hours
- Phase 2 (Spacing): 1 hour
- Phase 3 (Transitions): 1 hour
- Phase 4 (Collapsible): 1-2 hours
- Phase 5 (Mobile): 1 hour
- Phase 6 (Testing): 1 hour
- Phase 7 (Optional): 2-3 hours

**Recommended Approach**:
- Complete Phases 1-4 first (core functionality and styling)
- Test thoroughly in Phase 6
- Consider Phase 7 enhancements in future iterations

## Files to Focus On

### Primary Files (Will Definitely Update)
1. `src/components/layout/app-sidebar.tsx` - Main sidebar component
2. `src/components/layout/header.tsx` - Header height transitions
3. `src/components/layout/page-container.tsx` - Content area spacing

### Secondary Files (May Update)
4. `src/components/ui/sidebar.tsx` - Core sidebar component (verify shadcn version is latest)
5. `src/app/globals.css` - CSS variables and global styles
6. `src/constants/data.ts` - Navigation configuration

### Verification Files (Check, Don't Change)
7. `src/app/dashboard/layout.tsx` - Layout structure (already correct)
8. `src/hooks/use-mobile.tsx` - Mobile detection hook
9. `src/components/layout/user-nav.tsx` - User menu in sidebar footer

## Testing Checklist

### Desktop (≥768px)
- [ ] Sidebar expands/collapses smoothly
- [ ] Icon-only collapsed state looks clean
- [ ] Header height adjusts (64px → 48px)
- [ ] Tooltips show on hover when collapsed
- [ ] Keyboard shortcut (Cmd+B / Ctrl+B) works
- [ ] State persists after page refresh
- [ ] Collapsible menu items work correctly
- [ ] Active state highlighting works
- [ ] Focus states are visible

### Mobile (<768px)
- [ ] Sidebar hidden by default
- [ ] Sheet drawer opens from left
- [ ] Drawer has proper width (288px)
- [ ] Backdrop overlay appears
- [ ] Navigation items work in drawer
- [ ] Drawer closes on backdrop click
- [ ] Drawer closes on navigation
- [ ] Trigger button visible in header

### Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Mac/iOS)

### Themes
- [ ] Light mode
- [ ] Dark mode
- [ ] System preference mode

## Reference Implementation

### Key Code Patterns from Qrious

**1. Dashboard Layout Structure**:
```typescript
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**2. Header with Height Transition**:
```typescript
<header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
  <div className='flex items-center gap-2 px-4'>
    <SidebarTrigger className='-ml-1' />
    <Separator orientation='vertical' className='mr-2 h-4' />
    <Breadcrumbs />
  </div>
  <div className='flex items-center gap-2 px-4'>
    {/* Right side content */}
  </div>
</header>
```

**3. Sidebar with Proper Spacing**:
```typescript
<Sidebar collapsible='icon'>
  <SidebarHeader className="gap-2 p-2">
    <OrgSwitcher />
  </SidebarHeader>

  <SidebarContent className='overflow-x-hidden'>
    <SidebarGroup className="p-2">
      <SidebarGroupLabel className="h-8 px-2">Overview</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {/* Menu items */}
      </SidebarMenu>
    </SidebarGroup>
  </SidebarContent>

  <SidebarFooter className="gap-2 p-2">
    {/* User menu */}
  </SidebarFooter>

  <SidebarRail />
</Sidebar>
```

**4. Menu Item with Tooltip (Collapsed State)**:
```typescript
<SidebarMenuItem key={item.title}>
  <SidebarMenuButton asChild tooltip={item.title}>
    <Link href={item.url}>
      <item.icon />
      <span>{item.title}</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

**5. Collapsible Menu Item**:
```typescript
<Collapsible className="group/collapsible">
  <SidebarMenuItem>
    <CollapsibleTrigger asChild>
      <SidebarMenuButton tooltip={item.title}>
        <item.icon />
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
      </SidebarMenuButton>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
        {item.items?.map((subItem) => (
          <SidebarMenuSubItem key={subItem.title}>
            <SidebarMenuSubButton asChild>
              <Link href={subItem.url}>{subItem.title}</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </CollapsibleContent>
  </SidebarMenuItem>
</Collapsible>
```

## Notes

- The qrious app is using shadcn/ui's Sidebar component which is a well-designed, accessible component
- Most of the styling is handled through data attributes (`data-state`, `data-collapsible`) which allows CSS-based state changes without re-renders
- Transitions are consistently 200ms with ease-linear timing for professional feel
- Mobile behavior uses Radix UI's Sheet component for drawer functionality
- Cookie persistence provides good UX by remembering user preference

## Next Steps

1. Review this plan with the team
2. Begin Phase 1 audit to identify specific changes needed
3. Proceed through phases systematically
4. Test thoroughly before considering complete
5. Consider Phase 7 enhancements for future iterations
