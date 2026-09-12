import { useMemo, useState } from 'react';
import ApplyActions from '../ApplyActions';
import { useApply } from '../ApplyContext';
import type { Applicant } from '../state';
import StepHeading from '../StepHeading';
import { stepDef } from '../steps';
import { validateApplicant, type ApplicantErrors } from '../validateApplicant';
import { todayIso } from '../validateTreatment';
import ApplicantForm from './ApplicantForm';
import { APPLICANT_FIELD_ORDER, fieldId } from './applicantFields';

// S4 신청 정보. 헤딩·폼·안내·액션 행을 조립한다 — S1(StepTreatment)과 같은 검증 흐름:
// 「다음」에서만 검증하고, 한 번 걸린 뒤에는 입력할 때마다 다시 검사해 메시지를 지운다. 첫 오류 칸에 포커스.
// 주민번호·신분증·통장은 여기서 받지 않는다 — 청구 준비 단계에서 담당자가 필요할 때만 따로 받는다 (위키 ⑤).

const STEP = 4;

export default function StepApplicant() {
  const { state, dispatch } = useApply();
  const def = stepDef(STEP);
  const today = useMemo(() => todayIso(), []);
  const [errors, setErrors] = useState<ApplicantErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (patch: Partial<Applicant>) => {
    dispatch({ type: 'setApplicant', patch });
    if (submitted) setErrors(validateApplicant({ ...state.applicant, ...patch }, today));
  };

  const handleNext = () => {
    const next = validateApplicant(state.applicant, today);
    setErrors(next);
    setSubmitted(true);
    const first = APPLICANT_FIELD_ORDER.find((name) => next[name]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    dispatch({ type: 'next' });
  };

  if (!def) return null;
  return (
    <>
      <StepHeading number={def.number} title={def.title} description={def.description} />
      <ApplicantForm value={state.applicant} errors={errors} onChange={handleChange} />
      <p className="apply-note is-info">
        <span aria-hidden="true">🔒</span>
        <span>청구 준비 단계에서 담당자가 필요한 서류가 있으면 따로 요청드려요. 지금은 위 정보만 있으면 돼요.</span>
      </p>
      <ApplyActions onNext={handleNext} />
    </>
  );
}
