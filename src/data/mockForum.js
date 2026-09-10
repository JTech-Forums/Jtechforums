const mockGuideTopics = [
  {
    id: 9001,
    slug: "egate-3-5-rollout-checklist",
    title: "eGate 3.5 rollout checklist for yeshiva labs",
    views: 1240,
    like_count: 212,
    reply_count: 64,
    created_at: "2025-01-04T14:23:00Z",
    tags: ["egate", "walkthrough", "deployment"],
  },
  {
    id: 9002,
    slug: "qin-f21-minimal-os-install",
    title: "Qin F21: Minimal OS install with kosher dialer",
    views: 880,
    like_count: 150,
    reply_count: 43,
    created_at: "2025-01-02T09:15:00Z",
    tags: ["qin-f21", "apps4flip"],
  },
  {
    id: 9003,
    slug: "cat-s22-filtering-hardening",
    title: "CAT S22 filtering hardening playbook",
    views: 765,
    like_count: 133,
    reply_count: 37,
    created_at: "2024-12-30T20:45:00Z",
    tags: ["cat-s22", "filtering", "policy"],
  },
];

const mockLeaderboardUsers = [
  {
    id: 43,
    username: "TripleU",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/tripleu/{size}/488_2.png",
    total_score: 22785,
    position: 1,
  },
  {
    id: 941,
    username: "ars18",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/ars18/{size}/2336_2.png",
    total_score: 21455,
    position: 2,
  },
  {
    id: 331,
    username: "Dev-in-the-BM_2.0",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/dev-in-the-bm_2.0/{size}/969_2.png",
    total_score: 18455,
    position: 3,
  },
];

const mockLeaderboardMeta = {
  id: 6,
  name: "JTech Champions (mock)",
  created_by_id: 43,
  period_filter_disabled: false,
};

const mockAboutStats = {
  users_count: 3120,
  posts_count: 58211,
  active_users_30_days: 612,
  users_30_days: 134,
  posts_30_days: 2980,
  posts_last_day: 114,
};

const defaultPayload = { ok: true };

const buildMockLatestPayload = (page) => ({
  topic_list: {
    topics: page > 0 ? [] : mockGuideTopics,
    more_topics_url: page > 0 ? null : "/latest?page=1",
  },
});

const buildMockLeaderboardPayload = () => ({
  leaderboard: mockLeaderboardMeta,
  users: mockLeaderboardUsers,
});

// Moderator snapshot for the explicitly labeled local preview. Production uses /forum/about.
const mockModeratorUsers = [
  {
    id: 77,
    username: "anonymousfliphones",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/anonymousfliphones/{size}/2591_2.png",
  },
  {
    id: 1247,
    username: "Shalom_Karr",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/shalom_karr/{size}/8264_2.png",
  },
  {
    id: 331,
    username: "Dev-in-the-BM_2.0",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/dev-in-the-bm_2.0/{size}/969_2.png",
  },
  {
    id: 28,
    username: "kosherboy",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/kosherboy/{size}/292_2.png",
  },
  {
    id: 741,
    username: "flipphoneguy",
    avatar_template:
      "/user_avatar/forums.jtechforums.org/flipphoneguy/{size}/11165_2.png",
  },
];

const mockAboutPayload = {
  users: mockModeratorUsers,
  about: {
    moderator_ids: mockModeratorUsers.map((user) => user.id),
    admin_ids: [],
    stats: mockAboutStats,
  },
};

export const resolveMockForumResponse = (pathWithQuery = "") => {
  const url = new URL(pathWithQuery, "https://mock.forums.jtech.local");
  const pathname = url.pathname || "";
  if (pathname === "/forum/about") {
    return mockAboutPayload;
  }

  if (pathname.startsWith("/forum/latest")) {
    const page = Number(url.searchParams.get("page") || "0");
    return buildMockLatestPayload(page);
  }

  if (pathname.startsWith("/forum/leaderboard/")) {
    return buildMockLeaderboardPayload();
  }

  return defaultPayload;
};
