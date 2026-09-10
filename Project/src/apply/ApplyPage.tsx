import Nav from '../components/Nav';
import { ApplyProvider, useApply } from './ApplyContext';
import ApplyHeader from './ApplyHeader';
import ApplyProgress from './ApplyProgress';
import ApplyRail from './ApplyRail';
import ApplyFooter from './ApplyFooter';
import StepApplicant from './steps/StepApplicant';
import StepConsent from './steps/StepConsent';
import StepDone from './steps/StepDone';
import StepDocuments from './steps/StepDocuments';
import StepInsurance from './steps/StepInsurance';
import StepTreatment from './steps/StepTreatment';
import type { ApplyStep } from './state';
import { useApplyMeta } from './useApplyMeta';
import '../styles/apply.css';

// 단계 본문. 각 단계가 헤딩·액션 행까지 자기가 그린다(SSH-543 spec 5절). 6은 접수 완료(SSH-486).
function StepBody({ step }: { step: ApplyStep }) {
  if (step === 1) return <StepTreatment />;
  if (step === 2) return <StepInsurance />;
  if (step === 3) return <StepDocuments />;
  if (step === 4) return <StepApplicant />;
  if (step === 5) return <StepConsent />;
  return <StepDone />;
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
