import { forumLinks } from "../lib/forumLinks";
import TechParticleScene from "./TechParticleScene";
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Icon from "./Icon";
gsap.registerPlugin(ScrollTrigger);

export function ImmersiveHero() {
  const root = useRef(null);
  const [showParticles, setShowParticles] = useState(
    () => window.matchMedia("(min-width: 1100px)").matches,
  );
  useLayoutEffect(() => {
    const desktop = window.matchMedia("(min-width: 1100px)");
    const update = () => setShowParticles(desktop.matches);
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1100px) and (prefers-reduced-motion: no-preference)",
      () => {
        const ctx = gsap.context(() => {
          gsap.from(".hero-brand-logo", {
            y: 40,
            opacity: 0,
            scale: 0.96,
            duration: 1.15,
            ease: "power3.out",
            clearProps: "all",
          });
          gsap.from(".hero-caption, .hero-bottom", {
            y: 20,
            opacity: 0,
            delay: 0.3,
            duration: 0.85,
            clearProps: "all",
          });
          gsap.to(".hero-brand", {
            y: -40,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "20% top",
              end: "bottom top",
              scrub: 1,
            },
          });
        }, root);
        return () => ctx.revert();
      },
    );
    return () => mm.revert();
  }, []);
  return (
    <section className="immersive-hero branded-hero" ref={root}>
      <div className="hero-blueprint" aria-hidden="true" />
      <div className="hero-ambient" aria-hidden="true" />
      {showParticles && <TechParticleScene />}
      <div className="hero-brand">
        <h1>
          <img
            className="hero-brand-logo"
            src="/img/whitelogo.png"
            alt="JTech Forums"
            width="860"
            height="250"
          />
        </h1>
        <span className="brand-light-line" aria-hidden="true" />
      </div>
      <div className="hero-caption">
        <p>
          The leading Jewish tech
          <br />& filtering community.
        </p>
        <span>Built by the community, for the community.</span>
        <a
          className="button"
          href="https://forums.jtechforums.org"
          target="_blank"
          rel="noreferrer"
        >
          Join the Forum <Icon name="external" />
        </a>
      </div>
      <div className="hero-bottom">
        <a href="#resources" className="scroll-cue">
          <span>↓</span> Scroll to explore
        </a>
      </div>
    </section>
  );
}

