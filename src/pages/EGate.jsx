import { useEffect, useRef, useState } from 'react';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';

import { asset } from "../lib/asset";
const featureList = [
  {
    title: 'Factory reset & ADB protection',
    body: 'Prevents resets, OEM unlock, and Developer Options tampering so eGate policies stay enforced.',
    icon: 'fa-solid fa-user-shield',
  },
  {
    title: 'App & storage restrictions',
    body: 'Hide or block apps, strip the Play Store, and disable removable media from one lock profile.',
    icon: 'fa-solid fa-tablet-screen-button',
  },
  {
    title: 'Connectivity controls',
    body: 'Shut down Wi-Fi, hotspots, Bluetooth sharing, and MMS when zero side channels are allowed.',
    icon: 'fa-solid fa-tower-broadcast',
  },
  {
    title: 'Web filtering',
    body: 'DNS category blocks plus WebView and in-app browser controls with explicit exception lists.',
    icon: 'fa-solid fa-globe',
  },
  {
    title: 'Accessibility-based security',
    body: 'Accessibility services enforce launch guards, disable WebView, and stop workaround attempts.',
    icon: 'fa-solid fa-universal-access',
  },
  {
    title: 'Remote management',
    body: 'Reseller portal lets partners push commands, toggle profiles, and audit fleets anywhere.',
    icon: 'fa-solid fa-arrows-spin',
  },
];

const demoVideoSrc = asset("/img/qinf21.mp4");

export default function EGate() {
  return (
    <Reveal as="div" className="bg-black" amount={0.1}>
      <Hero />
      <section className="bg-slate-950/70">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <SectionHeading
            label="Everything you need"
            title="Why choose eGate?"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureList.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="flex items-center gap-3 text-sky-300">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-lg text-sky-200">
                    <i className={feature.icon}></i>
                  </span>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-300">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Highlights />
      <Cta />
    </Reveal>
  );
}

function Hero() {
  return (
    <Reveal
      as="section"
      className="relative isolate overflow-hidden border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black"
      amount={0.1}
    >
      <PatternGrid />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div className="space-y-6">
          <p className="section-label text-xs uppercase text-sky-200">eGate filter</p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">Enterprise-grade control for kosher devices</h1>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/offlinesoftwaresolutions/egate"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Buy a license
            </a>
            <a
              href="https://jtechforums.org/t/what-is-egate-software/235"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white"
            >
              Learn more <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
            </a>
          </div>
          <p className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 sm:text-base">
            Built and maintained by <span className="font-semibold text-white">Offline Software Solutions</span> so every kosher deployment inherits
            the same hardened eGate stack.
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <PhoneMock />
        </div>
      </div>
    </Reveal>
  );
}

function PatternGrid() {
  return (
    <svg
      className="absolute inset-0 -z-10 size-full stroke-slate-900/80 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
      aria-hidden="true"
    >
      <defs>
        <pattern id="egate-grid" width="200" height="200" patternUnits="userSpaceOnUse" x="50%" y="-1">
          <path d="M0 200V0M200 0H0" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#egate-grid)" />
    </svg>
  );
}

