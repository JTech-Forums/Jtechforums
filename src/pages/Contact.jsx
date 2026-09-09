import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal';

const ENDPOINT = '/api/contact';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export default function Contact() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [supportsTouch, setSupportsTouch] = useState(false);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (document.querySelector('script[data-recaptcha="true"]')) return;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = 'true';
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const detectTouch = () => {
      const coarseQuery = window.matchMedia?.('(pointer: coarse)');
      const pointerCoarse = coarseQuery ? coarseQuery.matches : false;
      const hasTouchEvents = 'ontouchstart' in window;
      setSupportsTouch(pointerCoarse || hasTouchEvents);
    };

    detectTouch();
    window.addEventListener('resize', detectTouch);
    return () => window.removeEventListener('resize', detectTouch);
  }, []);

  const waitForRecaptcha = () =>
    new Promise((resolve, reject) => {
      if (!RECAPTCHA_SITE_KEY) {
        resolve(null);
        return;
      }

      const poll = (attempts = 0) => {
        if (window.grecaptcha?.enterprise?.ready && window.grecaptcha?.enterprise?.execute) {
          resolve(window.grecaptcha.enterprise);
          return;
        }

        if (attempts > 50) {
          reject(new Error('reCAPTCHA failed to load'));
          return;
        }

        setTimeout(() => poll(attempts + 1), 100);
      };

      poll();
    });

  const runRecaptcha = async () => {
    try {
      const enterprise = await waitForRecaptcha();
      if (!enterprise) return '';

      return await enterprise.execute(RECAPTCHA_SITE_KEY, { action: 'contact' });
    } catch (error) {
      console.warn('Unable to load reCAPTCHA', error);
      return '';
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (import.meta.env.DEV && import.meta.env.VITE_FORUM_USE_MOCK === 'true') { setStatus('error'); setMessage('Messages cannot be sent from this local preview. The contact service is not connected.'); return; }
    setStatus('loading');
    setMessage('');

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const payload = new URLSearchParams();
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        payload.append(key, value);
      }
    });

    try {
      const recaptchaToken = await runRecaptcha();
      if (recaptchaToken) {
        payload.append('recaptchaToken', recaptchaToken);
      }

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to send message right now.');
      }

      formElement.reset();
      setStatus('success');
      setMessage(result?.message || 'Message sent. Thanks for reaching out!');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Unable to send message right now.');
    }
  }

  const submitLabel = status === 'loading' ? 'Sending…' : supportsTouch ? 'Tap to send' : 'Send message';

  return (
    <Reveal as="div" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16" amount={0.15}>
      <div className="text-center">
        <p className="section-label text-xs uppercase text-sky-200">Contact</p>
        <h1 className="mt-4 text-5xl font-semibold text-white">Talk to JTech</h1>
        <p className="mt-3 text-base text-slate-300">Ask for guidance, request a walkthrough, or introduce a new deployment.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-12 glass-panel rounded-3xl border border-white/10 p-6 sm:p-8"
        autoComplete="on"
        noValidate={false}
      >
        <input type="text" name="_honey" tabIndex="-1" autoComplete="off" className="hidden" />
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset>
            <label htmlFor="name" className="text-sm font-semibold text-slate-200">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              autoCapitalize="words"
              inputMode="text"
              enterKeyHint="next"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white focus:border-sky-400 focus:outline-none"
              placeholder="Your name"
            />
          </fieldset>
          <fieldset>
            <label htmlFor="phone" className="text-sm font-semibold text-slate-200">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white focus:border-sky-400 focus:outline-none"
              placeholder="(123) 456-7890"
            />
          </fieldset>
          <fieldset className="md:col-span-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white focus:border-sky-400 focus:outline-none"
              placeholder="you@email.com"
            />
          </fieldset>
          <fieldset className="md:col-span-2">
            <label htmlFor="message" className="text-sm font-semibold text-slate-200">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows="5"
              required
              inputMode="text"
              enterKeyHint="send"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white focus:border-sky-400 focus:outline-none"
              placeholder="Share context, goals, timelines..."
            ></textarea>
          </fieldset>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-wait"
        >
          {submitLabel}
        </button>

        {message && (
          <div className="mt-6 flex items-center justify-center" aria-live="polite">
            <div
              className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold ${
                status === 'error'
                  ? 'border border-rose-400/40 bg-rose-400/10 text-rose-100 shadow-lg shadow-rose-500/20'
                  : 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-200 shadow-lg shadow-emerald-500/20'
              }`}
            >
              <span
                className={`inline-flex h-3 w-3 animate-pulse rounded-full ${
                  status === 'error' ? 'bg-rose-300' : 'bg-emerald-300'
                }`}
              />
              <span className="tracking-wide">{message}</span>
            </div>
          </div>
        )}
      </form>
    </Reveal>
  );
}
