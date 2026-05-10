import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";

export default function Pricing() {
  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-left">
        <div className="pricing-label">Pricing</div>
        <h2 className="pricing-heading">
          Free <span className="italic">during</span> beta.
        </h2>
        <p className="pricing-desc">
          No credit card. No limits on emails during beta. We&apos;re building
          this with early users — if it gets you a reply, tell us.
        </p>
        <div className="pricing-badge">Free beta access — no card required</div>
        <div className="pricing-cta">
          <form action={signInWithGoogleToDashboard}>
            <button type="submit" className="btn-main">
              Start for free →
            </button>
          </form>
        </div>
      </div>
      <div className="pricing-right">
        <div className="pricing-label" style={{ color: "var(--color-signal-label)" }}>
          What you get
        </div>
        <ul className="pricing-items">
          <li className="pricing-item">
            <span className="pricing-check">→</span>
            <span className="pricing-item-text">
              <strong>Real-time target research</strong> — we search the web for
              their papers, posts, and hiring patterns
            </span>
          </li>
          <li className="pricing-item">
            <span className="pricing-check">→</span>
            <span className="pricing-item-text">
              <strong>Identity extraction</strong> from your resume + GitHub —
              no hallucinated skills
            </span>
          </li>
          <li className="pricing-item">
            <span className="pricing-check">→</span>
            <span className="pricing-item-text">
              <strong>Compatibility mapping</strong> — we find the specific
              bridge between your work and theirs
            </span>
          </li>
          <li className="pricing-item">
            <span className="pricing-check">→</span>
            <span className="pricing-item-text">
              <strong>One email per target</strong> with angle + tone control,
              regeneration, and sentence-level rewrite
            </span>
          </li>
          <li className="pricing-item">
            <span className="pricing-check">→</span>
            <span className="pricing-item-text">
              <strong>Send directly from the app</strong> via Gmail — no copy-paste
            </span>
          </li>
        </ul>
        <div className="pricing-cta">
          <form action={signInWithGoogleToDashboard}>
            <button type="submit" className="btn-main" style={{ background: "var(--color-page-bg)", color: "var(--color-ink)" }}>
              Sign in with Google →
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
