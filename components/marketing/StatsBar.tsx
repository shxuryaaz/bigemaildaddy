export default function StatsBar() {
  return (
    <div className="bottom-bar">
      <div className="stat-cell">
        <span className="s-num">3.4×</span>
        <span className="s-label">Higher reply rate vs templates</span>
      </div>
      <div className="stat-cell">
        <span className="s-num">90s</span>
        <span className="s-label">To your first email draft</span>
      </div>
      <div className="stat-cell">
        <span className="s-num">0</span>
        <span className="s-label">Generic phrases. Ever.</span>
      </div>
      <div className="stat-cell quote-cell">
        <span className="q-mark">&quot;</span>
        <div>
          <div className="q-text">
            First cold email I sent that didn&apos;t make me want to delete my
            own account.
          </div>
          <div className="q-author">— Final yr, BITS Pilani CSE</div>
        </div>
      </div>
    </div>
  );
}
