import { useState } from "react";
import Icon from "../components/Icon";
const assets = Object.keys(import.meta.glob("/public/img/apps/*.png"))
  .map((path) => ({
    file: path.split("/").pop(),
    name: path
      .split("/")
      .pop()
      .replace(".png", "")
      .replace(/([a-z])([A-Z])/g, "$1 $2"),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
export default function LocalApps() {
  const [search, setSearch] = useState("");
  const filtered = assets.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="container">
      <div className="local-page-title">
        <span className="eyebrow">THE JTECH APP LIBRARY</span>
        <h1>Curated App Library</h1>
        <p>
          Trusted, safe apps vetted by the community. No mystery APKs—just apps
          that work.
        </p>
      </div>
      <div className="local-notice">
        Local preview: browse the app assets included in the repository. App
        links search the forum; downloads and submissions require the connected
        catalog.
      </div>
      <label className="local-filter">
        <Icon name="search" />
        <input
          aria-label="Search apps"
          placeholder="Find an app…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="local-apps">
        {filtered.map((app) => (
          <a
            className="local-app"
            key={app.file}
            href={`https://forums.jtechforums.org/search?q=${encodeURIComponent(app.name)}`}
            target="_blank"
            rel="noreferrer"
          >
            <img src={`/img/apps/${app.file}`} alt="" loading="lazy" />
            <div>
              <h3>{app.name}</h3>
              <p>Find on the forum ↗</p>
            </div>
          </a>
        ))}
      </div>
      {!filtered.length && (
        <p className="empty-state" role="status">
          No apps match “{search}”. Try another name.
        </p>
      )}
    </div>
  );
}
