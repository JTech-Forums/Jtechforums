/**
 * Resolve a file in public/ against the app's base path.
 *
 * The site is served from / in development and from /home on the apex, where
 * Discourse owns the root. Vite rewrites the URLs it can see at build time,
 * but not string literals in JSX — so every public/ asset goes through here.
 */
export const asset = (path) =>
  `${import.meta.env.BASE_URL}${String(path).replace(/^\//, "")}`;
