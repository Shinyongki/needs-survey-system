# 설문시스템 지시문 06 — 기관명·회차·권역 재구조화 (v2)

> **대상:** Claude Code (설문시스템 구현 세션)
> **작성일:** 2026-04-22 (v1 작성)
> **수정일:** 2026-04-22 (v2 — 세션 E 결과물 반영)
> **작성자:** Claude 프로젝트 (기획·분석·설계 세션)
> **프로젝트 경로:** `C:\Projects\설문시스템`
> **선행 지시문:** 지시문 05 (CSV Q번호 헤더 기반 전환) — 병행 또는 선행 완료

---

## 🔄 v2 주요 변경 (v1 대비)

1. **institutions 테이블 PK 방식 변경**
   - v1: `id (INTEGER PK) + institution_code (UNIQUE)`
   - v2: `institution_code (VARCHAR PK)` — 공식 기관 코드 직접 사용
2. **척도 방향 명시 추가**
   - 구글폼에서 `1=매우 그렇지 않다/매우 불만족, 5=매우 그렇다/매우 만족`로 저장됨
   - 설문지 표기(① 매우 만족~⑤ 매우 불만족)와 반대이므로 분석 시 1=부정, 5=긍정으로 통일
3. **CSV 파싱 시 header_mapping 시트 참조 로직 추가**
   - Apps Script가 각 응답 스프레드시트에 `header_mapping` 시트를 생성
   - CSV 헤더의 원래 문항 타이틀을 내부 코드로 변환 시 이 시트 참조

---

## 📌 개요

설문 체계 전면 개편에 따라 시스템 데이터 구조를 재구조화한다.

### 주요 변경

1. **institutions 마스터 테이블 신규 생성** (59개 기관, `institution_code` PK)
2. **responses 테이블에 institution_code·round_label 컬럼 추가**
3. **responses.region 컬럼 제거** → institutions JOIN 기반 자동 도출
4. **CSV 파싱 로직에 header_mapping 참조·기관 코드·회차 매핑 추가**
5. **분석 API에 기관별·회차별 필터 추가**
6. **신규 API**: institutions·rounds·응답률 관리
7. **프론트엔드 신규 화면**: 응답률 대시보드·기관별 분석 대시보드
8. **척도 방향 처리**: 1=부정, 5=긍정으로 통일 (구글폼 저장 규칙과 일치)

### 배경 및 목적

**배경**: 기존 설문에는 기관명을 수집하지 않아 응답률 관리·미응답 기관 독려가 불가능했고, 기관별 특성 분석도 할 수 없었다.

**목적**:
- 59개 수행기관 전체의 응답 현황 추적
- 기관별 차이 분석으로 맞춤형 지원 근거 확보 (광역 내부용)
- 권역 재편 시 과거 응답도 최신 기준으로 자동 재집계 가능한 구조

### 선행 조건

- 지시문 05(CSV Q번호 헤더 기반 전환) 완료 또는 동시 진행
- responses 테이블에 age_group·career 컬럼 이미 존재 (1·2단계 완료 상태)
- 구글폼 v2 Apps Script 배포 완료 (세션 E 결과물) — `header_mapping` 시트 생성 전제

---

## 🗄 1. institutions 마스터 테이블 생성

### 1-1. 테이블 스키마 (v2: institution_code PK)

```sql
CREATE TABLE IF NOT EXISTS institutions (
  institution_code TEXT PRIMARY KEY,
  institution_name TEXT NOT NULL,
  sigungu TEXT NOT NULL,
  region TEXT NOT NULL CHECK(region IN ('북부', '서부', '중부', '동부')),
  display_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_institutions_region ON institutions(region);
CREATE INDEX idx_institutions_sigungu ON institutions(sigungu);
CREATE INDEX idx_institutions_active ON institutions(active);
CREATE INDEX idx_institutions_sort_order ON institutions(sort_order);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER IF NOT EXISTS trg_institutions_updated_at
AFTER UPDATE ON institutions
FOR EACH ROW
BEGIN
  UPDATE institutions SET updated_at = datetime('now', 'localtime')
  WHERE institution_code = OLD.institution_code;
END;
```

### 1-2. 컬럼 설명

| 컬럼 | 설명 | 예시 |
|------|------|------|
| **institution_code** (PK) | 보건복지부 수행기관 코드 | A48310001 |
| institution_name | 기관명 | 거제노인통합지원센터 |
| sigungu | 시군구 | 거제시 |
| region | 권역 | 동부 |
| display_label | 드롭다운 표시용 라벨 (구글폼 선택값과 일치) | [거제시] 거제노인통합지원센터 |
| sort_order | 드롭다운 정렬 순서 | 1 ~ 59 |
| active | 활성 여부 (0=비활성, 1=활성) | 1 |

**PK 설계 의도**:
- `institution_code`는 보건복지부가 부여한 공식 식별자로 영구 고정값
- 외부 시스템(모인우리 등)과 연동 시 직접 매칭 가능
- 자연키(Natural Key) 사용으로 비즈니스 의미 유지

**권역 재편 시 주의**:
- 권역만 변경 시 `UPDATE institutions SET region = ? WHERE institution_code = ?` → 과거 응답의 권역 분석도 자동 반영 (JOIN 기반)
- 기관 폐쇄 시 `UPDATE institutions SET active = 0 WHERE institution_code = ?` (DELETE 금지, 과거 응답 보존)

### 1-3. 초기 데이터 삽입 (59개)

