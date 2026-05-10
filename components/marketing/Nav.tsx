import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";

export default function Nav() {
  return (
    <nav className="nav">
      <div className="logo-mark">
        <span className="logo-big">BigEmailDaddy</span>
        <span className="logo-sup">Beta</span>
      </div>
      <ul className="nav-links">
        <li><a href="#how-it-works">How it works</a></li>
        <li><a href="#examples">Examples</a></li>
        <li><a href="#pricing">Pricing</a></li>
      </ul>
      <form action={signInWithGoogleToDashboard}>
        <button type="submit" className="nav-cta">
          Start free →
        </button>
      </form>
    </nav>
  );
}
