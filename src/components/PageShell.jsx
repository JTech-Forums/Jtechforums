import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
export default function PageShell({ children }) {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return (
    <div className="site-shell">
      <Header />
      <main id="main" className={pathname === "/" ? "home-main" : "inner-page"}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
