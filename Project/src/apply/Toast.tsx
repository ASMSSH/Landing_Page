import { useEffect } from 'react';

// /apply 하단 고정 토스트. S1 영수증 인식 실패를 알리는 데만 쓴다 — 전역 토스트 시스템은 두지 않는다.
// message가 바뀔 때마다 4초 뒤 onClose를 부른다. onClose는 호출자가 useCallback으로 고정한다.

const AUTO_CLOSE_MS = 4000;

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="apply-toast" role="status">
      {message}
    </div>
  );
}
