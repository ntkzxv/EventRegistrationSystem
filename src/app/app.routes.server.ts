import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Auth-protected routes rely on the browser's localStorage token, so they
  // must be rendered client-side only — SSR has no localStorage and would
  // always see the user as logged out, redirecting to /login incorrectly.
  { path: 'my-events', renderMode: RenderMode.Client },
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/events', renderMode: RenderMode.Client },
  { path: 'admin-event-management', renderMode: RenderMode.Client },
  { path: 'admin/dashboard', renderMode: RenderMode.Client },
  { path: 'admin-dashboard', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
