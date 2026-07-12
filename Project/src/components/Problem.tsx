export default function Problem() {
  return (
    <section id="problem">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-tag">이런 적, 있으셨죠</span>
          <h2 className="sec-h2">보험은 들었는데, 정작 청구가 제일 어려워요</h2>
        </div>
        <div className="grid-2">
          <div className="p-card">
            <div className="icon-badge" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>📄</div>
            <h3>서류 하나가 빠졌대요</h3>
            <p>청구하려고 보니 세부내역서 한 장이 없어서, 병원을 다시 방문해야 했어요.</p>
          </div>
          <div className="p-card">
            <div className="icon-badge" style={{ background: 'var(--secondary-50)', color: 'var(--secondary-700)' }}>❓</div>
            <h3>청구 방법이 막막해요</h3>
            <p>보험은 들어놨는데, 뭘 어떻게 챙겨서 내야 하는지 아무도 알려주지 않았어요.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
