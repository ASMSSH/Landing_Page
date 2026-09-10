// S3 필요 서류 스냅샷을 만드는 순수 함수. React 의존이 없어 node:test로 검증한다 (requiredDocs.test.ts).
//
// 스냅샷(state.requiredDocs)은 단일 진실 원천이다 — S3 화면이 여기서 로딩 여부를 파생하고, S5 「신청하기」가
// 그대로 POST /api/claims 본문(required_docs)으로 보낸다 (SSH-473 spec 2절).

import { INSURERS } from '../data/insurers.ts';
import type { ClaimDocumentGuide } from '../lib/claimDocuments.ts';
import { CLAIM_TYPE_LABEL, type ClaimType } from '../lib/claimType.ts';
import type { RequiredDocsSnapshot } from './state.ts';

/** data/insurers.ts 마지막 항목과 같은 문자열. S2가 저장하는 값이다 */
export const UNKNOWN_INSURER = '기타 / 모름';

/**
 * 어느 보험사든 공통으로 필요한 서류 3건 — 실측한 7개 보험사 목록에 전부 들어 있는 항목만 골랐다.
 * 조회를 못 하거나(기타/모름) 실패했을 때 담당자 안내 카드 아래에 보여 준다.
 */
export const FALLBACK_HOSPITAL_DOCS: readonly string[] = ['진료비 영수증', '진료비 세부내역서'];
export const FALLBACK_SELF_DOCS: readonly string[] = ['보험금 청구서'];

/**
 * 서버에 물어볼 수 있는 보험사인가. 「기타 / 모름」과 빈 값은 false — 노션에 「공통」 행이 없어 서버가 항상 404를
 * 돌려준다(2026-09-10 실측). 「공통」 행이 생기면 여기서 UNKNOWN_INSURER 조건만 풀면 된다.
 */
export function canLookupDocs(insurer: string): boolean {
  const name = insurer.trim();
  if (!name || name === UNKNOWN_INSURER) return false;
  return INSURERS.some((ins) => ins.company === name);
}

function uniqueNames(docs: { name: string }[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const doc of docs) {
    const name = doc.name.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/**
 * 서버 가이드 → 스냅샷. 이름만 남긴다 — 설명·출처·다운로드는 이 화면의 정보가 아니다 (spec 「배경」).
 * claimType은 서버가 돌려준 값이 아니라 조회에 쓴 값을 넣는다 — 둘이 어긋나면 isSnapshotCurrent가 영영 false라
 * 재조회가 반복된다. 서버는 입력을 그대로 echo하므로 정상이면 같은 값이다.
 */
export function toRequiredDocsSnapshot(
  guide: ClaimDocumentGuide,
  insurer: string,
  claimType: ClaimType,
): RequiredDocsSnapshot {
  return {
    insurer,
    claimType,
    hospitalIssued: uniqueNames(guide.hospitalDocs),
    selfPrepared: uniqueNames(guide.selfDocs),
    fallback: guide.source !== 'notion',
  };
}

/** 조회를 못 했을 때의 스냅샷. fallback: true가 담당자가 확인할 신호로 저장까지 따라간다. */
export function fallbackRequiredDocs(insurer: string, claimType: ClaimType): RequiredDocsSnapshot {
  return {
    insurer,
    claimType,
    hospitalIssued: [...FALLBACK_HOSPITAL_DOCS],
    selfPrepared: [...FALLBACK_SELF_DOCS],
    fallback: true,
  };
}

/**
 * 스냅샷이 지금 입력(보험사·청구 유형)으로 만든 것인가 — 재조회 규칙의 유일한 근거.
 * S1 병명이나 S2 보험사를 바꾸면 false가 되어 S3에 다시 들어갈 때 자연히 재조회된다.
 */
export function isSnapshotCurrent(
  snapshot: RequiredDocsSnapshot | null,
  insurer: string,
  claimType: ClaimType,
): snapshot is RequiredDocsSnapshot {
  return snapshot !== null && snapshot.insurer === insurer && snapshot.claimType === claimType;
}

function labelOf(claimType: string): string {
  return (CLAIM_TYPE_LABEL as Record<string, string>)[claimType] ?? claimType;
}

/** S3 헤딩 설명 한 줄. Figma: 「삼성화재 · 통원 기준 — 병원에서 4개, 직접 준비 1개」 */
export function docsSummaryLine(snapshot: RequiredDocsSnapshot): string {
  const hospital = snapshot.hospitalIssued.length;
  const self = snapshot.selfPrepared.length;
  if (snapshot.fallback) {
    return `${snapshot.insurer} · 담당자 확인 필요 — 공통 서류 ${hospital + self}개`;
  }
  return `${snapshot.insurer} · ${labelOf(snapshot.claimType)} 기준 — 병원에서 ${hospital}개, 직접 준비 ${self}개`;
}

/** 요약 배너 제목. 스냅샷에 서버 title이 없으므로 클라이언트가 만든다 */
export function docsBannerTitle(snapshot: RequiredDocsSnapshot): string {
  if (snapshot.fallback) return '담당자가 확인 후 안내드려요';
  return `${snapshot.insurer} · ${labelOf(snapshot.claimType)} 청구 준비 서류`;
}