```sql
INSERT INTO institutions (institution_code, institution_name, sigungu, region, display_label, sort_order, active) VALUES
('A48310001', '거제노인통합지원센터', '거제시', '동부', '[거제시] 거제노인통합지원센터', 1, 1),
('A48310002', '거제사랑노인복지센터', '거제시', '동부', '[거제시] 거제사랑노인복지센터', 2, 1),
('A48310004', '은빛노인통합지원센터', '거제시', '동부', '[거제시] 은빛노인통합지원센터', 3, 1),
('A48310003', '하청교회 행복늘푸른대학', '거제시', '동부', '[거제시] 하청교회 행복늘푸른대학', 4, 1),
('A48880002', '거창노인통합지원센터', '거창군', '북부', '[거창군] 거창노인통합지원센터', 5, 1),
('A48880003', '거창인애노인통합지원센터', '거창군', '북부', '[거창군] 거창인애노인통합지원센터', 6, 1),
('A48880004', '해월노인복지센터', '거창군', '북부', '[거창군] 해월노인복지센터', 7, 1),
('A48820003', '대한노인회 고성군지회(노인맞춤돌봄서비스)', '고성군', '서부', '[고성군] 대한노인회 고성군지회(노인맞춤돌봄서비스)', 8, 1),
('A48820005', '사회적협동조합 노인세상', '고성군', '서부', '[고성군] 사회적협동조합 노인세상', 9, 1),
('A48250007', '김해돌봄지원센터', '김해시', '동부', '[김해시] 김해돌봄지원센터', 10, 1),
('A48250004', '김해시종합사회복지관', '김해시', '동부', '[김해시] 김해시종합사회복지관', 11, 1),
('A48250006', '보현행원노인통합지원센터', '김해시', '동부', '[김해시] 보현행원노인통합지원센터', 12, 1),
('A48250005', '생명의전화노인통합지원센터', '김해시', '동부', '[김해시] 생명의전화노인통합지원센터', 13, 1),
('A48250001', '효능원노인통합지원센터', '김해시', '동부', '[김해시] 효능원노인통합지원센터', 14, 1),
('A48840001', '화방남해노인통합지원센터', '남해군', '서부', '[남해군] 화방남해노인통합지원센터', 15, 1),
('A48840002', '화방재가복지센터', '남해군', '서부', '[남해군] 화방재가복지센터', 16, 1),
('A48270002', '밀양노인통합지원센터', '밀양시', '동부', '[밀양시] 밀양노인통합지원센터', 17, 1),
('A48270001', '밀양시자원봉사단체협의회', '밀양시', '동부', '[밀양시] 밀양시자원봉사단체협의회', 18, 1),
('A48270003', '우리들노인통합지원센터', '밀양시', '동부', '[밀양시] 우리들노인통합지원센터', 19, 1),
('A48240003', '남양양로원', '사천시', '서부', '[사천시] 남양양로원', 20, 1),
('A48240001', '사랑원노인지원센터', '사천시', '서부', '[사천시] 사랑원노인지원센터', 21, 1),
('A48240004', '사천건양주야간보호센터', '사천시', '서부', '[사천시] 사천건양주야간보호센터', 22, 1),
('A48240002', '사천노인통합지원센터', '사천시', '서부', '[사천시] 사천노인통합지원센터', 23, 1),
('A48860002', '산청복음노인통합지원센터', '산청군', '북부', '[산청군] 산청복음노인통합지원센터', 24, 1),
('A48860004', '산청성모노인통합지원센터', '산청군', '북부', '[산청군] 산청성모노인통합지원센터', 25, 1),
('A48860001', '산청한일노인통합지원센터', '산청군', '북부', '[산청군] 산청한일노인통합지원센터', 26, 1),
('A48860003', '산청해민노인통합지원센터', '산청군', '북부', '[산청군] 산청해민노인통합지원센터', 27, 1),
('A48330001', '사회복지법인신생원양산재가노인복지센터', '양산시', '동부', '[양산시] 사회복지법인신생원양산재가노인복지센터', 28, 1),
('A48330005', '성요셉소규모노인종합센터', '양산시', '동부', '[양산시] 성요셉소규모노인종합센터', 29, 1),
('A48330004', '양산행복한돌봄 사회적협동조합', '양산시', '동부', '[양산시] 양산행복한돌봄 사회적협동조합', 30, 1),
('A48720001', '의령노인통합지원센터', '의령군', '중부', '[의령군] 의령노인통합지원센터', 31, 1),
('A48170004', '공덕의집노인통합지원센터', '진주시', '서부', '[진주시] 공덕의집노인통합지원센터', 32, 1),
('A48170003', '나누리노인통합지원센터', '진주시', '서부', '[진주시] 나누리노인통합지원센터', 33, 1),
('A48170001', '진양노인통합지원센터', '진주시', '서부', '[진주시] 진양노인통합지원센터', 34, 1),
('A48170002', '진주노인통합지원센터', '진주시', '서부', '[진주시] 진주노인통합지원센터', 35, 1),
('A48170005', '하늘마음노인통합지원센터', '진주시', '서부', '[진주시] 하늘마음노인통합지원센터', 36, 1),
('A48740002', '창녕군새누리노인종합센터', '창녕군', '중부', '[창녕군] 창녕군새누리노인종합센터', 37, 1),
('A48740001', '창녕지역자활센터', '창녕군', '중부', '[창녕군] 창녕지역자활센터', 38, 1),
('A48120014', '경남고용복지센터', '창원시', '중부', '[창원시] 경남고용복지센터', 39, 1),
('A48120008', '경남노인통합지원센터', '창원시', '중부', '[창원시] 경남노인통합지원센터', 40, 1),
('A48120001', '동진노인통합지원센터', '창원시', '중부', '[창원시] 동진노인통합지원센터', 41, 1),
('A48120015', '마산회원노인종합복지관', '창원시', '중부', '[창원시] 마산회원노인종합복지관', 42, 1),
('A48120004', '명진노인통합지원센터', '창원시', '중부', '[창원시] 명진노인통합지원센터', 43, 1),
('A48120011', '정현사회적협동조합', '창원시', '중부', '[창원시] 정현사회적협동조합', 44, 1),
('A48120013', '진해노인종합복지관', '창원시', '중부', '[창원시] 진해노인종합복지관', 45, 1),
('A48120012', '진해서부노인종합복지관', '창원시', '중부', '[창원시] 진해서부노인종합복지관', 46, 1),
('A48120002', '창원도우누리노인통합재가센터', '창원시', '중부', '[창원시] 창원도우누리노인통합재가센터', 47, 1),
('A48120005', '플러스희망 사회적협동조합', '창원시', '중부', '[창원시] 플러스희망 사회적협동조합', 48, 1),
('A48220003', '통영노인통합지원센터', '통영시', '동부', '[통영시] 통영노인통합지원센터', 49, 1),
('A48220002', '통영시종합사회복지관', '통영시', '동부', '[통영시] 통영시종합사회복지관', 50, 1),
('A48850002', '경남하동지역자활센터', '하동군', '서부', '[하동군] 경남하동지역자활센터', 51, 1),
('A48850001', '하동노인통합지원센터', '하동군', '서부', '[하동군] 하동노인통합지원센터', 52, 1),
('A48730001', '(사)대한노인회함안군지회', '함안군', '중부', '[함안군] (사)대한노인회함안군지회', 53, 1),
('A48730002', '함안군재가노인통합지원센터', '함안군', '중부', '[함안군] 함안군재가노인통합지원센터', 54, 1),
('A48870002', '사단법인 대한노인회 함양군지회', '함양군', '북부', '[함양군] 사단법인 대한노인회 함양군지회', 55, 1),
('A48890003', '미타재가복지센터', '합천군', '북부', '[합천군] 미타재가복지센터', 56, 1),
('A48890006', '사회적협동조합 합천종합복지공동체', '합천군', '북부', '[합천군] 사회적협동조합 합천종합복지공동체', 57, 1),
('A48890005', '코끼리행복복지센터', '합천군', '북부', '[합천군] 코끼리행복복지센터', 58, 1),
('A48890004', '합천노인통합지원센터', '합천군', '북부', '[합천군] 합천노인통합지원센터', 59, 1);
```

