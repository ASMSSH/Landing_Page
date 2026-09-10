import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ANALYZE_FAILED_MESSAGE, analyzeReceiptWithGemini } from '../../lib/geminiAnalyze';
import ApplyActions from '../ApplyActions';
import { useApply } from '../ApplyContext';
import StepHeading from '../StepHeading';
import Toast from '../Toast';
import { imageToDataUrl } from '../imageToDataUrl';
import { receiptToTreatment } from '../receiptToTreatment';
import type { Treatment } from '../state';
import { stepDef } from '../steps';
import { todayIso, validateTreatment, type TreatmentErrors } from '../validateTreatment';
import ReceiptUploadCard, { type UploadStatus } from './ReceiptUploadCard';
import TreatmentForm from './TreatmentForm';
import { TREATMENT_FIELD_ORDER, fieldId } from './treatmentFields';

// S1 진료 정보 등록. 헤딩·업로드 카드·폼·액션 행을 이 컴포넌트가 조립한다 (spec 5절 —
// 단계 컴포넌트가 헤딩과 액션 행을 소유한다. S3·S4~S6도 같은 방식).
//
// 영수증 사진 흐름: 파일 선택 → imageToDataUrl(축소) → /api/analyze-receipt → receiptToTreatment →
// setTreatment patch. 파일·dataURL은 이 함수 안에서만 살고 상태·스토리지에 넣지 않는다 (위키 ⑪-③).

const OCR_DONE_DESCRIPTION = '영수증에서 읽은 내용이에요. 확인하고 틀린 곳은 고쳐 주세요';
const OCR_EMPTY_MESSAGE = '영수증에서 읽을 수 있는 내용이 없었어요. 직접 입력해 주세요';

export default function StepTreatment() {
  const { state, dispatch } = useApply();
  const def = stepDef(1);
  const today = useMemo(() => todayIso(), []);

  // 다른 단계에 갔다 돌아와도 「읽었어요」 카드가 유지되게 초기값은 상태에서 온다 (사진은 저장하지 않는다)
  const [status, setStatus] = useState<UploadStatus>(state.receiptRead ? 'done' : 'idle');
  const [errors, setErrors] = useState<TreatmentErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 언마운트(다음 단계로 이동 등) 시 진행 중인 분석 요청을 끊는다
  useEffect(() => () => abortRef.current?.abort(), []);

  const closeToast = useCallback(() => setToast(null), []);

  const handleFile = async (file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setToast(null);

    try {
      const dataUrl = await imageToDataUrl(file);
      const analysis = await analyzeReceiptWithGemini(dataUrl, controller.signal);
      if (controller.signal.aborted) return;
      const patch = receiptToTreatment(analysis);
      if (Object.keys(patch).length === 0) {
        setStatus('idle');
        setToast(OCR_EMPTY_MESSAGE);
        return;
      }
      dispatch({ type: 'setTreatment', patch });
      dispatch({ type: 'setReceiptRead', read: true });
      if (submitted) setErrors(validateTreatment({ ...state.treatment, ...patch }, today));
      setStatus('done');
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus('idle');
      setToast(error instanceof Error && error.message ? error.message : ANALYZE_FAILED_MESSAGE);
    }
  };

  const handleChange = (patch: Partial<Treatment>) => {
    dispatch({ type: 'setTreatment', patch });
    // 한 번 「다음」에서 걸린 뒤에는 입력할 때마다 다시 검사해 메시지를 지운다
    if (submitted) setErrors(validateTreatment({ ...state.treatment, ...patch }, today));
  };

  const handleNext = () => {
    const next = validateTreatment(state.treatment, today);
    setErrors(next);
    setSubmitted(true);
    const first = TREATMENT_FIELD_ORDER.find((name) => next[name]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    dispatch({ type: 'next' });
  };

  if (!def) return null;
  return (
    <>
      <StepHeading
        number={def.number}
        title={def.title}
        description={status === 'done' ? OCR_DONE_DESCRIPTION : def.description}
      />
      <ReceiptUploadCard status={status} onFile={handleFile} />
      <TreatmentForm value={state.treatment} errors={errors} today={today} onChange={handleChange} />
      <ApplyActions onNext={handleNext} />
      <Toast message={toast} onClose={closeToast} />
    </>
  );
}
