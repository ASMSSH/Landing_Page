// 영수증 사진(File)을 /api/analyze-receipt에 보낼 dataURL로 바꾼다.
// 폰 JPEG는 3~6MB가 흔해, 큰 사진은 브라우저에서 1600px JPEG로 줄여 보낸다 (SSH-543 spec 2절, 「1차 리뷰 결정」 4).
// 브라우저 API(FileReader·createImageBitmap·canvas)라 node:test 대상이 아니다 — 실기기로 검증한다.
//
// 상한이 3MB인 이유: 전송 본문은 base64 dataURL을 감싼 JSON이라 원본의 약 1.37배가 된다.
// Vercel 서버리스 함수의 요청 본문 한도가 4.5MB라, 서버(server/gemini.ts)의 4MB 검사보다 플랫폼 413이
// 먼저 돌아오지 않게 원본 3MB(→ 전송 약 4.1MB)에서 끊는다. 로컬 dev 미들웨어는 6MB 버퍼라 이 한계가 재현되지 않는다.

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_SIDE_AS_IS = 2000;
const RESIZE_MAX_SIDE = 1600;
const RESIZE_QUALITY = 0.85;

export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export class ImageTooLargeError extends Error {
  constructor() {
    super('사진이 너무 커요. 3MB 이하 JPG·PNG로 올려 주세요');
    this.name = 'ImageTooLargeError';
  }
}

export class UnsupportedImageError extends Error {
  constructor() {
    super('JPG·PNG·WEBP·HEIC 사진만 올릴 수 있어요');
    this.name = 'UnsupportedImageError';
  }
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

async function decode(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null; // Chrome은 HEIC를 디코드하지 못한다
  }
}

function resizeToJpeg(bitmap: ImageBitmap): Promise<Blob | null> {
  const scale = Math.min(1, RESIZE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', RESIZE_QUALITY));
}

/**
 * 파일이 3MB 이하이고 긴 변이 2000px 이하면 그대로, 아니면 1600px JPEG로 줄인다.
 * 디코드가 안 되는 형식(Chrome의 HEIC)은 원본이 3MB 이하일 때만 그대로 보낸다.
 */
export async function imageToDataUrl(file: File): Promise<string> {
  const type = file.type.toLowerCase();
  if (!ACCEPTED_MIME_TYPES.includes(type)) throw new UnsupportedImageError();

  const bitmap = await decode(file);
  if (!bitmap) {
    if (file.size > MAX_UPLOAD_BYTES) throw new ImageTooLargeError();
    return readAsDataUrl(file);
  }

  try {
    const smallEnough = file.size <= MAX_UPLOAD_BYTES && Math.max(bitmap.width, bitmap.height) <= MAX_SIDE_AS_IS;
    if (smallEnough) return await readAsDataUrl(file);

    const resized = await resizeToJpeg(bitmap);
    if (!resized || resized.size > MAX_UPLOAD_BYTES) throw new ImageTooLargeError();
    return await readAsDataUrl(resized);
  } finally {
    bitmap.close();
  }
}
