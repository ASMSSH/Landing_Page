import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { CONSENTS, CONSENT_EFFECTIVE_DATE, CONSENT_VERSION, type ConsentBlock, type ConsentDoc } from '../consents';

// S5-a 동의 전문 — 팝업. 데스크톱은 가운데 대화상자, ≤480은 아래에서 올라오는 시트(S1-c 사진 보기 ReceiptPhotoDialog와 같은
// 패턴·클래스). 머리(칩·제목·메타·✕)와 발(「닫기」)은 고정이고 본문만 스크롤된다 — 긴 조문을 끝까지 내려가 닫을 필요가 없게.
// 처음(2026-09-10)엔 Figma S5-a대로 5단계 본문 자리를 통째로 바꿨는데, 닫기가 맨 아래라 불편하다는 사용자 피드백으로 팝업으로 바꿨다.
// 열고 닫는 것과 history 연동은 StepConsent가 한다. 여기는 렌더 + onClose(배경 클릭·Esc·✕·「닫기」)뿐이다.
// 블록 모델(consents.ts)을 그리고, 인라인 `**굵게**`만 <strong>으로 바꾼다 — 링크·기타 마크업은 지원하지 않는다.

interface ConsentDialogProps {
  /** null이면 닫힘 */
  doc: ConsentDoc | null;
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

export default function ConsentDialog({ doc, onClose }: ConsentDialogProps) {
  const open = doc !== null;
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // 다른 동의로 바꿔 열면 본문 스크롤을 맨 위로
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0);
    bodyRef.current?.focus();
  }, [doc]);

  if (!doc) return null;
  const index = CONSENTS.findIndex((d) => d.key === doc.key) + 1;
  return (
    <div className="apply-dialog-backdrop" onClick={onClose}>
      <div
        className="apply-dialog apply-consent-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-consent-doc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="apply-consent-doc-head">
          <div className="apply-consent-doc-head-row">
            <span className="apply-consent-doc-chip">동의 {index} / {CONSENTS.length} · 필수</span>
            <button type="button" className="apply-dialog-close" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>
          <h2 id="apply-consent-doc-title" className="apply-consent-doc-title">{doc.title}</h2>
          <p className="apply-consent-doc-meta">
            문안 버전 {CONSENT_VERSION} · {CONSENT_EFFECTIVE_DATE} 시행 · 베타(법률 검토 전)
          </p>
        </div>
        <div ref={bodyRef} className="apply-consent-doc-scroll" tabIndex={-1}>
          <div className="apply-consent-doc-body">
            {doc.blocks.map((block, i) => <Block key={i} block={block} />)}
          </div>
          <p className="apply-consent-doc-warn">
            <span aria-hidden="true">⚠</span>
            <span>베타 기간 문안이에요. 법률 검토 후 내용이 바뀔 수 있고, 바뀌면 문안 버전이 올라가요.</span>
          </p>
        </div>
        <div className="apply-dialog-btns apply-consent-doc-foot">
          <button type="button" className="btn btn-primary apply-btn-next" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
