# SSH-553 — S1 영수증 드래그 앤 드롭 + 「베타」 문구를 무료 이용 기간·프로모션으로

2026-09-12 팀 내부 QA 피드백 2건을 반영한다. **① 데스크톱에서 영수증 사진을 S1 업로드 카드에 끌어다 놓으면 「파일 선택」과
같은 경로로 읽히게** 하고, **② 화면 어디에도 「베타」·`BETA`가 남지 않게** 문구를 「무료 이용 기간」·「무료 프로모션」 계열로 바꾼다.
①은 `ReceiptUploadCard`가 드래그 상태만 갖고 파일은 지금 `<input type="file">`이 타는 `handleFile` 하나로 넘긴다(로직 두 벌 금지).
②는 `/apply` 8곳에 더해 **랜딩 체험 모달(`MvpModal`)의 `BETA` 배지**까지 뺀다 — 사용자 요청(2026-09-12)으로 랜딩도 대상이다.
동의 문안 본문·`CONSENT_VERSION`·reducer·서버는 건드리지 않는다.

> **이 PR이 남기는 것 한 문장**: 1440에서 영수증 JPG를 S1 카드에 끌어다 놓으면 카드가 「여기에 놓으세요」로 바뀌었다가 「파일 선택」과
> 똑같이 읽혀 폼이 채워지고(이미지가 아니면 같은 거부 문구), `/`·`/apply` 어디에도 「베타」·`BETA`가 없다.

## 배경

- **Jira** SSH-553 본문(2026-09-12) — 두 피드백의 원인·바꿀 방향 표. 형제 티켓: SSH-543(S1 업로드 카드·`handleFile` 경로 — 이 위에
  쌓는다), SSH-550(S1 분석 실패를 토스트 대신 빨간 오류 문구로 — **아직 「해야 할 일」**, 같은 파일을 만지므로 이 PR이 먼저 머지되고
  SSH-550이 그 위에서 문구 위치를 옮긴다. 이 PR은 거부 문구를 **지금 경로 그대로 토스트**로 둔다), SSH-545(랜딩 정리·`src/mvp/*`
  삭제 예정 — `MvpModal`은 지워질 코드지만 그때까지 `BETA`가 보이므로 한 줄만 뺀다)
- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ④ 화면 명세 S1 행(영수증 업로드 카드 · OCR 분석 중은 카드 안
  로딩 · 실패 시 토스트), ⑥ 동의 절 「법률 검토 전이라 화면에 "베타" 표시를 한다(§13)」 — **이 결정이 바뀐다.** 위키 갱신은 위키 PR로
  따로(범위 밖). `wiki/기획/법률-검토-현황.md` ⑥도 같은 서술
- **Figma** `/apply` 데스크톱·모바일 시안 — 헤더 오른쪽 `BETA` 배지, S3 앰버 카드 「베타 기간엔 …」, S5 하단 안내, 동의 모달 메타 줄.
  코드와 같이 고친다(5절). 드롭 강조 상태는 시안에 없다 — 기존 카드의 점선 보더·primary 배경을 한 단계 진하게 쓴다(1절)

### 왜 「베타」를 빼는가

「베타」는 위키 ⑥의 "동의 문안이 법률 검토 전"을 알리려고 넣었는데, QA에서 "미완성 서비스"로 읽혔다. 서비스는 정식이고 **무료인 이유는
프로모션(무료 이용 기간)**이다. 그래서 (a) 무료 근거를 말하는 자리는 「무료 이용 기간」·「무료 프로모션」으로, (b) 법률 검토 전을 알리는 자리는
「베타」 없이 「법률 검토 전」만 남긴다. 둘을 섞어 쓰던 문장(S5 하단 「베타 서비스예요. 동의 문안은 법률 검토 전이며 …」)은 (b)만 남긴다.

### 왜 드래그 상태를 `StepTreatment`가 아니라 카드가 갖는가

드래그 강조는 카드의 모양이고(`is-dragover` 클래스·문안), 파일 처리는 부모의 `handleFile`이다. `ReceiptUploadCard`는 이미 "상태별 모양만
그리고 input은 부모가 갖는다"는 분업이라(SSH-543), 드래그 카운터·`is-dragover`는 카드 안에, 떨어진 `File`은 `onDrop(file)` 콜백으로 부모에
올린다. 부모는 `onDrop={(file) => void handleFile(file)}` 한 줄이다.

### 지금 레포 상태 — 딛고 설 것

