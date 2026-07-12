import { useEffect, useRef, useState } from 'react';
import { FAQ } from '../data/faq';

function FaqRow({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    setMaxH(open && ref.current ? ref.current.scrollHeight : 0);
  }, [open, a]);

  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={onToggle}>
        <span className="q">{q}</span>
        <span className="ic">＋</span>
      </button>
      <div className="faq-a" ref={ref} style={{ maxHeight: maxH }}>
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="faq">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-tag">자주 묻는 질문</span>
          <h2 className="sec-h2">궁금한 점을 모았어요</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((item, i) => (
            <FaqRow
              key={i}
              q={item.q}
              a={item.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
