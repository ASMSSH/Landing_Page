import { useEffect, useState } from 'react';
import Icon from '../../components/icons';

// S1 영수증 업로드 카드 — 가로형 한 줄(아이콘 · 문안 · 버튼). Figma 데스크톱 S1/S1-a.
// 파일 선택 input은 StepTreatment가 갖고(모달의 「다시 올리기」도 같은 input을 연다), 여기는 상태별 모양만 그린다.
// 실패 상태는 따로 없다 — 실패하면 부모가 이전 상태로 되돌리고 토스트를 띄운다.

export type UploadStatus = 'idle' | 'loading' | 'done';

interface ReceiptUploadCardProps {
  status: UploadStatus;
  /** done일 때 썸네일로 보여줄 사진 object URL. 없거나 못 그리면 영수증 아이콘 */
  previewUrl: string | null;
  /** 파일 선택창 열기 (「파일 선택」·「다시 올리기」) */
  onPick: () => void;
  /** 「사진 보기」·썸네일 클릭 */
  onView: () => void;
}

const COPY: Record<UploadStatus, { title: string; sub: string }> = {
  idle: {
    title: '영수증을 올리면 자동으로 채워드려요',
    sub: 'JPG·PNG · 사진은 저장하지 않고 인식에만 써요 · 없으면 아래에 직접 적어도 돼요',
  },
  loading: {
    title: '영수증을 읽고 있어요…',
    sub: '보통 10초 안에 끝나요',
  },
  done: {
    title: '영수증 1장을 읽었어요',
    sub: '읽은 내용을 아래에서 확인하고 틀린 곳은 고쳐 주세요',
  },
};

/** 사진 썸네일. 브라우저가 못 그리는 형식(Chrome의 HEIC)이면 영수증 아이콘으로 */
function Thumbnail({ url, onClick }: { url: string | null; onClick: () => void }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  return (
    <button type="button" className="apply-upload-thumb" onClick={onClick} aria-label="올린 영수증 사진 보기">
      {url && !broken ? (
        <img src={url} alt="" onError={() => setBroken(true)} />
      ) : (
        <Icon name="receipt" size={24} />
      )}
      <span className="apply-upload-badge" aria-hidden="true">
        <Icon name="check" size={11} strokeWidth={3} />
      </span>
    </button>
  );
}

export default function ReceiptUploadCard({ status, previewUrl, onPick, onView }: ReceiptUploadCardProps) {
  const copy = COPY[status];

  return (
    <div className={`apply-upload${status === 'loading' ? ' is-loading' : ''}${status === 'done' ? ' is-done' : ''}`}>
      {status === 'done' ? (
        <Thumbnail url={previewUrl} onClick={onView} />
      ) : (
        <span className="apply-upload-icon" aria-hidden="true">
          {status === 'loading' ? <span className="apply-spinner" /> : <Icon name="camera" size={22} />}
        </span>
      )}
      <div className="apply-upload-copy">
        <strong className="apply-upload-title">{copy.title}</strong>
        <span className="apply-upload-sub">{copy.sub}</span>
      </div>
      {status === 'done' ? (
        <div className="apply-upload-btns">
          <button type="button" className="btn apply-btn-ghost apply-btn-white" onClick={onView}>
            사진 보기
          </button>
          <button type="button" className="btn apply-btn-ghost apply-btn-white" onClick={onPick}>
            다시 올리기
          </button>
        </div>
      ) : (
        <button type="button" className="btn apply-upload-btn" disabled={status === 'loading'} onClick={onPick}>
          {status === 'loading' ? '읽는 중' : '파일 선택'}
        </button>
      )}
    </div>
  );
}
