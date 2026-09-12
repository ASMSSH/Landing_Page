import Nav from './components/Nav';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Features from './components/Features';
import Faq from './components/Faq';
import ApplyCta from './components/ApplyCta';
import Footer from './components/Footer';
import ApplyPage from './apply/ApplyPage';
import { isApplyPath } from './lib/route';

// 랜딩은 섹션 6개를 그대로 쌓는다. 체험 모달(MvpProvider·MvpModal)과 사전 알림 폼은 SSH-545에서 제거 — 신청은 /apply 하나로 받는다.
function Landing() {
  return (
    <>
      <Nav />
      <span id="top" />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Faq />
        <ApplyCta />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return isApplyPath(location.pathname) ? <ApplyPage /> : <Landing />;
}
