import { Fragment, type ReactNode } from 'react';
import { CONSENTS, CONSENT_EFFECTIVE_DATE, CONSENT_VERSION, type ConsentBlock, type ConsentDoc } from '../consents';

// S5-a 동의 전문. 5단계 본문 자리에 그대로 들어간다(프로그레스·레일은 그대로 — Figma S5-a).
// 열고 닫는 것과 history 연동은 StepConsent가 한다. 여기는 읽기 전용 렌더 + 「닫기」 콜백뿐이다.
// 블록 모델(consents.ts)을 그리고, 인라인 `**굵게**`만 <strong>으로 바꾼다 — 링크·기타 마크업은 지원하지 않는다.

interface ConsentDocumentProps {
  doc: ConsentDoc;
  onClose: () => void;
}

/** `**a** b **c**` → [<strong>a</strong>, ' b ', <strong>c</strong>]. 짝이 안 맞으면 마지막 조각은 평문 */
function renderInline(text: string): ReactNode {
  const parts = text.split('**');
  if (parts.length < 3) return text;
  return parts.map((part, i) =>
    i % 2 === 1 && i < parts.length - 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

function Block({ block }: { block: ConsentBlock }) {
  switch (block.type) {
    case 'h':
      return <h3>{renderInline(block.text)}</h3>;
    case 'p':
      return <p>{renderInline(block.text)}</p>;
    case 'ol':
      return (
        <ol>
          {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ol>
      );
    case 'ul':
      return (
        <ul>
          {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ul>
      );
    case 'table':
      return (
        <table>
          <thead>
            <tr>
              {block.head.map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {/* data-label: ≤480에서 표를 세로 카드로 풀 때 열 제목으로 쓴다 */}
                {row.map((cell, c) => <td key={c} data-label={block.head[c]}>{renderInline(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export default function ConsentDocument({ doc, onClose }: ConsentDocumentProps) {
  const index = CONSENTS.findIndex((d) => d.key === doc.key) + 1;
  return (
    <section className="apply-consent-doc" aria-labelledby="apply-consent-doc-title">
      <span className="apply-consent-doc-chip">동의 {index} / {CONSENTS.length} · 필수</span>
      <h2 id="apply-consent-doc-title" className="apply-consent-doc-title">{doc.title}</h2>
      <p className="apply-consent-doc-meta">
        문안 버전 {CONSENT_VERSION} · {CONSENT_EFFECTIVE_DATE} 시행 · 베타(법률 검토 전)
      </p>
      <div className="apply-panel apply-consent-doc-body">
        {doc.blocks.map((block, i) => <Block key={i} block={block} />)}
      </div>
      <p className="apply-consent-doc-warn">
        <span aria-hidden="true">⚠</span>
        <span>베타 기간 문안이에요. 법률 검토 후 내용이 바뀔 수 있고, 바뀌면 문안 버전이 올라가요.</span>
      </p>
      <div className="apply-consent-doc-foot">
        <span className="apply-step-count">동의 전문 · 5단계 「보기」에서 열림</span>
        <button type="button" className="btn apply-btn-ghost apply-consent-doc-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </section>
  );
}
