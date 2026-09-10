import Nav from '../components/Nav';
import { ApplyProvider, useApply } from './ApplyContext';
import ApplyHeader from './ApplyHeader';
import ApplyProgress from './ApplyProgress';
import ApplyRail from './ApplyRail';
import ApplyActions from './ApplyActions';
import ApplyFooter from './ApplyFooter';
import StepHeading from './StepHeading';
import StepPlaceholder from './steps/StepPlaceholder';
import { stepDef } from './steps';
import '../styles/apply.css';

function ApplyShell() {
  const { state } = useApply();
  const def = stepDef(state.step);
  return (
    <div className="apply-page">
      <Nav variant="apply" />
      <div className="apply-container">
        <ApplyHeader />
        <ApplyProgress />
        <div className="apply-body">
          <main className="apply-main">
            {def ? (
              <>
                <StepHeading number={def.number} title={def.title} description={def.description} />
                <StepPlaceholder />
                <ApplyActions />
              </>
            ) : (
              <StepPlaceholder message="접수가 완료됐어요" />
            )}
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
