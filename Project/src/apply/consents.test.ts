import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENTS, CONSENT_EFFECTIVE_DATE, CONSENT_VERSION, consentDoc, type ConsentBlock } from './consents.ts';
import { initialApplyState } from './state.ts';

function textsOf(block: ConsentBlock): string[] {
  switch (block.type) {
    case 'h':
    case 'p':
      return [block.text];
    case 'ol':
    case 'ul':
      return [...block.items];
    case 'table':
      return [...block.head, ...block.rows.flat()];
  }
}

test('동의는 5개이고 key가 상태의 consents 키와 정확히 일치한다', () => {
  assert.equal(CONSENTS.length, 5);
  const keys = CONSENTS.map((d) => d.key);
  assert.equal(new Set(keys).size, 5);
  assert.deepEqual([...keys].sort(), Object.keys(initialApplyState.consents).sort());
});

test('순서는 이용약관 → 개인정보 → 고유식별정보 → 병원 → 보험사 (위키 ⑥·Figma S5)', () => {
  assert.deepEqual(
    CONSENTS.map((d) => d.key),
    ['terms', 'privacy', 'uniqueId', 'hospital3p', 'insurer3p'],
  );
});

test('문안 버전은 consent-v1이고 시행일이 이용약관 말미에 들어간다', () => {
  assert.equal(CONSENT_VERSION, 'consent-v1');
  assert.match(CONSENT_EFFECTIVE_DATE, /^\d{4}-\d{2}-\d{2}$/);
  const terms = consentDoc('terms');
  const all = terms.blocks.flatMap(textsOf).join('\n');
  assert.ok(all.includes(`본 약관은 ${CONSENT_EFFECTIVE_DATE}부터 시행합니다.`));
});

test('모든 문서에 라벨·제목·본문이 있고 표는 열 수가 맞는다', () => {
  for (const doc of CONSENTS) {
    assert.ok(doc.label.trim().length > 0, doc.key);
    assert.ok(doc.title.trim().length > 0, doc.key);
    assert.ok(doc.blocks.length > 0, doc.key);
    for (const block of doc.blocks) {
      if (block.type === 'table') {
        assert.ok(block.head.length > 0, doc.key);
        for (const row of block.rows) assert.equal(row.length, block.head.length, `${doc.key} 표 열 수`);
      }
      for (const t of textsOf(block)) assert.ok(t.trim().length > 0, `${doc.key} 빈 텍스트`);
    }
  }
});

test('노션의 미정 대괄호·동의함 체크 줄이 남아 있지 않다', () => {
  for (const doc of CONSENTS) {
    for (const t of doc.blocks.flatMap(textsOf)) {
      assert.ok(!t.includes('['), `${doc.key}: ${t}`);
      assert.ok(!t.includes('□'), `${doc.key}: ${t}`);
    }
  }
});

test('굵게 표기는 짝이 맞는다 (** 개수가 짝수)', () => {
  for (const doc of CONSENTS) {
    for (const t of doc.blocks.flatMap(textsOf)) {
      const count = (t.match(/\*\*/g) ?? []).length;
      assert.equal(count % 2, 0, `${doc.key}: ${t}`);
    }
  }
});

test('consentDoc은 key로 찾고 없으면 throw', () => {
  assert.equal(consentDoc('hospital3p').title, '개인정보 제3자 제공 동의 (병원)');
  assert.throws(() => consentDoc('nope' as never));
});
