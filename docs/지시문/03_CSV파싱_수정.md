# 지시문 03: CSV 파싱 로직 수정

> Wave 2 — 지시문 02 완료 후 실행  
> 선행 조건: 지시문 02 완료 (responses 테이블에 region·age_group·career 컬럼 존재)  
> 프로젝트 경로: C:\Projects\설문시스템

---

## 작업 목적

설문 도입부 구조 변경(기관명·기관유형 삭제, 권역 추가)을 CSV 파싱 로직에 반영한다.  
파싱 시 도입부 응답값을 추출하여 responses 테이블의 region·age_group·career에 저장한다.

---

## 변경 전후 CSV 구조 비교

### 통합설문 (S01·S02) 도입부

| 열 순서 | 변경 전 | 변경 후 |
|---|---|---|
| 1 | 응답번호 (skip) | 응답번호 (skip) |
| 2 | 제출시간 (skip) | 제출시간 (skip) |
| 3 | 기관유형 (skip) | **연령대 → age_group 저장** |
| 4 | 기관명 (skip) | **경력 → career 저장** |
| 5 | 연령대 → age_group 저장 | **권역 → region 저장** |
| 6 | 경력 → career 저장 | 이후 문항 Q1, Q2, … |
| 7 | 권역 없음 | |
| 8~ | 문항 Q1, Q2, … | |

> 변경 후: skip 대상 열이 응답번호·제출시간 2개로 줄어든다.

### 현장설문 (J01~J17) 도입부

| 열 순서 | 변경 전 | 변경 후 |
|---|---|---|
| 1 | 응답번호 (skip) | 응답번호 (skip) |
| 2 | 제출시간 (skip) | 제출시간 (skip) |
| 3 | 기관명 (skip) | **연령대 → age_group 저장** |
| 4 | 연령대 → age_group 저장 | **경력 → career 저장** |
| 5 | 경력 → career 저장 | **권역 → region 저장** |
| 6 | 권역 없음 | 이후 문항 Q1, Q2, … |
| 7~ | 문항 Q1, Q2, … | |

> 변경 후: skip 대상 열이 응답번호·제출시간 2개로 줄어든다.

---

## 실행 절차

### 1단계: 현재 파싱 로직 파일 확인

```bash
cat backend/routes/responses.js
```

CSV 파싱 관련 코드 위치 파악 — 주로 아래 패턴 확인:
- `응답번호`, `제출시간`, `기관명`, `기관유형` skip 처리 부분
- 문항 번호 부여 시작 위치 (현재 기관명 등 skip 후 Q1부터 시작)

### 2단계: 파싱 로직 수정

수정 핵심 3가지:

**① skip 열 목록 변경**
```javascript
// 변경 전
const SKIP_COLUMNS = ['응답번호', '제출시간', '기관유형', '기관명'];

// 변경 후
const SKIP_COLUMNS = ['응답번호', '제출시간'];
```

**② 도입부 열 → 메타 컬럼 추출 추가**

`backend/constants/regions.js`에서 매핑 import 후:

```javascript
const { REGION_LABELS, AGE_GROUP_LABELS, CAREER_LABELS } = require('../constants/regions');

// CSV 헤더에서 도입부 열 위치 파악 후 각 행에서 추출
function extractMeta(headers, row) {
  // 헤더명으로 매칭 (연령대, 경력, 권역 열 이름 기준)
  const ageHeader = headers.find(h => h.includes('연령대'));
  const careerHeader = headers.find(h => h.includes('경력'));
  const regionHeader = headers.find(h => h.includes('권역'));

  return {
    age_group: ageHeader ? (AGE_GROUP_LABELS[row[ageHeader]] ?? null) : null,
    career: careerHeader ? (CAREER_LABELS[row[careerHeader]] ?? null) : null,
    region: regionHeader ? (REGION_LABELS[row[regionHeader]] ?? null) : null,
  };
}
```

**③ INSERT 시 메타 컬럼 포함**

```javascript
// 변경 전
db.prepare(`INSERT INTO responses (...) VALUES (...)`).run(...);

// 변경 후 — region, age_group, career 추가
db.prepare(`
  INSERT INTO responses (..., region, age_group, career)
  VALUES (..., ?, ?, ?)
`).run(..., meta.region, meta.age_group, meta.career);
```

### 3단계: 테스트

테스트용 CSV 파일(`테스트_S01.csv`)을 업로드하여 아래 쿼리로 확인:

```sql
SELECT id, region, age_group, career
FROM responses
ORDER BY id DESC
LIMIT 10;
```

기대 결과: region·age_group·career에 값이 정상 저장될 것 (NULL 아님)

---

## 주의사항

- 헤더명이 정확히 일치하지 않을 경우 NULL 저장 (에러 아님) — 기존 정책 유지
- 기존 업로드된 responses 데이터의 region·age_group·career는 NULL 유지 (소급 불필요)
- 문항 번호 Q1 시작 위치가 바뀌므로, 기존 question_count mismatch 경고 로직도 skip 열 수 변경에 맞게 조정 필요

---

## 완료 조건

- S01·S02 CSV 업로드 시 region·age_group·career 정상 저장
- J01~J17 CSV 업로드 시 동일하게 정상 저장
- question_count mismatch 경고가 올바른 문항 수 기준으로 동작

---

## 완료 후 보고 형식

```
[지시문 03 완료]
- SKIP_COLUMNS 변경 (4개 → 2개) ✅
- extractMeta 함수 추가 ✅
- INSERT 시 region·age_group·career 저장 ✅
- S01 테스트 업로드: region/age_group/career 값 확인 ✅
- J01 테스트 업로드: 동일 확인 ✅
- question_count 경고 기준 조정 ✅
```
