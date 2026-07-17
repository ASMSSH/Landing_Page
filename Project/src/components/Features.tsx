import { useMvp } from '../mvp/MvpContext';
import Icon, { type IconName } from './icons';

type Tone = 'primary' | 'secondary' | 'success';

const STEPS: { icon: IconName; tone: Tone; title: string; desc: string }[] = [
  { icon: 'receipt', tone: 'primary', title: '영수증 등록', desc: '병원에서 받은 영수증을 사진 한 장으로 올려요.' },
  { icon: 'file-search', tone: 'secondary', title: '서류·환급 예상금액 확인', desc: '필요한 서류와 받게 될 예상 보험금을 미리 알려드려요.' },
  { icon: 'send', tone: 'primary', title: '청구 접수', desc: '서류 준비부터 보험사 접수·제출까지 전부 대신 진행해요.' },
  { icon: 'wallet', tone: 'success', title: '보험금 지급', desc: '심사 완료 후 보험금이 계좌로 바로 입금돼요.' },
];

export default function Features() {
  const { open } = useMvp();
  return (
    <section id="features" className="features">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-tag">핵심 기능</span>
          <h2 className="sec-h2">청구, 이렇게 간단해져요</h2>
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
              <Icon name="arrow-right" size={24} className="f-arrow" />
              <div className="mini-list">
                <div className="t">자동 준비 완료</div>
                <div className="mini-row"><span className="mini-chk">✓</span>진료비 세부내역서</div>
                <div className="mini-row"><span className="mini-chk">✓</span>진단서</div>
                <div className="mini-row"><span className="mini-chk">✓</span>진료비 영수증</div>
              </div>
            </div>
            <h3>병원에 다시 갈 필요 없어요</h3>
            <p>서류 떼러 병원을 오갈 필요 없이, 영수증만 올리면 필요한 서류 준비부터 보험사 접수까지 저희가 알아서 처리해요.</p>
          </div>
          <div className="f-card">
            <div className="f-visual sage">
              <div className="status-card">
                <div className="status-row"><span className="sr-label">영수증 등록</span><span className="sr-badge done">완료</span></div>
                <div className="status-row"><span className="sr-label">보험사 청구 접수</span><span className="sr-badge done">완료</span></div>
                <div className="status-row"><span className="sr-label">심사·보험금 지급</span><span className="sr-badge live">진행 중</span></div>
              </div>
            </div>
            <h3>지금 어디까지 됐는지, 실시간으로</h3>
            <p>접수부터 지급까지 청구가 어느 단계에 있는지 실시간으로 확인할 수 있어요. 맡겨두고도 불안하지 않게.</p>
          </div>
        </div>

        <p className="flow-label">이렇게 동작해요</p>
        <div className="flow">
          {STEPS.map((s, i) => (
            <div className={`flow-step tone-${s.tone}`} key={i}>
              <div className="flow-rail">
                <div className="flow-num">{i + 1}</div>
                {i < STEPS.length - 1 && <div className="flow-line"></div>}
              </div>
              <div className="flow-content">
                <div className="flow-title">
                  <Icon name={s.icon} size={20} className="flow-ic" />
                  <h4>{s.title}</h4>
                </div>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="center-cta">
          <button className="btn btn-sage" onClick={open}>체험해보기 🐾</button>
        </div>
      </div>
    </section>
  );
}
