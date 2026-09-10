import Icon from '../components/icons';
import { INSTAGRAM_URL } from '../data/links';
import { track } from '../lib/analytics';
import { useApply } from './ApplyContext';

const EMPTY = '—';

// 진료비는 숫자 문자열이 원칙이지만("12000"), "12,000"·"12000원"처럼 들어와도 NaN원을 보여주지 않는다.
function formatCost(treatmentCost: string): string {
  const digits = treatmentCost.replace(/[^\d]/g, '');
  if (!digits) return treatmentCost.trim();
  return `${Number(digits).toLocaleString('ko-KR')}원`;
}

function visitLine(visitDate: string, treatmentCost: string): string {
  const cost = treatmentCost.trim() ? formatCost(treatmentCost) : '';
  return [visitDate, cost].filter(Boolean).join(' · ');
}

function SummaryCard() {
  const { state } = useApply();
  const { treatment, insurance, applicant } = state;
  const rows: [string, string][] = [
    ['병원', treatment.hospitalName],
    ['진료일 · 진료비', visitLine(treatment.visitDate, treatment.treatmentCost)],
    ['보험사', [insurance.insurer, insurance.productName].filter(Boolean).join(' · ')],
    ['보호자', applicant.name],
    ['반려동물', applicant.petName],
  ];
  return (
    <section className="apply-card apply-summary" aria-label="신청 요약">
      <h3 className="apply-card-title">신청 요약</h3>
      <dl className="apply-summary-list">
        {rows.map(([label, value]) => (
          <div key={label} className="apply-summary-row">
            <dt>{label}</dt>
            <dd className={value ? undefined : 'empty'}>{value || EMPTY}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HelpCard() {
  return (
    <section className="apply-card apply-help" aria-label="이렇게 진행돼요">
      <h3 className="apply-card-title">이렇게 진행돼요</h3>
      <ul className="apply-help-list">
        <li><Icon name="check" size={14} strokeWidth={3} />병원에서 필요한 서류를 저희가 대신 받아드려요</li>
        <li><Icon name="check" size={14} strokeWidth={3} />신청하면 담당자가 24시간 안에 전화드려요</li>
        <li><Icon name="check" size={14} strokeWidth={3} />베타 기간엔 대리 청구가 무료예요</li>
        <li>
          <Icon name="check" size={14} strokeWidth={3} />
          궁금한 건{' '}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => track('cta_click', { cta: 'apply_rail_insta' })}
          >
            인스타 DM
          </a>
          으로 물어보세요
        </li>
      </ul>
    </section>
  );
}

export default function ApplyRail() {
  return (
    <aside className="apply-rail">
      <SummaryCard />
      <HelpCard />
    </aside>
  );
}
