import { forumLinks } from "../lib/forumLinks";
import { Link } from "react-router-dom";
import Icon from "./Icon";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div>
          <Link to="/" className="brand">
            <img src="/img/whitelogo.png" alt="JTech" />
            <span>FORUMS</span>
          </Link>
          <p>Community-run tech & filtering intelligence.</p>
        </div>
        <a
          href="https://forums.jtechforums.org"
          target="_blank"
          rel="noreferrer"
          className="text-link"
        >
          See you on the forum <Icon name="external" />
        </a>
      </div>
      <div className="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} JTech Forums LLC.</p>
        <nav aria-label="Footer navigation">
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <p className="footer-credit">
          <span>Landing page built by</span>{" "}
          <span className="footer-credit-partners">
            <a href={forumLinks.creator} target="_blank" rel="noreferrer">
              @samsclub
            </a>
            <span
              className="footer-credit-cross"
              aria-label="in collaboration with"
            >
              &times;
            </span>
            <a href="https://condvar.com" target="_blank" rel="noreferrer">
              condvar.com
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}
