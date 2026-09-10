import Icon from '../../components/icons';
import { INSURERS } from '../../data/insurers';
import ApplyActions from '../ApplyActions';
import { useApply } from '../ApplyContext';
import StepHeading from '../StepHeading';
import { stepDef } from '../steps';

// S2 보험 선택. 보험사 카드 8개(4열 → ≤768 2열) + 상품명 자유 입력 + 제한 안내.
// 저장값은 company 문자열만 — claims.insurer 컬럼과 SSH-473 서류 룩업이 보험사 단위다.

const PRODUCT_FIELD_ID = 'apply-field-productName';

export default function StepInsurance() {
  const { state, dispatch } = useApply();
  const def = stepDef(2);
  const { insurer, productName } = state.insurance;

  if (!def) return null;
  return (
    <>
      <StepHeading number={def.number} title={def.title} description={def.description} />
      <div className="apply-panel apply-insurance">
        <div className="apply-insurers" role="radiogroup" aria-label="보험사">
          {INSURERS.map((ins) => {
            const selected = insurer === ins.company;
            return (
              <button
                key={ins.company}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`apply-insurer${selected ? ' is-selected' : ''}`}
                onClick={() => dispatch({ type: 'setInsurance', patch: { insurer: ins.company } })}
              >
                <span className="apply-insurer-name">{ins.company}</span>
                <span className="apply-insurer-product">{ins.product}</span>
              </button>
            );
          })}
        </div>
        <div className="apply-field">
          <label htmlFor={PRODUCT_FIELD_ID} className="apply-field-label">보험 상품명 (선택)</label>
          <input
            id={PRODUCT_FIELD_ID}
            className="field"
            type="text"
            autoComplete="off"
            placeholder="예) 위풍당당 다이렉트"
            value={productName}
            onChange={(e) => dispatch({ type: 'setInsurance', patch: { productName: e.target.value } })}
          />
          <p className="apply-field-hint">몰라도 괜찮아요 — 서류는 보험사 기준으로 안내해요</p>
        </div>
      </div>
      <p className="apply-note">
        <Icon name="info" size={16} />
        <span>마이브라운·카카오페이는 앱·카톡 전용 접수라 대리 접수가 제한될 수 있어요. 담당자가 확인 후 안내드려요.</span>
      </p>
      <ApplyActions nextDisabled={!insurer} />
    </>
  );
}
