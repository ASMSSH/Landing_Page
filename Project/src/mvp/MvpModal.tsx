import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useMvp } from "./MvpContext";
import { EXAMPLES } from "../data/examples";
import { DEFAULT_INSURER } from "../data/insurers";
import { receiptSVG } from "../lib/receiptSVG";
import {
  EMPTY_FIELDS,
  type Fields,
  type UploadInfo,
} from "./types";
import Step1Upload from "./Step1Upload";
import Step2Insurer from "./Step2Insurer";
import Step3Result from "./Step3Result";
import Step4Notification, { type SubscribeStatus } from "./Step4Notification";
import { formatMobileNumber } from "../lib/phone";
import { track } from "../lib/analytics";

const STEP_LABELS = ["영수증", "보험", "서류", "청구대행"];

const SUBSCRIBE_ERROR_MESSAGES: Record<string, string> = {
  invalid_phone: "휴대전화번호 형식을 확인해 주세요.",
  server_not_configured: "서버 설정이 아직 완료되지 않았어요.",
  object_not_found: "연동 대상을 찾지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export default function MvpModal() {
  const { isOpen, close } = useMvp();

  const [step, setStep] = useState(1);
  const [ready, setReady] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<number | null>(null);
  const [upload, setUpload] = useState<UploadInfo | null>(null);
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [surgery, setSurgery] = useState(false);
  const [insurer, setInsurer] = useState(DEFAULT_INSURER);
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [claimAgencyOptIn, setClaimAgencyOptIn] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<SubscribeStatus>("idle");
  const [subscribeError, setSubscribeError] = useState("");

  const resetStep1 = useCallback(() => {
    setReady(false);
    setSelectedReceipt(null);
    setUpload(null);
    setFields(EMPTY_FIELDS);
    setSurgery(false);
  }, []);

  /* Reset whole flow whenever the modal opens; lock body scroll + ESC to close. */
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setInsurer(DEFAULT_INSURER);
    setPhone("");
    setAgreed(false);
    setClaimAgencyOptIn(false);
    setSubscribeStatus("idle");
    setSubscribeError("");
    resetStep1();
    track("mvp_open");
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, resetStep1]);

  useEffect(() => {
    if (isOpen) track("mvp_step", { step });
  }, [isOpen, step]);

  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (!isOpen) return;
    return () => track("mvp_close", { last_step: stepRef.current });
  }, [isOpen]);

  function selectReceipt(i: number) {
    const ex = EXAMPLES[i];
    track("mvp_receipt_select", { receipt: ex.file });
    setSelectedReceipt(i);
    const url = receiptSVG(ex);
    setUpload({
      name: ex.file,
      url,
      downloadName: ex.file.replace(/\.jpg$/, ".svg"),
      status: "영수증 선택 완료",
    });
    setFields({ docType: ex.docType, date: ex.date, diag: ex.diag, cost: ex.cost });
    setSurgery(ex.surgery);
    setReady(true);
  }

  async function submitNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubscribeStatus("submitting");
    setSubscribeError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          insurer: insurer === "공통 기준" ? "기타 / 모름" : insurer,
          source: "mvp-result",
          claimAgencyOptIn,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setSubscribeStatus("done");
        track("signup_submit", { status: "done", source: "mvp-result", insurer, claim_agency_opt_in: claimAgencyOptIn });
        return;
      }

      setSubscribeStatus("error");
      setSubscribeError(
        SUBSCRIBE_ERROR_MESSAGES[data.error] ?? "신청에 실패했어요. 잠시 후 다시 시도해 주세요.",
      );
      track("signup_submit", { status: "error", source: "mvp-result", error: data.error ?? "unknown" });
    } catch {
      setSubscribeStatus("error");
      setSubscribeError("네트워크 오류예요. 잠시 후 다시 시도해 주세요.");
      track("signup_submit", { status: "error", source: "mvp-result", error: "network" });
    }
  }

  if (!isOpen) return null;

  const canNext = ready;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="보험찾개냥 체험하기"
      >
        <div className="modal-head">
          <div className="modal-brand">
            <span className="paw">🐾</span>
            <span className="nm">보험찾개냥 체험하기</span>
            <span className="beta-badge">BETA</span>
          </div>
          <button className="modal-close" onClick={close} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="stepper">
          {STEP_LABELS.map((label, idx) => {
            const n = idx + 1;
            const cls = n === step ? "active" : n < step ? "done" : "";
            return (
              <Fragment key={n}>
                {idx > 0 && <div className="step-line" />}
                <div className={`step-node ${cls}`.trim()}>
                  <span className="step-dot">{n < step ? "✓" : n}</span>
                  <span className="step-label">{label}</span>
                </div>
              </Fragment>
            );
          })}
        </div>

        <div className="modal-body" key={step}>
          {step === 1 && (
            <Step1Upload
              selectedReceipt={selectedReceipt}
              upload={upload}
              onSelectReceipt={selectReceipt}
              onChangeReceipt={resetStep1}
            />
          )}
          {step === 2 && (
            <Step2Insurer selected={insurer} onSelect={setInsurer} />
          )}
          {step === 3 && (
            <Step3Result
              insurerLabel={insurer}
              fields={fields}
              surgery={surgery}
            />
          )}
          {step === 4 && (
            <Step4Notification
              phone={phone}
              agreed={agreed}
              claimAgencyOptIn={claimAgencyOptIn}
              status={subscribeStatus}
              errorMessage={subscribeError}
              onPhoneChange={(value) => setPhone(formatMobileNumber(value))}
              onAgreementChange={setAgreed}
              onClaimAgencyOptInChange={setClaimAgencyOptIn}
              onSubmit={submitNotification}
            />
          )}
        </div>

        <div className={`modal-foot step-${step}`}>
          <span className="step-count">{step} / 4 단계</span>
          <div className="foot-btns">
            {step > 1 && (
              <button
                className="mbtn ghost"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                ← 이전
              </button>
            )}
            {step === 1 && (
              <button
                className="mbtn primary"
                disabled={!canNext}
                title={!ready ? "먼저 영수증을 선택해 주세요" : undefined}
                onClick={() => canNext && setStep(2)}
              >
                다음 →
              </button>
            )}
            {step === 2 && (
              <button className="mbtn primary" onClick={() => setStep(3)}>
                필요 서류 확인하기 →
              </button>
            )}
            {step === 3 && (
              <button
                className="mbtn primary"
                onClick={() => setStep(4)}
              >
                청구대행 서비스 알아보기 →
              </button>
            )}
            {step === 4 && (
              <button
                className={`mbtn primary${subscribeStatus === "done" ? " done" : ""}`}
                type="submit"
                form="mvp-notification-form"
                disabled={!agreed || subscribeStatus === "submitting" || subscribeStatus === "done"}
              >
                {subscribeStatus === "done"
                  ? claimAgencyOptIn
                    ? "사전 체험 신청 완료 ✓"
                    : "알림 신청 완료 ✓"
                  : subscribeStatus === "submitting"
                    ? "신청 중…"
                    : claimAgencyOptIn
                      ? "청구대행 사전 체험 신청하기 →"
                      : "출시 알림 신청하기 →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
