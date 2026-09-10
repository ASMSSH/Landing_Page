import { useRef } from 'react';
import Icon from '../../components/icons';
import { ACCEPTED_MIME_TYPES } from '../imageToDataUrl';

// S1 영수증 업로드 카드 — 가로형 한 줄(아이콘 · 문안 · 버튼). Figma 데스크톱 S1/S1-a.
// 파일은 여기서 고르기만 하고, 읽기·분석·상태 반영은 StepTreatment가 한다.
// 실패 상태는 따로 없다 — 실패하면 부모가 idle로 되돌리고 토스트를 띄운다.

export type UploadStatus = 'idle' | 'loading' | 'done';

interface ReceiptUploadCardProps {
  status: UploadStatus;
  onFile: (file: File) => void;
}

const COPY: Record<UploadStatus, { title: string; sub: string; button: string }> = {
  idle: {
    title: '영수증을 올리면 자동으로 채워드려요',
    sub: 'JPG·PNG · 사진은 저장하지 않고 인식에만 써요 · 없으면 아래에 직접 적어도 돼요',
    button: '파일 선택',
  },
  loading: {
    title: '영수증을 읽고 있어요…',
    sub: '보통 10초 안에 끝나요',
    button: '읽는 중',
  },
  done: {
    title: '영수증 1장을 읽었어요',
    sub: '읽은 내용을 아래에서 확인하고 틀린 곳은 고쳐 주세요',
    button: '다시 올리기',
  },
};

export default function ReceiptUploadCard({ status, onFile }: ReceiptUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = COPY[status];

  return (
    <div className={`apply-upload${status === 'loading' ? ' is-loading' : ''}${status === 'done' ? ' is-done' : ''}`}>
      <span className="apply-upload-icon" aria-hidden="true">
        {status === 'loading' ? <span className="apply-spinner" /> : <Icon name={status === 'done' ? 'check' : 'camera'} size={22} />}
      </span>
      <div className="apply-upload-copy">
        <strong className="apply-upload-title">{copy.title}</strong>
        <span className="apply-upload-sub">{copy.sub}</span>
      </div>
      <button
        type="button"
        className={`btn ${status === 'done' ? 'apply-btn-ghost' : 'apply-upload-btn'}`}
        disabled={status === 'loading'}
        onClick={() => inputRef.current?.click()}
      >
        {copy.button}
      </button>
      {/* capture 속성은 넣지 않는다 — 안드로이드에서 갤러리 선택이 막힌다 */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // 같은 파일을 다시 골라도 change가 나게
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
