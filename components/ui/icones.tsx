/** Ícones em SVG inline — sem dependência externa, herdam `currentColor` e o tamanho do texto. */

type Props = { className?: string };

const base = "size-4 shrink-0";

function Svg({
  children,
  className,
  preenchido = false,
}: Props & { children: React.ReactNode; preenchido?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={preenchido ? "currentColor" : "none"}
      stroke={preenchido ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? base}
    >
      {children}
    </svg>
  );
}

export function IconePainel(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </Svg>
  );
}

export function IconeProcessos(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 4h9l2 2h5a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M7 12h10M7 15.5h6" />
    </Svg>
  );
}

export function IconeMais(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconeDocumento(p: Props) {
  return (
    <Svg {...p}>
      <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z" />
      <path d="M14 3v4h4M9 13h6M9 16.5h4" />
    </Svg>
  );
}

export function IconeBaixar(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function IconeAssinatura(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 19c3.5 0 3.5-11 7-11s3.5 8 6.5 8c1.6 0 2.3-1.2 2.5-2.4" />
      <path d="M4 21h16" />
    </Svg>
  );
}

export function IconeRelogio(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconeAlerta(p: Props) {
  return (
    <Svg {...p}>
      <path d="M10.6 4.2 2.9 17.4A1.6 1.6 0 0 0 4.3 20h15.4a1.6 1.6 0 0 0 1.4-2.6L13.4 4.2a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 9.5v4M12 16.8v.01" />
    </Svg>
  );
}

export function IconeCheck(p: Props) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  );
}

export function IconeSeta(p: Props) {
  return (
    <Svg {...p}>
      <path d="M5 12h14m0 0-5-5m5 5-5 5" />
    </Svg>
  );
}

export function IconeVoltar(p: Props) {
  return (
    <Svg {...p}>
      <path d="M19 12H5m0 0 5-5m-5 5 5 5" />
    </Svg>
  );
}

export function IconeChevron(p: Props) {
  return (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconeUsuario(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Svg>
  );
}

export function IconeReiniciar(p: Props) {
  return (
    <Svg {...p}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </Svg>
  );
}

export function IconeCadeado(p: Props) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="10" width="15" height="10" rx="1.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </Svg>
  );
}

export function IconeImprimir(p: Props) {
  return (
    <Svg {...p}>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7" rx="1.5" />
      <path d="M7 14h10v6H7z" />
    </Svg>
  );
}

export function IconeBalanca(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 4v16M7 20h10M5 8h14M9 8 6 14h6L9 8ZM15 8l-3 6h6l-3-6Z" />
    </Svg>
  );
}
