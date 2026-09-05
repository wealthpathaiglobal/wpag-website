function unavailable() {
  return new Response('Not found', { status: 404, headers: {
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Cache-Control': 'private, no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  }});
}
export { unavailable as GET, unavailable as POST, unavailable as PUT, unavailable as PATCH, unavailable as DELETE, unavailable as OPTIONS, unavailable as HEAD };
