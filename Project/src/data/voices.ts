export interface Voice {
  emoji: string;
  title: string;
  quote: string;
  name: string;
  meta: string;
}

// 펫보험 보호자 인터뷰에서 뽑은 '청구가 어렵다'는 목소리 — Problem 섹션 인용 카드.
export const VOICES: Voice[] = [
  {
    emoji: '🐶',
    title: '서류가 복잡하고 반려도 잦음',
    quote:
      '진단서에 병명이 정확히 안 적혔다고 반려된 적이 있어요. 진단서에 진료비 확인서에… 뭘 어떻게 떼야 통과되는 건지 매번 헷갈려요.',
    name: '박○○ 님',
    meta: '2살 시츄 보호자',
  },
  {
    emoji: '🐩',
    title: '병원 재방문이 너무 번거로움',
    quote:
      '서류 하나 잘못 떼면 병원을 또 가야 하는데, 집에서 멀어서 예약하고 대기하고… 재발급 받으러 가는 그 시간이 더 아까워요.',
    name: '이○○ 님',
    meta: '3살 푸들 보호자',
  },
  {
    emoji: '🐕',
    title: '소액은 귀찮아서 포기',
    quote:
      '솔직히 몇 만 원 받자고 이 고생을 하나 싶더라고요. 금액이 작으면 그냥 청구 안 하고 넘어가게 돼요.',
    name: '김○○ 님',
    meta: '5살 말티즈 보호자',
  },
];
