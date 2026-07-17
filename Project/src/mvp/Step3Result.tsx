import { useEffect, useMemo, useState } from "react";
import {
  FALLBACK_DOCUMENT_GUIDE,
  type ClaimDocumentGuide,
  type ResultDoc,
} from "../data/resultDocs";
import { inferClaimType, type ClaimType } from "../lib/claimType";
import type { Fields } from "./types";

interface Props {
  insurerLabel: string;
  fields: Fields;
  surgery: boolean;
  analysisClaimType?: ClaimType | null;
}

function getDocumentVisual(doc: ResultDoc): { icon: string; tone: string } {
  const name = doc.name.toLowerCase();

  if (/영수증|진료비|상세|세부/.test(name)) return { icon: "🧾", tone: "coral" };
  if (/진단|소견/.test(name)) return { icon: "🩺", tone: "mint" };
  if (/x-ray|엑스레이|영상|mri|ct/.test(name)) return { icon: "🩻", tone: "blue" };
  if (/수술|마취/.test(name)) return { icon: "🩹", tone: "orange" };
  if (/입원|퇴원/.test(name)) return { icon: "🛏️", tone: "yellow" };
  if (/청구서/.test(name)) return { icon: "✍️", tone: "blue" };
  if (/개인정보|동의/.test(name)) return { icon: "🔐", tone: "mint" };
  if (/통장|계좌/.test(name)) return { icon: "🏦", tone: "yellow" };
  if (/신분|주민/.test(name)) return { icon: "🪪", tone: "coral" };

  return doc.tagKind === "hospital"
    ? { icon: "🏥", tone: "orange" }
    : { icon: "📋", tone: "blue" };
}

function ResultItem({ doc }: { doc: ResultDoc }) {
  const visual = getDocumentVisual(doc);
  return (
    <div className="res-item">
      <span className={`ic ${visual.tone}`} aria-hidden="true">{visual.icon}</span>
      <div className="txt">
        <span className="rn">{doc.name}</span>
        <span className="rw">{doc.desc}</span>
      </div>
      <span className={`tag ${doc.tagKind}`}>{doc.tag}</span>
    </div>
  );
}

function ResultNote({ note }: { note: string }) {
  const parts = note.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="result-note">
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a href={part} target="_blank" rel="noreferrer" key={`${part}-${index}`}>
            출처 보기
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export default function Step3Result({
  insurerLabel,
  fields,
  surgery,
  analysisClaimType,
}: Props) {
  const inferredClaimType = useMemo(
    () => inferClaimType(fields, surgery),
    [fields, surgery],
  );
  const claimType = analysisClaimType ?? inferredClaimType;
  const [guide, setGuide] = useState<ClaimDocumentGuide>(
    FALLBACK_DOCUMENT_GUIDE,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      claimType,
      insurer: insurerLabel,
    });

    fetch(`/api/claim-documents?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        // 아직 Notion 조회 미구현(501) 등 비정상 응답이면 자체 fallback 사용
        if (!response.ok) throw new Error("claim-documents unavailable");
        return response.json();
      })
      .then((data: ClaimDocumentGuide) => setGuide(data))
      .catch(() => {
        if (!controller.signal.aborted) setGuide(FALLBACK_DOCUMENT_GUIDE);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [claimType, insurerLabel]);

  return (
    <div className="modal-step">
      <div className="step-heading">
        <div className="st">
          <span className="n">3</span>
          <h3>필요 서류</h3>
        </div>
      </div>
      <div className="result-head">
        <div className="rt">{guide.title}</div>
        <div className="rs">
          {insurerLabel} 기준 · 병원에서 {guide.hospitalDocs.length}개 · 직접{" "}
          {guide.selfDocs.length}개
          {loading ? " 확인 중이에요." : " 챙기면 준비가 쉬워요."}
        </div>
        <span className={`result-source ${guide.source}`}>
          {guide.source === "notion" ? "보험사 기준" : "기본 안내"}
        </span>
      </div>

      {guide.warning && <div className="result-warning">{guide.warning}</div>}

      <div className="res-group-label">🏥 병원에서 받아야 할 서류</div>
      {guide.hospitalDocs.map((doc, i) => (
        <ResultItem doc={doc} key={`${doc.name}-${i}`} />
      ))}

      <div className="res-group-head">
        <span className="res-group-label">✍️ 직접 준비할 서류</span>
        {(guide.downloads || []).map((file) => (
          <a
            className="download-doc"
            href={file.url}
            target="_blank"
            rel="noreferrer"
            key={file.url}
          >
            서류 다운로드
          </a>
        ))}
      </div>
      {guide.selfDocs.map((doc, i) => (
        <ResultItem doc={doc} key={`${doc.name}-${i}`} />
      ))}

      {guide.notes.map((note, i) => (
        <ResultNote note={note} key={i} />
      ))}
    </div>
  );
}
