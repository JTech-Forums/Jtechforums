import { Link } from 'react-router-dom';

export default function ServerError() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="section-label text-xs uppercase text-rose-200">500</p>
      <h1 className="text-4xl font-semibold text-white">Something went sideways</h1>
      <p className="text-base text-slate-300">We logged the issue and will investigate. Try refreshing or head back to the home page.</p>
      <div className="flex gap-3">
        <Link to="/" className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950">
          Go home
        </Link>
        <a href="https://jtechforums.org" target="_blank" rel="noopener" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">
          Report on forum
        </a>
      </div>
    </div>
  );
}