- `src/apply/steps/StepTreatment.tsx` — `handleFile(file)`: `imageToDataUrl`(MIME 검사 → `UnsupportedImageError` 「JPG·PNG·WEBP·HEIC
  사진만 올릴 수 있어요」, 3MB 초과 축소 → `ImageTooLargeError`) → `/api/analyze-receipt` → `receiptToTreatment` → dispatch. 실패는
  `setToast(error.message)`. `<input type="file" hidden>`의 `onChange`가 `files[0]`을 여기로 넘긴다. **드롭도 이 함수로 넘기면 검증·거부
  문구·성공 경로가 전부 같다**
- `src/apply/steps/ReceiptUploadCard.tsx` — `status: 'idle' | 'loading' | 'done'`별 `COPY`·아이콘·버튼. 루트 `div.apply-upload`에
  `is-loading`·`is-done` 클래스. `loading` 중엔 「파일 선택」 버튼이 `disabled` — 드롭도 같은 조건으로 무시한다
- `src/styles/apply.css` 83~101행 — `.apply-upload`(점선 `--primary-300` 보더 · `--primary-50` 배경), `.is-done`(실선 `--success-300` ·
  `--success-50`). `--primary-100`·`--primary-500` 토큰이 `index.css`에 있다
- `src/apply/ApplyPage.tsx` `ApplyShell` — `useEffect`가 이미 하나(단계 전환 스크롤, SSH-548). `/apply`에서만 마운트되므로 `window`
  리스너를 여기 두면 "`/apply`에서만"이 자동으로 성립한다
- 「베타」 사용처(2026-09-12 `grep -rni 베타\|beta` 결과, 테스트 파일에는 없음):

  | 파일 | 지금 |
  | --- | --- |
  | `src/apply/ApplyHeader.tsx` | 부제 「베타 기간 무료 · 로그인 없이 5분이면 끝나요」 + `<span class="beta-badge apply-beta">BETA</span>` |
  | `src/apply/useApplyMeta.ts` | description 「… 베타 기간 무료, 로그인 없이 5분.」 |
  | `src/apply/ApplyRail.tsx` HelpCard | 「베타 기간엔 대리 청구가 무료예요」 |
  | `src/apply/steps/StepDocuments.tsx` `DocsBetaCard` | 「베타 기간엔 대리 청구가 무료예요」, 클래스 `apply-docs-beta*` |
  | `src/apply/steps/StepConsent.tsx` | 「베타 서비스예요. 동의 문안은 법률 검토 전이며 …」, 클래스 `apply-consent-beta`, 15행 주석 |
  | `src/apply/steps/ConsentDialog.tsx` | 메타 「· 베타(법률 검토 전)」, 경고 「베타 기간 문안이에요. …」 |
  | `src/apply/ApplyFooter.tsx` | 「© 보험찾개냥 · 베타 · 문의는」 |
  | `src/apply/consents.ts` 12행 주석 | "법률 검토 전이라 화면에 「베타」를 표시한다 (위키 ⑥)" |
  | `src/mvp/MvpModal.tsx` 164행 | 랜딩 체험 모달 헤더 `<span class="beta-badge">BETA</span>` |
  | `src/index.css` 235행 | `.beta-badge` — 위 두 배지가 유일한 사용처. 둘 다 빠지면 죽은 규칙 |
  | `src/styles/apply.css` 1·17·184~188·209·297행 | 주석 `.beta-badge` 언급 · `.apply-beta` · `.apply-docs-beta*` · `.apply-consent-beta` |

## 범위

### 1. 드래그 앤 드롭 — `ReceiptUploadCard.tsx` · `apply.css`

카드 prop에 `onDrop: (file: File) => void`를 더한다. 카드 루트 `div.apply-upload`에 네 핸들러:

- `onDragEnter` — `dataTransfer.types`에 `Files`가 없으면(텍스트·링크 드래그) 무시. 있으면 `preventDefault` + 카운터 `+1`, 0→1이면
  `dragover` 상태 on
- `onDragOver` — `preventDefault`(이게 있어야 drop이 발생한다) + `dataTransfer.dropEffect = 'copy'`
- `onDragLeave` — 카운터 `-1`, 0이 되면 off. **자식 요소(아이콘·문안·버튼)를 지날 때 `dragleave`/`dragenter`가 쌍으로 나므로 카운터로
  깜빡임을 막는다**(티켓 요구). 카운터는 `useRef`