**삽입 결과 검증**:
```sql
SELECT COUNT(*) FROM institutions;  -- 59
SELECT region, COUNT(*) FROM institutions GROUP BY region;
-- 북부: 12, 서부: 15, 중부: 15, 동부: 17
SELECT sigungu, COUNT(*) FROM institutions GROUP BY sigungu;  -- 18개 시군구
```

---

## 🔄 2. responses 테이블 스키마 변경

### 2-1. 신규 컬럼 추가

```sql
-- 1. institution_code 컬럼 추가 (FK)
ALTER TABLE responses ADD COLUMN institution_code TEXT
  REFERENCES institutions(institution_code);

-- 2. round_label 컬럼 추가 (J16·J17·S01·S02는 NULL 허용)
ALTER TABLE responses ADD COLUMN round_label TEXT;

-- 3. 인덱스 생성
CREATE INDEX idx_responses_institution_code ON responses(institution_code);
CREATE INDEX idx_responses_round_label ON responses(round_label);
CREATE INDEX idx_responses_survey_institution ON responses(survey_type, institution_code);
```

### 2-2. 기존 region 컬럼 제거

**SQLite 3.35 이상**:
```sql
ALTER TABLE responses DROP COLUMN region;
```

**SQLite 3.35 미만** (테이블 재생성):
```sql
BEGIN TRANSACTION;

CREATE TABLE responses_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_type TEXT NOT NULL,
  institution_code TEXT REFERENCES institutions(institution_code),
  round_label TEXT,
  age_group TEXT,
  career TEXT,
  -- region 컬럼 제거됨
  answers TEXT,  -- JSON
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

INSERT INTO responses_new (id, survey_type, institution_code, round_label, age_group, career, answers, created_at)
SELECT id, survey_type, institution_code, round_label, age_group, career, answers, created_at
FROM responses;

DROP TABLE responses;
ALTER TABLE responses_new RENAME TO responses;

-- 인덱스 재생성
CREATE INDEX idx_responses_survey_type ON responses(survey_type);
CREATE INDEX idx_responses_institution_code ON responses(institution_code);
CREATE INDEX idx_responses_round_label ON responses(round_label);
CREATE INDEX idx_responses_survey_institution ON responses(survey_type, institution_code);

COMMIT;
```

**권고**: `better-sqlite3`는 SQLite 3.35 이상 지원하므로 첫 번째 방식 시도. 실패 시 두 번째 방식으로 폴백.

### 2-3. 권역 분석 방식 전환

**기존 쿼리**:
```sql
SELECT region, AVG(score) FROM responses WHERE survey_type = 'J03' GROUP BY region;
```

**변경 후**:
```sql
SELECT i.region, AVG(score)
FROM responses r
JOIN institutions i ON r.institution_code = i.institution_code
WHERE r.survey_type = 'J03'
GROUP BY i.region;
```

---

## 📏 3. 척도 방향 처리 규칙 (v2 신규)

### 3-1. 구글폼 저장 방향 vs 설문지 표기

**설문지 표기**: ① 매우 만족  ② 만족  ③ 보통  ④ 불만족  ⑤ 매우 불만족

**구글폼 저장**: 
| CSV 저장값 | 의미 |
|-----------|------|
| 1 | 매우 그렇지 않다 / 매우 불만족 (**부정**) |
| 2 | 그렇지 않다 / 불만족 |
| 3 | 보통 |
| 4 | 그렇다 / 만족 |
| 5 | 매우 그렇다 / 매우 만족 (**긍정**) |

**이유**: 구글폼 `setScaleItem`은 min이 반드시 낮은 숫자여야 하므로, 설문지와 반대 방향으로 저장됨.

### 3-2. 분석 시 처리 규칙

**모든 척도 문항 분석은 다음 원칙 고정**:

