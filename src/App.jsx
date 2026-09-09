import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PageShell from "./components/PageShell";
import Home from "./pages/Home";
const Guides = lazy(() => import("./pages/Guides"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const About = lazy(() => import("./pages/About"));
const EGate = lazy(() => import("./pages/EGate"));
const Contact = lazy(() => import("./pages/Contact"));
const Apps = lazy(() => import("./pages/Apps"));
const LocalApps = lazy(() => import("./pages/LocalApps"));
import { firebaseConfigured } from "./lib/firebase";
const SignIn = lazy(() => import("./pages/SignIn"));
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
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/:slug" element={<GuideDetail />} />
          <Route path="/egate" element={<EGate />} />
          <Route
            path="/apps"
            element={firebaseConfigured ? <Apps /> : <LocalApps />}
          />
          <Route path="/signin" element={<SignIn />} />
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
