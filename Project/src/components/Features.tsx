import { useMvp } from '../mvp/MvpContext';

export default function Features() {
  const { open } = useMvp();
  return (
    <section id="features" className="features">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-tag">핵심 기능</span>
          <h2 className="sec-h2">서류 준비, 이렇게 간단해져요</h2>
        </div>
        <div className="grid-2">
          <div className="f-card">
            <div className="f-visual coral">
              <div className="mini-doc">
                <div className="t">진료내역서</div>
                <div className="bar" style={{ width: '100%' }}></div>
                <div className="bar" style={{ width: '73%' }}></div>
                <div className="bar" style={{ width: '88%' }}></div>
                <div className="bar" style={{ width: '59%' }}></div>
              </div>
              <div className="f-arrow" style={{ color: 'var(--primary-500)', fontSize: 22, fontWeight: 700 }}>→</div>
              <div className="mini-list">
                <div className="t">필요 서류 3개</div>
                <div className="mini-row"><span className="mini-chk">✓</span>진료비 영수증</div>
                <div className="mini-row"><span className="mini-chk">✓</span>진단서</div>
                <div className="mini-row"><span className="mini-chk">✓</span>진료 상세 내역서</div>
              </div>
            </div>
            <h3>올리기만 하면, 나머지는 저희가</h3>
            <p>가입한 보험사 기준으로 병원에서 꼭 챙겨야 할 서류를 골라 알려드려요. 뭘 받아야 할지 더는 헤매지 않아도 돼요.</p>
          </div>
          <div className="f-card">
            <div className="f-visual sage">
              <div className="ba-row">
                <div className="ba-left">↺ 서류가 빠지면</div>
                <span className="pill bad">병원 재방문</span>
              </div>
              <div className="mid-arrow">↓</div>
              <div className="ba-row after">
                <div className="ba-left">
                  <span className="mini-chk" style={{ width: 20, height: 20, fontSize: 12 }}>✓</span>처음에 다 챙기면
                </div>
                <span className="pill good">병원 1번</span>
              </div>
            </div>
            <h3>병원, 두 번 가지 않게</h3>
            <p>첫 방문에 필요한 서류를 한 번에 챙기니, 재방문에 드는 시간도 교통비도 아껴드려요.</p>
          </div>
        </div>

        <p className="flow-label">이렇게 동작해요</p>
        <div className="flow">
          <div className="flow-step">
            <div className="flow-num" style={{ background: 'var(--primary-50)', border: '2px solid var(--primary-300)', color: 'var(--primary-600)' }}>1</div>
            <div className="icon-badge" style={{ background: 'var(--primary-50)' }}>📷</div>
            <h4>영수증 등록</h4>
            <p>병원에서 받은 영수증을 사진 한 장으로 올려요.</p>
          </div>
          <div className="flow-step">
            <div className="flow-num" style={{ background: 'var(--secondary-50)', border: '2px solid var(--secondary-300)', color: 'var(--secondary-700)' }}>2</div>
            <div className="icon-badge" style={{ background: 'var(--secondary-50)' }}>🔍</div>
            <h4>보험사 맞춤 안내</h4>
            <p>가입 보험사 기준으로 필요한 서류를 알려드려요.</p>
          </div>
          <div className="flow-step">
            <div className="flow-num" style={{ background: 'var(--success-50)', border: '2px solid var(--success-300)', color: 'var(--success-600)' }}>3</div>
            <div className="icon-badge" style={{ background: 'var(--success-50)' }}>📋</div>
            <h4>한 번에 챙기기</h4>
            <p>병원을 나오기 전, 목록대로 서류를 받아요.</p>
          </div>
        </div>
        <div className="center-cta">
          <button className="btn btn-sage" onClick={open}>체험해보기 🐾</button>
        </div>
      </div>
    </section>
  );
}