const slides = [
  {
    id: "01",
    label: "THE KNOWLEDGE BASE",
    title: (
      <>
        Step-by-Step
        <br />
        Guides
      </>
    ),
    text: "Detailed walkthroughs for every device and setup. From flip phones to smartphones, we've got you covered.",
    to: forumLinks.guides,
    action: "Explore the guides",
    type: "guides",
  },
  {
    id: "02",
    label: "THE COMMUNITY TOOLKIT",
    title: (
      <>
        Curated
        <br />
        App Library
      </>
    ),
    text: "Trusted, safe apps vetted by the community. No mystery APKs—just apps that work.",
    to: forumLinks.apps,
    action: "Find your next app",
    type: "apps",
  },
  {
    id: "03",
    label: "CONNECTED. PROTECTED.",
    title: (
      <>
        eGate
        <br />
        Filter Support
      </>
    ),
    text: "Enterprise-grade filtering solutions with dedicated community support and setup guides.",
    to: "/egate",
    action: "Discover eGate",
    type: "egate",
  },
  {
    id: "04",
    label: "YOUR NEXT SETUP STARTS HERE",
    title: (
      <>
        Filter
        <br />
        Installer
      </>
    ),
    text: "A simple place to install all kosher MDMs, simplified for even someone without any filtering knowledge.",
    to: "https://installer.jtechforums.org/",
    action: "Open the installer",
    type: "installer",
  },
];
function SlideVisual({ type }) {
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef(null);
  const previewButton = useRef(null);
  useLayoutEffect(() => {
    if (expanded) dialog.current?.showModal();
  }, [expanded]);
  function closePreview() {
    setExpanded(false);
    previewButton.current?.focus();
  }
  if (type === "apps")
    return (
      <div className="rail-app-wall">
        {[
          "Waze",
          "Musicolet",
          "WeNote",
          "eGate",
          "KosherChat",
          "FileManagerPlus",
          "GoogleTranslate",
          "ButtonMapper",
          "ColorNote",
        ].map((a, i) => (
          <div key={a} style={{ "--tile": i }}>
            <img src={`/img/apps/${a}.png`} alt={a} loading="lazy" />
          </div>
        ))}
      </div>
    );
  if (type === "egate")
    return (
      <div className="rail-phone">
        <span className="phone-speaker" />
        <video
          src="/img/qinf21.mp4"
          poster="/img/home/egatesquare.png"
          muted
          loop
          playsInline
          controls
          preload="metadata"
          aria-label="eGate demonstration"
        />
        <div className="phone-dial">◉</div>
        <div className="phone-keys">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i}>{i < 9 ? i + 1 : ["*", "0", "#"][i - 9]}</span>
          ))}
        </div>
      </div>
    );
  if (type === "installer")
    return (
      <div className="rail-terminal">
        <div className="terminal-top">
          <span>● ● ●</span> JTECH / INSTALLER
        </div>
        <div className="terminal-content">
          <span className="terminal-muted">$ jtech connect</span>
          <p>
            <span>✓</span> Device connected
          </p>
          <p>
            <span>✓</span> Find your filter
          </p>
          <p>
            <span>✓</span> Install with confidence
          </p>
          <div className="terminal-bar">
            <span />
          </div>
          <strong>
            YOUR DEVICE. YOUR STANDARDS.<b>_</b>
          </strong>
        </div>
      </div>
    );
  return (
    <>
      <div className="rail-guide-stack">
        <div className="guide-screen">
          <div className="guide-screen-top">
            <span>● ● ●</span>
            <span>JTECH / GUIDES</span>
            <Icon name="external" size={12} />
          </div>
          <button
            ref={previewButton}
            className="guide-expand"
            onClick={() => setExpanded(true)}
            aria-label="Expand guide preview"
          >
            <img
              src="/img/guides.png"
              alt="JTech forum guides including wireless debugging, blocking MMS, and understanding GSI packages"
              loading="lazy"
            />
            <span>
              EXPAND PREVIEW <Icon name="plus" size={16} />
            </span>
          </button>
        </div>
        <div className="guide-popover">
          <Icon name="check" />
          <span>
            Real questions.
            <br />
            <strong>Community answers.</strong>
          </span>
        </div>
      </div>
      {expanded && (
        <dialog
          ref={dialog}
          className="image-lightbox"
          onCancel={closePreview}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePreview();
          }}
        >
          <div className="lightbox-toolbar">
            <span>JTECH / GUIDE PREVIEW</span>
            <button onClick={closePreview} aria-label="Close guide preview">
              <Icon name="close" />
            </button>
          </div>
          <img src="/img/guides.png" alt="Full-size JTech guides preview" />
        </dialog>
      )}
    </>
  );
}
export function ExperienceRail() {
  const shell = useRef(null);
  const root = useRef(null),
    track = useRef(null),
    viewport = useRef(null),
    trigger = useRef(null);
  const [active, setActive] = useState(0);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1100px) and (prefers-reduced-motion: no-preference)",
      () => {
        const distance = () =>
          track.current.scrollWidth - viewport.current.clientWidth;
        const sizeShell = () => {
          const headerHeight = document
            .querySelector(".site-header")
            .getBoundingClientRect().height;
          shell.current.style.setProperty("--story-top", `${headerHeight}px`);
          shell.current.style.height = `${root.current.offsetHeight + distance()}px`;
        };
        shell.current.classList.add("is-scroll-story");
        sizeShell();
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: shell.current,
            start: () =>
              `top ${document.querySelector(".site-header").getBoundingClientRect().height}px`,
            refreshPriority: 1,
            onRefreshInit: sizeShell,
            end: () => `+=${distance()}`,
            scrub: 0.65,
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              setActive(Math.min(3, Math.round(self.progress * 3))),
          },
        });
        trigger.current = tween.scrollTrigger;
        const sceneAnimations = [];
        gsap.utils
          .toArray(".experience-panel", root.current)
          .forEach((panel, index) => {
            if (index === 0) return;
            const visual = panel.querySelector(".panel-visual");
            const copy = panel.querySelector(".panel-copy");
            sceneAnimations.push(
              gsap.fromTo(
                visual,
                { scale: 0.65, rotate: 8, opacity: 0.15, y: 65 },
                {
                  scale: 1,
                  rotate: 0,
                  opacity: 1,
                  y: 0,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: panel,
                    containerAnimation: tween,
                    start: "left 95%",
                    end: "left 18%",
                    scrub: 0.5,
                  },
                },
              ),
            );
            sceneAnimations.push(
              gsap.fromTo(
                copy,
                { y: 80, opacity: 0.1 },
                {
                  y: 0,
                  opacity: 1,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: panel,
                    containerAnimation: tween,
                    start: "left 80%",
                    end: "left 15%",
                    scrub: 0.5,
                  },
                },
              ),
            );
          });
        document.fonts.ready.then(() => {
          if (trigger.current) ScrollTrigger.refresh();
        });
        return () => {
          sceneAnimations.forEach((a) => {
            a.scrollTrigger?.kill();
            a.revert();
          });
          trigger.current = null;
          tween.scrollTrigger?.kill();
          tween.revert();
          shell.current?.classList.remove("is-scroll-story");
          shell.current?.style.removeProperty("height");
          shell.current?.style.removeProperty("--story-top");
        };
      },
    );
    return () => mm.revert();
  }, []);
  function go(index) {
    if (trigger.current)
      window.scrollTo({
        top:
          trigger.current.start +
          ((trigger.current.end - trigger.current.start) * index) / 3,
        behavior: "smooth",
      });
    else
      viewport.current.scrollTo({
        left:
          track.current.children[index].offsetLeft - track.current.offsetLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    setActive(index);
  }
  return (
    <div className="story-pin-shell" ref={shell}>
      <section
        className="experience-rail"
        id="resources"
        ref={root}
        aria-label="Explore JTech resources"
      >
        <div className="rail-heading">
          <div>
            <span className="eyebrow">EXPLORE THE ECOSYSTEM</span>
            <h2>
              Everything.
              <br />
              <span>In one place.</span>
            </h2>
          </div>
          <div className="rail-heading-right">
            <span>FOUR WAYS TO GET FURTHER.</span>
            <p>
              Keep scrolling. There's more to discover. <span>↗</span>
            </p>
          </div>
        </div>
        <div
          className="rail-viewport"
          ref={viewport}
          onScroll={() => {
            if (!trigger.current) {
              const width =
                track.current.children[0]?.getBoundingClientRect().width || 1;
              setActive(
                Math.min(
                  3,
                  Math.round(viewport.current.scrollLeft / (width + 24)),
                ),
              );
            }
          }}
        >
          <div className="rail-track" ref={track}>
            {slides.map((s, i) => (
              <article
                className={`experience-panel panel-${s.type}`}
                key={s.id}
                onFocusCapture={() => {
                  if (trigger.current && active !== i) go(i);
                }}
              >
                <div className="panel-copy">
                  <span className="eyebrow">{s.label}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  {s.to.startsWith("http") ? (
                    <a
                      className="panel-link"
                      href={s.to}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.action}
                      <Icon name="external" />
                    </a>
                  ) : (
                    <Link className="panel-link" to={s.to}>
                      {s.action}
                      <Icon name="external" />
                    </Link>
                  )}
                </div>
                <div className="panel-visual">
                  <SlideVisual type={s.type} />
                </div>
                <span className="panel-number">/{s.id}</span>
              </article>
            ))}
          </div>
        </div>
        <div className="rail-footer">
          <div className="rail-pagination" aria-label="Resource slides">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => go(i)}
                aria-label={`Show resource ${i + 1}`}
                aria-current={active === i ? "true" : undefined}
              >
                <span>{s.id}</span>
                <i />
              </button>
            ))}
          </div>
          <span className="rail-footer-label">
            SCROLL / SWIPE TO EXPLORE <Icon />
          </span>
        </div>
      </section>
    </div>
  );
}

