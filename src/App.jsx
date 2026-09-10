import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PageShell from "./components/PageShell";
import Home from "./pages/Home";
const About = lazy(() => import("./pages/About"));
const EGate = lazy(() => import("./pages/EGate"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const ServerError = lazy(() => import("./pages/ServerError"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  const location = useLocation();
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="container empty-state" role="status">
            Loading page…
          </div>
        }
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/egate" element={<EGate />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/terms-of-service" element={<Terms />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageShell>
  );
}
