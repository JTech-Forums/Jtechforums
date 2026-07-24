import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { sendEmailVerification, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, firestore, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const MAX_FORM_LIMITS = {
  name: 72,
  username: 32,
  header: 160,
  description: 1200,
};

const initialForm = {
  name: '',
  username: '',
  header: '',
  description: '',
  forumUrl: '',
};

const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

const ICON_TILE_GRADIENTS = [
  'from-sky-500/80 to-indigo-600/80',
  'from-cyan-500/80 to-sky-600/80',
  'from-indigo-500/80 to-violet-600/80',
  'from-teal-500/80 to-cyan-600/80',
  'from-blue-500/80 to-indigo-600/80',
];

function letterOf(name) {
  const c = (name || '').trim().charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

function tileGradient(name) {
  let h = 0;
  for (const ch of name || '?') h = (h * 31 + ch.charCodeAt(0)) % 997;
  return ICON_TILE_GRADIENTS[h % ICON_TILE_GRADIENTS.length];
}

function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function formatDate(createdAt) {
  if (!createdAt?.toDate) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(createdAt.toDate());
}

function AppIcon({ app, size = 'h-12 w-12', rounded = 'rounded-xl', textSize = 'text-lg' }) {
  const [broken, setBroken] = useState(false);
  if (app.iconUrl && !broken) {
    return (
      <img
        src={app.iconUrl}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className={`${size} ${rounded} shrink-0 bg-slate-900 object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`${size} ${rounded} flex shrink-0 items-center justify-center bg-gradient-to-br ${tileGradient(app.name)} font-display ${textSize} font-semibold text-white/90`}
      aria-hidden="true"
    >
      {(app.name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function Apps() {
  const { user, loading, profile } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [approvedApps, setApprovedApps] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [formValues, setFormValues] = useState(initialForm);
  const [files, setFiles] = useState({ icon: null, apk: null });
  const [submissionStatus, setSubmissionStatus] = useState({ state: 'idle', message: '' });
  const [uploadProgress, setUploadProgress] = useState({ icon: 0, apk: 0 });
  const [moderationMessage, setModerationMessage] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const searchRef = useRef(null);

  const isAdmin = Boolean(profile?.isAdmin || user?.email === ADMIN_EMAIL);

  useEffect(() => {
    setCatalogReady(false);
    setCatalogLoading(true);
    const appsRef = collection(firestore, 'apps');
    const approvedQuery = query(appsRef, where('status', '==', 'approved'));
    const unsubApproved = onSnapshot(approvedQuery, (snapshot) => {
      setApprovedApps(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      setCatalogLoading(false);
    });

    let unsubPending = () => {};
    if (isAdmin) {
      const pendingQuery = query(appsRef, where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
      unsubPending = onSnapshot(pendingQuery, (snapshot) => {
        setPendingApps(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      });
    } else {
      setPendingApps([]);
    }

    return () => {
      unsubApproved();
      unsubPending();
    };
  }, [user?.email, isAdmin]);

  // "/" focuses search
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape') setSelectedApp(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sortedApps = useMemo(
    () => [...approvedApps].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [approvedApps]
  );

  const categories = useMemo(() => {
    const counts = new Map();
    for (const app of sortedApps) {
      const c = app.sourceCategory || 'Community';
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sortedApps]);

  const filteredApps = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortedApps.filter((app) => {
      if (category !== 'All' && (app.sourceCategory || 'Community') !== category) return false;
      if (!term) return true;
      return [app.name, app.header, app.description, app.username, app.version]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    });
  }, [sortedApps, search, category]);

  const groupedApps = useMemo(() => {
    const groups = new Map();
    for (const app of filteredApps) {
      const letter = letterOf(app.name);
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push(app);
    }
    return groups;
  }, [filteredApps]);

  const activeLetters = useMemo(() => new Set(groupedApps.keys()), [groupedApps]);

  const totalBytes = useMemo(
    () => sortedApps.reduce((sum, app) => sum + (app.fileSize || 0), 0),
    [sortedApps]
  );

  const scrollToLetter = (letter) => {
    document.getElementById(`letter-${letter === '#' ? 'num' : letter}`)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    const limit = MAX_FORM_LIMITS[name];
    const nextValue = typeof limit === 'number' ? value.slice(0, limit) : value;
    setFormValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleFileChange = (event) => {
    const { name, files: list } = event.target;
    setFiles((prev) => ({ ...prev, [name]: list?.[0] || null }));
  };

  const handleFileDrop = (name, file) => {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [name]: file }));
  };

  const uploadFile = (path, file, key) =>
    new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress((prev) => ({ ...prev, [key]: percent }));
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });

  const handleAppSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setSubmissionStatus({ state: 'error', message: 'Sign in before submitting.' });
      return;
    }
    if (!user.emailVerified) {
      setSubmissionStatus({ state: 'error', message: 'Verify your email first.' });
      return;
    }
    if (!files.icon || !files.apk) {
      setSubmissionStatus({ state: 'error', message: 'Upload both an icon and APK.' });
      return;
    }

    setSubmissionStatus({ state: 'loading', message: 'Uploading files...' });
    setUploadProgress({ icon: 0, apk: 0 });
    try {
      const safe = (value) => value.trim();
      const normalizedUsername = safe(formValues.username).startsWith('@')
        ? safe(formValues.username)
        : `@${safe(formValues.username)}`;
      const normalizedLink = formValues.forumUrl?.startsWith('http')
        ? formValues.forumUrl.trim()
        : `https://${formValues.forumUrl.trim()}`;

      const timestamp = Date.now();
      const iconPath = `app-icons/${user.uid}/${timestamp}-${files.icon.name.replace(/\s+/g, '-')}`;
      const apkPath = `app-apks/${user.uid}/${timestamp}-${files.apk.name.replace(/\s+/g, '-')}`;

      const [iconUrl, apkUrl] = await Promise.all([
        uploadFile(iconPath, files.icon, 'icon'),
        uploadFile(apkPath, files.apk, 'apk'),
      ]);

      await addDoc(collection(firestore, 'apps'), {
        name: safe(formValues.name),
        username: normalizedUsername,
        header: safe(formValues.header),
        description: safe(formValues.description),
        forumUrl: normalizedLink,
        iconUrl,
        iconPath,
        apkUrl,
        apkPath,
        fileSize: files.apk.size,
        uploaderUid: user.uid,
        uploaderEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setFormValues(initialForm);
      setFiles({ icon: null, apk: null });
      setSubmissionStatus({ state: 'success', message: 'Submitted for review. Thanks!' });
      setUploadProgress({ icon: 0, apk: 0 });
    } catch (error) {
      console.error(error);
      setSubmissionStatus({ state: 'error', message: error.message || 'Unable to submit app.' });
    }
  };

  const handleModeration = async (appId, status) => {
    try {
      await updateDoc(doc(firestore, 'apps', appId), {
        status,
        reviewerEmail: user.email,
        reviewedAt: serverTimestamp(),
      });
      setModerationMessage(`App ${status}.`);
    } catch (error) {
      setModerationMessage(error.message || 'Unable to update submission.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setVerificationMessage('Verification email sent. Check your inbox.');
    } catch (error) {
      setVerificationMessage(error.message);
    }
  };

  useEffect(() => {
    if (catalogLoading) {
      setCatalogReady(false);
      return undefined;
    }
    const timeout = setTimeout(() => setCatalogReady(true), 400);
    return () => clearTimeout(timeout);
  }, [catalogLoading]);

  const renderSubmissionSection = () => {
    if (loading) {
      return <p className="text-sm text-slate-300">Checking your account...</p>;
    }
    if (!user) {
      return (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-white">Share your build</h2>
          <p className="text-sm text-slate-200">
            You need a verified account before uploading APKs.{' '}
            <Link to="/signin" className="text-sky-300 underline">
              Go to sign in
            </Link>
            .
          </p>
        </div>
      );
    }
    if (!user.emailVerified) {
      return (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-white">Verify your email</h2>
          <p className="text-sm text-slate-200">
            We sent a link to <span className="font-semibold">{user.email}</span>. Once verified, revisit this page to unlock uploads.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              onClick={handleResendVerification}
            >
              Resend verification email
            </button>
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
          {verificationMessage && <p className="text-sm text-white">{verificationMessage}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Share your build</h2>
            <p className="text-sm text-slate-300">Signed in as {user.email}</p>
          </div>
          <button
            type="button"
            className="w-full rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 sm:w-auto"
            onClick={() => setShowSubmissionForm((prev) => !prev)}
          >
            {showSubmissionForm ? 'Hide form' : 'Open submission'}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Need to upload an APK?</p>
              <p className="text-xs text-slate-400">
                Keep icons ≤2MB, link your forum post, and wait for the admin review queue to approve.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmissionForm((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <span>{showSubmissionForm ? 'Collapse' : 'Expand form'}</span>
              <i className={`fa-solid ${showSubmissionForm ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`} />
            </button>
          </div>
          <AnimatePresence initial={false}>
            {showSubmissionForm && (
              <motion.form
                className="mt-6 space-y-4"
                onSubmit={handleAppSubmit}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="App name"
                    name="name"
                    value={formValues.name}
                    onChange={handleFormChange}
                    required
                    maxLength={MAX_FORM_LIMITS.name}
                  />
                  <InputField
                    label="JTech username"
                    name="username"
                    value={formValues.username}
                    onChange={handleFormChange}
                    placeholder="@you"
                    required
                  />
                </div>
                <InputField
                  label="One-line summary"
                  name="header"
                  value={formValues.header}
                  onChange={handleFormChange}
                  placeholder="What does it do?"
                  required
                />
                <div>
                  <label className="text-sm font-semibold text-white" htmlFor="description">
                    More info
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    required
                    value={formValues.description}
                    onChange={handleFormChange}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {formValues.description.length}/{MAX_FORM_LIMITS.description} characters
                  </p>
                </div>
                <InputField
                  label="Guide or forum link"
                  name="forumUrl"
                  value={formValues.forumUrl}
                  onChange={handleFormChange}
                  placeholder="https://forums.jtechforums.org/..."
                  required
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FileField
                    label="App icon"
                    name="icon"
                    accept="image/png,image/jpeg,image/webp"
                    file={files.icon}
                    onChange={handleFileChange}
                    onDropFile={handleFileDrop}
                    helper="PNG/JPG/WebP • 1024×1024 preferred • < 2 MB"
                    progress={uploadProgress.icon}
                  />
                  <FileField
                    label="APK file"
                    name="apk"
                    accept=".apk"
                    file={files.apk}
                    onChange={handleFileChange}
                    onDropFile={handleFileDrop}
                    helper="Signed release build • max 200 MB"
                    progress={uploadProgress.apk}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submissionStatus.state === 'loading'}
                  className="w-full rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
                >
                  {submissionStatus.state === 'loading' ? 'Submitting…' : 'Submit for review'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        {submissionStatus.message && (
          <p className={`text-sm ${submissionStatus.state === 'error' ? 'text-rose-200' : 'text-emerald-300'}`}>
            {submissionStatus.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <PageLoader show={!catalogReady} label="Loading catalog" />
      <div
        className={`mx-auto max-w-6xl space-y-10 px-6 py-12 transition-opacity duration-500 ${catalogReady ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        {/* ------------------------------------------------ header */}
        <section>
          <p className="section-label text-xs uppercase text-sky-200">APK directory</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
              Community App Catalog
            </h1>
            <p className="font-mono text-xs text-slate-400">
              {sortedApps.length} packages
              {totalBytes > 0 && <> · {(totalBytes / 1e9).toFixed(1)} GB</>}
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-base text-slate-300">
            Every APK shared on the forums, indexed A to Z. Built and vetted by community members
            for kosher flip phones, filtered Android devices, and everything in between.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <label className="relative block" htmlFor="catalog-search">
              <span className="sr-only">Search apps</span>
              <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" />
              <input
                id="catalog-search"
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, purpose, or uploader…"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-14 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:block">
                /
              </kbd>
            </label>
            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <CategoryChip
                label="All"
                count={sortedApps.length}
                active={category === 'All'}
                onClick={() => setCategory('All')}
              />
              {categories.map(([name, count]) => (
                <CategoryChip
                  key={name}
                  label={name}
                  count={count}
                  active={category === name}
                  onClick={() => setCategory(name)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ directory */}
        <section className="flex gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            {filteredApps.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                <p className="text-slate-300">No apps match your search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategory('All');
                  }}
                  className="mt-3 text-sm text-sky-300 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              [...groupedApps.entries()].map(([letter, apps]) => (
                <div key={letter} id={`letter-${letter === '#' ? 'num' : letter}`} className="scroll-mt-24">
                  <div className="relative py-6">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 select-none font-display text-[7rem] font-bold leading-none text-white/[0.04]"
                    >
                      {letter}
                    </span>
                    <div className="relative flex items-baseline gap-3 pl-6">
                      <h2 className="font-display text-2xl font-semibold text-sky-200">{letter}</h2>
                      <span className="font-mono text-[11px] text-slate-500">
                        {apps.length} {apps.length === 1 ? 'app' : 'apps'}
                      </span>
                      <div className="h-px flex-1 self-center bg-gradient-to-r from-sky-400/30 to-transparent" />
                    </div>
                  </div>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {apps.map((app) => (
                      <li key={app.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="group flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 motion-reduce:hover:translate-y-0"
                        >
                          <AppIcon app={app} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className="truncate font-display text-base font-semibold text-white">
                                {app.name}
                              </span>
                              {app.version && (
                                <span className="shrink-0 rounded border border-sky-400/30 bg-sky-400/10 px-1.5 py-px font-mono text-[10px] text-sky-200">
                                  {app.version}
                                </span>
                              )}
                            </span>
                            {app.header && (
                              <span className="mt-0.5 line-clamp-2 block text-sm text-slate-300">{app.header}</span>
                            )}
                            <span className="mt-1.5 block truncate font-mono text-[11px] text-slate-500">
                              {app.username}
                              {formatSize(app.fileSize) && <> · {formatSize(app.fileSize)}</>}
                              {formatDate(app.createdAt) && <> · {formatDate(app.createdAt)}</>}
                              {app.versions?.length > 0 && <> · {app.versions.length + 1} builds</>}
                            </span>
                          </span>
                          <i
                            className="fa-solid fa-arrow-right mt-1 shrink-0 text-xs text-slate-600 transition group-hover:text-sky-300"
                            aria-hidden="true"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          {/* A–Z rail */}
          <nav
            aria-label="Jump to letter"
            className="sticky top-24 hidden h-fit flex-col items-center gap-px self-start lg:flex"
          >
            {ALPHABET.map((letter) => {
              const active = activeLetters.has(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={!active}
                  onClick={() => scrollToLetter(letter)}
                  className={`w-7 rounded py-0.5 text-center font-mono text-[11px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
                    active ? 'text-sky-300 hover:bg-sky-400/10 hover:text-white' : 'cursor-default text-slate-700'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </nav>
        </section>

        {/* ------------------------------------------------ submission */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/30">
          {renderSubmissionSection()}
        </section>

        {/* ------------------------------------------------ admin queue */}
        {user?.email === ADMIN_EMAIL && (
          <section className="rounded-3xl border border-amber-300/30 bg-amber-300/5 p-6 shadow-lg shadow-amber-900/20">
            <h2 className="font-display text-2xl font-semibold text-white">Admin review queue</h2>
            <p className="mt-2 text-sm text-amber-100">Only admins can see this section.</p>
            {moderationMessage && <p className="mt-3 text-sm text-white">{moderationMessage}</p>}
            {pendingApps.length === 0 ? (
              <p className="mt-4 text-sm text-white/80">No pending submissions.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {pendingApps.map((app) => (
                  <article key={app.id} className="rounded-2xl border border-white/20 bg-black/30 p-4">
                    <div className="flex flex-col gap-2 text-sm text-white">
                      <p className="text-lg font-semibold">{app.name}</p>
                      <p>{app.header}</p>
                      <p className="text-xs text-white/70">
                        Submitted by {app.username} ({app.uploaderEmail})
                      </p>
                      {app.forumUrl && (
                        <a href={app.forumUrl} target="_blank" rel="noopener" className="text-sky-300 underline">
                          Forum / guide link
                        </a>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                        onClick={() => handleModeration(app.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                        onClick={() => handleModeration(app.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ------------------------------------------------ detail overlay */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selectedApp.name}
              className="glass-panel max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <AppIcon app={selectedApp} size="h-16 w-16" rounded="rounded-2xl" textSize="text-2xl" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-semibold text-white">{selectedApp.name}</h2>
                  {selectedApp.header && <p className="mt-1 text-sm text-slate-300">{selectedApp.header}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  aria-label="Close"
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {selectedApp.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-200">
                  {selectedApp.description}
                </p>
              )}

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-[11px]">
                <MetaItem label="Uploaded by" value={selectedApp.username} />
                {selectedApp.version && <MetaItem label="Version" value={selectedApp.version} />}
                {formatSize(selectedApp.fileSize) && <MetaItem label="Size" value={formatSize(selectedApp.fileSize)} />}
                {formatDate(selectedApp.createdAt) && <MetaItem label="Shared" value={formatDate(selectedApp.createdAt)} />}
                {selectedApp.sourceCategory && <MetaItem label="Category" value={selectedApp.sourceCategory} />}
              </dl>

              {selectedApp.versions?.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                    Other builds
                  </h3>
                  <ul className="mt-2 divide-y divide-white/5 rounded-2xl border border-white/10 bg-black/20">
                    {selectedApp.versions.map((build) => (
                      <li key={build.sha1} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-slate-200">
                            {build.label || `Version ${build.version || '—'}`}
                            {build.label && build.version && (
                              <span className="ml-2 font-mono text-[10px] text-sky-300/80">{build.version}</span>
                            )}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-500">
                            {build.username}
                            {formatSize(build.fileSize) && <> · {formatSize(build.fileSize)}</>}
                            {formatDate(build.createdAt) && <> · {formatDate(build.createdAt)}</>}
                          </span>
                        </span>
                        {build.forumUrl && (
                          <a
                            href={build.forumUrl}
                            target="_blank"
                            rel="noopener"
                            aria-label="Forum post for this build"
                            className="rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                          >
                            <i className="fa-solid fa-comments text-xs" />
                          </a>
                        )}
                        <a
                          href={build.apkUrl}
                          target="_blank"
                          rel="noopener"
                          aria-label="Download this build"
                          className="rounded-full p-2 text-sky-300 transition hover:bg-sky-400/10 hover:text-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                        >
                          <i className="fa-solid fa-download text-xs" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {selectedApp.apkUrl && (
                  <a
                    href={selectedApp.apkUrl}
                    target="_blank"
                    rel="noopener"
                    className="flex-1 rounded-full bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
                  >
                    <i className="fa-solid fa-download mr-2" aria-hidden="true" />
                    Download APK
                  </a>
                )}
                {selectedApp.forumUrl && (
                  <a
                    href={selectedApp.forumUrl}
                    target="_blank"
                    rel="noopener"
                    className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                  >
                    <i className="fa-solid fa-comments mr-2" aria-hidden="true" />
                    Forum post
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CategoryChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
        active
          ? 'border-sky-400/60 bg-sky-400/15 text-sky-100'
          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200'
      }`}
    >
      {label} <span className={active ? 'text-sky-300/80' : 'text-slate-600'}>{count}</span>
    </button>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-slate-200">{value}</dd>
    </div>
  );
}

function InputField({ label, name, value, onChange, required, placeholder, maxLength }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-white">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={onChange}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
      />
    </div>
  );
}

function FileField({ label, name, accept, onChange, onDropFile, file, helper, progress }) {
  const [dragging, setDragging] = useState(false);

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragging(true);
    } else if (event.type === 'dragleave') {
      setDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) {
      onDropFile(name, droppedFile);
    }
  };

  return (
    <div>
      <label className="text-sm font-semibold text-white">{label}</label>
      <label
        htmlFor={name}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-4 py-8 text-center text-sm text-white transition ${
          dragging ? 'border-sky-400 bg-slate-900/70' : 'border-white/20 bg-slate-900/30 hover:border-sky-400 hover:bg-slate-900/60'
        }`}
      >
        <i className="fa-solid fa-cloud-arrow-up text-2xl text-sky-300" />
        <span className="mt-2 font-semibold">{file ? 'Replace file' : 'Click or drag to upload'}</span>
        {file && <span className="mt-1 text-xs text-slate-300">{file.name}</span>}
        {helper && <span className="mt-1 text-xs text-slate-400">{helper}</span>}
        {progress > 0 && progress < 100 && (
          <div className="mt-4 h-2 w-full rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${progress}%` }} />
          </div>
        )}
      </label>
      <input id={name} name={name} type="file" accept={accept} onChange={onChange} className="hidden" />
    </div>
  );
}
