import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { applyReducer, initialApplyState, type ApplyAction, type ApplyState } from './state';

interface ApplyContextValue {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  /**
   * S1에서 올린 영수증 사진의 object URL. 「사진 보기」 썸네일·모달이 쓴다.
   * 서버·스토리지에 저장하지 않고(위키 ⑪-③) 브라우저 메모리에만 있어 새로고침하면 사라진다 —
   * SSH-542 「세션 저장은 하지 않는다」와 같은 원칙. S2에 갔다 돌아와도 보여야 해서 S1 로컬이 아니라 여기 둔다.
   */
  receiptPreview: string | null;
  /** 새 URL을 넣으면 이전 URL은 revoke한다. null이면 지운다 */
  setReceiptPreview: (url: string | null) => void;
  /**
   * S5 「신청하기」 전송 중. 단계 컴포넌트 밖의 「← 이전」(ApplyActions)·프로그레스(ApplyProgress)도 이 값을 읽어 이동을 막는다 —
   * 요청이 서버에 닿은 뒤 화면을 떠나면 접수는 되는데 접수번호를 못 보고, 돌아와 다시 누르면 중복 접수다 (AI 리뷰 P2, SSH-486)
   */
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  /**
   * 신청 1건의 멱등 키 — POST /api/claims 본문의 client_id. 서버(server/claims.ts)는 같은 값이 다시 오면 insert 대신
   * 이미 접수된 접수번호를 돌려준다. 15초 타임아웃 뒤 「다시 시도」가 같은 신청을 두 번 접수하는 것을 막는다 (SSH-544).
   * reducer 상태(initialApplyState)는 상수라 거기 두면 reset 뒤에도 같은 값이 남는다 — 「처음으로」 뒤의 새 신청이 이전
   * 접수번호를 돌려받는 사고. 그래서 Provider가 들고 reset에서만 새로 만든다.
   * 실패 뒤 S4로 돌아가 내용을 고치고 다시 보내도 같은 값이 간다 — 서버는 그 행의 내용을 갱신하고 접수번호를 유지한다.
   */
  clientId: string;
}

const ApplyContext = createContext<ApplyContextValue | null>(null);

/**
 * 멱등 키 생성. crypto.randomUUID는 보안 컨텍스트(HTTPS·localhost)에만 있어서 `vite --host`로 띄운 http://192.168.x.x를
 * 실기기에서 열면 /apply가 렌더 전에 죽는다 (AI 리뷰 P3). getRandomValues는 어디서나 있으니 그걸로 v4를 만든다.
 */
function newClientId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function ApplyProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(applyReducer, initialApplyState);
  const [receiptPreview, setPreviewState] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clientId, setClientId] = useState(newClientId);
  const previewRef = useRef<string | null>(null);

  const setReceiptPreview = useCallback((url: string | null) => {
    const prev = previewRef.current;
    if (prev && prev !== url) URL.revokeObjectURL(prev);
    previewRef.current = url;
    setPreviewState(url);
  }, []);

  // reset(S6 「처음으로」)이면 사진도 같이 지우고, 멱등 키도 새로 만든다
  const dispatch = useCallback<Dispatch<ApplyAction>>(
    (action) => {
      rawDispatch(action);
      if (action.type === 'reset') {
        setReceiptPreview(null);
        setClientId(newClientId());
      }
    },
    [setReceiptPreview],
  );

  // 페이지를 떠날 때 object URL 해제
  useEffect(() => () => setReceiptPreview(null), [setReceiptPreview]);

  return (
    <ApplyContext.Provider value={{ state, dispatch, receiptPreview, setReceiptPreview, submitting, setSubmitting, clientId }}>
      {children}
    </ApplyContext.Provider>
  );
}

export function useApply(): ApplyContextValue {
  const ctx = useContext(ApplyContext);
  if (!ctx) throw new Error('useApply must be used within ApplyProvider');
  return ctx;
}
