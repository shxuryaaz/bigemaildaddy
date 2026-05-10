export default function Footer() {
  return (
    <footer className="page-footer">
      <span className="footer-copy">
        © {new Date().getFullYear()} BigEmailDaddy — Beta
      </span>
      <span className="footer-copy">Built for BTech students in India</span>
    </footer>
  );
}