- **긍정 비율** = (4+5 응답 수) / 전체 응답 수 × 100
- **부정 비율** = (1+2 응답 수) / 전체 응답 수 × 100
- **평균** = 1~5 가중 평균 (그대로 사용, 높을수록 긍정)
- **CSI (만족도 지수)** = 평균 그대로 사용 (높을수록 좋음)

### 3-3. 분석 API 응답 필드 주의

```json
{
  "scale_analysis": {
    "common-4": {
      "mean": 4.12,
      "positive_rate": 78.3,
      "negative_rate": 5.2,
      "direction": "1=negative, 5=positive"
    }
  }
}
```

**모든 척도 응답에 `direction` 필드 명시** → 프론트엔드·외부 연동 혼란 방지.

---

## 📥 4. CSV 파싱 로직 (v2: header_mapping 반영)

### 4-1. CSV 파싱 전체 흐름

```
CSV 업로드
  ↓
① 응답 스프레드시트의 `header_mapping` 시트 조회
  ↓
② CSV 헤더(문항 타이틀) → 내부 코드 변환 테이블 구성
  ↓
③ 각 행 파싱
  - 도입-0: 기관 display_label → institution_code 조회
  - 도입-0-a: 회차 라벨 그대로 저장 (J16·J17·S01·S02는 null)
  - 도입-1·2: 연령대·경력 그대로
  - 나머지 문항: 내부 코드를 키로 answers JSON 저장
  ↓
④ responses 테이블 INSERT
```

### 4-2. header_mapping 시트 참조

Apps Script가 각 응답 스프레드시트의 2번째 탭에 생성하는 `header_mapping` 시트 구조:

| 구글폼 문항 타이틀 | 내부 코드 |
|-------------------|----------|
| 귀하의 소속 기관은? | 도입-0 |
| 이번 참여하신 회차/일정은? | 도입-0-a |
| 귀하의 연령대는? | 도입-1 |
| 귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? | 도입-2 |
| [공통-1] ... | 공통-1 |
| [공통-2] ... | 공통-2 |
| ... | ... |

**참조 방법**:
- Google Sheets API로 `header_mapping` 시트를 읽거나
- CSV 내보낼 때 함께 다운받은 매핑 정보를 JSON/별도 CSV로 업로드

### 4-3. 기관명 → institution_code 매핑 함수

파일 위치: `backend/src/services/csvParser.js`

