import { INSTAGRAM_URL } from '../data/links';

export default function ApplyFooter() {
  return (
    <footer className="apply-foot">
      <p>
        © 보험찾개냥 · 문의는{' '}
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">인스타 DM</a>
      </p>
    </footer>
  );
}
