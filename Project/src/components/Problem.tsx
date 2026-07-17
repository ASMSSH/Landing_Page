import { VOICES } from '../data/voices';
import Icon from './icons';

export default function Problem() {
  return (
    <section id="problem">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-tag">펫보험 보호자분들께 직접 물어봤어요</span>
          <h2 className="sec-h2">보험은 들었는데, 정작 청구가 제일 어려워요</h2>
        </div>
        <div className="grid-3">
          {VOICES.map((v, i) => (
            <div className="voice-card" key={i}>
              <Icon name="quote" size={26} className="quote-mark" />
              <h3 className="voice-title">{v.title}</h3>
              <p className="quote">“{v.quote}”</p>
              <div className="profile">
                <span className="avatar">{v.emoji}</span>
                <div>
                  <div className="nm">{v.name}</div>
                  <div className="meta">{v.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
