# 지시문 05 — CSV Q번호 헤더 기반 전환

> 대상 프로젝트: `C:\Projects\설문시스템`
> 백엔드 포트: 3001 / 프론트엔드 포트: 5173

---

## 배경 및 목적

현재 시스템은 CSV 열 순서(0, 1, 2, …)를 기반으로 `question_no`를 부여한다.
문항 추가·삭제 또는 구글폼 수정 시 열 순서가 바뀌어 번호가 밀리는 문제가 있다.

구글폼 생성 시 모든 문항에 `"Q01. "`, `"Q02. "` 형식의 프리픽스를 붙였으므로,
헤더명에서 Q번호를 직접 추출하면 이 문제가 해결된다.

---

## 변경 대상 파일

`backend/routes/responses.js` — CSV 파싱 로직

---

## 변경 내용

### 1. Q번호 추출 함수 추가

파일 상단(또는 파싱 로직 직전)에 아래 함수를 추가한다.

```javascript
/**
 * 헤더명에서 Q번호를 추출한다.
 * "Q01. 문항내용" → 1
 * "Q12. 문항내용" → 12
 * 매칭 실패 시 null 반환 (폴백용)
 */
function extractQuestionNo(header) {
  const match = header.match(/^Q(\d+)\.\s/);
  return match ? parseInt(match[1], 10) : null;
}
```

---

### 2. 파싱 루프 수정

현재 열 순서 기반 코드를 헤더명 기반으로 교체한다.

**변경 전 (열 순서 기반):**
```javascript
// 기존 코드 (예시 — 실제 코드 구조에 맞게 적용)
headers.forEach((header, idx) => {
  if (/* 문항 열 조건 */) {
    const question_no = q + 1; // 열 순서 기반
    // ...
  }
});
```

**변경 후 (헤더명 기반 + 폴백):**
```javascript
let fallbackIndex = 0; // 폴백용 카운터

headers.forEach((header, idx) => {
  if (/* 문항 열 조건 — 기존과 동일 */) {
    fallbackIndex++;

    // 헤더에서 Q번호 추출 시도
    const qFromHeader = extractQuestionNo(header);

    // Q번호가 있으면 사용, 없으면 열 순서 폴백
    const question_no = qFromHeader !== null ? qFromHeader : fallbackIndex;

    // 이하 기존 로직 동일
    // ...
  }
});
```

---

### 3. 폴백 동작 정책

| CSV 헤더 형식 | question_no 결정 방식 |
|---|---|
| `Q01. 문항내용` (구글폼 신규) | 헤더에서 추출 → `1` |
| `Q12. 문항내용` | 헤더에서 추출 → `12` |
| `문항내용` (구형 CSV, Q번호 없음) | 열 순서 기반 폴백 |

폴백 시 기존 동작과 완전히 동일하게 처리한다 (하위 호환 보장).

---

## 검증 방법

### 케이스 A — 신규 구글폼 CSV (Q번호 있음)
1. S01 구글폼에서 테스트 응답 1건 생성 후 CSV 내보내기
2. 시스템에 업로드
3. 응답 상세 조회 → `question_no`가 헤더의 Q번호와 일치하는지 확인
   - 예: 헤더 `Q05. 문항` → DB에 `question_no = 5` 저장 확인

### 케이스 B — 구형 CSV (Q번호 없음)
1. 기존 테스트 CSV(Q번호 없는 형식) 업로드
2. 오류 없이 업로드 완료되는지 확인
3. `question_no`가 열 순서 기반으로 정상 부여되는지 확인

---

## 완료 기준

- [ ] `extractQuestionNo` 함수 추가
- [ ] 파싱 루프에서 헤더 기반 추출 + 폴백 적용
- [ ] 케이스 A 검증 통과
- [ ] 케이스 B 검증 통과 (하위 호환)
- [ ] 기존 업로드된 응답 데이터에 영향 없음 확인
