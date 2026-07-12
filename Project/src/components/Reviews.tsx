import { REVIEWS } from '../data/reviews';

export default function Reviews() {
  return (
    <section id="reviews">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-tag">먼저 써본 분들</span>
          <h2 className="sec-h2">서류 걱정, 이렇게 덜었어요</h2>
        </div>
        <div className="grid-3">
          {REVIEWS.map((rev, i) => (
            <div className="rev-card" key={i}>
              <div className="stars">★★★★★</div>
              <p className="quote">{rev.quote}</p>
              <div className="profile">
                <span className="avatar">{rev.emoji}</span>
                <div>
                  <div className="nm">{rev.name}</div>
                  <div className="meta">{rev.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
