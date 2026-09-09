import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
const links = [
  ["Home", "/"],
  ["Guides", "/guides"],
  ["Apps", "/apps"],
  ["eGate", "/egate"],
  ["About", "/about"],
  ["Contact", "/contact"],
];
export default function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="JTech Forums home">
          <img src="/img/whitelogo.png" alt="JTech" />
          <span>FORUMS</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <button className="sign-in" onClick={() => signOut(auth)}>
              Sign out
            </button>
          ) : (
            <Link className="sign-in" to="/signin">
              Sign in
            </Link>
          )}
          <a
            className="button button-small"
            href="https://forums.jtechforums.org"
            target="_blank"
            rel="noreferrer"
          >
            Join the Forum <Icon name="external" size={16} />
          </a>
        </div>
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
          <Link to="/signin">Sign in</Link>
        </nav>
      )}
    </header>
  );
}
