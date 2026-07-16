import { useRef, useState } from "react";
import { EXAMPLE_CHIPS } from "../data/examples";
import type { AiAnalysis, Fields, UploadInfo } from "./types";

interface Props {
  selectedExample: number | null;
  analyzing: boolean;
  ready: boolean;
  upload: UploadInfo | null;
  fields: Fields;
  aiAnalysis: AiAnalysis | null;
  surgery: boolean;
  onSelectExample: (i: number) => void;
  onUploadFile: (file: File) => void;
  onRemove: () => void;
  onFieldChange: (key: keyof Fields, value: string) => void;
  onToggleSurgery: () => void;
}

export default function Step1Upload({
  selectedExample,
  analyzing,
  ready,
  upload,
  fields,
  aiAnalysis,
  surgery,
  onSelectExample,
  onUploadFile,
  onRemove,
  onFieldChange,
  onToggleSurgery,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const isReceiptWithoutDiagnosis =
    fields.docType.trim() === "진료비 영수증" && !fields.diag.trim();

  return (
    <div className="modal-step">
      <div className="step-heading">
        <div className="st">
          <span className="n">1</span>
          <h3>영수증 · 진료내역서 올리기</h3>
        </div>
        <span className="sub">사진 1장이면 충분해요</span>
      </div>

      <div
        className={`dropzone${drag ? " drag" : ""}`}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onUploadFile(f);
        }}
      >
        <span className="di-badge">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </span>
        <span className="dz-main">사진을 끌어다 놓거나 눌러서 올려주세요</span>
        <span className="dz-sub">
          jpg · png · heic — 체험판에서는 사진이 저장되지 않아요
        </span>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {upload && (
        <div className="uploaded-file">
          <div
            className="uf-thumb"
            style={{ backgroundImage: `url("${upload.url}")` }}
            onClick={() => window.open(upload.url, "_blank")}
          />
          <div className="uf-info">
            <span className="uf-name">{upload.name}</span>
            <span className="uf-status">
              <span className={`uf-check${analyzing ? " loading" : ""}`}>
                {analyzing ? <span className="spinner" /> : "✓"}
              </span>
              <span>{upload.status}</span>
            </span>
          </div>
          <a
            className="uf-btn download"
            href={upload.url}
            download={upload.downloadName}
            title="내려받기"
            aria-label="영수증 내려받기"
          >
            ↓
          </a>
          <button
            className="uf-btn remove"
            type="button"
            onClick={onRemove}
            title="삭제"
            aria-label="첨부 삭제"
          >
            ✕
          </button>
        </div>
      )}

      <div className="or-example">또는 예시로 바로 체험해보기</div>
      <div className="examples">
        {EXAMPLE_CHIPS.map((label, i) => (
          <button
            key={i}
            className={`ex-chip${selectedExample === i ? " selected" : ""}`}
            type="button"
            onClick={() => onSelectExample(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {analyzing && (
        <div className="analyzing">
          <span className="spinner" />
          <span className="an-text">영수증을 읽고 있어요…</span>
          <span className="an-sub">
            문서 유형과 진료 내용을 자동으로 정리하는 중이에요
          </span>
        </div>
      )}

      {ready && !analyzing && (
        <div className="fields-stack">
          {aiAnalysis && (
            <div className={`ai-card ${aiAnalysis.source}`}>
              <span className="ai-label">
                {aiAnalysis.source === "example"
                  ? "예시 분석 결과"
                  : "분석 결과"}
              </span>
              <p>{aiAnalysis.summary}</p>
              {aiAnalysis.evidence.length > 0 && (
                <div className="ai-chips">
                  {aiAnalysis.evidence.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              )}
              {aiAnalysis.warnings.map((item) => (
                <small key={item}>{item}</small>
              ))}
            </div>
          )}
          <div className="field-2">
            <div className="field-block">
              <label>문서 유형</label>
              <input
                className="field"
                value={fields.docType}
                onChange={(e) => onFieldChange("docType", e.target.value)}
              />
            </div>
            <div className="field-block">
              <label>진료일</label>
              <input
                className="field"
                value={fields.date}
                onChange={(e) => onFieldChange("date", e.target.value)}
              />
            </div>
          </div>
          <div className="field-2">
            <div className="field-block">
              <label>병명 / 진료 내용</label>
              <input
                className="field"
                disabled={isReceiptWithoutDiagnosis}
                placeholder={
                  isReceiptWithoutDiagnosis ? "영수증에서는 확인 어려움" : "예: 슬개골 탈구"
                }
                value={fields.diag}
                onChange={(e) => onFieldChange("diag", e.target.value)}
              />
              {isReceiptWithoutDiagnosis && (
                <span className="field-hint">
                  진료비 영수증에는 병명이나 진료 내용이 없는 경우가 많아요.
                </span>
              )}
            </div>
            <div className="field-block">
              <label>총 진료비 (원)</label>
              <input
                className="field"
                placeholder="예: 350,000"
                value={fields.cost}
                onChange={(e) => onFieldChange("cost", e.target.value)}
              />
            </div>
          </div>
          <div
            className={`check-row${surgery ? " on" : ""}`}
            onClick={onToggleSurgery}
          >
            <span className="check-box">✓</span>
            <span className="cl">수술을 받았어요</span>
          </div>
        </div>
      )}
    </div>
  );
}
