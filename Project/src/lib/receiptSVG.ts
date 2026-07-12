import type { Example } from '../data/examples';

/** Builds a self-contained SVG receipt for an example and returns it as a data URL. */
export function receiptSVG(ex: Example): string {
  const r = ex.receipt;
  const W = 360;
  const PAD = 28;
  const esc = (s: string | number) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const meta: [string, string][] = [
    ['환자', r.patient],
    ['보호자', r.guardian],
    ['진료일', ex.date],
    ['영수증번호', r.no],
    ['진단명', ex.diag],
  ];

  let y = 96;
  let s = '';
  s += `<text x="180" y="42" font-size="19" font-weight="700" fill="#EF5E3B" text-anchor="middle">${esc(r.hospital)}</text>`;
  s += `<text x="180" y="63" font-size="12" fill="#8A7462" text-anchor="middle">진료비 계산서 · 영수증</text>`;
  for (const m of meta) {
    s += `<text x="${PAD}" y="${y}" font-size="12" fill="#8A7462">${esc(m[0])}</text>`;
    s += `<text x="${W - PAD}" y="${y}" font-size="12" fill="#453528" text-anchor="end">${esc(m[1])}</text>`;
    y += 22;
  }
  s += `<line x1="${PAD}" y1="${y - 4}" x2="${W - PAD}" y2="${y - 4}" stroke="#EAD9C4" stroke-dasharray="3 3"/>`;
  y += 22;
  for (const it of r.items) {
    s += `<text x="${PAD}" y="${y}" font-size="12" fill="#453528">${esc(it[0])}</text>`;
    s += `<text x="${W - PAD}" y="${y}" font-size="12" fill="#453528" text-anchor="end">${esc(it[1])} 원</text>`;
    y += 24;
  }
  s += `<line x1="${PAD}" y1="${y - 6}" x2="${W - PAD}" y2="${y - 6}" stroke="#EAD9C4" stroke-dasharray="3 3"/>`;
  y += 24;
  s += `<text x="${PAD}" y="${y}" font-size="14" font-weight="700" fill="#453528">합계 금액</text>`;
  s += `<text x="${W - PAD}" y="${y}" font-size="16" font-weight="700" fill="#EF5E3B" text-anchor="end">${esc(r.total)} 원</text>`;
  y += 28;
  s += `<text x="${PAD}" y="${y}" font-size="10" fill="#A38F7D">결제 · 신용카드</text>`;
  s += `<text x="${W - PAD}" y="${y}" font-size="10" fill="#A38F7D" text-anchor="end">사업자 123-45-67890</text>`;
  y += 20;
  s += `<text x="180" y="${y}" font-size="10" fill="#C9B49E" text-anchor="middle">※ 보험찾개냥 체험용 예시 영수증입니다</text>`;
  const H = y + 18;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif">` +
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="#FFFDF8" stroke="#EAD9C4"/>${s}</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
