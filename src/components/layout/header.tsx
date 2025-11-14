import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { ThemeSelector } from '../theme-selector';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { HEADER } from './constants';
import { cn } from '@/lib/utils';

export default function Header() {
  return (
    <header
      className={cn(
        HEADER.CLASSES.CONTAINER,
        HEADER.CLASSES.DEFAULT_HEIGHT,
        HEADER.CLASSES.COLLAPSED_TRIGGER
      )}
    >
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger sidebarId='app' className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <UserNav />
        <ModeToggle />
        <ThemeSelector />
        <Separator orientation='vertical' className='ml-2 h-4' />
        <SidebarTrigger sidebarId='chat' className='-mr-1 rotate-180' />
      </div>
    </header>
  );
}
