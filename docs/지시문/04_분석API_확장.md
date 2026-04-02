# 지시문 04: 분석 API 확장 (권역·연령대·경력별 집계)

> Wave 3 — 지시문 03 완료 후 실행  
> 선행 조건: 지시문 03 완료 (responses에 region·age_group·career 데이터 저장됨)  
> 프로젝트 경로: C:\Projects\설문시스템

---

## 작업 목적

분석 단위를 기관별 → 전체·권역·연령대·경력별로 확장한다.  
기존 분석 API를 유지하면서, 권역·연령대·경력 필터 파라미터를 추가한다.

---

## 추가할 기능

### 1. 기존 분석 엔드포인트에 필터 파라미터 추가

기존: `GET /api/analysis?survey_code=S01`  
변경: `GET /api/analysis?survey_code=S01&region=북부&age_group=30대&career=1~3년`

- 파라미터 없으면 전체 집계 (기존 동작 유지)
- 파라미터 있으면 해당 조건으로 필터링 후 집계

### 2. 권역별 비교 엔드포인트 신규 추가

`GET /api/analysis/by-region?survey_code=S01&question_no=1`

응답 형식:
```json
{
  "question_no": 1,
  "survey_code": "S01",
  "by_region": {
    "북부": { "count": 12, "avg": 3.8, "distribution": {...} },
    "서부": { "count": 18, "avg": 4.1, "distribution": {...} },
    "중부": { "count": 23, "avg": 3.9, "distribution": {...} },
    "동부": { "count": 20, "avg": 4.2, "distribution": {...} }
  }
}
```

### 3. 연령대별·경력별 비교 엔드포인트 신규 추가

`GET /api/analysis/by-group?survey_code=S01&question_no=1&group_by=age_group`  
`GET /api/analysis/by-group?survey_code=S01&question_no=1&group_by=career`

응답 형식 (age_group 예시):
```json
{
  "question_no": 1,
  "group_by": "age_group",
  "by_group": {
    "20대": { "count": 8, "avg": 3.5 },
    "30대": { "count": 22, "avg": 3.9 },
    "40대": { "count": 28, "avg": 4.1 },
    "50대": { "count": 15, "avg": 4.0 },
    "60대이상": { "count": 3, "avg": 3.7 }
  }
}
```

---

## 실행 절차

### 1단계: 기존 분석 라우트 파악

```bash
cat backend/routes/analysis.js
```

현재 집계 쿼리 구조 파악 (GROUP BY, WHERE 조건 등)

### 2단계: 필터 파라미터 추가 (기존 엔드포인트)

```javascript
// 기존 GET /api/analysis 라우트에 추가
router.get('/', (req, res) => {
  const { survey_code, region, age_group, career } = req.query;

  // 필터 조건 동적 생성
  const filters = [];
  const params = [survey_code];

  if (region)    { filters.push('r.region = ?');    params.push(region); }
  if (age_group) { filters.push('r.age_group = ?'); params.push(age_group); }
  if (career)    { filters.push('r.career = ?');    params.push(career); }

  const whereClause = filters.length
    ? 'AND ' + filters.join(' AND ')
    : '';

  // 기존 쿼리에 whereClause 삽입
  const query = `
    SELECT ...
    FROM responses r
    WHERE r.survey_code = ?
    ${whereClause}
    ...
  `;
  // ...
});
```

### 3단계: 권역별 비교 엔드포인트 추가

```javascript
router.get('/by-region', (req, res) => {
  const { survey_code, question_no } = req.query;

  const rows = db.prepare(`
    SELECT
      r.region,
      COUNT(*) as count,
      AVG(CAST(a.answer AS REAL)) as avg,
      a.answer,
      COUNT(a.answer) as answer_count
    FROM responses r
    JOIN answers a ON a.response_id = r.id
    WHERE r.survey_code = ?
      AND a.question_no = ?
      AND r.region IS NOT NULL
      AND a.answer GLOB '[1-5]'
    GROUP BY r.region, a.answer
    ORDER BY r.region, a.answer
  `).all(survey_code, question_no);

  // 결과를 by_region 구조로 변환 후 응답
  const result = groupByRegion(rows);
  res.json({ question_no, survey_code, by_region: result });
});
```

### 4단계: 연령대·경력별 비교 엔드포인트 추가

```javascript
router.get('/by-group', (req, res) => {
  const { survey_code, question_no, group_by } = req.query;

  // group_by는 'age_group' 또는 'career'만 허용
  const ALLOWED_GROUPS = ['age_group', 'career'];
  if (!ALLOWED_GROUPS.includes(group_by)) {
    return res.status(400).json({ error: 'group_by must be age_group or career' });
  }

  const rows = db.prepare(`
    SELECT
      r.${group_by} as group_key,
      COUNT(*) as count,
      AVG(CAST(a.answer AS REAL)) as avg
    FROM responses r
    JOIN answers a ON a.response_id = r.id
    WHERE r.survey_code = ?
      AND a.question_no = ?
      AND r.${group_by} IS NOT NULL
      AND a.answer GLOB '[1-5]'
    GROUP BY r.${group_by}
    ORDER BY r.${group_by}
  `).all(survey_code, question_no);

  const byGroup = {};
  rows.forEach(row => {
    byGroup[row.group_key] = { count: row.count, avg: Math.round(row.avg * 100) / 100 };
  });

  res.json({ question_no, group_by, by_group: byGroup });
});
```

### 5단계: 테스트

```bash
# 전체 집계 (기존 동작 유지 확인)
curl "http://localhost:3001/api/analysis?survey_code=S01"

# 권역 필터
curl "http://localhost:3001/api/analysis?survey_code=S01&region=북부"

# 권역별 비교
curl "http://localhost:3001/api/analysis/by-region?survey_code=S01&question_no=1"

# 경력별 비교
curl "http://localhost:3001/api/analysis/by-group?survey_code=S01&question_no=1&group_by=career"
```

---

## 주의사항

- 기존 분석 엔드포인트 동작은 반드시 유지 (파라미터 없을 때 전체 집계)
- `group_by` 파라미터 SQL injection 방지: ALLOWED_GROUPS 화이트리스트 필수
- region·age_group·career가 NULL인 응답은 전체 집계에는 포함, 그룹별 비교에서는 제외
- 복수선택(answer_type='multi') 문항은 평균 계산 대상 아님 — 기존 answer_type 분기 로직 유지

---

## 완료 조건

- 기존 `GET /api/analysis` 동작 유지 확인
- region 필터 적용 시 해당 권역 응답만 집계됨 확인
- `/by-region` 엔드포인트 4개 권역 모두 응답 확인
- `/by-group?group_by=age_group` 및 `group_by=career` 응답 확인
- SQL injection 방지 확인 (group_by=region 등 비허용값 → 400 에러)

---

## 완료 후 보고 형식

```
[지시문 04 완료]
- 기존 분석 API 필터 파라미터 추가 ✅
- GET /api/analysis/by-region 엔드포인트 추가 ✅
- GET /api/analysis/by-group 엔드포인트 추가 ✅
- 전체 집계 기존 동작 유지 확인 ✅
- SQL injection 방지 확인 ✅
- 테스트 전체 통과 ✅
```
