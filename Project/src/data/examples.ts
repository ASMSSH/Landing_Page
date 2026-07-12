export interface Receipt {
  hospital: string;
  patient: string;
  guardian: string;
  no: string;
  items: [string, string][];
  total: string;
}

export interface Example {
  file: string;
  docType: string;
  date: string;
  diag: string;
  cost: string;
  surgery: boolean;
  receipt: Receipt;
}

export const EXAMPLES: Example[] = [
  {
    file: '슬개골탈구_예시영수증.jpg',
    docType: '진료비 영수증',
    date: '2026.07.02',
    diag: '슬개골 내측 탈구 (2기)',
    cost: '350,000',
    surgery: true,
    receipt: {
      hospital: '행복동물병원',
      patient: '몽이 · 말티즈 3세',
      guardian: '홍○○',
      no: '20260702-0031',
      items: [
        ['진찰·상담료', '30,000'],
        ['방사선(X-ray) 검사', '60,000'],
        ['마취료', '55,000'],
        ['슬개골 정복 수술', '150,000'],
        ['입원·처치료', '40,000'],
        ['주사·약제료', '15,000'],
      ],
      total: '350,000',
    },
  },
  {
    file: '피부염_예시영수증.jpg',
    docType: '진료비 영수증',
    date: '2026.07.05',
    diag: '아토피성 피부염',
    cost: '85,000',
    surgery: false,
    receipt: {
      hospital: '행복동물병원',
      patient: '나비 · 코리안숏헤어 2세',
      guardian: '김○○',
      no: '20260705-0067',
      items: [
        ['진찰·상담료', '20,000'],
        ['피부 검사(스크래핑)', '25,000'],
        ['처치료', '18,000'],
        ['약제비(2주분)', '22,000'],
      ],
      total: '85,000',
    },
  },
];

export const EXAMPLE_CHIPS = ['🦴 슬개골 탈구 수술 · 35만원', '🩹 피부염 통원 · 8.5만원'];
