import { recognize } from 'tesseract.js';
import type { Fields } from '../mvp/types';

const normalizeText = (text: string) =>
  text
    .replace(/[“”]/g, '"')
    .replace(/[|[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*,\s*(\d{3})/g, '$1,$2')
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    .trim();

const normalizeLine = (line: string) => normalizeText(line);

const uniq = <T,>(items: T[]) => [...new Set(items)];

const formatAmount = (value: string) => {
  const number = Number(value.replace(/[^\d]/g, ''));
  if (!Number.isFinite(number) || number <= 0) return '';
  return number.toLocaleString('ko-KR');
};

const extractDate = (text: string) => {
  const match =
    text.match(/(?:20\d{2})[.\-/년\s]+(?:0?[1-9]|1[0-2])[.\-/월\s]+(?:0?[1-9]|[12]\d|3[01])/)
    || text.match(/(?:0?[1-9]|1[0-2])[.\-/월\s]+(?:0?[1-9]|[12]\d|3[01])[.\-/일\s]+(?:20\d{2})/);

  if (!match) return '';
  const numbers = match[0].match(/\d+/g) || [];
  if (numbers.length < 3) return '';

  const [a = '', b = '', c = ''] = numbers;
  const year = a.length === 4 ? a : c;
  const month = a.length === 4 ? b : a;
  const day = a.length === 4 ? c : b;
  return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`;
};

const extractCost = (lines: string[]) => {
  const amountPattern = /(?:\d{1,3}(?:,\d{3})+|\d{4,})(?:\s*원)?/g;
  const scored: { value: string; score: number }[] = [];

  lines.forEach((line) => {
    const amounts = line.match(amountPattern) || [];
    amounts.forEach((amount) => {
      const value = formatAmount(amount);
      const numeric = Number(value.replaceAll(',', ''));
      if (!value || numeric < 1000) return;

      let score = numeric;
      if (/합계|총액|총\s*진료비|청구|결제|수납|total/i.test(line)) score += 10_000_000;
      if (/할인|잔액|카드|현금|부가세|공급가/i.test(line)) score -= 2_000_000;
      scored.push({ value, score });
    });
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.value || '';
};

const extractDiag = (lines: string[]) => {
  const explicit = lines.find((line) => /병명|상병|진단|진료\s*내용|내원\s*사유|증상/.test(line));
  if (explicit) {
    const value = explicit
      .replace(/.*?(병명|상병|진단명?|진료\s*내용|내원\s*사유|증상)\s*[:：]?\s*/i, '')
      .trim();
    if (value.length >= 2 && value.length <= 40) return value;
  }

  const keywords = [
    '아토피',
    '피부염',
    '알레르기',
    '슬개골',
    '탈구',
    '구토',
    '설사',
    '결석',
    '염증',
    '감염',
    '골절',
    '상해',
    '외상',
    '초음파',
    '혈액검사',
    'X-ray',
    '수술',
  ];
  return lines.find((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))) || '';
};

const extractDocType = (text: string) => {
  if (/세부\s*내역|진료\s*내역|진료비\s*세부/.test(text)) return '진료비 세부내역서';
  if (/영수증|계산서|수납/.test(text)) return '진료비 영수증';
  if (/진단서|소견서/.test(text)) return '진단서/소견서';
  return '진료비 영수증';
};

const detectSurgery = (text: string) => /수술|마취|입원|퇴원|절제|봉합/.test(text);

export interface OcrFieldResult {
  fields: Fields;
  surgery: boolean;
  text: string;
}

export async function extractFieldsFromImage(file: File): Promise<OcrFieldResult> {
  const result = await recognize(file, 'kor+eng');
  const text = normalizeText(result.data.text || '');
  const lines = uniq((result.data.text || '').split(/\r?\n/).map(normalizeLine).filter((line) => line.length > 1));

  const docType = extractDocType(text);

  return {
    text,
    surgery: detectSurgery(text),
    fields: {
      docType,
      date: extractDate(text),
      diag: docType === '진료비 영수증' ? '' : extractDiag(lines),
      cost: extractCost(lines),
    },
  };
}
