import { Link } from 'react-router-dom';
import { guideArticles } from '../data/guides';
import Icon from '../components/Icon';
import { useEffect, useMemo, useRef, useState } from 'react';
import SectionHeading from '../components/SectionHeading';
import PageLoader from '../components/PageLoader';
import { fetchForumApi, getForumWebBase } from '../lib/forumApi';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const normalizeTagLabel = (tag) => {
  if (!tag) return '';
  if (typeof tag === 'string') return tag;
  return tag.name || tag.slug || '';
};

export default function Guides() {
  const sentinelRef = useRef(null);
  const [topics, setTopics] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const forumBase = getForumWebBase();
  const guidesCategory = import.meta.env.VITE_DISCOURSE_GUIDES_PATH || 'guides';

  useEffect(() => {
    let aborted = false;
    const fetchPage = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchForumApi(`/forum/latest?page=${page}&category=${encodeURIComponent(guidesCategory)}`);

        if (!response.ok) {
          throw new Error(`Forum request failed (${response.status})`);
        }

        const payload = await response.json();
        const newTopics = (payload?.topic_list?.topics ?? []).filter(
          (topic) => !topic.pinned && !(topic.slug || '').startsWith('about-')
        );

        setTopics((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const filtered = newTopics.filter((topic) => !existingIds.has(topic.id));
          return [...prev, ...filtered];
        });

        const hasNext = Boolean(payload?.topic_list?.more_topics_url) || newTopics.length > 0;
        setHasMore(hasNext);
        if (!aborted) {
          setInitialLoaded(true);
        }
      } catch (err) {
        if (!aborted) {
          setError(err.message || 'Unable to fetch guides right now.');
          setHasMore(false);
          setInitialLoaded(true);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchPage();
    return () => {
      aborted = true;
    };
  }, [page, guidesCategory]);

  useEffect(() => {
    if (!hasMore || !topics.length) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, topics.length]);

  const formattedTopics = useMemo(
    () =>
      topics.map((topic, index) => ({
        ...topic,
        url: import.meta.env.VITE_FORUM_USE_MOCK === 'true' ? `${forumBase}/search?q=${encodeURIComponent(topic.title)}` : `${forumBase}/t/${topic.slug}/${topic.id}`,
        isHero: index === 0,
      })),
    [topics, forumBase]
  );

  return (
    <>
      <PageLoader show={!initialLoaded} label="Fetching guides" />
      <div className={`mx-auto max-w-5xl space-y-12 px-6 transition-opacity duration-500 ${initialLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <section className="local-guides">
        <div className="local-page-title"><span className="eyebrow">THE COMMUNITY KNOWLEDGE BASE</span><h1>Step-by-Step Guides</h1><p>Detailed walkthroughs for every device and setup. From flip phones to smartphones, we've got you covered.</p></div>
        {guideArticles.map(guide => <Link className="local-guide" key={guide.slug} to={`/guides/${guide.slug}`}><div><h2>{guide.title}</h2><p>{guide.summary}</p></div><Icon/></Link>)}
      </section>
      <section className="pb-16 pt-12">
        <SectionHeading
          label="Guides"
          title="Latest walkthroughs from the JTech forum"
          description={import.meta.env.VITE_FORUM_USE_MOCK === 'true' ? 'Sample forum topics for the local preview. The guides above are available to read in full.' : 'We pull the newest topics from the Guides category in real-time. Scroll to keep loading fresh signal.'}
          reveal={false}
        />

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-6">
          {formattedTopics.map((topic) => (
            <GuideCard key={topic.id} topic={topic} />
          ))}
        </div>

        <div ref={sentinelRef} className="mt-10 h-1 w-full" />
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-300">
            <span className="h-2 w-2 animate-ping rounded-full bg-sky-400" />
            Loading more guides…
          </div>
        )}
      </section>
    </div>
    </>
  );
}

function GuideCard({ topic }) {
  const isHero = topic.isHero;
  return (
    <a
      href={topic.url}
      target="_blank"
      rel="noopener"
      className={`group relative block overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 text-left transition-all duration-500 hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-[0_0_60px_rgba(56,189,248,0.3)] ${
        isHero ? 'md:p-10' : 'md:p-8'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
        <div className="absolute -inset-6 bg-gradient-to-r from-sky-500/20 via-transparent to-indigo-500/20 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          <span>{formatDate(topic.created_at)}</span>
          <div className="flex items-center gap-4 text-[11px] tracking-normal text-slate-200">
            <Metric icon="fa-eye" label={topic.views} />
            <Metric icon="fa-comments" label={topic.reply_count} />
            <Metric icon="fa-heart" label={topic.like_count} />
          </div>
        </div>
        <h3
          className={`font-semibold text-white transition-colors duration-300 group-hover:text-sky-100 ${
            isHero ? 'text-3xl sm:text-4xl' : 'text-2xl'
          }`}
        >
          {topic.title}
        </h3>
        {topic.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {topic.tags.slice(0, 4).map((tag, index) => {
              const label = normalizeTagLabel(tag);
              if (!label) return null;
              return (
                <span
                  key={`${label}-${index}`}
                  className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition-colors duration-300 group-hover:border-sky-200/40 group-hover:text-white"
                >
                  {label}
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-sm font-semibold text-sky-200 transition-transform duration-300 group-hover:translate-x-1">
          Continue on the forum <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
        </div>
      </div>
    </a>
  );
}

function Metric({ icon, label }) {
  if (label === undefined || label === null) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-slate-300">
      <i className={`fa-solid ${icon}`}></i>
      {label}
    </span>
  );
}
