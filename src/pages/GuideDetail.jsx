import { Link, useParams } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import SectionHeading from '../components/SectionHeading';
import { guideArticles } from '../data/guides';

export default function GuideDetail() {
  const { slug } = useParams();
  const guide = guideArticles.find((entry) => entry.slug === slug);

  if (!guide) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold text-white">Guide not found</h1>
        <p className="text-slate-300">The resource you are looking for is either private or has been moved.</p>
        <Link to="/guides" className="rounded-full bg-sky-500 px-5 py-3 font-semibold text-slate-950">
          Back to guides
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 pt-12 pb-16">
      <Link to="/guides" className="text-link">← All guides</Link>
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">{guide.category}</p>
      <h1 className="text-4xl font-semibold text-white sm:text-5xl">{guide.title}</h1>
      <p className="text-lg text-slate-300">{guide.summary}</p>
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
        <span className="font-semibold text-white">Heads up:</span> {guide.heroNote}
        {guide.heroLink && (
          <>
            {' '}
            <a href={guide.heroLink.href} target="_blank" rel="noopener" className="text-sky-300 underline">
              {guide.heroLink.label}
            </a>
          </>
        )}
      </div>

      {guide.sections.map((section) => (
        <GlassCard key={section.title} className="space-y-6">
          <SectionHeading label={section.eyebrow} title={section.title} description={section.description} />
          {section.subsections && (
            <div className="space-y-6">
              {section.subsections.map((sub) => (
                <div key={sub.subtitle} className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
                  <h3 className="text-lg font-semibold text-white">{sub.subtitle}</h3>
                  {sub.description && <p className="mt-2 text-sm text-slate-300">{sub.description}</p>}
                  {sub.variants && (
                    <div className="mt-4 space-y-4">
                      {sub.variants.map((variant) => (
                        <div key={variant.label} className="rounded-xl border border-white/5 bg-slate-950/70 p-4">
                          <p className="text-sm font-semibold text-white">{variant.label}</p>
                          {variant.body && <p className="mt-2 text-sm text-slate-300">{variant.body}</p>}
                          {variant.steps && (
                            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                              {variant.steps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ol>
                          )}
                          {variant.link && (
                            <a
                              href={variant.link.href}
                              target="_blank"
                              rel="noopener"
                              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sky-300"
                            >
                              {variant.link.label} <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {sub.steps && (
                    <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                      {sub.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  )}
                  {sub.code && (
                    <pre className="mt-4 rounded-xl bg-slate-950/80 p-4 text-sm text-sky-200">
                      <code>{sub.code}</code>
                    </pre>
                  )}
                  {sub.note && <p className="mt-2 text-xs text-slate-400">{sub.note}</p>}
                  {sub.link && (
                    <a
                      href={sub.link.href}
                      target="_blank"
                      rel="noopener"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sky-300"
                    >
                      {sub.link.label} <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {section.steps && (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {section.code && (
            <pre className="rounded-xl bg-slate-950/80 p-4 text-sm text-sky-200">
              <code>{section.code}</code>
            </pre>
          )}
          {section.link && (
            <a
              href={section.link.href}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300"
            >
              {section.link.label} <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          )}
        </GlassCard>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400">
        <Link to="/guides" className="inline-flex items-center gap-2 text-sky-300">
          <i className="fa-solid fa-arrow-left"></i>
          Back to guides
        </Link>
        <a href="https://forums.jtechforums.org" target="_blank" rel="noopener" className="inline-flex items-center gap-2">
          Continue the discussion <i className="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>
    </div>
  );
}
