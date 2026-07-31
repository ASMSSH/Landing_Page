import { useEffect, useRef, useState } from 'react';
import { FAQ, type FaqItem } from '../data/faq';
import Icon from './icons';
import { track } from '../lib/analytics';

function FaqRow({ q, a, link, open, onToggle }: FaqItem & { open: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    setMaxH(open && ref.current ? ref.current.scrollHeight : 0);
  }, [open, a]);

  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={onToggle}>
        <span className="q">{q}</span>
        <Icon name="chevron-down" size={20} className="ic" />
      </button>
      <div className="faq-a" ref={ref} style={{ maxHeight: maxH }}>
        <p>
          {a}
          {link && (
            <>
              {' '}
              <a className="faq-link" href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <section id="faq" className="faq">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-tag">자주 묻는 질문</span>
          <h2 className="sec-h2">궁금한 점, 미리 풀어드릴게요</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((item, i) => (
            <FaqRow
              key={i}
              q={item.q}
              a={item.a}
              link={item.link}
              open={openSet.has(i)}
              onToggle={() => {
                if (!openSet.has(i)) track('faq_open', { index: i, question: item.q });
                toggle(i);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
