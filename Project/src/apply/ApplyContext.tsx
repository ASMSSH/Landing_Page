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
}

const ApplyContext = createContext<ApplyContextValue | null>(null);

export function ApplyProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(applyReducer, initialApplyState);
  const [receiptPreview, setPreviewState] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const previewRef = useRef<string | null>(null);

  const setReceiptPreview = useCallback((url: string | null) => {
    const prev = previewRef.current;
    if (prev && prev !== url) URL.revokeObjectURL(prev);
    previewRef.current = url;
    setPreviewState(url);
  }, []);

  // reset(S6 「처음으로」)이면 사진도 같이 지운다
  const dispatch = useCallback<Dispatch<ApplyAction>>(
    (action) => {
      rawDispatch(action);
      if (action.type === 'reset') setReceiptPreview(null);
    },
    [setReceiptPreview],
  );

  // 페이지를 떠날 때 object URL 해제
  useEffect(() => () => setReceiptPreview(null), [setReceiptPreview]);

  return (
    <ApplyContext.Provider value={{ state, dispatch, receiptPreview, setReceiptPreview, submitting, setSubmitting }}>
      {children}
    </ApplyContext.Provider>
  );
}

export function useApply(): ApplyContextValue {
  const ctx = useContext(ApplyContext);
  if (!ctx) throw new Error('useApply must be used within ApplyProvider');
  return ctx;
}
