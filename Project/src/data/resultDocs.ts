export interface ResultDoc {
  name: string;
  desc: string;
  tag: string;
  tagKind: 'hospital' | 'self';
}

export interface DocumentDownload {
  name: string;
  url: string;
}

export interface ClaimDocumentGuide {
  claimType: string;
  title: string;
  source: 'notion' | 'fallback';
  hospitalDocs: ResultDoc[];
  selfDocs: ResultDoc[];
  downloads?: DocumentDownload[];
  notes: string[];
  warning?: string;
}

export const FALLBACK_HOSPITAL_DOCS: ResultDoc[] = [
  {
    name: '진료 상세 내역서',
    desc: '진료 항목·금액을 확인하는 공통 서류예요. 영수증만으로는 부족할 수 있어요.',
    tag: '병원 발급',
    tagKind: 'hospital',
  },
  {
    name: '진단서 (상병명코드 기재)',
    desc: '진료비 350,000원 — 30만원 이상 청구는 진단서를 요구하는 경우가 일반적이에요. 상병명코드 기재를 꼭 요청하세요.',
    tag: '병원 발급',
    tagKind: 'hospital',
  },
  {
    name: 'X-ray 영상 · 판독 소견',
    desc: '관절·골격 질환 청구 시 영상 자료를 요구하는 사례가 많아요. 진료 당일 함께 받아두면 재방문이 없어요.',
    tag: '병원 발급',
    tagKind: 'hospital',
  },
  {
    name: '수술기록지',
    desc: '수술 청구 심사에 필요한 서류예요.',
    tag: '병원 발급',
    tagKind: 'hospital',
  },
  {
    name: '입 · 퇴원확인서',
    desc: '입원을 동반한 수술이었다면 함께 챙겨주세요.',
    tag: '입원 시',
    tagKind: 'hospital',
  },
];

export const FALLBACK_SELF_DOCS: ResultDoc[] = [
  {
    name: '보험금청구서',
    desc: '삼성화재 홈페이지·앱에서 양식을 내려받아 작성해요.',
    tag: '보험사 양식',
    tagKind: 'self',
  },
  {
    name: '개인정보처리동의서',
    desc: '청구서와 함께 제출하는 공통 서류예요.',
    tag: '보험사 양식',
    tagKind: 'self',
  },
  {
    name: '통장 사본',
    desc: '보험금을 받을 계좌 확인용이에요.',
    tag: '첫 청구 시',
    tagKind: 'self',
  },
];

export const FALLBACK_DOCUMENT_GUIDE: ClaimDocumentGuide = {
  claimType: 'illness',
  title: '질병 통원/진료비 청구 준비 서류',
  source: 'fallback',
  hospitalDocs: FALLBACK_HOSPITAL_DOCS,
  selfDocs: FALLBACK_SELF_DOCS,
  notes: ['참고용 안내예요. 최종 서류 요건은 가입 보험사 확인이 필요해요.'],
};
