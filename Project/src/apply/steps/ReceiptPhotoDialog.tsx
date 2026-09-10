import { useEffect, useState } from 'react';
import Icon from '../../components/icons';

// 올린 영수증 사진 보기. 데스크톱은 가운데 대화상자, ≤480은 아래에서 올라오는 시트(CSS로 갈린다).
// Figma S1-c. 배경 클릭·Esc·「닫기」로 닫고, 열려 있는 동안 본문 스크롤을 잠근다(체험 모달 MvpModal과 같은 패턴,
// 클래스는 apply- 접두사로 새로 쓴다).

interface ReceiptPhotoDialogProps {
  open: boolean;
  url: string | null;
  onClose: () => void;
  /** 「다시 올리기」 — 파일 선택창을 연다. 닫는 건 호출자가 한다 */
  onReupload: () => void;
}

export default function ReceiptPhotoDialog({ open, url, onClose, onReupload }: ReceiptPhotoDialogProps) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);

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

  if (!open) return null;
  return (
    <div className="apply-dialog-backdrop" onClick={onClose}>
      <div
        className="apply-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-photo-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="apply-dialog-head">
          <h3 id="apply-photo-title" className="apply-dialog-title">올린 영수증 사진</h3>
          <button type="button" className="apply-dialog-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="apply-dialog-image">
          {url && !broken ? (
            <img src={url} alt="올린 영수증 사진" onError={() => setBroken(true)} />
          ) : (
            <div className="apply-dialog-image-fallback">
              <Icon name="receipt" size={40} />
              <span>이 브라우저에서는 사진을 미리 볼 수 없어요. 아래 폼의 내용을 확인해 주세요</span>
            </div>
          )}
        </div>
        <p className="apply-dialog-note">
          사진은 서버에 저장하지 않고 이 화면에서만 보여요. 창을 닫아도 폼에 채운 값은 그대로예요.
        </p>
        <div className="apply-dialog-btns">
          <button type="button" className="btn apply-btn-ghost apply-btn-white" onClick={onReupload}>
            다시 올리기
          </button>
          <button type="button" className="btn btn-primary apply-btn-next" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
