import { useEffect, useRef, useState, type DragEvent } from 'react';
import Icon from '../../components/icons';

// S1 영수증 업로드 카드 — 가로형 한 줄(아이콘 · 문안 · 버튼). Figma 데스크톱 S1/S1-a.
// 파일 선택 input은 StepTreatment가 갖고(모달의 「다시 올리기」도 같은 input을 연다), 여기는 상태별 모양만 그린다.
// 실패 상태는 따로 없다 — 실패하면 부모가 이전 상태로 되돌리고 토스트를 띄운다.
//
// 카드 전체가 드롭 영역이다 (SSH-553). 드래그 중 강조(is-dragover)만 여기서 갖고, 떨어진 File은 onDrop으로 부모에 올린다 —
// 부모가 「파일 선택」 input과 같은 handleFile로 넘기므로 검증·거부 문구·OCR 경로가 한 벌이다. 터치(모바일)는 드래그 이벤트가 없다.

export type UploadStatus = 'idle' | 'loading' | 'done';

interface ReceiptUploadCardProps {
  status: UploadStatus;
  /** done일 때 썸네일로 보여줄 사진 object URL. 없거나 못 그리면 영수증 아이콘 */
  previewUrl: string | null;
  /** 파일 선택창 열기 (「파일 선택」·「다시 올리기」) */
  onPick: () => void;
  /** 「사진 보기」·썸네일 클릭 */
  onView: () => void;
  /** 카드에 파일을 끌어다 놓음 — 「파일 선택」과 같은 경로로 처리한다 */
  onDrop: (file: File) => void;
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

/** 드래그 중엔 상태와 무관하게 이 문안 — done에서 놓아도 「다시 올리기」와 같은 동작이라 문구를 가를 이유가 없다 */
const DRAGOVER_COPY = { title: '여기에 놓으세요', sub: '놓으면 바로 읽기 시작해요' };

/** 파일을 끄는 드래그인가 — 텍스트·링크 드래그는 강조하지 않는다 */
function hasFiles(e: DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes('Files');
}

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

export default function ReceiptUploadCard({ status, previewUrl, onPick, onView, onDrop }: ReceiptUploadCardProps) {
  const [dragover, setDragover] = useState(false);
  // 자식 요소(아이콘·문안·버튼)를 지날 때 dragleave/dragenter가 쌍으로 나서, 불리언이면 강조가 깜빡인다 — 깊이를 센다
  const depth = useRef(0);
  const copy = dragover ? DRAGOVER_COPY : COPY[status];

  const reset = () => {
    depth.current = 0;
    setDragover(false);
  };

  // 읽는 중엔 「파일 선택」 버튼이 disabled인 것과 같은 조건으로 드롭을 받지 않는다 — 강조도 안 하고 preventDefault도 안 해서
  // 카드 밖과 똑같이 「놓을 수 없음」 커서가 된다(ApplyShell의 window 리스너)
  const accepts = (e: DragEvent) => status !== 'loading' && hasFiles(e);

  const handleDragEnter = (e: DragEvent) => {
    if (!accepts(e)) return;
    e.preventDefault();
    depth.current += 1;
    if (depth.current === 1) setDragover(true);
  };
  const handleDragOver = (e: DragEvent) => {
    if (!accepts(e)) return;
    e.preventDefault(); // 이게 있어야 drop이 발생한다
    e.dataTransfer.dropEffect = 'copy';
  };
  const handleDragLeave = (e: DragEvent) => {
    if (!accepts(e)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragover(false);
  };
  const handleDrop = (e: DragEvent) => {
    if (!accepts(e)) return;
    e.preventDefault();
    reset();
    const file = e.dataTransfer.files[0]; // 여러 장이면 첫 장만 — input도 multiple이 아니다
    if (file) onDrop(file);
  };

  return (
    <div
      className={`apply-upload${status === 'loading' ? ' is-loading' : ''}${status === 'done' ? ' is-done' : ''}${dragover ? ' is-dragover' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
