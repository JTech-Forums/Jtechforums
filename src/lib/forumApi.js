import { resolveMockForumResponse } from '../data/mockForum';

const normalizeBase = (value, fallback) => {
  const trimmed = (value || '').replace(/\/$/, '');
  return trimmed || fallback;
};

const defaultDevRemoteBase =
  import.meta.env.VITE_FORUM_REMOTE_FALLBACK || 'https://forumapi-vvtyqkmgxa-uc.a.run.app';
const rawBase = import.meta.env.VITE_FORUM_API_BASE_URL || '';
const trimmedBase = rawBase.trim();
const isRelativeBase = trimmedBase.startsWith('/');
const fallbackBase = import.meta.env.DEV ? defaultDevRemoteBase : '/api';
const resolvedBase =
  import.meta.env.DEV && (isRelativeBase || !trimmedBase) ? defaultDevRemoteBase : trimmedBase;
const forumApiBase = normalizeBase(resolvedBase, fallbackBase);
const forumWebBase = normalizeBase(import.meta.env.VITE_FORUM_URL, 'https://jtechforums.org');
const forumMockMode = (import.meta.env.VITE_FORUM_USE_MOCK || '').toLowerCase();
const forceMock =
  forumMockMode === 'true' ||
  forumMockMode === 'always' ||
  forumMockMode === 'on' ||
  forumMockMode === 'force';
const allowMockFallback =
  !forceMock &&
  ['auto', 'fallback'].includes(forumMockMode) &&
  import.meta.env.DEV;

const buildMockResponse = (pathWithQuery) => {
  const payload = resolveMockForumResponse(pathWithQuery);
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const getForumWebBase = () => forumWebBase;

export const fetchForumApi = async (path, init) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!forceMock) {
    try {
      const response = await fetch(`${forumApiBase}${normalizedPath}`, init);
      if (response.ok || !allowMockFallback) {
        return response;
      }
      console.warn('Forum API returned non-200 status in dev, using mock payload.', response.status);
    } catch (error) {
      if (!allowMockFallback) {
        throw error;
      }
      console.warn('Forum API request failed in dev, using mock payload.', error);
    }
  }

  return buildMockResponse(normalizedPath);
};
