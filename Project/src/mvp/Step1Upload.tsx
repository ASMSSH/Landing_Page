import { EXAMPLES } from "../data/examples";
import type { UploadInfo } from "./types";

interface Props {
  selectedReceipt: number | null;
  upload: UploadInfo | null;
  onSelectReceipt: (i: number) => void;
  onChangeReceipt: () => void;
}

export default function Step1Upload({
  selectedReceipt,
  upload,
  onSelectReceipt,
  onChangeReceipt,
}: Props) {
  const receipt = selectedReceipt === null ? null : EXAMPLES[selectedReceipt];

  return (
    <div className="modal-step receipt-step">
      <div className="step-heading">
        <div className="st">
          <span className="n">1</span>
          <h3>{receipt ? "영수증 확인하기" : "영수증 선택하기"}</h3>
        </div>
        <span className="sub">
          {receipt ? "내용을 확인하고 다음 단계로 이동하세요" : "원하는 진료 유형을 골라보세요"}
        </span>
      </div>

      {!receipt && (
        <div className="receipt-picker" aria-label="영수증 유형">
          {EXAMPLES.map((option, i) => (
            <button
              key={option.title}
              className="receipt-option"
              type="button"
              onClick={() => onSelectReceipt(i)}
            >
              <span className="receipt-option-title">
                <span aria-hidden="true">{option.emoji}</span>
                <strong>{option.title}</strong>
              </span>
              <span className="receipt-option-row">
                <span>진료비</span>
                <b>{option.cost}원</b>
              </span>
              <span className="receipt-option-row payout">
                <span>예상 보험금</span>
                <b>{option.expectedPayout}원</b>
              </span>
            </button>
          ))}
        </div>
      )}

      {receipt && upload && (
        <div className="receipt-review">
          <div className="receipt-review-head">
            <div>
              <span className="receipt-review-label">선택한 진료</span>
              <strong>{receipt.emoji} {receipt.title}</strong>
            </div>
            <button type="button" className="receipt-change" onClick={onChangeReceipt}>
              다시 선택
            </button>
          </div>

          <button
            type="button"
            className="receipt-stage"
            onClick={() => window.open(upload.url, "_blank")}
            aria-label="영수증 크게 보기"
          >
            <img className="receipt-main-image" src={upload.url} alt={`${receipt.title} 영수증`} />
            <span className="receipt-zoom-hint">눌러서 크게 보기</span>
          </button>

          <div className="receipt-overview">
            <div>
              <span>진료비</span>
              <strong>{receipt.cost}원</strong>
            </div>
            <div className="payout">
              <span>예상 보험금</span>
              <strong>{receipt.expectedPayout}원</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
