# 지시문 01: question_count 참조값 수정

> Wave 1 — 독립 실행 가능  
> 선행 조건: 없음  
> 프로젝트 경로: C:\Projects\설문시스템

---

## 작업 목적

설문 구조 변경으로 확정된 문항 수를 surveys 테이블 question_count에 반영한다.  
question_count는 업로드 시 불일치 경고용 참조값이며, 업로드를 차단하지 않는다 (기존 정책 유지).

---

## 변경 내용

| survey_code | 변경 전 | 변경 후 | 변경 사유 |
|---|---|---|---|
| S01 | 55 또는 56 | **61** | 섹션 재편, 도입부 기관명 삭제 및 권역 추가 등 |
| S02 | 57 또는 59 | **65** | 동일 |
| J04 | 13 | **14** | 생활지원사 욕구 문항 1개 추가 |
| J06 | 13 | **14** | 생활지원사 욕구 문항 1개 추가 |

---

## 실행 절차

### 1단계: 현재 값 확인

```sql
SELECT survey_code, survey_name, question_count
FROM surveys
WHERE survey_code IN ('S01', 'S02', 'J04', 'J06')
ORDER BY survey_code;
```

### 2단계: 값 수정

```sql
UPDATE surveys SET question_count = 61 WHERE survey_code = 'S01';
UPDATE surveys SET question_count = 65 WHERE survey_code = 'S02';
UPDATE surveys SET question_count = 14 WHERE survey_code = 'J04';
UPDATE surveys SET question_count = 14 WHERE survey_code = 'J06';
```

### 3단계: 완료 확인

```sql
SELECT survey_code, survey_name, question_count
FROM surveys
WHERE survey_code IN ('S01', 'S02', 'J04', 'J06')
ORDER BY survey_code;
```

기대 결과:
```
S01 | 상반기 통합설문 | 61
S02 | 하반기 통합설문 | 65
J04 | 역량강화교육(생활지원사) | 14
J06 | 심리지원교육(생활지원사) | 14
```

---

## 완료 조건

- 위 4개 survey_code의 question_count가 기대값과 일치할 것
- 다른 survey_code의 question_count는 변경되지 않을 것

---

## 완료 후 보고 형식

```
[지시문 01 완료]
- S01: ○○ → 61 ✅
- S02: ○○ → 65 ✅
- J04: 13 → 14 ✅
- J06: 13 → 14 ✅
```
