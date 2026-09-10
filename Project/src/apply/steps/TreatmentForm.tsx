import type { ReactNode } from 'react';
import type { Treatment } from '../state';
import type { TreatmentErrors } from '../validateTreatment';
import { fieldId } from './treatmentFields';

// S1 진료 정보 폼 — 2열(≤768 1열). 값은 입력 즉시 부모가 setTreatment patch로 상태에 넣는다.
// 진료비는 상태엔 숫자만("58000") 두고 화면엔 천 단위 쉼표로 보여준다 (요약 레일·claims 컬럼이 숫자 기준).

interface TreatmentFormProps {
  value: Treatment;
  errors: TreatmentErrors;
  /** YYYY-MM-DD. 진료일 input의 max */
  today: string;
  onChange: (patch: Partial<Treatment>) => void;
}

interface FieldProps {
  name: keyof Treatment;
  label: string;
  hint: string;
  error?: string;
  full?: boolean;
  children: ReactNode;
}

function Field({ name, label, hint, error, full, children }: FieldProps) {
  return (
    <div className={`apply-field${error ? ' has-error' : ''}${full ? ' apply-form-full' : ''}`}>
      <label htmlFor={fieldId(name)} className="apply-field-label">{label}</label>
      {children}
      {error ? (
        <p className="apply-field-error" role="alert">{error}</p>
      ) : (
        <p className="apply-field-hint">{hint}</p>
      )}
    </div>
  );
}

const formatCostInput = (digits: string) => (digits ? Number(digits).toLocaleString('ko-KR') : '');

export default function TreatmentForm({ value, errors, today, onChange }: TreatmentFormProps) {
  return (
    <div className="apply-panel apply-form">
      <h3 className="apply-form-title">진료 정보</h3>
      <div className="apply-form-grid">
        <Field name="hospitalName" label="병원 이름 *" hint="영수증에 적힌 이름 그대로" error={errors.hospitalName}>
          <input
            id={fieldId('hospitalName')}
            className="field"
            type="text"
            autoComplete="off"
            placeholder="예) 개냥동물병원"
            value={value.hospitalName}
            aria-invalid={Boolean(errors.hospitalName)}
            onChange={(e) => onChange({ hospitalName: e.target.value })}
          />
        </Field>
        <Field name="visitDate" label="진료일 *" hint="오늘 이전 날짜만" error={errors.visitDate}>
          <input
            id={fieldId('visitDate')}
            className="field"
            type="date"
            max={today}
            value={value.visitDate}
            aria-invalid={Boolean(errors.visitDate)}
            onChange={(e) => onChange({ visitDate: e.target.value })}
          />
        </Field>
        <Field name="treatmentCost" label="진료비 *" hint="영수증 합계 금액(원)" error={errors.treatmentCost}>
          <input
            id={fieldId('treatmentCost')}
            className="field"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="예) 58,000"
            value={formatCostInput(value.treatmentCost)}
            aria-invalid={Boolean(errors.treatmentCost)}
            onChange={(e) => onChange({ treatmentCost: e.target.value.replace(/\D/g, '') })}
          />
        </Field>
        <Field name="diagnosis" label="병명·진료 내용 (선택)" hint="필요 서류를 더 정확히 안내해요">
          <input
            id={fieldId('diagnosis')}
            className="field"
            type="text"
            autoComplete="off"
            placeholder="예) 피부염 치료"
            value={value.diagnosis}
            onChange={(e) => onChange({ diagnosis: e.target.value })}
          />
        </Field>
        <Field name="hospitalAddress" label="병원 주소 (선택)" hint="담당자가 병원에 연락할 때 써요" full>
          <input
            id={fieldId('hospitalAddress')}
            className="field"
            type="text"
            autoComplete="off"
            placeholder="예) 서울 마포구 …"
            value={value.hospitalAddress}
            onChange={(e) => onChange({ hospitalAddress: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