- `onDrop` — `preventDefault`, 카운터 0·off, `dataTransfer.files[0]`이 있으면 `onDrop(file)`. 여러 파일이면 첫 장만(input도 `multiple`이
  없다). `status === 'loading'`이면 무시(「파일 선택」 버튼이 disabled인 것과 같은 조건)

드래그 중 모양 — 클래스 `is-dragover`, 문안은 상태와 무관하게 「여기에 놓으세요」 / 「놓으면 바로 읽기 시작해요」로 덮는다(`idle`·`done`
둘 다. `done`에서 놓으면 「다시 올리기」와 같은 동작이다 — `handleFile`이 이전 사진·값을 새 결과로 바꾼다). 버튼·썸네일은 그대로 둔다.

```css
.apply-upload.is-dragover { border-style:dashed; border-color:var(--primary-500); background:var(--primary-100); }
.apply-upload.is-dragover .apply-upload-title { color:var(--primary-600); }
```

`is-done`보다 뒤에 선언해 실선·초록을 덮는다. 색·간격은 토큰만. 모바일(터치)은 드래그 이벤트가 없으니 변화 없음 — 미디어 쿼리도 없다.

### 2. 페이지 다른 곳에 놓았을 때 브라우저가 이미지를 열지 않게 — `ApplyPage.tsx`

`ApplyShell`에 `useEffect` 하나:

```ts
useEffect(() => {
  const block = (e: DragEvent) => {
    if (e.defaultPrevented) return;          // 카드가 이미 받은 이벤트는 건드리지 않는다
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';   // 카드 밖에서는 「놓을 수 없음」 커서
  };
  window.addEventListener('dragover', block);
  window.addEventListener('drop', block);
  return () => { window.removeEventListener('dragover', block); window.removeEventListener('drop', block); };
}, []);
```

- `ApplyShell`은 `/apply`에서만 마운트되므로 랜딩(`/`)에는 영향이 없다(티켓 "window 레벨은 `/apply`에서만")
- 카드 핸들러가 `preventDefault`한 이벤트는 버블링으로 `window`까지 오지만 `defaultPrevented`라 건너뛴다 — 카드 위 `copy` 커서가 유지된다

### 3. `/apply` 「베타」 제거 — 문구·클래스

문안은 티켓의 "구현 때 확정" — 아래로 정하고 PR Point에서 확인받는다. 「무료 이용 기간엔 대리 청구가 무료예요」처럼 「무료」가 두 번 오는
문장은 피했다.

| 파일 | 바꾼 뒤 |
| --- | --- |
| `ApplyHeader.tsx` | 부제 「무료 이용 기간 · 로그인 없이 5분이면 끝나요」. `BETA` span 제거 → `.apply-head`는 `apply-head-copy`만 남는다 |
| `useApplyMeta.ts` | 「영수증 한 장으로 펫보험 청구를 맡기세요. 무료 이용 기간, 로그인 없이 5분.」 |
| `ApplyRail.tsx` | 「무료 이용 기간이라 대리 청구 비용이 없어요」 |
| `StepDocuments.tsx` | 함수 `DocsPromoCard`, 클래스 `apply-docs-promo*`. 제목 「지금은 무료 프로모션 기간이에요」, 부제 「대리 청구 비용 없이 서류 발급부터 보험사 제출까지 담당자가 대신해요. 사본은 나중에 따로 받아요.」 |
| `StepConsent.tsx` | 「동의 문안은 법률 검토 전이며, 위임장은 병원 방문 때 종이로 받아요. 신청 즉시 담당자에게 알림이 가고 24시간 안에 연락드려요.」 클래스 `apply-consent-note`. 15행 주석 「베타 문구」 → 「법률 검토 전 안내」 |
| `ConsentDialog.tsx` | 메타 「문안 버전 … · … 시행 · 법률 검토 전」, 경고 「법률 검토 전 문안이에요. 검토 후 내용이 바뀔 수 있고, 바뀌면 문안 버전이 올라가요.」 |
| `ApplyFooter.tsx` | 「© 보험찾개냥 · 문의는 인스타 DM」 |
| `consents.ts` 주석 | 「법률 검토 전이라 화면에 「법률 검토 전」 안내를 둔다. 「베타」 표기는 SSH-553에서 뺐다 — 서비스는 정식이고 무료는 프로모션이다」 |
| `apply.css` | 1행 주석에서 `.beta-badge` 제거 · `.apply-beta`(17·297행) 삭제 · `.apply-docs-beta*` → `.apply-docs-promo*`(주석 「프로모션 무료 카드」) · `.apply-consent-beta` → `.apply-consent-note` |

