export default function SignalPanel() {
  return (
    <div className="signal-panel">
      <div className="signal-title">Why this lands</div>
      <div className="signal-item">
        <span className="sig-num">01</span>
        <span className="sig-text">
          <strong>Paper-level specificity</strong> — not &quot;your
          research&quot;, section 4 of a named 2024 publication
        </span>
      </div>
      <div className="signal-item">
        <span className="sig-num">02</span>
        <span className="sig-text">
          <strong>Proof not claims</strong> — GitHub repo as evidence, not
          &quot;I&apos;m passionate about NLP&quot;
        </span>
      </div>
      <div className="signal-item">
        <span className="sig-num">03</span>
        <span className="sig-text">
          <strong>Zero-risk ask</strong> — repo first, then 15 min. They lose
          nothing saying yes
        </span>
      </div>
    </div>
  );
}
