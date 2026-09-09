import { useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

const googleProvider = new GoogleAuthProvider();
const passwordRequirements = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'An uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'A number', test: (value) => /\d/.test(value) },
  { label: 'A symbol (!@#$)', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export default function SignIn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/apps';

  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, redirectTo, navigate]);

  const isSignup = mode === 'signup';
  const passwordStatus = useMemo(
    () => passwordRequirements.map((requirement) => ({ ...requirement, satisfied: requirement.test(form.password || '') })),
    [form.password]
  );
  const passwordStrong = passwordStatus.every((requirement) => requirement.satisfied);
  const canSubmit = isSignup
    ? Boolean(form.email && form.password && form.confirm && passwordStrong && form.confirm === form.password)
    : Boolean(form.email && form.password);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setForm((prev) => ({ ...prev, password: '', confirm: '' }));
    setMessage('');
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (!auth) { setMessage('Sign in is unavailable in the local preview. Firebase is not connected.'); return; }
    setMessage('');
    if (isSignup) {
      if (!passwordStrong) {
        setMessage('Use a stronger password to protect your account.');
        return;
      }
      if (form.password !== form.confirm) {
        setMessage('Passwords do not match.');
        return;
      }
    }
    setSubmitting(true);

    try {
      if (!isSignup) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await sendEmailVerification(credential.user);
        setMessage('Account created. Check your email for a verification link.');
      }
      setForm({ email: '', password: '', confirm: '' });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (!auth) { setMessage('Sign in is unavailable in the local preview. Firebase is not connected.'); return; }
    setMessage('');
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth) { setMessage('Password reset is unavailable in the local preview. Firebase is not connected.'); return; }
    if (!form.email) {
      setMessage('Enter your email to receive a reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email);
      setMessage('Password reset email sent.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <Reveal as="div" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" amount={0.1}>
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950 shadow-2xl shadow-black/40">
        <div className="flex flex-col lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          <section className="border-b border-white/5 px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r">
            <p className="section-label text-xs uppercase tracking-[0.4em] text-sky-200">Account</p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <h1 className="text-4xl font-semibold text-white">{isSignup ? 'Create your account' : 'Sign in to JTech'}</h1>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold text-white sm:text-sm">
                <button
                  type="button"
                  className={`rounded-full px-4 py-1 transition ${!isSignup ? 'bg-white text-slate-900 shadow' : 'text-slate-200'}`}
                  onClick={() => {
                    if (mode !== 'signin') toggleMode();
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-1 transition ${isSignup ? 'bg-white text-slate-900 shadow' : 'text-slate-200'}`}
                  onClick={() => {
                    if (mode !== 'signup') toggleMode();
                  }}
                >
                  Sign up
                </button>
              </div>
            </div>
            <p className="mt-3 text-base text-slate-300">
              Use email or Google to manage catalog submissions. We verify every address before allowing uploads.
            </p>

            <form onSubmit={handleEmailSubmit} className="mt-8 space-y-5">
              <FormField
                label="Email"
                htmlFor="email"
                children={
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    value={form.email}
                    onChange={handleInput}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white focus:border-sky-400 focus:outline-none"
                  />
                }
              />

              <FormField
                label="Password"
                htmlFor="password"
                helper={isSignup ? 'Use 8+ characters to speed up approval.' : 'Need a hand? Reset it below.'}
                children={
                  <input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    value={form.password}
                    onChange={handleInput}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white focus:border-sky-400 focus:outline-none"
                  />
                }
              />

              {isSignup && (
                <>
                  <FormField
                    label="Confirm password"
                    htmlFor="confirm"
                    children={
                      <input
                        id="confirm"
                        name="confirm"
                        type="password"
                        minLength={8}
                        required
                        autoComplete="new-password"
                        value={form.confirm}
                        onChange={handleInput}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white focus:border-sky-400 focus:outline-none"
                      />
                    }
                  />
                  <ul className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                    {passwordStatus.map(({ label, satisfied }) => (
                      <li key={label} className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            satisfied ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/70'
                          }`}
                        >
                          <i className={`fa-solid ${satisfied ? 'fa-check' : 'fa-minus'}`}></i>
                        </span>
                        <span className={satisfied ? 'text-white' : ''}>{label}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="w-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/40 transition hover:from-sky-300 hover:to-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSignup ? 'Create account' : 'Sign in with email'}
                </button>
                <button type="button" className="text-left text-xs text-slate-200 underline" onClick={handlePasswordReset}>
                  Forgot password?
                </button>
              </div>
            </form>

            {message && (
              <p
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid')
                    ? 'border-rose-400/20 bg-rose-400/10 text-rose-100'
                    : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                }`}
              >
                {message}
              </p>
            )}

            <Link to="/apps" className="mt-6 inline-flex items-center text-sm font-semibold text-sky-200">
              <i className="fa-solid fa-arrow-left mr-2 text-xs" />
              Back to the app catalog
            </Link>
          </section>

          <aside className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute inset-y-0 right-[-30%] w-[120%] rounded-full bg-sky-500/20 blur-3xl" />
            </div>
            <div className="relative flex h-full flex-col gap-6 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">Instant access</p>
                <h2 className="mt-3 text-3xl font-semibold">Skip the form with Google</h2>
                <p className="mt-2 text-sm text-slate-200">
                  Link your Google account once and we keep approvals and catalog edits in sync automatically.
                </p>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={submitting}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-300 disabled:opacity-60"
                >
                  <i className="fa-brands fa-google text-base text-sky-200" />
                  Continue with Google
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-100">
                <h3 className="text-base font-semibold text-white">Quick facts</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center gap-2 text-xs">
                    <i className="fa-solid fa-shield-halved text-sky-300" />
                    Moderators review every upload before it appears in the catalog.
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <i className="fa-solid fa-bell text-sky-300" />
                    We email you when something is approved or needs edits.
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <i className="fa-solid fa-cloud-arrow-up text-sky-300" />
                    Swap APKs or icons anytime after approval.
                  </li>
                </ul>
              </div>

              <div className="mt-auto text-xs text-slate-300">
                Need help? Email{' '}
                <a href="mailto:support@jtechforums.org" className="text-sky-200 underline">
                  support@jtechforums.org
                </a>{' '}
                with your forum username.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Reveal>
  );
}

function FormField({ label, helper, htmlFor, children }) {
  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-white">
          {label}
        </label>
        {helper && <p className="text-xs text-slate-400">{helper}</p>}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
