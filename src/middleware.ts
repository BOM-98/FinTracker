import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Public routes - allow access
  const publicPaths = ['/login', '/register', '/confirm-signup', '/auth'];
  if (publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return response;
  }

  // Onboarding routes - allow authenticated users only
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
  }

  // Dashboard and protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check onboarding completion
    const { data: userData } = await supabase
      .from('users')
      .select('onboarded_at')
      .eq('id', user.id)
      .single();

    if (!userData?.onboarded_at) {
      return NextResponse.redirect(
        new URL('/onboarding/household', request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static files/images; include everything else that might read auth
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
