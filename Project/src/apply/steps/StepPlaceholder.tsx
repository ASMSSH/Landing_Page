// 각 단계 본문이 들어올 자리. S1·S2는 SSH-543, S3은 SSH-473, S4~S6은 SSH-486이 채운다.
export default function StepPlaceholder({ message = '이 단계는 준비 중이에요' }: { message?: string }) {
  return (
    <div className="apply-panel apply-placeholder">
      <p>{message}</p>
    </div>
  );
}
