import notificationBell from "../assets/launch_notification_bell_animated.svg";
import OtpPanel from "../components/OtpPanel";
import type { OtpControls } from "../lib/useOtp";

export type SubscribeStatus = "idle" | "submitting" | "done" | "error";

interface Props {
  phone: string;
  agreed: boolean;
  claimAgencyOptIn: boolean;
  status: SubscribeStatus;
  errorMessage: string;
  otp: OtpControls;
  onPhoneChange: (phone: string) => void;
  onAgreementChange: (agreed: boolean) => void;
  onClaimAgencyOptInChange: (agreed: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const BENEFITS = [
  "보험사에 맞는 청구서류를 대신 확인해드려요",
  "서류 준비부터 보험사 제출까지 한 번에 맡길 수 있어요",
  "추가서류 요청과 보험금 지급 과정도 끝까지 챙겨드려요",
];

export default function Step4Notification({
  phone,
  agreed,
  claimAgencyOptIn,
  status,
  errorMessage,
  otp,
  onPhoneChange,
  onAgreementChange,
  onClaimAgencyOptInChange,
  onSubmit,
}: Props) {
  const done = status === "done";
  const submitting = status === "submitting";

  return (
    <div className="modal-step notification-step">
      <span className="notification-badge">보험금 청구대행 사전 체험</span>

      <div className="notification-copy">
        <span>서류 준비부터 보험금 지급까지</span>
        <h3>{done ? "청구대행 신청이 완료됐어요!" : "보험금 청구, 이제 맡겨보세요"}</h3>
        <p>
          {done
            ? "서비스가 준비되면 인증하신 휴대전화번호로 가장 먼저 연락드릴게요."
            : "전화번호 인증 후 신청하면, 준비되는 대로 가장 먼저 연락드릴게요."}
        </p>
      </div>

      <img className="notification-bell" src={notificationBell} alt="출시 알림 종" />

      <div className="notification-benefits">
        <strong>서비스가 출시되면</strong>
        <ul>
          {BENEFITS.map((benefit) => (
            <li key={benefit}>
              <span aria-hidden="true">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <form id="mvp-notification-form" className="notification-form" onSubmit={onSubmit}>
        <label htmlFor="mvp-notification-phone">연락받을 휴대전화번호</label>
        <input
          id="mvp-notification-phone"
          className="field"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-1234-5678"
          maxLength={13}
          required
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          disabled={done || submitting}
        />

        <OtpPanel otp={otp} phone={phone} disabled={done || submitting} />

        <label className="notification-consent">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(event) => onAgreementChange(event.target.checked)}
            disabled={done || submitting}
          />
          <span>개인정보 수집 및 이용 동의 <b>(필수)</b></span>
          <a
            href="https://app.notion.com/p/39bdbdcebb5e80e6a2ffc34ff1c11a8f?source=copy_link"
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            자세히 보기 ›
          </a>
        </label>

        <label className="notification-consent optional">
          <input
            type="checkbox"
            checked={claimAgencyOptIn}
            onChange={(event) => onClaimAgencyOptInChange(event.target.checked)}
            disabled={done || submitting}
          />
          <span>
            청구대행 서비스 사전 체험 신청 <b>(선택)</b>
            <small>선택하면 체험 대상자로 먼저 연락드려요.</small>
          </span>
        </label>

        {status === "error" && <p className="notification-message error">{errorMessage}</p>}
        {done && (
          <p className="notification-message success">
            {claimAgencyOptIn
              ? "사전 체험 신청 완료! 체험 대상자로 먼저 연락드릴게요."
              : "알림 신청 완료! 청구대행 소식을 가장 먼저 알려드릴게요."}
          </p>
        )}
      </form>

    </div>
  );
}