function PhoneMock() {
  return (
    <svg viewBox="0 0 280 628" role="img" className="w-[12rem] max-w-full drop-shadow-2xl sm:w-[13.5rem] lg:w-[15.5rem]">
      <defs>
        <clipPath id="egate-phone-screen">
          <rect width="190" height="270" rx="16" x="45" y="60" />
        </clipPath>
      </defs>
      <rect x="10" y="10" width="260" height="605" rx="35" fill="#232323" />
      <rect x="25" y="40" width="230" height="315" rx="12" fill="#050505" />
      <foreignObject x="45" y="60" width="190" height="270" clipPath="url(#egate-phone-screen)">
        <VideoPreview
          src={demoVideoSrc}
          className="h-full w-full rounded-3xl bg-black"
          videoClassName="h-full w-full rounded-3xl object-contain"
          videoStyle={{ transform: 'scale(0.92)' }}
          label="eGate demo"
        />
      </foreignObject>
      <rect x="120" y="25" width="40" height="6" rx="3" fill="#555555" />
      <g fill="#575757">
        <circle cx="140" cy="410" r="35" />
        <circle fill="#232323" cx="140" cy="410" r="30" />
        <circle fill="#575757" cx="140" cy="410" r="28" />
        <rect x="35" y="375" width="60" height="30" rx="15" />
        <rect x="35" y="415" width="60" height="30" rx="15" />
        <rect x="185" y="375" width="60" height="30" rx="15" />
        <rect x="185" y="415" width="60" height="30" rx="15" />
      </g>
      <g fill="#575757">
        <rect x="35" y="470" width="60" height="30" rx="15" />
        <rect x="110" y="470" width="60" height="30" rx="15" />
        <rect x="185" y="470" width="60" height="30" rx="15" />
        <rect x="35" y="515" width="60" height="30" rx="15" />
        <rect x="110" y="515" width="60" height="30" rx="15" />
        <rect x="185" y="515" width="60" height="30" rx="15" />
        <rect x="35" y="560" width="60" height="30" rx="15" />
        <rect x="110" y="560" width="60" height="30" rx="15" />
        <rect x="185" y="560" width="60" height="30" rx="15" />
      </g>
    </svg>
  );
}

