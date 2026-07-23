import { useEffect, useMemo, useState } from 'react';
import SectionHeading from '../components/SectionHeading';
import GlassCard from '../components/GlassCard';
import Reveal from '../components/Reveal';
import { fetchForumApi } from '../lib/forumApi';

const missionParagraphs = [
  "JTech's mission is to empower the Jewish community by providing the most precise, accurate, and up-to-date technology and filtering information.",
  'We obsess over accuracy, halachic sensitivity, and practical deployment so families, schools, and mechanchim can make confident choices without spending days in WhatsApp chats.',
];

const offerings = [
  {
    icon: 'fa-comments',
    title: 'Forum intelligence',
    description:
      '2,000+ public threads covering eGate releases, Qin F21 builds, CAT S22 tweaks, and halachic guardrails. Every answer is vetted before it’s pinned.',
    link: { label: 'Visit forum', href: 'https://forums.jtechforums.org' },
  },
  {
    icon: 'fa-book-open',
    title: 'Guides & playbooks',
    description:
      'Long-form docs such as the eGate rollout guide, Apps4Flip catalogs, and CAT S22 Verizon walkthroughs—kept current by moderators and community SMEs.',
    link: { label: 'Browse guides', href: '/guides' },
  },
  {
    icon: 'fa-screwdriver-wrench',
    title: 'Deployment support',
    description:
      'Real assets you can ship today: policy templates, parent comms, install-day checklists, and escalation trees lifted straight from working schools.',
    link: { label: 'Talk to us', href: '/contact' },
  },
];

const values = [
  {
    title: 'Community-first moderation',
    body: 'Every public answer is reviewed by mechanchim, admins, or veteran resellers before it’s promoted or cited in a guide.',
  },
  {
    title: 'Evidence over hype',
    body: 'We require screenshots, config diffs, or log output for every claim so you can reproduce fixes without guessing.',
  },
  {
    title: 'Vendor-neutral stance',
    body: 'JTech doesn’t sell hardware or filters. We publish evaluation checklists and highlight partners only once the community trusts them.',
  },
];

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toLocaleString();
};

export default function About() {
  const [forumStats, setForumStats] = useState({
    members: null,
    posts: null,
    active30: null,
    newMembers30: null,
    posts30: null,
    postsDay: null,
  });

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const aboutRes = await fetchForumApi('/forum/about');
        const aboutJson = await aboutRes.json();
        if (cancelled) return;

        const stats = aboutJson?.about?.stats || {};

        setForumStats({
          members: stats.users_count ?? null,
          posts: stats.posts_count ?? null,
          active30: stats.active_users_30_days ?? null,
          newMembers30: stats.users_30_days ?? null,
          posts30: stats.posts_30_days ?? null,
          postsDay: stats.posts_last_day ?? null,
        });
      } catch (error) {
        console.warn('Unable to load forum stats', error);
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const headlineStats = useMemo(
    () => [
      { label: 'Active members', value: formatNumber(forumStats.active30) },
      { label: 'Total posts', value: formatNumber(forumStats.posts) },
      { label: 'Members all time', value: formatNumber(forumStats.members) },
    ],
    [forumStats]
  );

  return (
    <Reveal as="div" className="space-y-16 sm:space-y-20" amount={0.1}>
      <section className="relative isolate overflow-hidden px-4 pb-14 pt-16 text-center sm:px-6 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
          <img src="/img/phonegrid.png" alt="" className="h-full w-full object-cover opacity-15" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 to-slate-950" />
        </div>
        <div className="mx-auto max-w-4xl space-y-6">
          <p className="section-label text-xs uppercase text-sky-200">About JTech</p>
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">Built by and for the Jewish tech community</h1>
          <p className="text-lg text-slate-300">
            We keep the stories and statistics grounded in what actually ships: vetted guidance, verified rollouts, and real families protected every week.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-center text-slate-300">
          {headlineStats.map((stat) => (
            <div key={stat.label} className="min-w-[140px]">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-xs text-slate-500">
          Active members are folks who posted or read in the past 30 days. All-time members include every verified contributor—lurkers are removed
          automatically if they stay silent for 30 days, so these counts reflect real humans rather than bots or crawlers.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading label="Mission" title="Everything kosher mobile in one trusted playbook" align="center" />
        <div className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
          {missionParagraphs.map((paragraph) => (
            <p key={paragraph} className="text-base text-slate-200">
              {paragraph}
            </p>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading label="Past 30 days" title="Forum activity snapshot" align="center" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <GlassCard className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">New verified members</p>
            <p className="mt-4 text-3xl font-semibold text-white">{formatNumber(forumStats.newMembers30)}</p>
            <p className="mt-1 text-sm text-slate-400">Signed up & contributed</p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Posts today</p>
            <p className="mt-4 text-3xl font-semibold text-white">{formatNumber(forumStats.postsDay)}</p>
            <p className="mt-1 text-sm text-slate-400">Past 24 hours</p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Posts this month</p>
            <p className="mt-4 text-3xl font-semibold text-white">{formatNumber(forumStats.posts30)}</p>
            <p className="mt-1 text-sm text-slate-400">Last 30 days</p>
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          label="What we offer"
          title="Everything you need to launch and support kosher devices"
          align="center"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((item) => (
            <GlassCard key={item.title}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                  <i className={`fa-solid ${item.icon} text-xl`}></i>
                </span>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              </div>
              <p className="mt-4 text-sm text-slate-300">{item.description}</p>
              <a href={item.link.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
                {item.link.label}
                <i className="fa-solid fa-arrow-right"></i>
              </a>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading label="Principles" title="How we keep the signal trustworthy" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => (
            <GlassCard key={value.title} title={value.title} description={value.body} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-4xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
          <SectionHeading label="Team" title="Who keeps JTech running" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-white">Moderators & mechanchim</h3>
              <p className="mt-2 text-sm text-slate-300">
                Review every public answer, pin verified fixes, and ensure halachic boundaries are respected in every guide.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Power users & deployers</h3>
              <p className="mt-2 text-sm text-slate-300">
                Share scripts, rollback steps, and postmortems from real eGate, Qin, and GrapheneOS launches so others avoid the same pitfalls.
              </p>
            </div>
          </div>
          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">
            JTech Forums is operated by <span className="text-slate-400">JTech Forums LLC</span>, a New Jersey limited liability
            company based in Lakewood, NJ. See our{' '}
            <a href="/terms" className="text-sky-300 hover:text-sky-200">Terms of Service</a> and{' '}
            <a href="/privacy-policy" className="text-sky-300 hover:text-sky-200">Privacy Policy</a>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="glass-panel flex flex-col items-center gap-6 rounded-4xl border border-white/10 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="section-label text-xs uppercase text-sky-200">Get involved</p>
          <h2 className="text-3xl font-semibold text-white">Publish, mentor, or just ask a question</h2>
          <p className="text-base text-slate-200">
            The About page always closed with an invitation to the forum. That still stands-bring your insight and help the next family ship a safe phone.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            <a
              href="https://forums.jtechforums.org"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900"
            >
              Join the forum
            </a>
            <a href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white">
              Talk with the team
            </a>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
