export interface Insurer {
  company: string;
  product: string;
}

export const INSURERS: Insurer[] = [
  { company: '메리츠화재', product: '펫퍼민트' },
  { company: 'DB손해보험', product: '펫블리 반려견보험' },
  { company: 'KB손해보험', product: '금쪽같은 펫보험' },
  { company: '삼성화재', product: '위풍당당 다이렉트' },
  { company: '현대해상', product: '굿앤굿우리펫' },
  { company: '한화손해보험', product: '펫투게더' },
  { company: '롯데손해보험', product: '마이펫보험' },
  { company: 'NH농협손해보험', product: '펫앤미든든' },
  { company: '기타 / 모름', product: '공통 기준으로 안내' },
];

export const DEFAULT_INSURER = '삼성화재 위풍당당 다이렉트';

export function insurerLabel(ins: Insurer): string {
  return ins.company === '기타 / 모름' ? '공통 기준' : `${ins.company} ${ins.product}`;
}
