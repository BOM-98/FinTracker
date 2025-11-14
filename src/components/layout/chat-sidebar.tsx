'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { CHAT_SIDEBAR } from './constants';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Selectors for dynamically updating width
const SELECTORS = {
  GAP: `[data-sidebar-id="${CHAT_SIDEBAR.ID}"] [data-slot="sidebar-gap"]`,
  CONTAINER: `[data-sidebar-id="${CHAT_SIDEBAR.ID}"] [data-slot="sidebar-container"]`
} as const;

interface ChatSidebarProps
  extends Omit<React.ComponentProps<typeof Sidebar>, 'id'> {}

// Custom hook for persisting sidebar width
const usePersistedWidth = (): [
  number,
  React.Dispatch<React.SetStateAction<number>>
] => {
  const [width, setWidth] = React.useState<number>(CHAT_SIDEBAR.WIDTH.DEFAULT);

  // Load persisted width on mount
  React.useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(CHAT_SIDEBAR.STORAGE_KEY);
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (
          !isNaN(parsedWidth) &&
          parsedWidth >= CHAT_SIDEBAR.WIDTH.MIN &&
          parsedWidth <= CHAT_SIDEBAR.WIDTH.MAX
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
      localStorage.setItem(CHAT_SIDEBAR.STORAGE_KEY, width.toString());
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
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(
        Math.max(newWidth, CHAT_SIDEBAR.WIDTH.MIN),
        CHAT_SIDEBAR.WIDTH.MAX
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

// Simple chat interface component
function ChatInterface() {
  const [messages, setMessages] = React.useState<
    Array<{ text: string; isUser: boolean }>
  >([
    { text: 'Hello! How can I help you today?', isUser: false }
  ]);
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { text: input, isUser: true }]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: 'This is a placeholder chat interface. AI integration coming soon!',
          isUser: false
        }
      ]);
    }, 1000);
  };

  return (
    <div className='flex h-full flex-col'>
      <ScrollArea className='flex-1 p-4'>
        <div className='space-y-4'>
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                message.isUser ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className='text-sm'>{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className='border-t p-4'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className='flex gap-2'
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Type a message...'
            className='flex-1'
          />
          <Button type='submit' size='icon'>
            <Send className='h-4 w-4' />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ChatSidebar({ ...props }: ChatSidebarProps) {
  const { state } = useSidebar();
  const isExpanded = state(CHAT_SIDEBAR.ID) === 'expanded';
  const [width, setWidth] = usePersistedWidth();
  const { isResizing, handleMouseDown } = useResizeHandler(setWidth);

  // Sync sidebar width with DOM elements
  useSidebarWidthSync(width, isExpanded, isResizing);

  return (
    <>
      <Sidebar
        id={CHAT_SIDEBAR.ID}
        side={CHAT_SIDEBAR.SIDE as 'right'}
        variant={CHAT_SIDEBAR.VARIANT as 'floating'}
        collapsible={CHAT_SIDEBAR.COLLAPSIBLE as 'offcanvas'}
        {...props}
        className='[&_[data-sidebar="sidebar"]]:bg-background'
      >
        <SidebarHeader className='border-b'>
          <div className='flex items-center gap-2 px-2 py-1'>
            <MessageSquare className='h-5 w-5' />
            <h2 className='text-lg font-semibold'>
              {CHAT_SIDEBAR.LABELS.HEADER_TITLE}
            </h2>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className='h-full p-0'>
            <SidebarGroupContent className='h-full'>
              <ChatInterface />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail sidebarId={CHAT_SIDEBAR.ID} />
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
            style={{ right: `${width}px` }}
            onMouseDown={handleMouseDown}
            role='separator'
            aria-label='Resize chat sidebar'
            aria-valuenow={width}
            aria-valuemin={CHAT_SIDEBAR.WIDTH.MIN}
            aria-valuemax={CHAT_SIDEBAR.WIDTH.MAX}
          />
          {/* Visual feedback for resize area */}
          <div
            className={cn(
              'fixed top-0 bottom-0 z-40 w-4 cursor-col-resize',
              'hover:bg-primary/10'
            )}
            style={{ right: `${width - 2}px` }}
            onMouseDown={handleMouseDown}
            aria-hidden='true'
          />
        </>
      )}
    </>
  );
}
