import type { ReactNode } from 'react';
import { formatBirthInput } from '../../lib/birth';
import { formatMobileNumber } from '../../lib/phone';
import type { Applicant } from '../state';
import type { ApplicantErrors } from '../validateApplicant';
import { fieldId } from './applicantFields';

// S4 신청 정보 폼 — 2열(≤768 1열). 값은 입력 즉시 부모가 setApplicant patch로 상태에 넣는다.
// 전화·생년월일은 숫자만 받아 하이픈을 자동으로 붙인다(상태에도 하이픈 포함 형식 그대로 — claims 컬럼 형식과 같다).
// 스타일은 S1 TreatmentForm의 .apply-form/.apply-field 클래스를 그대로 쓴다.

interface ApplicantFormProps {
  value: Applicant;
  errors: ApplicantErrors;
  onChange: (patch: Partial<Applicant>) => void;
}

interface FieldProps {
  name: keyof Applicant;
  label: string;
  hint: string;
  error?: string;
  children: ReactNode;
}

function Field({ name, label, hint, error, children }: FieldProps) {
  return (
    <div className={`apply-field${error ? ' has-error' : ''}`}>
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

export default function ApplicantForm({ value, errors, onChange }: ApplicantFormProps) {
  return (
    <div className="apply-panel apply-form">
      <h3 className="apply-form-title">보호자 · 반려동물 정보</h3>
      <div className="apply-form-grid">
        <Field name="name" label="보호자 이름 *" hint="실명 2~20자" error={errors.name}>
          <input
            id={fieldId('name')}
            className="field"
            type="text"
            autoComplete="name"
            placeholder="예) 김민석"
            value={value.name}
            aria-invalid={Boolean(errors.name)}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field name="phone" label="휴대전화번호 *" hint="담당자가 24시간 안에 연락드려요" error={errors.phone}>
          <input
            id={fieldId('phone')}
            className="field"
            type="text"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="010-0000-0000"
            value={value.phone}
            aria-invalid={Boolean(errors.phone)}
            onChange={(e) => onChange({ phone: formatMobileNumber(e.target.value) })}
          />
        </Field>
        <Field name="birth" label="생년월일 *" hint="만 14세 이상만 신청할 수 있어요" error={errors.birth}>
          <input
            id={fieldId('birth')}
            className="field"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            value={value.birth}
            aria-invalid={Boolean(errors.birth)}
            onChange={(e) => onChange({ birth: formatBirthInput(e.target.value) })}
          />
        </Field>
        <Field name="petName" label="반려동물 이름 *" hint="병원에 등록된 이름으로" error={errors.petName}>
          <input
            id={fieldId('petName')}
            className="field"
            type="text"
            autoComplete="off"
            placeholder="예) 코코"
            value={value.petName}
            aria-invalid={Boolean(errors.petName)}
            onChange={(e) => onChange({ petName: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
