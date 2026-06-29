export default function Footer() {
  return (
    <footer className="border-t border-line mt-20 relative z-10" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="font-serif-display text-xl sm:text-2xl text-ink-dark">Notes Hub · Class XI Biology</div>
          <p className="font-mono-arch text-[10px] sm:text-[11px] tracking-widest uppercase text-ink-light mt-2">
            A student-run archive. Open access. No paywalls.
          </p>
        </div>
        <div className="font-serif-display italic text-base sm:text-lg text-ink-dark">
          Coded by <span className="not-italic font-semibold text-accent-green">Prateek</span>
          <span className="text-accent-pink">.....</span>
        </div>
      </div>
    </footer>
  );
}