function VideoPreview({
  src,
  type = 'video/mp4',
  className = '',
  videoClassName = '',
  videoStyle,
  playbackRate = 0.8,
  label = 'Product preview video',
}) {
  const videoRef = useRef(null);
  const isMountedRef = useRef(true);
  const [requiresInteraction, setRequiresInteraction] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const attemptPlayback = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.defaultMuted = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.playbackRate = playbackRate;

    const playPromise = videoEl.play();
    if (playPromise?.catch) {
      playPromise.catch((error) => {
        if (isMountedRef.current && (!error || error.name !== 'AbortError')) {
          setRequiresInteraction(true);
        }
      });
    }
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return undefined;
    isMountedRef.current = true;

    setRequiresInteraction(false);
    setVideoError(false);

    attemptPlayback();
    const handleLoadedData = () => attemptPlayback();
    const handlePlay = () => {
      if (isMountedRef.current) {
        setRequiresInteraction(false);
      }
    };

    videoEl.addEventListener('loadeddata', handleLoadedData);
    videoEl.addEventListener('play', handlePlay);

    return () => {
      isMountedRef.current = false;
      videoEl.removeEventListener('loadeddata', handleLoadedData);
      videoEl.removeEventListener('play', handlePlay);
    };
  }, [playbackRate, src]);

  const showOverlay = requiresInteraction || videoError;

  const handleManualPlay = () => {
    setVideoError(false);
    setRequiresInteraction(false);
    attemptPlayback();
  };

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className={`block ${videoClassName}`}
        style={videoStyle}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={showOverlay}
        aria-label={label}
        onError={() => setVideoError(true)}
      >
        <source src={src} type={type} />
      </video>
      {showOverlay && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-black/70 px-4 text-center text-xs font-semibold text-white">
          <p className="leading-tight">
            {videoError ? 'Preview unavailable in this browser.' : "Tap play if the preview doesn't start automatically."}
          </p>
          {!videoError && (
            <button
              type="button"
              onClick={handleManualPlay}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20"
            >
              <i className="fa-solid fa-play text-[10px]" /> Play preview
            </button>
          )}
          {videoError && (
            <a
              href={src}
              download
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white underline-offset-2 transition hover:bg-white/20"
            >
              <i className="fa-solid fa-download text-[10px]" /> Download video
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Highlights() {
  return (
    <Reveal as="section" className="bg-black py-20 sm:py-24" amount={0.15}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="mx-auto text-center text-3xl font-semibold text-white sm:text-4xl">
          Check out what eGate can do&hellip;
        </p>
        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <article className="relative lg:row-span-2">
            <CardChrome className="lg:rounded-l-[2rem]">
              <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                <p className="text-xl font-semibold text-white">Easy-to-use design</p>
                <p className="mt-3 text-sm text-slate-300">
                  Direct lift from the legacy site: the UI showcase stays front-and-center with the same video placement.
                </p>
              </div>
              <div className="relative mx-auto flex w-full max-w-sm flex-1 items-center justify-center px-8 pb-10 pt-8 lg:max-w-full">
                <div className="h-[22rem] w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4 shadow-2xl">
                  <div className="flex h-full w-full items-center justify-center rounded-[1.5rem] bg-black/70 p-4">
                    <VideoPreview
                      src={demoVideoSrc}
                      className="h-full w-full"
                      videoClassName="h-full w-full rounded-2xl object-contain"
                      videoStyle={{ transform: 'scale(0.92)' }}
                      label="eGate UI preview"
                    />
                  </div>
                </div>
              </div>
            </CardChrome>
          </article>

          <article className="relative max-lg:row-start-1">
            <CardChrome className="max-lg:rounded-t-[2rem]">
              <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                <p className="text-xl font-semibold text-white">Password-based</p>
                <p className="mt-3 text-sm text-slate-300">Locked by credentials you control—no unauthorized toggles.</p>
              </div>
              <div className="flex flex-1 items-center justify-center px-8 pb-10 pt-6">
                <PasswordBadge />
              </div>
            </CardChrome>
          </article>

          <article className="relative lg:row-span-2">
            <CardChrome className="max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]">
              <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                <p className="text-xl font-semibold text-white">Reseller portal</p>
                <p className="mt-3 text-sm text-slate-300">
                  Bulk license controls and remote toggles.
                </p>
              </div>
              <div className="relative flex flex-1 items-center justify-center px-8 pb-10 pt-6">
                <div className="w-full rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
                  <img
                    src={asset("/img/home/reseller.webp")}
                    alt="Reseller portal"
                    className="h-full w-full rounded-3xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </CardChrome>
          </article>
        </div>
      </div>
    </Reveal>
  );
}

function CardChrome({ children, className = '' }) {
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 ${className}`}>
      {children}
    </div>
  );
}

function PasswordBadge() {
  return (
    <div className="relative w-full max-w-xs rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-center text-white shadow-xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 text-3xl text-sky-200">
        <i className="fa-solid fa-lock"></i>
      </div>
      <p className="mt-4 text-lg font-semibold">Password enforced</p>
      <p className="mt-1 text-xs uppercase tracking-[0.4em] text-slate-400">offline key</p>
      <div className="mt-5 space-y-2 text-left text-xs text-slate-200/80">
        <p className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Local device PIN protection
        </p>
        <p className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          Admin-only override portal
        </p>
      </div>
    </div>
  );
}

function Cta() {
  return (
    <Reveal as="section" className="bg-black py-24" amount={0.15}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 px-8 py-12 sm:px-12 lg:px-16">
          <div className="absolute inset-y-0 right-0 -z-10 w-2/3 bg-gradient-to-l from-sky-500/20 to-transparent blur-3xl" aria-hidden="true" />
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Join the same community from the legacy page</h2>
              <p className="mt-4 text-base text-slate-200">
                Ask moderators about eGate deployments, request guide approvals, or share APK policies. It’s the same CTA from the old .io experience,
                now living in our Firebase-powered site.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://jtechforums.org"
                  target="_blank"
                  rel="noopener"
                  className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950"
                >
                  Join the forum
                </a>
                <a href="/contact" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white">
                  Talk to a specialist
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <img
                src={asset("/img/forum.webp")}
                alt="Forum preview"
                className="w-full rounded-2xl object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
