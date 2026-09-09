import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import Icon from "../components/Icon";
import HomeContent from "../components/HomeContent";
import { fetchForumApi, getForumWebBase } from "../lib/forumApi";
import { firestore } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const forumBaseUrl = getForumWebBase();

const LEADERBOARD_ID = 6;
const LEADERBOARD_PERIOD = "monthly";
const LEADERBOARD_LIMIT = 3;

const adminProfiles = [
  {
    name: "Usher Weiss",
    handle: "@TripleU",
    role: "Forums Owner & Maintainer",
    avatar:
      "https://forums.jtechforums.org/user_avatar/forums.jtechforums.org/tripleu/144/488_2.png",
    profileUrl: "https://forums.jtechforums.org/u/tripleu",
  },
  {
    name: "Avrumi Sternheim",
    handle: "@ars18",
    role: "Forums Admin & Moderator",
    avatar:
      "https://forums.jtechforums.org/user_avatar/forums.jtechforums.org/ars18/144/2336_2.png",
    profileUrl: "https://forums.jtechforums.org/u/ars18",
  },
  {
    name: "Offline Software Solutions",
    handle: "@flipadmin",
    role: "Forum Founder & Developer",
    avatar:
      "https://forums.jtechforums.org/user_avatar/forums.jtechforums.org/flipadmin/144/2891_2.png",
    profileUrl: "https://forums.jtechforums.org/u/flipadmin",
  },
];

const resolveAvatar = (template, size = 144) => {
  if (!template) return "";
  const path = template.replace("{size}", String(size));
  return path.startsWith("http") ? path : `${forumBaseUrl}${path}`;
};

const deriveModerators = (aboutData) => {
  if (!aboutData?.about || !Array.isArray(aboutData.users)) return [];
  const modIds = new Set(aboutData.about.moderator_ids || []);
  const adminIds = new Set(aboutData.about.admin_ids || []);
  return aboutData.users
    .filter(
      (u) =>
        modIds.has(u.id) &&
        !adminIds.has(u.id) &&
        u.username?.toLowerCase() !== "jtechbridgebot",
    )
    .map((u) => ({
      username: u.username,
      role: u.title?.trim() || "Forum Moderator",
      avatar: resolveAvatar(u.avatar_template),
      profileUrl: `${forumBaseUrl}/u/${encodeURIComponent(u.username)}`,
    }));
};

const feedbackShowcase = [
  {
    id: "fb-1",
    name: "Sara K.",
    handle: "@kosherandroid",
    context: "Galaxy A14 + TAG Guardian",
    quote:
      '"The apps section walked me through every step. My phone is locked down, but still useful."',
    fromFirestore: false,
  },
  {
    id: "fb-2",
    name: "Eli D.",
    handle: "@flipguy",
    context: "Nokia 2780 & Kosher config",
    quote:
      '"Every time I break something, the forum already has the answer. Huge time saver."',
    fromFirestore: false,
  },
  {
    id: "fb-3",
    name: "Malky R.",
    handle: "@techmom",
    context: "Moto G Pure for the family",
    quote:
      '"Needed a safe phone setup for our teens. The guidance here kept it calm, kosher, and doable."',
    fromFirestore: false,
  },
];

