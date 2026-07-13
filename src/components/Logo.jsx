function LogoMark() {
  return (
    <svg className="logo__symbol" viewBox="0 0 128 78" aria-hidden="true" focusable="false">
      <path className="logo__primary" d="M6 67 43 9h17L25 67H6Z" />
      <path className="logo__primary" d="M62 9h17l34 58H95L70 24 56 47 46 30 58 9h4Z" />
      <path className="logo__accent" d="M76 31h18L78 62 64 42l12-11Z" />
      <path className="logo__primary" d="M96 31h15l17 36h-18l-8-19-10 19H76l20-36Z" />
    </svg>
  );
}

export default function Logo({ light = false, variant = 'horizontal' }) {
  return (
    <a
      className={`logo logo--${variant} ${light ? 'logo--light' : ''}`}
      href="/#inicio"
      aria-label="ALM Anestesia — início"
    >
      <LogoMark />
      <span className="logo__wordmark">
        <span className="logo__letters">ALM</span>
        <span className="logo__name">ANESTESIA</span>
      </span>
    </a>
  );
}
