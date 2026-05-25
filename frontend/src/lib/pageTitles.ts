export function getPageTitle(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/assignments')) return 'Assignment';
  if (pathname.startsWith('/groups')) return 'My Groups';
  if (pathname.startsWith('/toolkit')) return "AI Teacher's Toolkit";
  if (pathname.startsWith('/library')) return 'My Library';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'VedaAI';
}
