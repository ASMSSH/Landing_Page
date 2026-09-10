import Nav from '../components/Nav';
import { ApplyProvider, useApply } from './ApplyContext';
import ApplyHeader from './ApplyHeader';
import ApplyProgress from './ApplyProgress';
import ApplyRail from './ApplyRail';
import ApplyActions from './ApplyActions';
import ApplyFooter from './ApplyFooter';
import StepHeading from './StepHeading';
import StepDocuments from './steps/StepDocuments';
import StepInsurance from './steps/StepInsurance';
import StepPlaceholder from './steps/StepPlaceholder';
import StepTreatment from './steps/StepTreatment';
import { stepDef } from './steps';
import type { ApplyStep } from './state';
import { useApplyMeta } from './useApplyMeta';
import '../styles/apply.css';

// 단계 본문. S1~S3은 헤딩·액션 행까지 자기가 그린다(SSH-543 spec 5절). S4·S5는 빈 패널(SSH-486이 채운다).
function StepBody({ step }: { step: ApplyStep }) {
  if (step === 1) return <StepTreatment />;
  if (step === 2) return <StepInsurance />;
  if (step === 3) return <StepDocuments />;
  const def = stepDef(step);
  if (!def) return <StepPlaceholder message="접수가 완료됐어요" />;
  return (
    <>
      <StepHeading number={def.number} title={def.title} description={def.description} />
      <StepPlaceholder />
      <ApplyActions />
    </>
  );
}

function ApplyShell() {
  useApplyMeta();
  const { state } = useApply();
  return (
    <div className="apply-page">
      <Nav variant="apply" />
      <div className="apply-container">
        <ApplyHeader />
        <ApplyProgress />
        <div className="apply-body">
          <main className="apply-main">
            <StepBody step={state.step} />
          </main>
          <ApplyRail />
        </div>
      </div>
      <ApplyFooter />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <ApplyProvider>
      <ApplyShell />
    </ApplyProvider>
  );
}
