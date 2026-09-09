import {
  ImmersiveHero,
  ExperienceRail,
  MotionAtmosphere,
  StoryBridge,
} from "./ImmersiveExperience";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import faqEntries from "../data/faqEntries";
import { fetchForumApi, getForumWebBase } from "../lib/forumApi";
const forum = getForumWebBase();
function Avatar({ name, image }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="avatar">
      {image && !failed ? (
        <img
          src={image}
          alt=""
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
export default function HomeContent({
  aboutData,
  adminProfiles,
  moderatorProfiles,
  leaderboardState,
  feedbackList,
  isAdmin,
  onFeedback,
  onDelete,
}) {
  const faqIntro = useRef(null);
  useLayoutEffect(() => {
    const node = faqIntro.current;
    const measure = () =>
      node.style.setProperty(
        "--faq-height",
        `${node.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, []);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Latest");
  const [topics, setTopics] = useState([]);
  const [status, setStatus] = useState("loading");
  const [faqQuery, setFaqQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetchForumApi("/forum/latest", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setTopics(data.topic_list?.topics || []);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, []);
  const orderedTopics = useMemo(
    () =>
      [...topics]
        .sort((a, b) =>
          tab === "Popular"
            ? (b.views || 0) - (a.views || 0)
            : tab === "Most discussed"
              ? (b.reply_count || 0) - (a.reply_count || 0)
              : new Date(b.created_at) - new Date(a.created_at),
        )
        .slice(0, 4),
    [topics, tab],
  );
  const stats = aboutData?.about?.stats;
  const preview = import.meta.env.VITE_FORUM_USE_MOCK === "true";
  const fmt = (n) =>
    typeof n === "number"
      ? Intl.NumberFormat("en", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(n)
      : "—";
  const search = (e) => {
    e.preventDefault();
    if (query.trim())
      window.open(
        `${forum}/search?q=${encodeURIComponent(query.trim())}`,
        "_blank",
        "noopener,noreferrer",
      );
  };
  return (
    <>
      <MotionAtmosphere />
      <ImmersiveHero />
      <div className="community-strip">
        <div className="container strip-inner">
          <div className="strip-intro">
            <Icon name="chat" />
            <span>
              Small questions.
              <br />
              <strong>Real answers.</strong>
            </span>
          </div>
          <div>
            <strong>{fmt(stats?.users_count)}</strong>
            <span>Community members</span>
          </div>
          <div>
            <strong>{fmt(stats?.posts_count)}</strong>
            <span>Shared posts</span>
          </div>
          <div>
            <strong>{fmt(stats?.active_users_30_days)}</strong>
            <span>Active this month</span>
          </div>
          <div className="strip-note">
            Built by the community.
            <br />
            For the community.
            {preview && <small>Local preview · sample statistics</small>}
          </div>
        </div>
      </div>
      <StoryBridge />
      <ExperienceRail />
      <section className="conversation-section container">
        <div className="discussion-main">
          <div className="section-top">
            <div>
              <span className="eyebrow">THE CONVERSATION CONTINUES</span>
              <h2>Inside the forum.</h2>
            </div>
            <a
              className="text-link"
              href={forum}
              target="_blank"
              rel="noreferrer"
            >
              View all topics <Icon name="external" size={17} />
            </a>
          </div>
          <div
            className="topic-tabs"
            role="tablist"
            aria-label="Sort discussions"
          >
            {["Latest", "Popular", "Most discussed"].map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
            <span>{preview ? "Sample discussions" : "From the community"}</span>
          </div>
          <div
            className="topics"
            role="tabpanel"
            aria-label={`${tab} discussions`}
          >
            {status === "loading" && (
              <p className="empty-state" role="status">
                Loading conversations…
              </p>
            )}
            {status === "error" && (
              <div className="empty-state">
                <p>Conversations couldn't load right now.</p>
                <a className="text-link" href={forum}>
                  Browse the forum <Icon />
                </a>
              </div>
            )}
            {status === "ready" && !topics.length && (
              <p className="empty-state">
                No conversations yet. Start one on the forum.
              </p>
            )}
            {orderedTopics.map((t, i) => (
              <a
                className="topic-row"
                href={
                  preview
                    ? `${forum}/search?q=${encodeURIComponent(t.title)}`
                    : `${forum}/t/${t.slug}/${t.id}`
                }
                target="_blank"
                rel="noreferrer"
                key={t.id}
              >
                <span className={`topic-symbol symbol-${i}`}>
                  <Icon name={["phone", "book", "chat", "grid"][i]} />
                </span>
                <div>
                  <h3>{t.title}</h3>
                  <p>
                    <span className="category-dot" />
                    {typeof t.tags?.[0] === "string"
                      ? t.tags[0]
                      : t.tags?.[0]?.name || "Community"}
                    <span className="topic-date">
                      {new Date(t.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
                <span className="topic-replies">
                  <Icon name="chat" size={16} />
                  {t.reply_count || 0}
                </span>
                <Icon name="external" size={17} />
              </a>
            ))}
          </div>
          <form className="forum-search" onSubmit={search}>
            <Icon name="search" />
            <input
              aria-label="Search the forums"
              placeholder="A question in mind? Search the forums…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
            <button aria-label="Search" type="submit">
              <Icon />
            </button>
          </form>
          <div className="search-suggestions">
            <span>Try searching</span>
            {["eGate", "TAG filter", "Nokia 2780", "MDM setup"].map((q) => (
              <button key={q} onClick={() => setQuery(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
        <aside className="community-aside">
          <div className="eyebrow">BUILT ON SHARED KNOWLEDGE</div>
          <Icon name="chat" size={36} />
          <h3>
            Your next question.
            <br />
            Someone's experience.
          </h3>
          <p>
            Guides, walkthroughs, shared apps, troubleshooting threads, and
            beginner questions all contributed by the community to help each
            other out.
          </p>
          <a className="button" href={forum} target="_blank" rel="noreferrer">
            Join the conversation <Icon name="external" size={18} />
          </a>
          <span className="aside-signoff">
            A respectful space for every question.
          </span>
        </aside>
      </section>
      <section className="people-section">
        <div className="container">
          <div className="section-top">
            <div>
              <span className="eyebrow">REAL PEOPLE. SHARED PURPOSE.</span>
              <h2>
                The people
                <br />
                <span>behind JTech.</span>
              </h2>
            </div>
            <Link to="/about" className="text-link">
              About JTech <Icon />
            </Link>
          </div>
          <div className="people-grid team-roster">
            {adminProfiles.map((p) => (
              <a
                className="person"
                key={p.handle}
                href={p.profileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Avatar
                  name={p.name}
                  image={`/img/team/${p.handle.slice(1)}.png`}
                />
                <div>
                  <h3>{p.name}</h3>
                  <span className="person-handle">{p.handle}</span>
                  <p>{p.role}</p>
                </div>
                <Icon name="external" size={18} />
              </a>
            ))}
          </div>
          {moderatorProfiles.length > 0 && (
            <div className="moderators">
              <h3>Our Moderators</h3>
              {moderatorProfiles.map((p) => (
                <a key={p.username} href={p.profileUrl}>
                  {p.username}
                </a>
              ))}
            </div>
          )}
          <div className="leaderboard">
            <span>
              Community champions{" "}
              <small>{preview ? "Sample leaderboard" : "This month"}</small>
            </span>
            {leaderboardState.entries.map((p, i) => (
              <a
                key={p.id}
                href={p.profileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span className="rank">0{i + 1}</span>
                <strong>{p.username}</strong>
                <span>{fmt(p.cheers)} points</span>
              </a>
            ))}
            {leaderboardState.status === "error" && (
              <a href={`${forum}/leaderboard`}>
                View the community leaderboard{" "}
                <Icon name="external" size={16} />
              </a>
            )}
          </div>
        </div>
      </section>
      <section className="container feedback-section">
        <div className="section-top">
          <div>
            <span className="eyebrow">FROM THE COMMUNITY</span>
            <h2>It helps to have people.</h2>
          </div>
          <button className="text-link" onClick={onFeedback}>
            Share your feedback <Icon name="plus" size={18} />
          </button>
        </div>
        <div className="quote-grid">
          {feedbackList.slice(0, 3).map((f) => (
            <figure key={f.id}>
              <span className="quote-mark">“</span>
              <blockquote>{f.quote.replace(/^"|"$/g, "")}</blockquote>
              <figcaption>
                <Avatar name={f.name} />
                <div>
                  <strong>{f.name}</strong>
                  <span>{f.context}</span>
                </div>
              </figcaption>
              {isAdmin && f.fromFirestore && (
                <button onClick={() => onDelete(f.id)}>Delete feedback</button>
              )}
            </figure>
          ))}
        </div>
      </section>
      <section className="faq-section container">
        <div className="faq-intro" ref={faqIntro}>
          <span className="eyebrow">GOOD TO KNOW</span>
          <h2>
            A few common
            <br />
            <em>questions.</em>
          </h2>
          <p>New here? Start with the basics.</p>
          <label className="faq-search">
            <Icon name="search" size={18} />
            <input
              aria-label="Search questions"
              placeholder="Find an answer…"
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
            />
          </label>
          <Link to="/contact" className="text-link">
            Still need a hand? <Icon />
          </Link>
        </div>
        <div className="faq-list">
          {faqEntries
            .filter((f) =>
              `${f.question} ${f.answer}`
                .toLowerCase()
                .includes(faqQuery.toLowerCase()),
            )
            .map((f) => (
              <details key={f.question}>
                <summary>
                  {f.question}
                  <Icon name="plus" size={18} />
                </summary>
                <p>{f.answer}</p>
              </details>
            ))}
          {!faqEntries.some((f) =>
            `${f.question} ${f.answer}`
              .toLowerCase()
              .includes(faqQuery.toLowerCase()),
          ) && (
            <p className="empty-state">
              No matching questions. Try a different search or contact us.
            </p>
          )}
        </div>
      </section>
      <section className="container closing-section">
        <span className="eyebrow">THERE'S A PLACE FOR YOU HERE</span>
        <h2>
          Ready to join the <em>community?</em>
        </h2>
        <p>
          Thousands of community members are already sharing guides,
          troubleshooting setups,
          <br />
          and helping each other stay connected—safely.
        </p>
        <a className="button" href={forum} target="_blank" rel="noreferrer">
          Join the Forum <Icon name="external" size={18} />
        </a>
        <div className="closing-watermark" aria-hidden="true">
          jtech.
        </div>
      </section>
    </>
  );
}