```javascript
const Database = require('better-sqlite3');
const db = new Database('./data/survey.db');

/**
 * 드롭다운 라벨에서 institution_code 조회
 * @param {string} displayLabel - "[거제시] 거제노인통합지원센터" 형식
 * @returns {string|null} institution_code 또는 null (매칭 실패 시)
 */
function resolveInstitutionCode(displayLabel) {
  if (!displayLabel || typeof displayLabel !== 'string') {
    return null;
  }

  // 정확 매칭 우선
  const exact = db.prepare(
    'SELECT institution_code FROM institutions WHERE display_label = ? AND active = 1'
  ).get(displayLabel.trim());
  if (exact) return exact.institution_code;

  // 공백·괄호 등 미세한 차이 대응
  const normalized = displayLabel.trim().replace(/\s+/g, ' ');
  const loose = db.prepare(
    'SELECT institution_code FROM institutions WHERE display_label = ? AND active = 1'
  ).get(normalized);
  if (loose) return loose.institution_code;

  // 실패 로그
  console.warn(`[CSV 파싱] 기관명 매칭 실패: "${displayLabel}"`);
  return null;
}

/**
 * header_mapping 기반 CSV 헤더 변환
 * @param {Object[]} mappingRows - header_mapping 시트 데이터
 * @returns {Object} 타이틀 → 내부코드 매핑 객체
 */
function buildHeaderMap(mappingRows) {
  const map = {};
  for (const row of mappingRows) {
    const title = row['구글폼 문항 타이틀'];
    const code = row['내부 코드'];
    if (title && code) map[title] = code;
  }
  return map;
}

/**
 * CSV 행 파싱 (S01·S02·J01~J17 공통)
 */
function parseCsvRow(row, surveyType, headerMap) {
  // 헤더 매핑 역참조 (내부코드 → 실제 CSV 컬럼명)
  const inverseMap = {};
  for (const [title, code] of Object.entries(headerMap)) {
    inverseMap[code] = title;
  }

  // 도입부 필수 정보 추출
  const institutionLabel = row[inverseMap['도입-0']] || row[inverseMap['기본-00']];
  const roundLabel = row[inverseMap['도입-0-a']] || null;
  const ageGroup = row[inverseMap['도입-1']] || row[inverseMap['기본-0']];
  const career = row[inverseMap['도입-2']] || row[inverseMap['기본-1']];

  // 회차 문항 없는 사업 검증
  const noRoundSurveys = ['J16', 'J17', 'S01', 'S02'];
  if (!noRoundSurveys.includes(surveyType) && !roundLabel) {
    console.warn(`[CSV 파싱] ${surveyType}: 회차 값 없음 (응답 ID=${row['타임스탬프']})`);
  }

  // 나머지 답변을 answers JSON으로 구성
  const answers = {};
  for (const [title, code] of Object.entries(headerMap)) {
    if (['도입-0', '도입-0-a', '도입-1', '도입-2',
         '기본-00', '기본-0', '기본-1'].includes(code)) continue;
    if (row[title] !== undefined) answers[code] = row[title];
  }

  return {
    survey_type: surveyType,
    institution_code: resolveInstitutionCode(institutionLabel),
    round_label: roundLabel,
    age_group: ageGroup,
    career: career,
    answers: JSON.stringify(answers),
    created_at: row['타임스탬프'] || new Date().toISOString()
  };
}

/**
 * CSV 업로드 전체 처리
 */
function uploadCsv(csvFilePath, surveyType, mappingFilePath) {
  // 1. header_mapping 로드
  const mappingRows = parseCsvFile(mappingFilePath);
  const headerMap = buildHeaderMap(mappingRows);

  // 2. 응답 CSV 로드
  const rows = parseCsvFile(csvFilePath);
  const stats = {
    total: rows.length,
    success: 0,
    institution_match_failed: 0,
    round_missing: 0,
    errors: []
  };

  const insertStmt = db.prepare(`
    INSERT INTO responses
      (survey_type, institution_code, round_label, age_group, career, answers, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTx = db.transaction((rows) => {
    for (const row of rows) {
      try {
        const parsed = parseCsvRow(row, surveyType, headerMap);

        if (parsed.institution_code === null) {
          stats.institution_match_failed++;
          stats.errors.push({
            row: row['타임스탬프'],
            reason: 'institution_mismatch',
            value: row[Object.keys(headerMap).find(k => headerMap[k] === '도입-0')]
          });
        }

        const noRoundSurveys = ['J16', 'J17', 'S01', 'S02'];
        if (!noRoundSurveys.includes(surveyType) && !parsed.round_label) {
          stats.round_missing++;
        }

        insertStmt.run(
          parsed.survey_type,
          parsed.institution_code,
          parsed.round_label,
          parsed.age_group,
          parsed.career,
          parsed.answers,
          parsed.created_at
        );
        stats.success++;
      } catch (e) {
        stats.errors.push({ row: row['타임스탬프'], reason: 'parse_error', detail: e.message });
      }
    }
  });

  insertTx(rows);
  return stats;
}
```

### 4-4. CSV 업로드 검증 규칙

**경고 조건**:
- 기관명 매칭 실패 시 (institution_code = null)
- 회차 문항 필요 사업인데 round_label이 null인 경우
- 기관별 응답자 수가 해당 기관 전담사회복지사 수를 초과 시 (향후 직원 마스터 테이블 추가 시)
- header_mapping에 없는 CSV 컬럼 발견 시

**업로드 결과 UI 표시 (프론트엔드)**:
```
✓ 성공: 54건
⚠ 기관명 매칭 실패: 2건 → [상세 보기] → [수동 매핑]
⚠ 회차 누락: 1건 → [상세 보기]
✗ 파싱 오류: 0건
```

---

## 🔌 5. 분석 API 확장

### 5-1. 기존 엔드포인트 확장

`GET /api/analysis/:surveyType`

**신규 쿼리 파라미터**:

| 파라미터 | 타입 | 설명 | 예시 |
|----------|------|------|------|
| region | string | 권역 필터 | `?region=북부` |
| age_group | string | 연령대 필터 | `?age_group=30대` |
| career | string | 경력 필터 | `?career=3~5년` |
| **institution_code** | string[] | 기관 코드 필터 (다중 쉼표 구분) | `?institution_code=A48310001,A48880002` |
| **round_label** | string | 회차 필터 | `?round_label=1차 (2026-05-15)` |
| **sigungu** | string | 시군구 필터 | `?sigungu=창원시` |

**응답 JSON 구조**:

```json
{
  "survey_type": "J03",
  "filters_applied": {
    "region": "북부",
    "institution_code": ["A48880002"],
    "round_label": "1차 (2026-05-15)"
  },
  "total_responses": 45,
  "statistics": {
    "overall_avg": 4.12,
    "by_question": {
      "common-4": {
        "mean": 4.12,
        "positive_rate": 78.3,
        "negative_rate": 5.2,
        "direction": "1=negative, 5=positive"
      }
    }
  },
  "institution_breakdown": [
    {
      "institution_code": "A48880002",
      "institution_name": "거창노인통합지원센터",
      "sigungu": "거창군",
      "region": "북부",
      "count": 3,
      "avg": 4.33
    }
  ],
  "round_breakdown": [
    {
      "round_label": "1차 (2026-05-15)",
      "count": 45,
      "avg": 4.12
    }
  ]
}
```

### 5-2. 구현 예시

```javascript
router.get('/analysis/:surveyType', (req, res) => {
  const { surveyType } = req.params;
  const {
    region, age_group, career,
    institution_code, round_label, sigungu
  } = req.query;

  const conditions = ['r.survey_type = ?'];
  const params = [surveyType];

  if (region) { conditions.push('i.region = ?'); params.push(region); }
  if (age_group) { conditions.push('r.age_group = ?'); params.push(age_group); }
  if (career) { conditions.push('r.career = ?'); params.push(career); }
  if (institution_code) {
    const codes = institution_code.split(',');
    conditions.push(`r.institution_code IN (${codes.map(() => '?').join(',')})`);
    params.push(...codes);
  }
  if (round_label) { conditions.push('r.round_label = ?'); params.push(round_label); }
  if (sigungu) { conditions.push('i.sigungu = ?'); params.push(sigungu); }

  const sql = `
    SELECT r.*, i.institution_name, i.sigungu, i.region
    FROM responses r
    LEFT JOIN institutions i ON r.institution_code = i.institution_code
    WHERE ${conditions.join(' AND ')}
  `;

  const rows = db.prepare(sql).all(...params);
  const result = computeStatistics(rows, surveyType);

  res.json({
    survey_type: surveyType,
    filters_applied: { region, age_group, career, institution_code, round_label, sigungu },
    total_responses: rows.length,
    ...result
  });
});
```

---

## 🆕 6. 신규 API — 기관 마스터 관리

### 6-1. 기관 목록·상세 조회

```javascript
// 전체 활성 기관 목록 (드롭다운용)
router.get('/institutions', (req, res) => {
  const { active } = req.query;
  const where = active === 'all' ? '' : 'WHERE active = 1';
  const rows = db.prepare(`
    SELECT * FROM institutions ${where} ORDER BY sort_order ASC
  `).all();
  res.json(rows);
});