`CONSENT_VERSION`은 올리지 않는다 — 문안 본문이 아니라 화면 안내만 바뀐다(티켓). `consents.test.ts`는 「베타」를 보지 않으므로 그대로.

### 4. 랜딩 `BETA` 배지 제거 — `MvpModal.tsx` · `index.css`

- `MvpModal.tsx` 164행 `<span className="beta-badge">BETA</span>` 한 줄 삭제. 모달 헤더는 🐾 + 「보험찾개냥 체험하기」만 남는다
- `index.css` 235행 `.beta-badge` 삭제 — 3절·4절 뒤 사용처가 0이다. 랜딩에 다른 「베타」 문구는 없다(`src/`·`index.html`·`public/` grep)

### 5. Figma `/apply` 시안 동기화

코드가 끝난 뒤 데스크톱·모바일 시안에서 헤더 `BETA` 배지 삭제, S3 앰버 카드·S5 하단 안내·동의 모달 메타의 「베타」 문구를 3절 표와 같게.
드롭 강조 상태 프레임은 만들지 않는다(호버성 상태 — 스크린샷으로 남긴다). 화살표(←→)가 든 라벨은 건드리지 않는다(글리프 유실 이슈).

### 6. 파일 목록

| 파일 | 왜 |
| --- | --- |
| `src/apply/steps/ReceiptUploadCard.tsx` | 1절 — 드래그 카운터·`is-dragover`·`onDrop` prop |
| `src/apply/steps/StepTreatment.tsx` | 1절 — `onDrop={(file) => void handleFile(file)}` |
| `src/apply/ApplyPage.tsx` | 2절 — window 레벨 dragover/drop 차단 |
| `src/styles/apply.css` | 1절 `is-dragover` · 3절 클래스 개명·`.apply-beta` 삭제 |
| `src/apply/ApplyHeader.tsx` `ApplyFooter.tsx` `ApplyRail.tsx` `useApplyMeta.ts` `consents.ts` `steps/StepDocuments.tsx` `steps/StepConsent.tsx` `steps/ConsentDialog.tsx` | 3절 |
| `src/mvp/MvpModal.tsx` `src/index.css` | 4절 |
| `docs/spec/SSH-553/*` | spec·tasks·스크린샷 |

## 범위 밖 — 다른 곳이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| 분석 실패 문구를 토스트 → 카드 위 빨간 오류 문구로 | SSH-550 (이 PR 머지 뒤 그 위에서) |
| 위키 ⑥ 「베타 표시」 결정 갱신(`대리청구-웹-창구-설계.md`·`법률-검토-현황.md`) | 위키 PR 별도 |
| `src/mvp/*` 삭제·랜딩 CTA 통일 | SSH-545 |
| 클릭으로 카드 전체가 파일 선택창을 여는 것 · 여러 장 업로드 · 클립보드 붙여넣기 | 요청 없음 |
| 동의 문안 본문 수정·`consent-v2` | 법률 검토 뒤 |

## 검증

- [ ] `npm run build` · `npm run lint` · `npm test`
- [ ] 로컬 1440 — S1 카드에 JPG 드롭 → `is-dragover` 강조 → 「읽는 중」 → 폼 채워짐(「파일 선택」과 같은 결과). 자식 요소(버튼·문안) 위를
      지나도 강조가 깜빡이지 않음. 카드 밖(폼·레일)에 놓으면 아무 일 없음(새 탭 안 열림). `.txt` 드롭 → 「JPG·PNG·WEBP·HEIC 사진만 올릴 수 있어요」
      토스트. 「읽었어요」 상태에서 다시 드롭 → 새 사진으로 교체. 텍스트 드래그는 강조 없음
- [ ] `grep -rni "베타\|beta" Project/src Project/index.html` → 주석의 「SSH-553에서 뺐다」 한 줄만
- [ ] 랜딩 `/` 체험 모달 헤더에 배지 없음 · `/apply` 헤더·S3·S5·동의 모달·푸터에 「베타」 없음
- [ ] Vercel 프리뷰 (새로고침 포함)
- [ ] 스크린샷 S1 1440 · 768 · 390(첫 진입 모습 — 헤더에 배지 없음) + 1440 드래그 강조 상태 1장 → `docs/spec/SSH-553/`
- [ ] Figma 시안 5절

## 1차 리뷰 결정 (2026-09-12)

- 사용자가 Draft 직후 구현까지 요청 — 1차 리뷰 없이 같은 브랜치에서 잇는다. 문안(3절 표)은 PR Point로 확인받는다
