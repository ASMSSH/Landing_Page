import { useCallback, useEffect, useState } from 'react';
import { fetchClaimDocuments } from '../../lib/claimDocuments';
import { inferClaimTypeFromText } from '../../lib/claimType';
import ApplyActions from '../ApplyActions';
import { useApply } from '../ApplyContext';
import {
  UNKNOWN_INSURER,
  canLookupDocs,
  docsBannerTitle,
  docsSummaryLine,
  fallbackRequiredDocs,
  isSnapshotCurrent,
  toRequiredDocsSnapshot,
} from '../requiredDocs';
import type { RequiredDocsSnapshot } from '../state';
import StepHeading from '../StepHeading';
import { stepDef } from '../steps';
import Toast from '../Toast';

// S3 필요 서류 추천. S1 병명 → 청구 유형, S2 보험사와 함께 /api/claim-documents를 조회해 2열로 보여 준다.
// 로컬 로딩 상태를 두지 않는다 — 결과(실패도 fallback 스냅샷)는 전부 state.requiredDocs에 들어가고,
// 그 스냅샷이 지금 입력으로 만든 것인지(isSnapshotCurrent)로 로딩 여부를 판정한다 (SSH-473 spec 2절).
// S4에 갔다 돌아오면 로더 없이 결과가 보이고, S1 병명·S2 보험사를 바꾸면 자연히 다시 조회한다.

const STEP = 3;
const CHECK_ONLY_MESSAGE = '서류는 위 목록에서 확인하면 돼요. 맡기고 싶어지면 언제든 「무료로 대신 청구 맡기기」를 눌러 주세요';
const SKELETON_ROWS = [0, 1, 2];

function DocsLoader() {
  return (
    <div className="apply-docs-loader" role="status">
      <span className="apply-upload-icon" aria-hidden="true"><span className="apply-spinner" /></span>
      <p className="apply-docs-loader-title">필요한 서류를 찾고 있어요…</p>
      <p className="apply-docs-loader-sub">보험사·진료 유형에 맞는 서류를 확인하는 중이에요. 잠시만요.</p>
    </div>
  );
}

