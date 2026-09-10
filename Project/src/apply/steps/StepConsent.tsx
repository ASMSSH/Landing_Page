import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../../components/icons';
import { INSTAGRAM_URL } from '../../data/links';
import { getRefCode, track } from '../../lib/analytics';
import { submitClaim } from '../../lib/claims';
import ApplyActions from '../ApplyActions';
import { useApply } from '../ApplyContext';
import { toClaimPayload } from '../claimPayload';
import { CONSENTS, consentDoc, type ConsentKey } from '../consents';
import type { Consents } from '../state';
import StepHeading from '../StepHeading';
import { stepDef } from '../steps';
import ConsentDialog from './ConsentDialog';

// S5 동의 + 「신청하기」. 헤딩·마스터 행·개별 5행·베타 문구·(실패 배너)·액션 행을 조립한다.
// 「보기」를 누르면 전문 팝업(ConsentDialog)을 연다 — 데스크톱 대화상자·모바일 시트. URL은 /apply 그대로다.
// (처음엔 Figma S5-a대로 본문 자리를 통째로 바꿨는데, 닫기가 맨 아래라 불편하다는 피드백으로 팝업으로 바꿨다 — 2026-09-10)
//
// 뒤로가기: 전문을 열 때 history.pushState 한 엔트리를 넣어 브라우저 back이 /apply를 떠나지 않고 전문만 닫게 한다.
// 「닫기」·✕·배경 클릭·Esc는 전부 history.back()이라 엔트리가 남지 않는다. 전문이 열린 채 언마운트되면(「처음으로」 등)
// cleanup에서 그 엔트리를 걷는다. 닫혀 있을 때의 popstate는 무시한다 — 단계 단위 back은 SSH-547이 맡는다.
//
// 전송: 5개 전부 체크돼야 「신청하기」가 켜진다. 전송 중(Provider의 submitting)엔 「신청하기」·「← 이전」·프로그레스가 전부 잠기고
// 라벨은 「전송 중…」. 성공이면 접수번호를 상태에 넣고 6단계로(reducer가 접수번호 없이는 6으로 못 가게 막는다).
// 실패면 배너 — 입력·체크는 그대로 남는다.

const STEP = 5;
const CONSENT_KEYS = CONSENTS.map((d) => d.key);

interface HistoryState {
  applyConsent?: ConsentKey;
}

function allChecked(consents: Consents): boolean {
  return CONSENT_KEYS.every((key) => consents[key]);
}

function ConsentCheck({ id, checked, onChange }: { id: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <input
      id={id}
      className="apply-consent-check"
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function SubmitError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="apply-consent-error" role="alert">
      <p className="apply-consent-error-title">신청을 보내지 못했어요</p>
      <p className="apply-consent-error-sub">
        네트워크가 불안정하거나 서버가 응답하지 않았어요. 입력한 내용은 그대로 남아 있어요.
      </p>
      <div className="apply-consent-error-btns">
        <button type="button" className="btn btn-primary apply-consent-error-retry" onClick={onRetry}>
          다시 시도
        </button>
        <a
          className="btn apply-btn-ghost apply-btn-white"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => track('cta_click', { cta: 'apply_error_insta' })}
        >
          <Icon name="instagram" size={16} />
          인스타 DM으로 신청
        </a>
      </div>
    </div>
  );
}

export default function StepConsent() {
  const { state, dispatch, submitting, setSubmitting } = useApply();
  const def = stepDef(STEP);
  const { consents } = state;
  const [viewing, setViewing] = useState<ConsentKey | null>(null);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const viewingRef = useRef<ConsentKey | null>(null);
  viewingRef.current = viewing;

  // 브라우저 back → 전문 닫기. 열려 있지 않을 때의 popstate는 우리 일이 아니다
  useEffect(() => {
    const onPop = () => {
      if (viewingRef.current) setViewing(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 언마운트: 진행 중인 전송을 끊고 잠금을 풀며, 전문이 열린 채면 pushState로 넣은 엔트리를 걷는다.
  // 전송 중엔 이동이 잠겨 있어 여기 오는 길은 「처음으로」(reset)·페이지 이탈뿐이다
  useEffect(
    () => () => {
      abortRef.current?.abort();
      setSubmitting(false);
      if (viewingRef.current) history.back();
    },
    [setSubmitting],
  );

  const openDoc = (key: ConsentKey) => {
    history.pushState({ applyConsent: key } satisfies HistoryState, '');
    setViewing(key);
  };
  // 닫기 — back으로 닫아야 pushState 엔트리가 남지 않는다. popstate 핸들러가 viewing을 지운다
  const closeDoc = useCallback(() => history.back(), []);

  const setAll = (checked: boolean) =>
    dispatch({ type: 'setConsents', patch: Object.fromEntries(CONSENT_KEYS.map((k) => [k, checked])) as Partial<Consents> });

  const submit = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setFailed(false);
    setSubmitting(true);
    submitClaim(toClaimPayload(state, getRefCode()), controller.signal)
      .then(({ receiptNo }) => {
        dispatch({ type: 'setReceiptNo', receiptNo });
        dispatch({ type: 'goto', step: 6 });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSubmitting(false);
      });
  };

  if (!def) return null;
  const every = allChecked(consents);
  return (
    <>
      <StepHeading number={def.number} title={def.title} description={def.description} />
      <label className={`apply-consent-all${every ? ' is-checked' : ''}`} htmlFor="apply-consent-all">
        <ConsentCheck id="apply-consent-all" checked={every} onChange={setAll} />
        <span className="apply-consent-all-label">모두 동의합니다</span>
      </label>
      <ul className="apply-panel apply-consent-list">
        {CONSENTS.map((doc) => {
          const id = `apply-consent-${doc.key}`;
          return (
            <li key={doc.key} className="apply-consent-row">
              <ConsentCheck
                id={id}
                checked={consents[doc.key]}
                onChange={(checked) => dispatch({ type: 'setConsents', patch: { [doc.key]: checked } })}
              />
              <label htmlFor={id} className="apply-consent-label">
                {doc.label} <span className="apply-consent-required">(필수)</span>
              </label>
              <button type="button" className="apply-consent-view" onClick={() => openDoc(doc.key)}>
                보기
              </button>
            </li>
          );
        })}
      </ul>
      <p className="apply-consent-beta">
        베타 서비스예요. 동의 문안은 법률 검토 전이며, 위임장은 병원 방문 때 종이로 받아요. 신청 즉시 담당자에게 알림이 가고
        24시간 안에 연락드려요.
      </p>
      {failed && <SubmitError onRetry={submit} />}
      <ApplyActions nextDisabled={!every || submitting} nextLabel={submitting ? '전송 중…' : undefined} onNext={submit} />
      <ConsentDialog doc={viewing ? consentDoc(viewing) : null} onClose={closeDoc} />
    </>
  );
}
