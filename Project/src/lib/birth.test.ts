import assert from 'node:assert/strict';
import test from 'node:test';
import { formatBirthInput } from './birth.ts';

test('숫자를 입력하는 대로 YYYY-MM-DD 하이픈을 붙인다', () => {
  assert.equal(formatBirthInput(''), '');
  assert.equal(formatBirthInput('19'), '19');
  assert.equal(formatBirthInput('1990'), '1990');
  assert.equal(formatBirthInput('19900'), '1990-0');
  assert.equal(formatBirthInput('199005'), '1990-05');
  assert.equal(formatBirthInput('1990051'), '1990-05-1');
  assert.equal(formatBirthInput('19900512'), '1990-05-12');
});

test('숫자가 아닌 글자는 버리고 8자리를 넘으면 자른다', () => {
  assert.equal(formatBirthInput('1990-05-12'), '1990-05-12');
  assert.equal(formatBirthInput('1990.05.12abc'), '1990-05-12');
  assert.equal(formatBirthInput('199005123456'), '1990-05-12');
});
