export interface Receipt {
  hospital: string;
  patient: string;
  guardian: string;
  no: string;
  items: [string, string][];
  total: string;
}

export interface Example {
  emoji: string;
  title: string;
  file: string;
  docType: string;
  date: string;
  diag: string;
  cost: string;
  expectedPayout: string;
  surgery: boolean;
  receipt: Receipt;
}

export const EXAMPLES: Example[] = [
  {
    emoji: '🐶',
    title: '피부염 치료',
    file: '피부염_영수증.jpg',
    docType: '진료비 영수증',
    date: '2026.07.02',
    diag: '피부염',
    cost: '58,000',
    expectedPayout: '41,000',
    surgery: false,
    receipt: {
      hospital: '행복동물병원',
      patient: '몽이 · 말티즈 3세',
      guardian: '홍○○',
      no: '20260702-0031',
      items: [
        ['진찰·상담료', '18,000'],
        ['피부 검사', '15,000'],
        ['피부 처치료', '10,000'],
        ['약제비', '15,000'],
      ],
      total: '58,000',
    },
  },
  {
    emoji: '🐶',
    title: '외이염 치료',
    file: '외이염_영수증.jpg',
    docType: '진료비 영수증',
    date: '2026.07.05',
    diag: '외이염',
    cost: '72,000',
    expectedPayout: '50,000',
    surgery: false,
    receipt: {
      hospital: '행복동물병원',
      patient: '초코 · 푸들 5세',
      guardian: '김○○',
      no: '20260705-0067',
      items: [
        ['진찰·상담료', '20,000'],
        ['이경 검사', '18,000'],
        ['귀 세포 검사', '14,000'],
        ['세척·약제비', '20,000'],
      ],
      total: '72,000',
    },
  },
  {
    emoji: '🐱',
    title: '방광염 치료',
    file: '방광염_영수증.jpg',
    docType: '진료비 영수증',
    date: '2026.07.08',
    diag: '방광염',
    cost: '64,000',
    expectedPayout: '45,000',
    surgery: false,
    receipt: {
      hospital: '튼튼동물병원',
      patient: '나비 · 코리안숏헤어 2세',
      guardian: '이○○',
      no: '20260708-0042',
      items: [
        ['진찰·상담료', '18,000'],
        ['소변 검사', '16,000'],
        ['초음파 검사', '20,000'],
        ['약제비', '10,000'],
      ],
      total: '64,000',
    },
  },
  {
    emoji: '🐱',
    title: '구토·설사 진료',
    file: '구토설사_영수증.jpg',
    docType: '진료비 영수증',
    date: '2026.07.11',
    diag: '급성 위장염',
    cost: '49,000',
    expectedPayout: '34,000',
    surgery: false,
    receipt: {
      hospital: '튼튼동물병원',
      patient: '보리 · 러시안블루 4세',
      guardian: '박○○',
      no: '20260711-0085',
      items: [
        ['진찰·상담료', '18,000'],
        ['분변 검사', '12,000'],
        ['주사·처치료', '9,000'],
        ['약제비', '10,000'],
      ],
      total: '49,000',
    },
  },
];