export function MotionAtmosphere() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.utils
          .toArray(
            ".conversation-section .section-top, .people-section .section-top, .feedback-section .section-top",
          )
          .forEach((el) =>
            gsap.from(el, {
              y: 45,
              opacity: 0.15,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            }),
          );
        gsap.to(".site-scroll-progress", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        });
      });
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  return <div className="site-scroll-progress" aria-hidden="true" />;
}

export function StoryBridge() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1100px) and (prefers-reduced-motion: no-preference)",
      () => {
        const ctx = gsap.context(() => {
          gsap.fromTo(
            ".story-image",
            { scale: 0.72, rotate: -5, opacity: 0.25 },
            {
              scale: 1.1,
              rotate: 0,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: root.current,
                start: "top 95%",
                end: "bottom 70%",
                scrub: 1,
              },
            },
          );
          gsap.from(".story-words span", {
            y: 90,
            opacity: 0,
            stagger: 0.12,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: root.current,
              start: "top 65%",
              once: true,
            },
          });
        }, root);
        return () => ctx.revert();
      },
    );
    return () => mm.revert();
  }, []);
  return (
    <section className="story-bridge" ref={root}>
      <div className="story-image">
        <img
          src="/img/home/android.png"
          alt="Android and code symbols from the JTech community"
          loading="lazy"
        />
      </div>
      <div className="story-content">
        <span className="eyebrow">TECHNOLOGY THAT UNDERSTANDS YOU.</span>
        <h2 className="story-words">
          <span>Built for</span>
          <span>
            our community<span className="story-dot">.</span>
          </span>
        </h2>
        <p>
          From kosher phones to coding tips.
          <br />
          Everything in one respectful space.
        </p>
        <a href="#resources" className="text-link">
          Find your way forward <Icon />
        </a>
      </div>
      <span className="story-marker">[ THE JTECH STORY / 01 ]</span>
    </section>
  );
}
