import { getForumWebBase } from "./forumApi";

const forum = getForumWebBase();

// Canonical public destinations, verified against the forum category and user APIs.
export const forumLinks = {
  guides: `${forum}/c/guides/28`,
  apps: `${forum}/c/android-apps/6`,
  creator: `${forum}/u/sams-club`,
};
