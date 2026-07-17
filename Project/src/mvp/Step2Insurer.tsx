import { INSURERS, insurerLabel, type Insurer } from '../data/insurers';

interface Props {
  selected: string;
  onSelect: (label: string) => void;
}

export default function Step2Insurer({ selected, onSelect }: Props) {
  const isSelected = (ins: Insurer) => insurerLabel(ins) === selected;

  return (
    <div className="modal-step">
      <div className="step-heading">
        <div className="st"><span className="n">2</span><h3>가입한 보험 고르기</h3></div>
        <span className="sub">보험사 7곳 · 없으면 '기타'</span>
      </div>
      <div className="insurer-grid">
        {INSURERS.map((ins, i) => (
          <button
            key={i}
            className={`ins-card${isSelected(ins) ? ' selected' : ''}`}
            type="button"
            onClick={() => onSelect(insurerLabel(ins))}
          >
            <span className="cn">{ins.company}</span>
            <span className="cp">{ins.product}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
