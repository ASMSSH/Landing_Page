import { useEffect, useMemo, useState } from "react";
import {
  FALLBACK_DOCUMENT_GUIDE,
  type ClaimDocumentGuide,
  type ResultDoc,
} from "../data/resultDocs";
import { inferClaimType } from "../lib/claimType";
import type { Fields } from "./types";

interface Props {
  insurerLabel: string;
  fields: Fields;
  surgery: boolean;
}

const INSURER_DOCUMENTS_URL =
  "https://app.notion.com/p/39adbdcebb5e802bb823f2de78290b5b?v=e74dbdcebb5e8363b08e08c9cc70c289&source=copy_link";

function ResultItem({ doc, icon }: { doc: ResultDoc; icon: string }) {
  return (
    <div className="res-item">
      <span className="ic">{icon}</span>
      <div className="txt">
        <span className="rn">{doc.name}</span>
        <span className="rw">{doc.desc}</span>
      </div>
      <span className={`tag ${doc.tagKind}`}>{doc.tag}</span>
    </div>
  );
}

export default function Step3Result({ insurerLabel, fields, surgery }: Props) {
  const claimType = useMemo(
    () => inferClaimType(fields, surgery),
    [fields, surgery],
  );
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
      .then((response) => response.json())
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
        <ResultItem
          doc={doc}
          icon={i === 0 ? "✓" : "📄"}
          key={`${doc.name}-${i}`}
        />
      ))}

      <div className="res-group-head">
        <span className="res-group-label">✍️ 직접 준비할 서류</span>
        <a
          className="download-doc"
          href={INSURER_DOCUMENTS_URL}
          target="_blank"
          rel="noreferrer"
        >
          서류 다운로드 받기
        </a>
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
        <ResultItem doc={doc} icon="📝" key={`${doc.name}-${i}`} />
      ))}

      {guide.notes.map((note, i) => (
        <p className="result-note" key={i}>
          {note}
        </p>
      ))}
    </div>
  );
}
