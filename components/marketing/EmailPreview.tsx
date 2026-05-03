export default function EmailPreview() {
  return (
    <div className="email-frame">
      <div className="frame-label">Live email preview</div>
      <div className="email-paper">
        <div className="ep-head">
          <div className="ep-row">
            <span className="ep-key">To</span>
            <span className="ep-val">
              Prof. Rajesh Kumar — IIT Delhi, NLP Lab
            </span>
          </div>
          <div className="ep-row">
            <span className="ep-key">Sub</span>
            <span className="ep-val">Your section 4 gap + my capstone</span>
          </div>
        </div>
        <div className="ep-body">
          Prof. Kumar — your{" "}
          <span className="ep-hl">2024 paper on cross-lingual transfer</span>{" "}
          flagged code-switching as an open problem in section 4. That&apos;s
          the exact direction I&apos;ve been building for my final year project —
          a Hinglish corpus pipeline with sub-word alignment.
          <br />
          <br />
          Worth 15 minutes? Happy to send the repo first.
        </div>
      </div>
    </div>
  );
}