const MIN_FEEDBACK_LENGTH = 40;
const MAX_FEEDBACK_LENGTH = 600;
const MAX_FEEDBACK_NAME = 32;

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = Boolean(profile?.isAdmin);

  // State
  const [feedbackEntries, setFeedbackEntries] = useState(feedbackShowcase);
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    context: "",
    quote: "",
  });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [leaderboardState, setLeaderboardState] = useState({
    entries: [],
    status: "idle",
    error: "",
  });
  const [aboutData, setAboutData] = useState(null);
  const [aboutStatus, setAboutStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetchForumApi("/forum/about", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("failed");
        const payload = await res.json();
        setAboutData(payload);
        setAboutStatus("ready");
      } catch {
        if (!controller.signal.aborted) setAboutStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  const moderatorProfiles = deriveModerators(aboutData);

  // Load feedback from Firestore
  useEffect(() => {
    if (!firestore) {
      setFeedbackStatus("empty");
      return;
    }
    const feedbackRef = collection(firestore, "feedback");
    const feedbackQuery = query(
      feedbackRef,
      orderBy("createdAt", "desc"),
      limit(6),
    );
    setFeedbackStatus("loading");
    const unsubscribe = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setFeedbackEntries(feedbackShowcase);
          setFeedbackStatus("empty");
          return;
        }
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          name:
            doc.data().authorDisplayName ||
            doc.data().authorName ||
            "Forum member",
          handle: doc.data().authorHandle || "@community",
          context: doc.data().context || "Shared setup",
          quote: doc.data().quote || "",
          fromFirestore: true,
        }));
        setFeedbackEntries(docs);
        setFeedbackStatus("ready");
      },
      () => {
        setFeedbackEntries(feedbackShowcase);
        setFeedbackStatus("error");
      },
    );
    return unsubscribe;
  }, []);

  // Load leaderboard
  useEffect(() => {
    const controller = new AbortController();
    const loadLeaderboard = async () => {
      setLeaderboardState((prev) => ({ ...prev, status: "loading" }));
      try {
        const response = await fetchForumApi(
          `/forum/leaderboard/${LEADERBOARD_ID}?period=${LEADERBOARD_PERIOD}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Failed");
        const payload = await response.json();
        const entries = (payload?.users || [])
          .slice(0, LEADERBOARD_LIMIT)
          .map((u, i) => ({
            id: u.id || `${u.username}-${i}`,
            username: u.username || `member-${i + 1}`,
            position: u.position || i + 1,
            cheers: Number(u.total_score) || 0,
            avatar: u.avatar_template
              ? u.avatar_template.startsWith("http")
                ? u.avatar_template.replace("{size}", "160")
                : `${forumBaseUrl}${u.avatar_template.replace("{size}", "160")}`
              : `${forumBaseUrl}/letter_avatar_proxy/v4/letter/j/ce7236/160.png`,
            profileUrl: `${forumBaseUrl}/u/${encodeURIComponent(u.username || "")}`,
          }));
        setLeaderboardState({ entries, status: "ready", error: "" });
      } catch {
        if (!controller.signal.aborted)
          setLeaderboardState({
            entries: [],
            status: "error",
            error: "Unable to load",
          });
      }
    };
    loadLeaderboard();
    return () => controller.abort();
  }, []);

  // Feedback handlers
  const handleFeedbackInput = (e) => {
    const { name, value } = e.target;
    setFeedbackForm((prev) => ({
      ...prev,
      [name]: name === "name" ? value.slice(0, MAX_FEEDBACK_NAME) : value,
    }));
    setFeedbackMessage("");
  };

  const handleFeedbackSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user) {
        setFeedbackMessage("Sign in first.");
        return;
      }
      const nameVal = feedbackForm.name.trim().slice(0, MAX_FEEDBACK_NAME);
      const quoteVal = feedbackForm.quote.trim().slice(0, MAX_FEEDBACK_LENGTH);
      if (!nameVal) {
        setFeedbackMessage("Add your display name.");
        return;
      }
      if (quoteVal.length < MIN_FEEDBACK_LENGTH) {
        setFeedbackMessage(
          `At least ${MIN_FEEDBACK_LENGTH} characters needed.`,
        );
        return;
      }
      setFeedbackSubmitting(true);
      try {
        await addDoc(collection(firestore, "feedback"), {
          uid: user.uid,
          authorName:
            user.displayName || user.email?.split("@")[0] || "Forum member",
          authorDisplayName: nameVal,
          authorHandle: user.email
            ? `@${user.email.split("@")[0]}`
            : `@${user.uid.slice(0, 6)}`,
          context: feedbackForm.context.trim() || "Custom setup",
          quote: quoteVal,
          createdAt: serverTimestamp(),
        });
        setFeedbackForm({ name: "", context: "", quote: "" });
        setFeedbackMessage("Submitted!");
        setFeedbackModalOpen(false);
      } catch {
        setFeedbackMessage("Unable to submit right now.");
      } finally {
        setFeedbackSubmitting(false);
      }
    },
    [feedbackForm, user],
  );

  const handleDeleteFeedback = useCallback(
    async (entryId) => {
      if (!entryId || !isAdmin) return;
      try {
        await deleteDoc(doc(firestore, "feedback", entryId));
      } catch {}
    },
    [isAdmin],
  );

  const feedbackList =
    feedbackStatus === "ready" ? feedbackEntries : feedbackShowcase;

  return (
    <>
      <HomeContent
        aboutData={aboutData}
        adminProfiles={adminProfiles}
        moderatorProfiles={moderatorProfiles}
        leaderboardState={leaderboardState}
        feedbackList={feedbackList}
        user={user}
        isAdmin={isAdmin}
        onFeedback={() =>
          user ? setFeedbackModalOpen(true) : navigate("/signin")
        }
        onDelete={handleDeleteFeedback}
      />
      {user && isFeedbackModalOpen && (
        <FeedbackModal
          feedbackForm={feedbackForm}
          feedbackMessage={feedbackMessage}
          feedbackSubmitting={feedbackSubmitting}
          onClose={() => setFeedbackModalOpen(false)}
          onInput={handleFeedbackInput}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </>
  );
}
function FeedbackModal({
  feedbackForm,
  feedbackMessage,
  feedbackSubmitting,
  onClose,
  onInput,
  onSubmit,
}) {
  const dialogRef = useCallback((node) => {
    if (node && !node.open) node.showModal();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="feedback-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="section-top">
        <h2>Share your feedback</h2>
        <button aria-label="Close feedback" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <label>
          Display name
          <input
            autoFocus
            name="name"
            required
            maxLength={MAX_FEEDBACK_NAME}
            value={feedbackForm.name}
            onChange={onInput}
          />
        </label>
        <label>
          Setup context
          <input
            name="context"
            value={feedbackForm.context}
            onChange={onInput}
          />
        </label>
        <label>
          Your feedback
          <textarea
            name="quote"
            required
            minLength={MIN_FEEDBACK_LENGTH}
            maxLength={MAX_FEEDBACK_LENGTH}
            rows={5}
            value={feedbackForm.quote}
            onChange={onInput}
          />
        </label>
        <p>
          {feedbackForm.quote.length} / {MAX_FEEDBACK_LENGTH} characters
          (minimum {MIN_FEEDBACK_LENGTH})
        </p>
        <p role="status">{feedbackMessage}</p>
        <button className="button" disabled={feedbackSubmitting}>
          {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </dialog>
  );
}
