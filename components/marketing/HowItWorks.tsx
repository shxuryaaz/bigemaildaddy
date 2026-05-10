export default function HowItWorks() {
  return (
    <section id="how-it-works" className="hiw-section">
      <div className="hiw-label">How it works</div>
      <h2 className="hiw-heading">Three steps. One email that lands.</h2>
      <div className="hiw-steps">
        <div className="hiw-step">
          <div className="hiw-num">01 — Setup</div>
          <div className="hiw-title">Upload your resume + GitHub</div>
          <p className="hiw-desc">
            We extract your <strong>actual projects</strong>, skills, and GitHub
            repos — not what you claim, what you&apos;ve shipped. This becomes
            your evidence base.
          </p>
        </div>
        <div className="hiw-step">
          <div className="hiw-num">02 — Target</div>
          <div className="hiw-title">Search for who you want to email</div>
          <p className="hiw-desc">
            Search by name, role, or institution. We web-research them in
            real-time — papers, posts, LinkedIn — and build a{" "}
            <strong>taste model</strong> of what they actually care about.
          </p>
        </div>
        <div className="hiw-step">
          <div className="hiw-num">03 — Generate</div>
          <div className="hiw-title">Pick angle + tone. We write it.</div>
          <p className="hiw-desc">
            Choose how you want to approach them. We find the{" "}
            <strong>non-obvious overlap</strong> between your work and theirs,
            then write one specific email — no templates, no filler.
          </p>
        </div>
      </div>
    </section>
  );
}
