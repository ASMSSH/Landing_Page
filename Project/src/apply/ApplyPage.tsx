import { useEffect } from 'react';
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
  // 단계가 바뀌면 스크롤을 맨 위로 — 「다음」·「← 이전」·프로그레스·브라우저 뒤로가기(SSH-547) 전부 state.step을 바꾸므로 여기 한 곳이면 된다.
  // 검증 실패로 단계가 안 바뀌면 스크롤도 안 움직인다(오류 칸이 보이는 자리 유지). 없으면 이전 단계의 스크롤 위치가 남아
  // 모바일에선 다음 단계 첫 화면이 헤딩 대신 액션 행·요약 카드였다 (SSH-548)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [state.step]);
  // S1 업로드 카드 밖(폼·레일·여백)에 사진을 놓으면 브라우저가 이미지를 새 탭으로 연다 — 페이지 전체에서 막는다 (SSH-553).
  // ApplyShell은 /apply에서만 마운트되므로 랜딩에는 걸리지 않는다. 카드가 이미 preventDefault한 이벤트(defaultPrevented)는
  // 건너뛰어 카드 위의 「복사」 커서가 유지되고, 그 밖에서는 「놓을 수 없음」 커서가 된다
  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
    };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, []);
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
