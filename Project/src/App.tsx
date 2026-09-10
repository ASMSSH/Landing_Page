import { MvpProvider } from './mvp/MvpContext';
import MvpModal from './mvp/MvpModal';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Features from './components/Features';
import Faq from './components/Faq';
import SignupCta from './components/SignupCta';
import Footer from './components/Footer';
import ApplyPage from './apply/ApplyPage';
import { isApplyPath } from './lib/route';

function Landing() {
  return (
    <MvpProvider>
      <Nav />
      <span id="top" />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Faq />
        <SignupCta />
      </main>
      <Footer />
      <MvpModal />
    </MvpProvider>
  );
}

export default function App() {
  return isApplyPath(location.pathname) ? <ApplyPage /> : <Landing />;
}