// 특정 기관 상세 (institution_code 기반)
router.get('/institutions/:code', (req, res) => {
  const inst = db.prepare('SELECT * FROM institutions WHERE institution_code = ?').get(req.params.code);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  res.json(inst);
});

// 권역별 기관 목록
router.get('/institutions/by-region/:region', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM institutions WHERE region = ? AND active = 1 ORDER BY sort_order ASC
  `).all(req.params.region);
  res.json(rows);
});
```

### 6-2. 기관 정보 수정 (권역 재편 등)

```javascript
// 권역 재배치
router.post('/institutions/:code/reassign-region', (req, res) => {
  const { new_region } = req.body;
  const valid = ['북부', '서부', '중부', '동부'];
  if (!valid.includes(new_region)) {
    return res.status(400).json({ error: 'Invalid region' });
  }

  db.prepare('UPDATE institutions SET region = ? WHERE institution_code = ?')
    .run(new_region, req.params.code);
  res.json({ success: true, note: '과거 응답의 권역 분석도 자동 반영됨' });
});

// 기관 비활성화 (폐쇄)
router.post('/institutions/:code/deactivate', (req, res) => {
  db.prepare('UPDATE institutions SET active = 0 WHERE institution_code = ?')
    .run(req.params.code);
  res.json({ success: true, note: '응답 데이터는 보존됨' });
});
```

### 6-3. 응답률 조회 API

```javascript
router.get('/institutions/response-rate/:surveyType', (req, res) => {
  const { surveyType } = req.params;

  const sql = `
    SELECT
      i.institution_code,
      i.institution_name,
      i.sigungu,
      i.region,
      COUNT(r.id) AS response_count
    FROM institutions i
    LEFT JOIN responses r ON r.institution_code = i.institution_code AND r.survey_type = ?
    WHERE i.active = 1
    GROUP BY i.institution_code
    ORDER BY i.sort_order
  `;

  const rows = db.prepare(sql).all(surveyType);

  const expected_per_institution = 1;  // 향후 직원 마스터 연동

  const result = rows.map(r => ({
    ...r,
    expected: expected_per_institution,
    response_rate: (r.response_count / expected_per_institution) * 100
  }));

  res.json(result);
});
```

---

## 🎛 7. 신규 API — 회차 관리

회차는 별도 마스터 테이블 없이 `responses.round_label`에서 DISTINCT 조회.

```javascript
// 설문별 회차 목록
router.get('/rounds/:surveyType', (req, res) => {
  const sql = `
    SELECT DISTINCT round_label
    FROM responses
    WHERE survey_type = ? AND round_label IS NOT NULL
    ORDER BY round_label
  `;
  const rows = db.prepare(sql).all(req.params.surveyType);
  res.json(rows.map(r => r.round_label));
});

// 회차별 응답 수·통계
router.get('/rounds/:surveyType/stats', (req, res) => {
  const sql = `
    SELECT
      round_label,
      COUNT(*) AS response_count,
      COUNT(DISTINCT institution_code) AS institution_count
    FROM responses
    WHERE survey_type = ? AND round_label IS NOT NULL
    GROUP BY round_label
    ORDER BY round_label
  `;
  const rows = db.prepare(sql).all(req.params.surveyType);
  res.json(rows);
});
```

**참고**: 회차 선택지 관리(구글폼 드롭다운 추가)는 Apps Script가 담당. 시스템은 응답 데이터에서 회차를 집계만 한다.

---

## 🖼 8. 프론트엔드 신규 화면

### 8-1. 응답률 대시보드

**경로**: `/dashboard/response-rate`

**기능**:
- 17종 설문 × 59개 기관 매트릭스 테이블
- 응답률별 색상 코딩:
  - 100%: 녹색
  - 80~99%: 노랑
  - 80% 미만: 빨강
  - 0%: 회색 (해당 설문 미참여)
- 미응답 기관 리스트 CSV 내보내기 기능
- 권역·시군구별 응답률 요약 카드

**UI 와이어프레임**:
```
┌─ 응답률 대시보드 ─────────────────────────────────┐
│                                                  │
│  [권역 선택] [설문 선택] [새로고침]                │
│                                                  │
│  전체 응답률: 82%  |  미응답 기관: 11개             │
│                                                  │
│  권역별 응답률                                    │
│  북부 █████████░  85%                             │
│  서부 ██████████  92%                             │
│  중부 ███████░░░  75%                             │
│  동부 █████████░  85%                             │
│                                                  │
│  기관별 매트릭스 (시군구 가나다순)                  │
│            S01 S02 J01 J03 J04 ... J17           │
│  [거제시]                                          │
│   A48310001  ✓  ✓   ✓  ✓  -   ...  ✓             │
│   ...                                             │
│                                                  │
│  [미응답 기관 CSV 내보내기]                        │
└──────────────────────────────────────────────────┘
```

### 8-2. 기관별 분석 대시보드

**경로**: `/dashboard/institution-analysis`

**기능**:
- 기관 선택 드롭다운 (59개, 시군구 순, institution_code 기반)
- 선택 기관의 설문별 응답 현황
- 선택 기관 vs 전체 평균 비교 차트 (레이더 또는 막대)
- 선택 기관의 시계열 만족도 추이 (연도 간 비교)

**권한**: 광역 내부 사용자만 접근 가능 (추후 인증 도입 시 권한 구분)

### 8-3. CSV 업로드 UI 변경

기존 CSV 업로드 화면에 다음 추가:

**업로드 전**:
- 설문 유형 드롭다운 (S01·S02·J01~J17)
- 응답 CSV 파일 선택
- **header_mapping 정보 업로드** (CSV 또는 자동 조회)
- "미리보기" 버튼 → 파싱 결과 미리 표시

**미리보기 정보**:
- 총 행 수
- 기관별 응답 분포 (상위 5개)
- 회차별 응답 분포 (해당 시)
- 기관명 매칭 실패 경고 (있을 시)
- 회차 누락 경고 (있을 시)

**업로드 후 결과**:
```
✓ 성공: 54건
⚠ 기관명 매칭 실패: 2건 → [상세 보기] → [수동 매핑]
⚠ 회차 누락: 1건 → [상세 보기]
✗ 파싱 오류: 0건
```

---

## 🧪 9. 테스트 시나리오

### 9-1. DB 레벨 테스트

```sql
-- 1. institutions 테이블 59개 확인
SELECT COUNT(*) FROM institutions WHERE active = 1;  -- 59

-- 2. 권역별 개수 확인
SELECT region, COUNT(*) FROM institutions GROUP BY region;
-- 기대값: 북부 12, 서부 15, 중부 15, 동부 17

-- 3. 시군구별 개수 확인
SELECT sigungu, COUNT(*) FROM institutions GROUP BY sigungu;  -- 18개

-- 4. 샘플 응답 삽입 및 JOIN 테스트
INSERT INTO responses (survey_type, institution_code, round_label, age_group, career, answers)
VALUES ('J03', 'A48880002', '1차 (2026-05-15)', '30대', '3~5년', '{"common-4": 4}');

SELECT r.*, i.institution_name, i.region
FROM responses r
JOIN institutions i ON r.institution_code = i.institution_code;

-- 5. 권역 재편 시뮬레이션
UPDATE institutions SET region = '중부' WHERE institution_code = 'A48880002';
SELECT r.*, i.region FROM responses r JOIN institutions i ON r.institution_code = i.institution_code;
-- 과거 응답의 권역이 '중부'로 자동 반영
```

### 9-2. API 레벨 테스트

```
1. GET /api/institutions → 59개 반환
2. GET /api/institutions/by-region/북부 → 12개 반환
3. GET /api/analysis/J03?institution_code=A48880002,A48880003 → 해당 기관들 집계만
4. GET /api/analysis/J03?round_label=1차 (2026-05-15) → 해당 회차만
5. GET /api/institutions/response-rate/J03 → 59개 응답률 배열
6. POST /api/institutions/A48880002/reassign-region 
   Body: { "new_region": "중부" } → 성공 응답
```

### 9-3. CSV 업로드 테스트

**테스트 파일 1**: 정상 CSV + 정상 header_mapping
- 기대: 성공 54건, 실패 0건

**테스트 파일 2**: 기관명 미세 불일치 포함
- `[거제시] 거제 노인 통합지원센터` (공백 추가)
- 기대: normalize 함수로 매칭 성공

**테스트 파일 3**: 존재하지 않는 기관명
- `[거제시] 없는기관` 포함
- 기대: institution_code = null, 경고 로그

**테스트 파일 4**: J03에 회차 누락
- 도입-0-a 컬럼이 비어있는 행 존재
- 기대: 경고 표시, round_label = null 저장

**테스트 파일 5**: header_mapping 누락 컬럼
- CSV에 있지만 mapping에 없는 컬럼
- 기대: 경고 로그, 해당 컬럼 무시

### 9-4. 척도 방향 테스트

**시나리오**: 동의형 척도(1=매우 그렇지 않다 ~ 5=매우 그렇다) 응답 분석

- 응답 [5, 5, 4, 4, 3, 2, 1] 입력
- 기대: 평균 3.43, 긍정비율 57.1% (4·5 응답 4개/7개), 부정비율 28.6% (1·2 응답 2개/7개)
- direction 필드 "1=negative, 5=positive" 응답에 포함

### 9-5. 프론트엔드 테스트

- 응답률 대시보드: 59 × 17 매트릭스 정상 표시
- 기관별 분석: 기관 선택 → 해당 기관 데이터만 필터 표시
- CSV 업로드: header_mapping 참조 정상 작동

---

## 🚢 10. 마이그레이션 절차

### 10-1. 사전 준비

```bash
# 1. DB 백업
cp C:\Projects\설문시스템\data\survey.db C:\Projects\설문시스템\data\survey_backup_20260422.db

# 2. 기존 응답 CSV 내보내기 (안전용)
node scripts/export-all-responses.js
```

### 10-2. 실행 순서

1. **institutions 테이블 생성 및 데이터 삽입**
   ```bash
   sqlite3 data/survey.db < sql/01_create_institutions.sql
   sqlite3 data/survey.db < sql/02_insert_institutions.sql
   ```

2. **검증**
   ```sql
   SELECT COUNT(*) FROM institutions;  -- 59
   ```

3. **responses 테이블 스키마 변경**
   ```bash
   sqlite3 data/survey.db < sql/03_alter_responses.sql
   ```

4. **CSV 파싱 로직 배포**
   - `backend/src/services/csvParser.js` 업데이트 (header_mapping 기반)
   - 단위 테스트 실행

5. **API 확장 배포**
   - `backend/src/routes/analysis.js` 업데이트
   - 신규 라우트 추가: `institutions.js`, `rounds.js`
   - 척도 방향 `direction` 필드 응답에 포함
   - 통합 테스트 실행

6. **프론트엔드 배포**
   - 응답률 대시보드 신규 화면
   - 기관별 분석 대시보드 신규 화면
   - CSV 업로드 UI 개선 (header_mapping 업로드 지원)

7. **전체 통합 테스트**
   - 샘플 CSV + header_mapping 업로드
   - 분석 API 호출
   - 대시보드 확인

8. **responses.region 컬럼 제거** (선택, 검증 완료 후)

### 10-3. 롤백 계획

```bash
cp data/survey_backup_20260422.db data/survey.db
git checkout main
```

---

## ⚠️ 11. 주의사항

### 11-1. 데이터 무결성

- **institution_code NULL 허용**: CSV 파싱 실패 시 null로 저장 → 수동 매핑 UI로 복구 가능
- **기관 폐쇄 시 DELETE 금지**: `active = 0`으로만 처리
- **권역 변경 시 과거 응답 영향**: JOIN 기반 분석이므로 자동 반영. 관리자에게 명확히 안내 필요

### 11-2. 척도 방향 (중요)

- 모든 척도 응답은 **1=부정, 5=긍정**으로 저장됨
- 분석 API 응답에 `direction` 필드로 명시
- 프론트엔드 표시 시 "1점 (매우 불만족) ~ 5점 (매우 만족)" 형식 준수
- 차트 Y축 방향: 위로 갈수록 긍정 (높을수록 좋음)

### 11-3. 성능 고려

- institutions 테이블은 59행이라 성능 영향 미미
- 분석 API에 JOIN 추가로 쿼리 복잡도 상승 → 인덱스 활용 필수
- 응답률 대시보드 요청이 무거울 경우 캐싱 고려

### 11-4. 구글폼과의 동기화

- 구글폼 드롭다운 선택지와 `institutions.display_label`이 **정확히 일치**해야 함
- institutions 변경 시 Apps Script로 구글폼 드롭다운 업데이트 필요
- 동기화 스크립트 작성 시 Apps Script `UrlFetchApp.fetch('/api/institutions')` 활용

### 11-5. 광역 내부용 기능 권한

- 기관별 분석 결과는 광역 내부용
- 현재 시스템은 인증 없음 → 추후 로그인·권한 관리 도입 시 기관별 분석 대시보드 접근 제한 필요
- 과도기: README에 "광역 담당자만 접근" 명시

### 11-6. 지시문 05와의 관계

- 지시문 05: CSV 헤더명이 내부 코드로 저장되도록 하는 작업
- 지시문 06 (v2): header_mapping 시트 기반 파싱 방식 채택
- **지시문 05의 구현 방식에 따라 지시문 06의 CSV 파싱 로직이 조정 필요 가능**
- Claude Code 실제 구현 시 두 지시문 간 정합성 검토 필수

---

## 📋 12. 완료 체크리스트

### DB 작업
- [ ] institutions 테이블 생성 (institution_code PK)
- [ ] 59개 기관 데이터 삽입
- [ ] 권역별·시군구별 카운트 검증
- [ ] responses 테이블에 institution_code 컬럼 추가 (FK)
- [ ] responses 테이블에 round_label 컬럼 추가
- [ ] 인덱스 생성
- [ ] (선택) responses.region 컬럼 제거

### 백엔드 작업
- [ ] CSV 파싱 로직: header_mapping 시트 기반 헤더 변환
- [ ] CSV 파싱 로직: resolveInstitutionCode 함수
- [ ] CSV 파싱 로직: round_label 추출
- [ ] CSV 파싱 로직: 경고 수집 기능
- [ ] 척도 방향 처리: direction 필드 모든 분석 응답에 포함
- [ ] 분석 API: institution_code 필터
- [ ] 분석 API: round_label 필터
- [ ] 분석 API: sigungu 필터
- [ ] 분석 API: institution_breakdown 응답 필드
- [ ] 분석 API: round_breakdown 응답 필드
- [ ] 신규 API: GET /institutions
- [ ] 신규 API: GET /institutions/:code
- [ ] 신규 API: GET /institutions/by-region/:region
- [ ] 신규 API: POST /institutions/:code/reassign-region
- [ ] 신규 API: POST /institutions/:code/deactivate
- [ ] 신규 API: GET /institutions/response-rate/:surveyType
- [ ] 신규 API: GET /rounds/:surveyType
- [ ] 신규 API: GET /rounds/:surveyType/stats

### 프론트엔드 작업
- [ ] CSV 업로드 UI 개선 (미리보기·경고·수동 매핑·mapping 업로드)
- [ ] 응답률 대시보드 신규 구현
- [ ] 기관별 분석 대시보드 신규 구현
- [ ] 기존 분석 화면에 기관별·회차별 필터 추가
- [ ] 모든 척도 차트에 direction 표시 (높을수록 긍정)

### 테스트
- [ ] DB 레벨 테스트 5개 시나리오
- [ ] API 레벨 테스트 6개 시나리오
- [ ] CSV 업로드 테스트 5개 시나리오
- [ ] 척도 방향 테스트
- [ ] 프론트엔드 통합 테스트

### 문서화
- [ ] API 문서 업데이트
- [ ] README에 권역 재편 시 절차 안내
- [ ] 광역 담당자용 운영 매뉴얼

---

## 📞 판단 필요 시

다음 상황에서는 작업을 멈추고 용기에게 확인 요청:

- institutions 테이블의 권역 매핑이 실제 운영과 차이가 있을 경우
- responses.region 컬럼 제거 시점 결정
- 프론트엔드 권한 관리 범위 (현재 없음)
- 기관 마스터 데이터 관리 UI를 별도 화면으로 구축할지 여부
- header_mapping 업로드 방식 (Google Sheets API 직접 연동 vs CSV 별도 업로드)

---

## 🔗 연관 문서

- 설문 파일: `상반기통합설문.md`, `하반기통합설문.md`, `현장설문.md` (세션 A 결과물)
- 분석지시어 v9: `상반기통합설문_분석지시어_v9.md`, `하반기통합설문_분석지시어_v9.md`, `현장설문_사업별분석지시어_v9.md` (세션 B 결과물)
- 결과보고서 가이드 v4: `현장설문_결과보고서_docx생성가이드_v4.md` (세션 C 결과물)
- 구글폼 Apps Script: `README.md` + 13개 `.gs` 파일 (세션 E 결과물)
- 공통 요약: `00_공통_변경사항_요약.md`

---

## 끝

**이 지시문(v2)을 통해 설문시스템의 기관별 분석 기반이 구축된다.**
**완료 후 용기와 Claude 프로젝트에 작업 결과 보고 필요.**
