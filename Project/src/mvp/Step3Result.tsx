import { HOSPITAL_DOCS, SELF_DOCS } from '../data/resultDocs';

export default function Step3Result({ insurerLabel }: { insurerLabel: string }) {
  return (
    <div className="modal-step">
      <div className="step-heading">
        <div className="st"><span className="n">3</span><h3>필요 서류</h3></div>
      </div>
      <div className="result-head">
        <div className="rt">{insurerLabel} 기준</div>
        <div className="rs">병원에서 5개 · 직접 3개만 챙기면 준비 끝이에요.</div>
      </div>

      <div className="res-secured">
        <span className="ic">✓</span>
        <div className="txt">
          <span className="rn">진료비 영수증</span>
          <span className="rw">방금 올린 문서로 확보 완료!</span>
        </div>
        <span className="tag done">업로드됨</span>
      </div>

      <div className="res-group-label">🏥 병원에서 받아야 할 서류</div>
      {HOSPITAL_DOCS.map((d, i) => (
        <div className="res-item" key={i}>
          <span className="ic">📄</span>
          <div className="txt"><span className="rn">{d.name}</span><span className="rw">{d.desc}</span></div>
          <span className={`tag ${d.tagKind}`}>{d.tag}</span>
        </div>
      ))}

      <div className="res-group-label">✍️ 직접 준비할 서류</div>
      {SELF_DOCS.map((d, i) => (
        <div className="res-item" key={i}>
          <span className="ic">📝</span>
          <div className="txt"><span className="rn">{d.name}</span><span className="rw">{d.desc}</span></div>
          <span className={`tag ${d.tagKind}`}>{d.tag}</span>
        </div>
      ))}

      <p className="result-note">참고용 안내예요. 최종 서류 요건은 가입 보험사 확인이 필요해요.</p>
    </div>
  );
}
