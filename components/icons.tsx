const ICONES: Record<string, string> = {
  painel: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  processos: "M4 4h9l2 2h5a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z|M7 12h10M7 15.5h6",
  mais: "M12 5v14M5 12h14",
  documento: "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z|M14 3v4h4M9 13h6M9 16.5h4",
  baixar: "M12 4v11m0 0 4-4m-4 4-4-4|M4 18h16",
  assinatura: "M3 19c3.5 0 3.5-11 7-11s3.5 8 6.5 8c1.6 0 2.3-1.2 2.5-2.4|M4 21h16",
  relogio: "circle:12,12,8.5|M12 7.5V12l3 2",
  alerta: "M10.6 4.2 2.9 17.4A1.6 1.6 0 0 0 4.3 20h15.4a1.6 1.6 0 0 0 1.4-2.6L13.4 4.2a1.6 1.6 0 0 0-2.8 0Z|M12 9.5v4M12 16.8v.01",
  check: "m5 12.5 4.5 4.5L19 7",
  seta: "M5 12h14m0 0-5-5m5 5-5 5",
  voltar: "M19 12H5m0 0 5-5m-5 5 5 5",
  chevron: "m6 9 6 6 6-6",
  usuario: "circle:12,8.5,3.75|M4.5 20a7.5 7.5 0 0 1 15 0",
  reiniciar: "M20 12a8 8 0 1 1-2.6-5.9|M20 4v4h-4",
  cadeado: "rect:4.5,10,15,10,1.5|M8 10V7.5a4 4 0 0 1 8 0V10",
  clipe: "M8 12.5 15.5 5a3 3 0 0 1 4.24 4.24L11.5 17.5a5 5 0 1 1-7.07-7.07L12.5 2.36",
  x: "M6 6l12 12M18 6L6 18",
};

function segmento(seg: string, i: number) {
  if (seg.startsWith("circle:")) {
    const [cx, cy, r] = seg.slice(7).split(",");
    return <circle key={i} cx={cx} cy={cy} r={r} />;
  }
  if (seg.startsWith("rect:")) {
    const [x, y, w, h, rx] = seg.slice(5).split(",");
    return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />;
  }
  return <path key={i} d={seg} />;
}

export function Icon({ name, className }: { name: keyof typeof ICONES; className?: string }) {
  const d = ICONES[name] ?? "";
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.split("|").map(segmento)}
    </svg>
  );
}
