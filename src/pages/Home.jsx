import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import Footer from '../components/Footer';
import { fetchForumApi, getForumWebBase } from '../lib/forumApi';
import { firestore } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import faqEntries from '../data/faqEntries';

const forumBaseUrl = getForumWebBase();

const LEADERBOARD_ID = 6;
const LEADERBOARD_PERIOD = 'monthly';
const LEADERBOARD_LIMIT = 3;

const adminProfiles = [
  {
    name: 'Usher Weiss',
    handle: '@TripleU',
    role: 'Forums Owner & Maintainer',
    avatar: 'https://forums.jtechforums.org/user_avatar/forums.jtechforums.org/tripleu/144/488_2.png',
    profileUrl: 'https://forums.jtechforums.org/u/tripleu',
  },
  {
    name: 'Avrumi Sternheim',
    handle: '@ars18',
    role: 'Forums Admin & Moderator',
    avatar: 'https://forums.jtechforums.org/user_avatar/forums.jtechforums.org/ars18/144/2336_2.png',
    profileUrl: 'https://forums.jtechforums.org/u/ars18',
  },
  {
    name: 'Offline Software Solutions',
    handle: '@flipadmin',
    role: 'Forum Founder & Developer',
    avatar: 'https://forums.jtechforums.org/user_avatar/forums.jtechforums.org/flipadmin/144/2891_2.png',
    profileUrl: 'https://forums.jtechforums.org/u/flipadmin',
  },
];

const resolveAvatar = (template, size = 144) => {
  if (!template) return '';
  const path = template.replace('{size}', String(size));
  return path.startsWith('http') ? path : `${forumBaseUrl}${path}`;
};

const deriveModerators = (aboutData) => {
  if (!aboutData?.about || !Array.isArray(aboutData.users)) return [];
  const modIds = new Set(aboutData.about.moderator_ids || []);
  const adminIds = new Set(aboutData.about.admin_ids || []);
  return aboutData.users
    .filter((u) => modIds.has(u.id) && !adminIds.has(u.id) && u.username?.toLowerCase() !== 'jtechbridgebot')
    .map((u) => ({
      username: u.username,
      role: u.title?.trim() || 'Forum Moderator',
      avatar: resolveAvatar(u.avatar_template),
      profileUrl: `${forumBaseUrl}/u/${encodeURIComponent(u.username)}`,
    }));
};

const feedbackShowcase = [
  {
    id: 'fb-1',
    name: 'Sara K.',
    handle: '@kosherandroid',
    context: 'Galaxy A14 + TAG Guardian',
    quote: '"The apps section walked me through every step. My phone is locked down, but still useful."',
    fromFirestore: false,
  },
  {
    id: 'fb-2',
    name: 'Eli D.',
    handle: '@flipguy',
    context: 'Nokia 2780 & Kosher config',
    quote: '"Every time I break something, the forum already has the answer. Huge time saver."',
    fromFirestore: false,
  },
  {
    id: 'fb-3',
    name: 'Malky R.',
    handle: '@techmom',
    context: 'Moto G Pure for the family',
    quote: '"Needed a safe phone setup for our teens. The guidance here kept it calm, kosher, and doable."',
    fromFirestore: false,
  },
];

const MIN_FEEDBACK_LENGTH = 40;
const MAX_FEEDBACK_LENGTH = 600;
const MAX_FEEDBACK_NAME = 32;

