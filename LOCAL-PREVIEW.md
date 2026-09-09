# Review the landing-page redesign locally

This branch proposes a visual and interaction redesign for maintainer review. It does not deploy the website. Static previews and a short particle-animation recording are in [docs/review](docs/review/README.md).

## Start a disconnected preview

Use a fresh checkout of this branch with Node.js and npm installed.

1. Run `npm ci` (`npm.cmd ci` in Windows PowerShell).
2. Create a local `.env.local` file containing:

   ```dotenv
   VITE_FORUM_USE_MOCK=true
   ```

   For a disconnected review, leave the `VITE_FIREBASE_*` variables unset. Do not overwrite an existing environment file with production credentials; use a fresh checkout instead. The environment file is ignored by Git and is not included in this PR.

3. Run `npm run dev -- --host 127.0.0.1` (`npm.cmd run dev -- --host 127.0.0.1` in Windows PowerShell).
4. Open the local URL printed by Vite, normally http://127.0.0.1:5173.

The fonts and existing icon stylesheet load from external CDNs. Forum and installer links still open their existing external destinations.

## What to review

- The original JTech wordmark, seven continuously morphing particle silhouettes, and restrained blue/cyan lighting.
- The large image reveal and four horizontal resource scenes. On desktop, scrolling down moves the scenes sideways while native CSS sticky positioning holds the section beneath the header. Scrolling past the final scene resumes vertical travel. Pagination also navigates between scenes.
- The full-size guide-image dialog, original phone video, app icons, and locally saved copies of existing forum avatars.
- The centered sticky FAQ introduction, searchable questions, discussion sorting, and app search.
- The shared dark styling on guides, eGate, account forms, informational pages, and error pages.
- Mobile navigation and horizontal swiping. Narrow screens use native horizontal scrolling instead of pinning.
- Reduced-motion settings, which stop particle animation and decorative motion and use native scrolling for the resource scenes.

## Preview data and integration boundaries

- Forum statistics, discussion previews, and the leaderboard use the repository's sample data when mock mode is enabled, labeled in the UI. Sample topic links search the forum instead of opening fabricated topic IDs.
- All three bundled guide articles can be read locally. Forum guides use the existing API when mock mode is disabled.
- Without Firebase configuration, the app page displays the existing app assets with forum-search links. Downloads, account actions, uploads, moderation, and feedback submission require the configured services.
- Account actions explain when Firebase is unavailable. The contact form does not send messages in local mock mode.
- The existing configured Firebase and API integrations remain in the code. Production authentication, feedback writes, contact delivery, catalog uploads, and moderation have not been tested against live services and need maintainer verification before release.
- Do not carry `VITE_FORUM_USE_MOCK=true` into a live build. Use the project's normal service configuration for an integration review.

## Validation performed

- `npm run build` with the repository's locked dependencies; Vite reports the existing large-chunk advisory.
- Eleven routes at desktop and mobile sizes: home, guides, guide detail, apps, eGate, about, contact, sign in, privacy, terms, and 404.
- Discussion sorting, encoded forum search, FAQ filtering/expansion/empty states, mobile menu/Escape, and app filtering/empty states.
- Horizontal story entry, forward/reverse travel, exit, pagination, route cleanup, and mobile/reduced-motion behavior.
- Full-size image dialog and Escape dismissal.
- Complete seven-shape particle cycle, centered FAQ positioning during scroll, stationary closing CTA, and reduced-motion stability.
- Responsive widths from 320px to 1920px, with no horizontal page overflow or browser JavaScript errors in the checks performed.

No dependencies, deployment settings, or backend service configuration were changed. The preview images document appearance; they are not a hosted interactive preview.
