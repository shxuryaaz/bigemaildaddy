import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";

export default function Hero() {
  return (
    <div className="hero-left">
      <div>
        <h1 className="headline">
          Your cold
          <br />
          emails are
          <br />
          <span className="stroke">trash.</span>
          <br />
          <span className="italic">Ours aren&apos;t.</span>
        </h1>
        <div className="tagline">Let Big Email Daddy handle it.</div>
        <p className="deck">
          Upload your resume and GitHub. Pick a professor or recruiter. We
          research them, find the <strong>exact overlap</strong> between their
          world and yours, and write one email that sounds like you actually
          thought about it.
        </p>
      </div>
      <div className="cta-block">
        <form action={signInWithGoogleToDashboard}>
          <button type="submit" className="btn-main">
            Write my first email
          </button>
        </form>
        <a href="#examples" className="btn-ghost">
          See example →
        </a>
      </div>
    </div>
  );
}