export default function Home() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = Boolean(profile?.isAdmin);

  // Scroll progress
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // State
  const [feedbackEntries, setFeedbackEntries] = useState(feedbackShowcase);
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackForm, setFeedbackForm] = useState({ name: '', context: '', quote: '' });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [leaderboardState, setLeaderboardState] = useState({ entries: [], status: 'idle', error: '' });
  const [aboutData, setAboutData] = useState(null);
  const [aboutStatus, setAboutStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetchForumApi('/forum/about', { signal: controller.signal });
        if (!res.ok) throw new Error('failed');
        const payload = await res.json();
        setAboutData(payload);
        setAboutStatus('ready');
      } catch {
        if (!controller.signal.aborted) setAboutStatus('error');
      }
    })();
    return () => controller.abort();
  }, []);

  const moderatorProfiles = deriveModerators(aboutData);

  // Load feedback from Firestore
  useEffect(() => {
    const feedbackRef = collection(firestore, 'feedback');
    const feedbackQuery = query(feedbackRef, orderBy('createdAt', 'desc'), limit(6));
    setFeedbackStatus('loading');
    const unsubscribe = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setFeedbackEntries(feedbackShowcase);
          setFeedbackStatus('empty');
          return;
        }
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().authorDisplayName || doc.data().authorName || 'Forum member',
          handle: doc.data().authorHandle || '@community',
          context: doc.data().context || 'Shared setup',
          quote: doc.data().quote || '',
          fromFirestore: true,
        }));
        setFeedbackEntries(docs);
        setFeedbackStatus('ready');
      },
      () => {
        setFeedbackEntries(feedbackShowcase);
        setFeedbackStatus('error');
      }
    );
    return unsubscribe;
  }, []);

  // Load leaderboard
  useEffect(() => {
    const controller = new AbortController();
    const loadLeaderboard = async () => {
      setLeaderboardState((prev) => ({ ...prev, status: 'loading' }));
      try {
        const response = await fetchForumApi(`/forum/leaderboard/${LEADERBOARD_ID}?period=${LEADERBOARD_PERIOD}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Failed');
        const payload = await response.json();
        const entries = (payload?.users || []).slice(0, LEADERBOARD_LIMIT).map((u, i) => ({
          id: u.id || `${u.username}-${i}`,
          username: u.username || `member-${i + 1}`,
          position: u.position || i + 1,
          cheers: Number(u.total_score) || 0,
          avatar: u.avatar_template ? (u.avatar_template.startsWith('http') ? u.avatar_template.replace('{size}', '160') : `${forumBaseUrl}${u.avatar_template.replace('{size}', '160')}`) : `${forumBaseUrl}/letter_avatar_proxy/v4/letter/j/ce7236/160.png`,
          profileUrl: `${forumBaseUrl}/u/${encodeURIComponent(u.username || '')}`,
        }));
        setLeaderboardState({ entries, status: 'ready', error: '' });
      } catch {
        if (!controller.signal.aborted) setLeaderboardState({ entries: [], status: 'error', error: 'Unable to load' });
      }
    };
    loadLeaderboard();
    return () => controller.abort();
  }, []);

  // Feedback handlers
  const handleFeedbackInput = (e) => {
    const { name, value } = e.target;
    setFeedbackForm((prev) => ({ ...prev, [name]: name === 'name' ? value.slice(0, MAX_FEEDBACK_NAME) : value }));
    setFeedbackMessage('');
  };

  const handleFeedbackSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!user) { setFeedbackMessage('Sign in first.'); return; }
    const nameVal = feedbackForm.name.trim().slice(0, MAX_FEEDBACK_NAME);
    const quoteVal = feedbackForm.quote.trim().slice(0, MAX_FEEDBACK_LENGTH);
    if (!nameVal) { setFeedbackMessage('Add your display name.'); return; }
    if (quoteVal.length < MIN_FEEDBACK_LENGTH) { setFeedbackMessage(`At least ${MIN_FEEDBACK_LENGTH} characters needed.`); return; }
    setFeedbackSubmitting(true);
    try {
      await addDoc(collection(firestore, 'feedback'), {
        uid: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Forum member',
        authorDisplayName: nameVal,
        authorHandle: user.email ? `@${user.email.split('@')[0]}` : `@${user.uid.slice(0, 6)}`,
        context: feedbackForm.context.trim() || 'Custom setup',
        quote: quoteVal,
        createdAt: serverTimestamp(),
      });
      setFeedbackForm({ name: '', context: '', quote: '' });
      setFeedbackMessage('Submitted!');
      setFeedbackModalOpen(false);
    } catch {
      setFeedbackMessage('Unable to submit right now.');
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackForm, user]);

  const handleDeleteFeedback = useCallback(async (entryId) => {
    if (!entryId || !isAdmin) return;
    try {
      await deleteDoc(doc(firestore, 'feedback', entryId));
    } catch {}
  }, [isAdmin]);

  const feedbackList = feedbackStatus === 'ready' ? feedbackEntries : feedbackShowcase;

  return (
    <div ref={containerRef} className="relative bg-[#030712]">
      {/* Fixed progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 z-50 origin-left"
        style={{ scaleX: smoothProgress }}
      />

      {/* ===== SECTION 1: Hero with zoom ===== */}
      <HeroSection />

      {/* ===== SECTION 2: The Problem - Zoom reveal ===== */}
      <ProblemSection />

      {/* ===== SECTION 3: The Solution - Scale up reveal ===== */}
      <SolutionSection />

      {/* ===== SECTION 4: Features with scroll animations ===== */}
      <FeaturesSection />

      {/* ===== SECTION 5: Community - Admins & Leaderboard ===== */}
      <CommunitySection
        adminProfiles={adminProfiles}
        moderatorProfiles={moderatorProfiles}
        moderatorStatus={aboutStatus}
        leaderboardState={leaderboardState}
        forumBaseUrl={forumBaseUrl}
      />

      {/* ===== SECTION 5.5: Forum Stats ===== */}
      <StatsSection aboutData={aboutData} status={aboutStatus} />

      {/* ===== SECTION 6: Testimonials ===== */}
      <TestimonialsSection
        feedbackList={feedbackList}
        user={user}
        isAdmin={isAdmin}
        onOpenModal={() => user ? setFeedbackModalOpen(true) : navigate('/signin')}
        onDelete={handleDeleteFeedback}
      />

      {/* ===== SECTION 7: FAQ ===== */}
      <FaqSection
        faqEntries={faqEntries}
        activeFaqIndex={activeFaqIndex}
        setActiveFaqIndex={setActiveFaqIndex}
      />

      {/* ===== SECTION 7.5: Search the Forums ===== */}
      <SearchForumSection forumBaseUrl={forumBaseUrl} />

      {/* ===== SECTION 8: CTA ===== */}
      <CtaSection />

      {/* ===== Footer ===== */}
      <footer className="relative z-10 border-t border-white/5 bg-[#030712]">
        <Footer />
      </footer>

      {/* Feedback Modal */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

/* ============================================
   HERO SECTION - Animated Aurora Background
============================================ */
function HeroSection() {
  const ref = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 }); // 0-1 range, center default
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Direct mouse tracking (0-1 range for position on screen)
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0f1a]">

      {/* Main gradient that follows mouse */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%,
            rgba(34, 211, 238, 0.15) 0%,
            rgba(59, 130, 246, 0.1) 25%,
            rgba(99, 102, 241, 0.08) 50%,
            transparent 70%)`,
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
      />

      {/* Secondary color bloom that follows mouse with delay */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: (mousePos.x - 0.5) * window.innerWidth * 0.5,
          y: (mousePos.y - 0.5) * window.innerHeight * 0.5,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      />

      {/* Ambient glow - top left */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 60%)',
          filter: 'blur(80px)',
          left: '-5%',
          top: '-10%',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient glow - bottom right */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
          filter: 'blur(70px)',
          right: '-5%',
          bottom: '-5%',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)"/>
        </svg>
      </div>

      {/* Soft vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10,15,26,0.4) 80%, rgba(10,15,26,0.7) 100%)',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase">
            Welcome to the community
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-display text-6xl sm:text-7xl lg:text-9xl font-bold text-white leading-[0.9] tracking-tight mb-8"
        >
          <span className="block">JTech</span>
          <motion.span
            className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            Forums
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-12"
        >
          The leading Jewish tech & filtering community.
          <span className="text-slate-500 block mt-2">Built by the community, for the community.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.a
            href="https://forums.jtechforums.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full overflow-hidden shadow-lg shadow-cyan-500/25"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(34,211,238,0.3)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">Join the Forum</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400"
              initial={{ x: '100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/guides"
              className="block px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 hover:border-white/40 transition-all backdrop-blur-sm"
            >
              Browse Guides
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-slate-500 text-xs font-mono tracking-widest uppercase">Scroll</span>
          <div className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-3 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ============================================
   PROBLEM SECTION - Dramatic zoom reveal
============================================ */
function ProblemSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  const imageRotate = useTransform(scrollYProgress, [0, 1], [3, 0]);
  const textX = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-slate-900/50 to-[#030712]" />

      {/* Red warning glow */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-red-500/10 blur-[150px]"
        style={{ opacity }}
      />

      <motion.div style={{ scale, opacity }} className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image with zoom */}
          <motion.div className="relative" style={{ scale: imageScale, rotate: imageRotate }}>
            <div className="relative rounded-3xl overflow-hidden border border-red-500/20 shadow-2xl shadow-red-500/10">
              <img src="/img/home/techie.png" alt="Confused user" className="w-full" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 to-transparent" />
            </div>
            {/* Floating badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -bottom-4 -right-4 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2 backdrop-blur-xl"
            >
              <motion.span
                className="text-red-400 font-mono text-sm"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ??? Help ???
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Text with slide */}
          <motion.div style={{ x: textX }} className="space-y-6">
            <motion.p
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-red-400 font-mono text-sm tracking-[0.2em] uppercase"
            >
              The Problem
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight"
            >
              Tech forums can be
              <span className="text-red-400"> overwhelming</span>
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 text-lg text-slate-400 leading-relaxed"
            >
              <p>
                Reddit threads go off-topic. XDA posts get buried. Stack Overflow feels intimidating.
                And none of them understand the unique needs of the frum community.
              </p>
              <p>
                You just want a straight answer about setting up a kosher phone—without wading through
                inappropriate content or irrelevant advice.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3 pt-4"
            >
              {['Off-topic noise', 'Inappropriate content', 'Outdated info', 'No moderation'].map((item, i) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-300 text-sm"
                >
                  {item}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ============================================
   SOLUTION SECTION - Browser mockup zoom in
============================================ */
function SolutionSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6], [0.6, 1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.4], [20, 0]);

  return (
    <section ref={ref} className="relative min-h-[130vh] flex items-center py-32 overflow-hidden">
      {/* Background glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-cyan-500/10 blur-[200px]"
        style={{ opacity }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div style={{ opacity, y }} className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-4"
          >
            The Solution
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto"
          >
            A forum built for
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent"> our community</span>
          </motion.h2>
        </motion.div>

        <motion.div
          style={{ scale, rotateX, transformPerspective: 1200 }}
          className="relative"
        >
          {/* Browser mockup */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/20">
            {/* Browser bar */}
            <div className="bg-slate-800/90 px-4 py-3 flex items-center gap-3 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 bg-slate-900/50 rounded-lg px-4 py-1.5 text-sm text-slate-400 font-mono">
                forums.jtechforums.org
              </div>
            </div>
            {/* Screenshot */}
            <img src="/img/forum.png" alt="JTech Forums" className="w-full" referrerPolicy="no-referrer" />
          </div>

          {/* Floating feature cards */}
          <motion.div
            initial={{ opacity: 0, x: -80, rotate: -10 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            className="absolute -left-12 top-1/4 bg-slate-900/95 border border-green-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-xl hidden lg:block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Moderated Daily</p>
                <p className="text-slate-400 text-sm">By frum volunteers</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 80, rotate: 10 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
            className="absolute -right-12 bottom-1/3 bg-slate-900/95 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-xl hidden lg:block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="7" y="2" width="10" height="20" rx="2" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Kosher-First</p>
                <p className="text-slate-400 text-sm">Family-friendly content</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-indigo-500/20 rounded-2xl px-6 py-4 backdrop-blur-xl shadow-xl hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <p className="text-white font-semibold">Safe & Trusted Community</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================
   FORUM STATS SECTION (live from /about.json)
============================================ */
const FORUM_CREATED_YEAR = 2023;

const formatStat = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return n.toLocaleString();
};

function StatsSection({ aboutData, status }) {
  const ref = useRef(null);
  const stats = aboutData?.about?.stats || null;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  const yearsActive = new Date().getFullYear() - FORUM_CREATED_YEAR;

  const cards = [
    { value: stats?.topics_7_days, label: 'topics', sub: 'in the last 7 days', accent: 'cyan' },
    { value: stats?.posts_last_day, label: 'posts', sub: 'today', accent: 'blue' },
    { value: stats?.active_users_7_days, label: 'active users', sub: 'in the last 7 days', accent: 'indigo' },
    { value: stats?.users_7_days, label: 'sign-ups', sub: 'in the last 7 days', accent: 'violet' },
  ];

  const accentMap = {
    cyan: 'from-cyan-400 to-blue-500',
    blue: 'from-blue-400 to-indigo-500',
    indigo: 'from-indigo-400 to-violet-500',
    violet: 'from-violet-400 to-fuchsia-500',
    pink: 'from-pink-400 to-rose-500',
  };

  return (
    <section ref={ref} className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-blue-950/20 to-[#030712]" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[180px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[180px]" />

      <motion.div style={{ opacity, y }} className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-4">By the Numbers</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
            JTech Forums <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">Stats</span>
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative group grow-0 shrink-0 basis-[calc(50%-0.5rem)] max-w-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)] lg:max-w-[calc(25%-0.75rem)]"
            >
              <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${accentMap[card.accent]} opacity-20 group-hover:opacity-40 transition-opacity blur-sm`} />
              <div className="relative bg-slate-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-sm h-full flex flex-col items-center text-center">
                <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-br ${accentMap[card.accent]} bg-clip-text text-transparent leading-none mb-2`}>
                  {status === 'loading' ? (
                    <span className="inline-block w-16 h-8 rounded bg-slate-800 animate-pulse" />
                  ) : (
                    formatStat(card.value)
                  )}
                </div>
                <p className="text-white font-semibold capitalize">{card.label}</p>
                <p className="text-xs text-slate-500 mt-auto pt-2">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="relative bg-gradient-to-br from-slate-900/90 to-cyan-950/30 border border-cyan-500/20 rounded-2xl p-6 overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
            <p className="text-xs font-mono uppercase tracking-wider text-cyan-400/80 mb-2">Total Real Members</p>
            <p className="text-4xl sm:text-5xl font-bold text-white leading-none">
              {status === 'loading' ? (
                <span className="inline-block w-32 h-10 rounded bg-slate-800 animate-pulse" />
              ) : (
                (stats?.users_count ?? 0).toLocaleString()
              )}{' '}
              <span className="text-lg font-medium text-slate-400">Members</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="relative bg-gradient-to-br from-slate-900/90 to-pink-950/30 border border-pink-500/20 rounded-2xl p-6 overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-pink-500/10 blur-3xl" />
            <p className="text-xs font-mono uppercase tracking-wider text-pink-400/80 mb-2">Likes</p>
            <p className="text-4xl sm:text-5xl font-bold text-white leading-none">
              {status === 'loading' ? (
                <span className="inline-block w-32 h-10 rounded bg-slate-800 animate-pulse" />
              ) : (
                formatStat(stats?.likes_count)
              )}{' '}
              <span className="text-lg font-medium text-slate-400">all time</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="relative bg-gradient-to-br from-slate-900/90 to-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <p className="text-xs font-mono uppercase tracking-wider text-indigo-400/80 mb-2">Established</p>
            <p className="text-4xl sm:text-5xl font-bold text-white leading-none">
              {FORUM_CREATED_YEAR}
              <span className="text-lg font-medium text-slate-400 ml-2">· {yearsActive} years strong</span>
            </p>
          </motion.div>
        </div>

        {status === 'error' && (
          <p className="text-center text-slate-500 text-sm mt-6">Live stats unavailable</p>
        )}
      </motion.div>
    </section>
  );
}

/* ============================================
   SEARCH THE FORUMS SECTION
============================================ */
function SearchForumSection({ forumBaseUrl }) {
  const ref = useRef(null);
  const [query, setQuery] = useState('');
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  const suggestions = ['eGate', 'TAG filter', 'Nokia 2780', 'Kosher Pixel', 'MDM setup'];
  const MIN_SEARCH_LENGTH = 3;
  const trimmedQuery = query.trim();
  const canSubmit = trimmedQuery.length >= MIN_SEARCH_LENGTH;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    window.open(
      `${forumBaseUrl}/search?q=${encodeURIComponent(trimmedQuery)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const openSuggestion = (term) => {
    window.open(`${forumBaseUrl}/search?q=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section ref={ref} className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-cyan-950/20 to-[#030712]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/10 blur-[200px]" />

      <motion.div style={{ opacity, scale }} className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <p className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-4">Search the Forums</p>
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
          Your question may already be <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">answered</span>
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
          Search thousands of threads from the JTech community — setups, troubleshooting, app recommendations, and more.
        </p>

        <form onSubmit={submit} className="relative group mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-2xl blur-xl opacity-60 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2 bg-slate-900/90 border border-white/10 rounded-2xl p-2 backdrop-blur-xl focus-within:border-cyan-500/50 transition-colors">
            <svg className="w-6 h-6 text-slate-400 ml-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “TAG Guardian” or “Nokia setup”..."
              aria-label="Search JTech Forums"
              minLength={MIN_SEARCH_LENGTH}
              className="flex-1 bg-transparent text-white placeholder-slate-500 px-2 py-3 focus:outline-none text-base"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 sm:px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.03] active:scale-95 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              Search
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-left pl-2 h-4">
            {trimmedQuery.length > 0 && !canSubmit
              ? `Enter at least ${MIN_SEARCH_LENGTH} characters (${MIN_SEARCH_LENGTH - trimmedQuery.length} more)`
              : ''}
          </p>
        </form>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <span className="text-slate-500 text-sm self-center mr-1">Popular:</span>
          {suggestions.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => openSuggestion(term)}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-full text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>

        <a
          href={`${forumBaseUrl}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <span>Or browse the full forum</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </motion.div>
    </section>
  );
}

/* ============================================
   HORIZONTAL SCROLL FEATURES SECTION
============================================ */
gsap.registerPlugin(ScrollTrigger);

function FeaturesSection() {
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);
  const cardsRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const features = [
    {
      title: 'Step-by-Step Guides',
      description: 'Detailed walkthroughs for every device and setup. From flip phones to smartphones, we\'ve got you covered.',
      image: '/img/guides.png',
      color: 'cyan',
      link: '/guides',
    },
    {
      title: 'Curated App Library',
      description: 'Trusted, safe apps vetted by the community. No mystery APKs—just apps that work.',
      image: '/img/home/gps.webp',
      color: 'green',
      link: '/apps',
    },
    {
      title: 'eGate Filter Support',
      description: 'Enterprise-grade filtering solutions with dedicated community support and setup guides.',
      image: '/img/home/egatesquare.png',
      color: 'indigo',
      link: '/egate',
    },
    {
      title: 'Filter Installer',
      description: 'A simple place to install all kosher MDMs, simplified for even someone without any filtering knowledge.',
      image: '/img/home/mdm-installer.png',
      color: 'violet',
      link: 'https://installer.jtechforums.org/',
      external: true,
      hasBackground: true,
    },
  ];

  const colorMap = {
    cyan: { border: 'border-cyan-500/30', glow: 'bg-cyan-500/30', text: 'text-cyan-400' },
    green: { border: 'border-green-500/30', glow: 'bg-green-500/30', text: 'text-green-400' },
    indigo: { border: 'border-indigo-500/30', glow: 'bg-indigo-500/30', text: 'text-indigo-400' },
    violet: { border: 'border-violet-500/30', glow: 'bg-violet-500/30', text: 'text-violet-400' },
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current;
    if (!section || !cards) return;

    // Calculate how far to scroll horizontally
    const getScrollAmount = () => {
      const cardsWidth = cards.scrollWidth;
      const viewportWidth = window.innerWidth;
      return -(cardsWidth - viewportWidth + viewportWidth * 0.05);
    };

    const ctx = gsap.context(() => {
      // Base scroll distance for horizontal movement
      const baseScrollDistance = Math.abs(getScrollAmount());
      // Add extra scroll distance for pause at end (1700px worth of scrolling where nothing moves)
      const totalScrollDistance = baseScrollDistance + 1700;

      // Use a custom ease that stops the animation at ~85% progress
      // This means the last 15% of scrolling will have no horizontal movement (pause effect)
      gsap.to(cards, {
        x: getScrollAmount,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: () => `+=${totalScrollDistance}`,
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Calculate effective progress - movement stops at 85%
            const moveProgress = Math.min(self.progress / 0.85, 1);

            // Update active index based on movement progress
            const newIndex = Math.min(
              features.length - 1,
              Math.floor(moveProgress * features.length)
            );
            setActiveIndex(newIndex);

            // Manually clamp the x position so it doesn't overshoot
            if (self.progress > 0.85) {
              gsap.set(cards, { x: getScrollAmount() });
            }
          },
          onLeave: () => {
            // Refresh ScrollTrigger when leaving to fix downstream section calculations
            ScrollTrigger.refresh();
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, [features.length]);

  return (
    <section ref={sectionRef} className="relative">
      <div ref={triggerRef} className="h-screen flex items-center overflow-hidden bg-[#030712]">
        {/* Header */}
        <div className="absolute top-16 left-0 right-0 z-10 text-center px-6">
          <p className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-2">What You'll Find</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Everything in one place</h2>
        </div>

        {/* Horizontal scrolling cards */}
        <div ref={cardsRef} className="flex gap-6 pl-[5%]">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="relative flex-shrink-0 w-[85vw] sm:w-[70vw] lg:w-[45vw] h-[65vh] flex items-center"
            >
              <div className="w-full grid lg:grid-cols-5 gap-6 lg:gap-10 items-center">
                {/* Image - takes 3 columns - all boxes same size */}
                <div className="lg:col-span-3 relative">
                  <div className={`absolute -inset-8 ${colorMap[feature.color].glow} blur-[60px] opacity-40`} />
                  <div className={`relative rounded-2xl overflow-hidden border ${colorMap[feature.color].border} shadow-2xl h-[280px] sm:h-[320px] lg:h-[360px] ${feature.hasBackground ? 'bg-gradient-to-br from-slate-900 via-violet-950/50 to-slate-900' : ''}`}>
                    {index === 0 ? (
                      /* Box 1: Scrolling animation - image taller than container */
                      <img
                        src={feature.image}
                        alt={feature.title}
                        referrerPolicy="no-referrer"
                        className="w-full animate-pan-vertical"
                      />
                    ) : feature.hasBackground ? (
                      /* Box 4: Centered smaller image with background */
                      <div className="flex items-center justify-center h-full p-10">
                        <img
                          src={feature.image}
                          alt={feature.title}
                          referrerPolicy="no-referrer"
                          className="max-h-[65%] max-w-[65%] object-contain drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                        />
                      </div>
                    ) : (
                      /* Boxes 2 & 3: Standard full cover */
                      <img
                        src={feature.image}
                        alt={feature.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {/* Number badge */}
                  <div className={`absolute -top-4 -left-4 w-14 h-14 rounded-xl bg-slate-900/90 border ${colorMap[feature.color].border} flex items-center justify-center backdrop-blur-xl`}>
                    <span className={`text-2xl font-bold ${colorMap[feature.color].text}`}>0{index + 1}</span>
                  </div>
                </div>

                {/* Text - takes 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-base text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                  {feature.external ? (
                    <a
                      href={feature.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 ${colorMap[feature.color].text} font-semibold hover:opacity-80 transition-opacity`}
                    >
                      <span>Explore</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  ) : (
                    <Link
                      to={feature.link}
                      className={`inline-flex items-center gap-2 ${colorMap[feature.color].text} font-semibold hover:opacity-80 transition-opacity`}
                    >
                      <span>Explore</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-3">
          {features.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-opacity duration-300 ${
                index <= activeIndex ? 'bg-cyan-400 opacity-100' : 'bg-cyan-400 opacity-30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   MODERATOR CAROUSEL - Native scroll-snap + arrow controls
============================================ */
function ModeratorCarousel({ moderators, status, forumBaseUrl, cardsRef }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth - clientWidth;
    setHasOverflow(overflow > 4);
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < overflow - 4);
    setScrollProgress(overflow > 0 ? Math.min(scrollLeft / overflow, 1) : 0);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, moderators.length]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const cardEl = el.querySelector('[data-mod-card]');
    const cardWidth = cardEl ? cardEl.getBoundingClientRect().width + 16 : 280;
    el.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  };

  const isLoading = status === 'loading' || (status === 'ready' && moderators.length === 0);
  const skeletonCount = 5;

  return (
    <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-emerald-950/20 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center text-emerald-300 ring-1 ring-emerald-500/30">
            <svg className="w-6 h-6" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
              <path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8l0 0z"/>
            </svg>
          </span>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Our Moderators</h3>
            <p className="text-sm text-slate-400 mt-0.5">Keeping the conversation kosher{hasOverflow ? ' · swipe to meet the team' : ''}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${hasOverflow ? '' : 'hidden'}`}>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label="Previous moderators"
            className="hidden sm:inline-flex w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10 disabled:hover:text-white items-center justify-center transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label="Next moderators"
            className="hidden sm:inline-flex w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10 disabled:hover:text-white items-center justify-center transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative -mx-2 px-2 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading && Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={`mod-skel-${i}`}
            className="snap-start grow-0 shrink-0 basis-[78%] sm:basis-[44%] md:basis-[32%] lg:basis-[23%] rounded-3xl bg-slate-800/40 border border-white/5 p-5 animate-pulse h-[212px]"
          />
        ))}

        {!isLoading && status === 'error' && (
          <p className="text-slate-400 text-sm py-8 px-2">Couldn't load moderators right now.</p>
        )}

        {!isLoading && moderators.map((mod, i) => (
          <a
            key={mod.username}
            ref={el => { if (cardsRef) cardsRef.current[i] = el; }}
            data-mod-card
            href={mod.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-start group relative grow-0 shrink-0 basis-[78%] sm:basis-[44%] md:basis-[32%] lg:basis-[23%] rounded-3xl bg-slate-800/40 border border-white/10 p-5 overflow-hidden hover:border-emerald-500/40 transition-all"
          >
            {/* Card glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/10 group-hover:via-emerald-500/5 group-hover:to-teal-500/10 transition-all" />

            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/40 to-teal-500/40 blur-md group-hover:blur-lg transition-all" />
                <img
                  src={mod.avatar}
                  alt={mod.username}
                  className="relative w-20 h-20 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-emerald-400/60 transition-all"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="font-semibold text-white group-hover:text-emerald-200 transition-colors truncate max-w-full">@{mod.username}</p>
              <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-2 min-h-[2rem]">{mod.role}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-400/80 group-hover:text-emerald-300 transition-colors">
                View profile
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Progress indicator — only shown when content actually overflows */}
      {!isLoading && hasOverflow && (
        <div className="relative flex items-center gap-3 mt-5">
          <span
            className="flex items-center gap-1.5 text-xs font-mono text-emerald-300/70 whitespace-nowrap transition-opacity duration-300"
            style={{ opacity: scrollProgress < 0.05 ? 1 : 0 }}
            aria-hidden="true"
          >
            Swipe
            <svg className="w-3.5 h-3.5 animate-[pulse_1.5s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
          <div className="relative flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-[width] duration-150 ease-out"
              style={{ width: `${Math.max(scrollProgress * 100, 6)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   COMMUNITY SECTION - Uses GSAP ScrollTrigger for animations
============================================ */
function CommunitySection({ adminProfiles, moderatorProfiles, moderatorStatus, leaderboardState, forumBaseUrl }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const leftColRef = useRef(null);
  const middleColRef = useRef(null);
  const rightColRef = useRef(null);
  const adminCardsRef = useRef([]);
  const moderatorCardsRef = useRef([]);
  const leaderboardCardsRef = useRef([]);
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
            onEnter: () => setIsVisible(true),
          },
        }
      );

      // Left column slide in
      gsap.fromTo(leftColRef.current,
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Right column slide in
      gsap.fromTo(rightColRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Admin cards stagger
      gsap.fromTo(adminCardsRef.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Moderator carousel container fade up
      gsap.fromTo(middleColRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  // Animate leaderboard cards when data loads
  useLayoutEffect(() => {
    if (leaderboardState.status !== 'ready' || !isVisible) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(leaderboardCardsRef.current.filter(Boolean),
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.15,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, [leaderboardState.status, isVisible]);

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-indigo-950/20 to-[#030712]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-indigo-500/10 blur-[200px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <p className="text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase mb-4">The People</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white">
            You're in good hands
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Admins */}
          <div ref={leftColRef} className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm opacity-0">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <svg className="w-5 h-5" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
                  <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z"/>
                </svg>
              </span>
              Forum Leaders
            </h3>
            <div className="space-y-4">
              {adminProfiles.map((admin, i) => (
                <a
                  key={admin.name}
                  ref={el => adminCardsRef.current[i] = el}
                  href={admin.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-indigo-500/30 hover:scale-[1.02] hover:translate-x-2 transition-all group opacity-0"
                >
                  <img
                    src={admin.avatar}
                    alt={admin.name}
                    className="w-14 h-14 rounded-xl object-cover"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{admin.name}</p>
                    <p className="text-sm text-slate-500">{admin.handle}</p>
                    <p className="text-sm text-slate-400 mt-1">{admin.role}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div ref={rightColRef} className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm opacity-0">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
                  <path d="M400 0H176c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8H24C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H384c17.7 0 32-14.3 32-32s-14.3-32-32-32H357.9C337 448 320 431 320 410.1c0-19.6 16-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24H446.4c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112h84.4c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63.1-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6h84.4c-5.1 66.3-31.1 111.2-63.1 142.3z"/>
                </svg>
              </span>
              Top Contributors
            </h3>
            <div className="space-y-4">
              {leaderboardState.status === 'loading' && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-slate-800/50 animate-pulse" />
                  ))}
                </div>
              )}
              {leaderboardState.status === 'ready' && leaderboardState.entries.map((entry, i) => (
                <a
                  key={entry.id}
                  ref={el => leaderboardCardsRef.current[i] = el}
                  href={entry.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-amber-500/30 hover:scale-[1.02] hover:-translate-x-2 transition-all group opacity-0"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-amber-500/20 text-amber-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                    'bg-orange-600/20 text-orange-400'
                  }`}>
                    #{entry.position}
                  </div>
                  <img
                    src={entry.avatar}
                    alt={entry.username}
                    className="w-12 h-12 rounded-xl object-cover"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white group-hover:text-amber-300 transition-colors">@{entry.username}</p>
                    <p className="text-sm text-slate-400">{entry.cheers.toLocaleString()} cheers</p>
                  </div>
                </a>
              ))}
              {leaderboardState.status === 'error' && (
                <p className="text-slate-400 text-center py-8">Unable to load leaderboard</p>
              )}
            </div>
            <a
              href={`${forumBaseUrl}/leaderboard/${LEADERBOARD_ID}?period=${LEADERBOARD_PERIOD}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-indigo-400 hover:text-indigo-300 mt-6 transition-colors"
            >
              View full leaderboard →
            </a>
          </div>
        </div>

        {/* Moderators carousel */}
        <div ref={middleColRef} className="mt-8 opacity-0">
          <ModeratorCarousel
            moderators={moderatorProfiles}
            status={moderatorStatus}
            forumBaseUrl={forumBaseUrl}
            cardsRef={moderatorCardsRef}
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================
   TESTIMONIALS SECTION - Uses GSAP ScrollTrigger for animations
============================================ */
function TestimonialsSection({ feedbackList, user, isAdmin, onOpenModal, onDelete }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Cards stagger animation
      gsap.fromTo(cardsRef.current.filter(Boolean),
        { opacity: 0, y: 60, rotateX: 20 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [feedbackList]);

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-slate-900/30 to-[#030712]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 opacity-0">
          <div>
            <p className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-4">Community Stories</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white">
              Real feedback
            </h2>
          </div>
          <button
            onClick={onOpenModal}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white font-semibold hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all"
          >
            {user ? 'Share your story' : 'Sign in to share'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbackList.map((entry, i) => (
            <article
              key={entry.id}
              ref={el => cardsRef.current[i] = el}
              className="relative bg-slate-900/50 border border-white/5 rounded-3xl p-6 hover:border-cyan-500/20 hover:-translate-y-2 hover:scale-[1.02] transition-all group opacity-0"
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            >
              {isAdmin && entry.fromFirestore && (
                <button
                  onClick={() => onDelete(entry.id)}
                  className="absolute top-4 right-4 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              )}
              <p className="text-cyan-400/60 font-mono text-xs uppercase tracking-wider mb-4">{entry.context}</p>
              <p className="text-slate-200 text-lg leading-relaxed mb-6">{entry.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center text-white font-bold">
                  {entry.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{entry.name}</p>
                  <p className="text-sm text-slate-500">{entry.handle}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FAQ SECTION - Uses GSAP ScrollTrigger for animations
============================================ */
function FaqSection({ faqEntries, activeFaqIndex, setActiveFaqIndex }) {
  const displayedFaqs = faqEntries.slice(0, 6);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const faqItemsRef = useRef([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // FAQ items stagger with alternating direction
      faqItemsRef.current.forEach((item, i) => {
        if (!item) return;
        gsap.fromTo(item,
          { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 65%',
              toggleActions: 'play none none none',
            },
            delay: i * 0.08,
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, [displayedFaqs.length]);

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] to-slate-900/50" />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <div ref={headerRef} className="text-center mb-12 opacity-0">
          <p className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-4">FAQ</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white">
            Quick answers
          </h2>
        </div>

        <div className="space-y-4">
          {displayedFaqs.map((faq, i) => (
            <div
              key={i}
              ref={el => faqItemsRef.current[i] = el}
              className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden opacity-0"
            >
              <button
                onClick={() => setActiveFaqIndex(activeFaqIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-semibold text-white pr-4">{faq.question}</span>
                <span
                  className={`text-cyan-400 text-xl flex-shrink-0 transition-transform duration-300 ${activeFaqIndex === i ? 'rotate-45' : ''}`}
                >
                  +
                </span>
              </button>
              <AnimatePresence>
                {activeFaqIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="px-6 pb-6 text-slate-400 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   CTA SECTION - Uses GSAP ScrollTrigger for animations
============================================ */
function CtaSection() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const headingRef = useRef(null);
  const highlightRef = useRef(null);
  const descRef = useRef(null);
  const buttonsRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Content container scale and fade
      gsap.fromTo(contentRef.current,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Heading
      gsap.fromTo(headingRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Highlight text
      gsap.fromTo(highlightRef.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Description
      gsap.fromTo(descRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Buttons
      gsap.fromTo(buttonsRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 55%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-40 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] rounded-full bg-cyan-500/20 blur-[200px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div ref={contentRef} className="relative z-10 max-w-4xl mx-auto px-6 text-center opacity-0">
        <div className="space-y-8">
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
            <span ref={headingRef} className="block opacity-0">Ready to join the</span>
            <span
              ref={highlightRef}
              className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent opacity-0"
            >
              community?
            </span>
          </h2>
          <p ref={descRef} className="text-xl text-slate-400 max-w-2xl mx-auto opacity-0">
            Thousands of community members are already sharing guides, troubleshooting setups, and helping each other stay connected—safely.
          </p>
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 justify-center pt-4 opacity-0">
            <a
              href="https://forums.jtechforums.org"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-10 py-5 bg-white text-slate-900 font-bold text-lg rounded-full overflow-hidden hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="relative z-10">Join JTech Forums</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-blue-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            </a>
            <Link
              to="/contact"
              className="block px-10 py-5 border border-white/20 text-white font-bold text-lg rounded-full hover:bg-white/5 hover:border-white/40 hover:scale-105 active:scale-95 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FEEDBACK MODAL
============================================ */
function FeedbackModal({ feedbackForm, feedbackMessage, feedbackSubmitting, onClose, onInput, onSubmit }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Share your feedback</h3>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            &times;
          </motion.button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Display name</label>
            <input
              name="name"
              value={feedbackForm.name}
              onChange={onInput}
              placeholder="e.g. Usher W."
              maxLength={MAX_FEEDBACK_NAME}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Setup context</label>
            <input
              name="context"
              value={feedbackForm.context}
              onChange={onInput}
              placeholder="e.g. Pixel 8a + TAG Guardian"
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Your feedback</label>
            <textarea
              name="quote"
              value={feedbackForm.quote}
              onChange={onInput}
              rows={4}
              placeholder="Share your experience..."
              maxLength={MAX_FEEDBACK_LENGTH}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              {feedbackForm.quote.length < MIN_FEEDBACK_LENGTH
                ? `${MIN_FEEDBACK_LENGTH - feedbackForm.quote.length} more characters needed`
                : `${MAX_FEEDBACK_LENGTH - feedbackForm.quote.length} characters remaining`}
            </p>
          </div>

          {feedbackMessage && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-cyan-400"
            >
              {feedbackMessage}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={feedbackSubmitting || feedbackForm.quote.trim().length < MIN_FEEDBACK_LENGTH || !feedbackForm.name.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
