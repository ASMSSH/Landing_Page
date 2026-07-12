export interface Review {
  emoji: string;
  quote: string;
  name: string;
  meta: string;
}

export const REVIEWS: Review[] = [
  {
    emoji: '🐶',
    quote:
      '"예전엔 서류 하나를 빠뜨려서 청구가 반려된 적이 있었는데, 이번엔 미리 다 챙겨서 한 번에 끝냈어요."',
    name: '이○○ 님',
    meta: '강아지 보호자',
  },
  {
    emoji: '🐱',
    quote:
      '"병원 다녀와서 사진만 찍어 올렸을 뿐인데 필요한 서류를 알려줘서, 뭘 준비해야 하나 고민할 필요가 없었어요."',
    name: '박○○ 님',
    meta: '고양이 보호자',
  },
  {
    emoji: '🐶',
    quote: '"병원을 다시 방문하지 않고 한 번에 준비할 수 있어서 정말 좋았습니다."',
    name: '최○○ 님',
    meta: '강아지 보호자',
  },
];
