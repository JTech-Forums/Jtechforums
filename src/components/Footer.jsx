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
        <span>Built with love and late-night coffee.</span>
      </div>
    </footer>
  );
}
