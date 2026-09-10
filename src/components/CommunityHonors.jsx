import { useState } from "react";
import Icon from "./Icon";
import { getForumWebBase } from "../lib/forumApi";
import "../styles/community-honors.css";

function MemberPortrait({ member }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="honors-portrait">
      {member.avatar && !failed ? (
        <img
          src={member.avatar}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{member.username.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}

function Laurel() {
  return (
    <svg
      className="honors-laurel"
      viewBox="0 0 240 240"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="120"
        cy="120"
        r="108"
        stroke="currentColor"
        strokeDasharray="1 9"
      />
      <path
        d="M96 207C38 181 23 108 59 48M144 207c58-26 73-99 37-159"
        stroke="currentColor"
      />
      {[0, 1].map((side) => (
        <g
          key={side}
          transform={side ? "translate(240 0) scale(-1 1)" : undefined}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`rotate(${i * 15} 120 120)`}>
              <path
                d="M48 132c-17-7-23-18-22-30 14 5 22 15 22 30Z"
                fill="currentColor"
                opacity=".65"
              />
              <path
                d="M48 132c0-17 7-28 18-34 2 15-5 28-18 34Z"
                fill="currentColor"
                opacity=".4"
              />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

export default function CommunityHonors({ moderators, leaderboard, preview }) {
  const forum = getForumWebBase();
  const entries = leaderboard.entries;
  const loading = ["idle", "loading"].includes(leaderboard.status);
  return (
    <section className="community-honors" aria-labelledby="honors-title">
      <div className="container">
        <header className="honors-heading">
          <div>
            <p className="honors-period">
              {preview ? "Sample leaderboard" : "This month"}
            </p>
            <h2 id="honors-title">
              Community
              <br />
              <span>champions.</span>
            </h2>
          </div>
          <a
            className="text-link"
            href={`${forum}/leaderboard`}
            target="_blank"
            rel="noreferrer"
          >
            The full leaderboard <Icon />
          </a>
        </header>
        {entries.length > 0 ? (
          <ol className="honors-board" aria-label="Community leaderboard">
            {entries.map((member, index) => (
              <li
                key={member.id}
                className={`honors-place honors-place-${index + 1}`}
              >
                <a
                  href={member.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="honors-member"
                >
                  <span className="honors-rank">
                    <span className="sr-only">Rank </span>
                    {String(member.position || index + 1).padStart(2, "0")}
                  </span>
                  <div className="honors-medallion">
                    {index === 0 && <Laurel />}
                    <MemberPortrait member={member} />
                  </div>
                  <div className="honors-identity">
                    <span className="honors-place-label">
                      {index === 0
                        ? "First place"
                        : index === 1
                          ? "Second place"
                          : "Third place"}
                    </span>
                    <h3>{member.username}</h3>
                  </div>
                  <div className="honors-score">
                    <strong>
                      {Intl.NumberFormat("en").format(member.cheers)}
                    </strong>
                    <span>points</span>
                  </div>
                  <span className="honors-profile">
                    View profile <Icon name="external" size={16} />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <div className="honors-empty" role="status">
            <span>
              {loading
                ? "Loading this month’s champions…"
                : leaderboard.status === "error"
                  ? "This month’s rankings are available on the forum."
                  : "A new month. The leaderboard is just getting started."}
            </span>
            <Icon name="chat" size={36} />
          </div>
        )}
        {moderators.length > 0 && (
          <div className="honors-moderators">
            <header>
              <h3>
                Our moderators<span>.</span>
              </h3>
              <p>Keeping JTech a place to help each other.</p>
            </header>
            <ul className="honors-mod-list">
              {moderators.map((member) => (
                <li key={member.username}>
                  <a href={member.profileUrl} target="_blank" rel="noreferrer">
                    <MemberPortrait member={member} />
                    <span className="honors-mod-name">{member.username}</span>
                    <span className="honors-mod-role">Moderator</span>
                    <Icon name="external" size={15} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
