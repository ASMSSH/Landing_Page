import assert from 'node:assert/strict';
import test from 'node:test';
import type { ClaimDocumentGuide } from '../lib/claimDocuments.ts';
import {
  UNKNOWN_INSURER,
  canLookupDocs,
  docsBannerTitle,
  docsSummaryLine,
  fallbackRequiredDocs,
  isSnapshotCurrent,
  toRequiredDocsSnapshot,
} from './requiredDocs.ts';

const guide = (over: Partial<ClaimDocumentGuide> = {}): ClaimDocumentGuide => ({
  claimType: 'skin',
  title: '삼성화재 · 피부/아토피 청구 준비 서류',
  source: 'notion',
  hospitalDocs: [
    { name: ' 진료비 세부내역서 ', desc: '', tag: '병원 발급', tagKind: 'hospital' },
    { name: '진료비 영수증', desc: '', tag: '병원 발급', tagKind: 'hospital' },
    { name: '진료비 영수증', desc: '', tag: '병원 발급', tagKind: 'hospital' },
  ],
  selfDocs: [{ name: '보험금 청구서', desc: '', tag: '보험사 양식', tagKind: 'self' }],
  notes: ['출처: https://example.com'],
  ...over,
});

test('서버 가이드에서 이름만 trim·중복 제거해 스냅샷을 만든다 — claimType은 조회에 쓴 값', () => {
  const s = toRequiredDocsSnapshot(guide({ claimType: 'illness' }), '삼성화재', 'skin');
  assert.deepEqual(s, {
    insurer: '삼성화재',
    claimType: 'skin',
    hospitalIssued: ['진료비 세부내역서', '진료비 영수증'],
    selfPrepared: ['보험금 청구서'],
    fallback: false,
  });
});

test('source가 notion이 아니면 fallback 표시가 붙는다', () => {
  assert.equal(toRequiredDocsSnapshot(guide({ source: 'fallback' }), '삼성화재', 'skin').fallback, true);
});

test('fallback 스냅샷은 공통 3건이고 fallback: true다', () => {
  const s = fallbackRequiredDocs(UNKNOWN_INSURER, 'illness');
  assert.equal(s.insurer, UNKNOWN_INSURER);
  assert.equal(s.claimType, 'illness');
  assert.deepEqual(s.hospitalIssued, ['진료비 영수증', '진료비 세부내역서']);
  assert.deepEqual(s.selfPrepared, ['보험금 청구서']);
  assert.equal(s.fallback, true);
});

test('canLookupDocs — 실제 보험사만 true, 빈 값·기타/모름은 false', () => {
  assert.equal(canLookupDocs('삼성화재'), true);
  assert.equal(canLookupDocs(UNKNOWN_INSURER), false);
  assert.equal(canLookupDocs(''), false);
  assert.equal(canLookupDocs('없는보험'), false);
});

test('isSnapshotCurrent — 보험사·청구 유형이 둘 다 같아야 현재다', () => {
  const s = toRequiredDocsSnapshot(guide(), '삼성화재', 'skin');
  assert.equal(isSnapshotCurrent(null, '삼성화재', 'skin'), false);
  assert.equal(isSnapshotCurrent(s, '메리츠화재', 'skin'), false);
  assert.equal(isSnapshotCurrent(s, '삼성화재', 'illness'), false);
  assert.equal(isSnapshotCurrent(s, '삼성화재', 'skin'), true);
});

test('헤딩 요약 문구 — 정상은 유형 라벨과 개수, fallback은 담당자 확인', () => {
  assert.equal(docsSummaryLine(toRequiredDocsSnapshot(guide(), '삼성화재', 'skin')), '삼성화재 · 피부 기준 — 병원에서 2개, 직접 준비 1개');
  assert.equal(docsSummaryLine(fallbackRequiredDocs('삼성화재', 'illness')), '삼성화재 · 담당자 확인 필요 — 공통 서류 3개');
});

test('배너 제목 — 정상은 보험사·유형, fallback은 안내 문구', () => {
  assert.equal(docsBannerTitle(toRequiredDocsSnapshot(guide(), '삼성화재', 'skin')), '삼성화재 · 피부 청구 준비 서류');
  assert.equal(docsBannerTitle(fallbackRequiredDocs(UNKNOWN_INSURER, 'illness')), '담당자가 확인 후 안내드려요');
});