function DocsSkeleton() {
  return (
    <div className="apply-panel apply-docs-skeleton" aria-hidden="true">
      <div className="apply-docs-grid">
        {[0, 1].map((col) => (
          <div key={col} className="apply-docs-col">
            <span className="apply-docs-skeleton-line is-title" />
            {SKELETON_ROWS.map((row) => (
              <span key={row} className="apply-docs-skeleton-row">
                <span className="apply-docs-skeleton-line" />
                <span className="apply-docs-skeleton-line is-badge" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function fallbackNote(insurer: string): string {
  if (insurer === UNKNOWN_INSURER) {
    return '보험사를 아직 몰라도 괜찮아요. 신청하면 담당자가 보험사를 확인해서 필요한 서류를 알려드려요. 아래는 어느 보험사든 공통으로 필요한 서류예요.';
  }
  return `${insurer} 기준 서류를 지금은 찾지 못했어요. 신청하면 담당자가 보험사에 확인해서 알려드려요. 아래는 어느 보험사든 공통으로 필요한 서류예요.`;
}

function DocsSummary({ snapshot, onRetry }: { snapshot: RequiredDocsSnapshot; onRetry: () => void }) {
  // 조회 실패로 온 fallback(기타/모름이 아닌 보험사)만 다시 찾을 수 있다 — 한 번 실패한 스냅샷이
  // 세션 동안 굳지 않게 (AI 리뷰 P3). 기타/모름은 서버가 항상 404라 버튼이 의미 없다
  const retryable = snapshot.fallback && canLookupDocs(snapshot.insurer);
  return (
    <div className={`apply-docs-summary${snapshot.fallback ? ' is-fallback' : ''}`}>
      <div className="apply-docs-summary-copy">
        <p className="apply-docs-summary-title">{docsBannerTitle(snapshot)}</p>
        <p className="apply-docs-summary-sub">
          {snapshot.fallback
            ? fallbackNote(snapshot.insurer)
            : '최종 요건은 보험사가 정해요. 담당자가 병원에 확인한 뒤 알려드려요.'}
        </p>
        {retryable && (
          <button type="button" className="btn apply-btn-ghost apply-btn-white apply-docs-retry" onClick={onRetry}>
            다시 찾아보기
          </button>
        )}
      </div>
      <span className="apply-docs-badge is-source">{snapshot.fallback ? '기본 안내' : '보험사 기준'}</span>
    </div>
  );
}

function DocsColumn({ title, names, kind }: { title: string; names: string[]; kind: 'hospital' | 'self' }) {
  return (
    <div className="apply-docs-col">
      <h3 className="apply-docs-col-title">{title}</h3>
      <ul className="apply-docs-rows">
        {names.length === 0 ? (
          <li className="apply-docs-empty">없어요</li>
        ) : (
          names.map((name) => (
            <li key={name} className="apply-docs-row">
              <span className="apply-docs-row-name">{name}</span>
              <span className={`apply-docs-badge is-${kind}`}>{kind === 'hospital' ? '병원 발급' : '보험사 양식'}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function DocsList({ snapshot }: { snapshot: RequiredDocsSnapshot }) {
  return (
    <div className="apply-panel">
      <div className="apply-docs-grid">
        <DocsColumn title="🏥 병원에서 받을 서류" names={snapshot.hospitalIssued} kind="hospital" />
        <DocsColumn title="✍️ 직접 준비할 서류" names={snapshot.selfPrepared} kind="self" />
      </div>
    </div>
  );
}

function DocsBetaCard() {
  return (
    <div className="apply-docs-beta">
      <span className="apply-docs-beta-icon" aria-hidden="true">🎁</span>
      <div>
        <p className="apply-docs-beta-title">베타 기간엔 대리 청구가 무료예요</p>
        <p className="apply-docs-beta-sub">서류 발급부터 보험사 제출까지 담당자가 대신해요. 사본은 나중에 따로 받아요.</p>
      </div>
    </div>
  );
}

export default function StepDocuments() {
  const { state, dispatch } = useApply();
  const def = stepDef(STEP);
  const insurer = state.insurance.insurer;
  const claimType = inferClaimTypeFromText(state.treatment.diagnosis);
  const snapshot = isSnapshotCurrent(state.requiredDocs, insurer, claimType) ? state.requiredDocs : null;
  const loading = snapshot === null;
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  // 스냅샷을 비우면 아래 effect가 다시 조회한다
  const retry = useCallback(() => dispatch({ type: 'setRequiredDocs', docs: null }), [dispatch]);

  useEffect(() => {
    if (snapshot) return;
    // 기타/모름·빈 보험사는 서버가 항상 404라 묻지 않는다 (spec 「배경」)
    if (!canLookupDocs(insurer)) {
      dispatch({ type: 'setRequiredDocs', docs: fallbackRequiredDocs(insurer, claimType) });
      return;
    }
    const controller = new AbortController();
    fetchClaimDocuments(claimType, insurer, controller.signal)
      .then((guide) => dispatch({ type: 'setRequiredDocs', docs: toRequiredDocsSnapshot(guide, insurer, claimType) }))
      .catch(() => {
        // StrictMode 1회차·언마운트로 취소된 요청은 무시한다. 그 외 실패(404·501·502·네트워크·타임아웃)는 fallback
        if (controller.signal.aborted) return;
        dispatch({ type: 'setRequiredDocs', docs: fallbackRequiredDocs(insurer, claimType) });
      });
    return () => controller.abort();
  }, [snapshot, insurer, claimType, dispatch]);

  if (!def) return null;
  const description = snapshot
    ? docsSummaryLine(snapshot)
    : insurer ? `${insurer} 기준으로 필요한 서류를 찾고 있어요` : def.description;
  return (
    <>
      <StepHeading number={def.number} title={def.title} description={description} />
      {snapshot ? (
        <>
          <DocsSummary snapshot={snapshot} onRetry={retry} />
          <DocsList snapshot={snapshot} />
          <DocsBetaCard />
        </>
      ) : (
        <>
          <DocsLoader />
          <DocsSkeleton />
        </>
      )}
      <ApplyActions
        nextDisabled={loading}
        secondary={{ label: '서류만 확인할게요', onClick: () => setToast(CHECK_ONLY_MESSAGE), disabled: loading }}
      />
      <Toast message={toast} onClose={closeToast} />
    </>
  );
}
