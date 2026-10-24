export function LoopMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="loopg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c6cff" />
          <stop offset="1" stopColor="#4fd1c5" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke="url(#loopg)" strokeWidth="4" strokeDasharray="58 12" strokeLinecap="round" transform="rotate(-60 16 16)" />
      <path d="M24.5 6.5l1.2 5.6-5.6-1.1z" fill="#4fd1c5" />
    </svg>
  );
}
