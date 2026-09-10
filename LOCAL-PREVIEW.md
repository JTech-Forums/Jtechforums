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

- Desktop retains the original wordmark, seven morphing particle shapes, image reveal, and pinned horizontal resource story.
- Phones and tablets below 1100px use a centered hero without the particle canvas and a vertical sequence of all four resource scenes. There is no horizontal carousel or resource pagination on these screens.
- Mobile typography, spacing, touch targets, forum topics, team profiles, leaderboard, FAQ, and footer have been adjusted for narrow screens.
- The guide-image dialog, eGate video, FAQ search, and mobile menu remain interactive. Motion respects reduced-motion preferences.
- Navigation contains Home, eGate, About, and Contact. In-page guide links open the forum Guides category; the app-library link opens Android Apps. Local guides, apps, and sign-in pages have been removed.
- The footer credit links @samsclub to the verified /u/sams-club forum profile and condvar.com to its website. The multiplication sign and both links stay together on mobile.
- Feedback from visitors without a local authenticated session opens Contact.

## Preview data and integration boundaries

- Forum statistics, discussions, moderators, and the leaderboard use sample data when mock mode is enabled. Sample topic links search the forum instead of opening fabricated topic IDs.
- External forum links still open the real forum. The contact form does not send messages in local mock mode.
- Existing Firebase feedback and contact integrations remain. Production writes and delivery have not been tested against live services.
- Do not carry VITE_FORUM_USE_MOCK=true into a live build. Use the normal service configuration for an integration review.
- The conversation feed's upstream Cloudflare 403 issue is unchanged; see docs/review for the investigation.

## Validation performed

- Production build passes with the existing Vite bundle-size advisory.
- Layouts at 320, 390, 430, 768, 1024, and 1440px: no horizontal page overflow; all mobile resource scenes fit vertically; desktop retains the particle canvas and pinned story.
- Guide preview open/close, FAQ filtering, mobile menu/Escape, and reduced-motion behavior checked in Chrome.
- Mobile About, eGate, Contact, Privacy, and Terms routes fit without overflow.
- Confirmed removed-page links are absent, in-page resource links use the forum categories, footer links are correct, and visitor feedback opens Contact.

No dependencies, deployment settings, or backend service configuration were changed. The images document appearance; they are not a hosted interactive preview.
