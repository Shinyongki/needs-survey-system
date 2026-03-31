# 02. 트랙 B — 백엔드 API

> 00_설계명세.md를 먼저 읽을 것  
> 트랙 A(DB 초기화)와 병렬 실행 가능. DB 연결 테스트는 트랙 A 완료 후 수행

---

## 작업 목표

`C:\Projects\설문시스템\server\` 에 Express 서버와 전체 라우터를 구현한다.  
포트: **3001**

---

## package.json

```json
{
  "name": "survey-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "better-sqlite3": "^9.0.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5",
    "csv-parse": "^5.5.0"
  }
}
```

---

## server\index.js

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/agencies',   require('./routes/agencies'));
app.use('/api/sessions',   require('./routes/surveys'));
app.use('/api/responses',  require('./routes/responses'));
app.use('/api/dashboard',  require('./routes/dashboard'));

app.listen(3001, () => console.log('서버 실행: http://localhost:3001'));
```

---

## server\db\connect.js

```javascript
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'database.db'));
db.pragma('journal_mode = WAL');
module.exports = db;
```

---

## server\routes\agencies.js

구현할 엔드포인트:

**GET /api/agencies**
- 전체 기관 목록 반환
- query: `district`(지자체 필터), `size`(소형·중형·대형 필터)
- 반환: `[{ agency_code, agency_name, district, facility_type, sw_count, ls_count, client_count, size_category }]`

**GET /api/agencies/:code**
- 기관 단건 조회

**PUT /api/agencies/:code**
- sw_count, ls_count, client_count 수정 가능
- agency_code, agency_name 수정 불가

---

## server\routes\surveys.js

구현할 엔드포인트:

**GET /api/sessions**
- query: `year`, `survey_code`, `status`
- 반환: 회차 목록

**POST /api/sessions**
- body: `{ survey_code, survey_name, year, half, round_no, target_role }`
- 반환: 생성된 session_id

**PATCH /api/sessions/:id/close**
- status를 'closed'로 변경

---

## server\routes\responses.js

구현할 엔드포인트:

**POST /api/responses/upload**
- body: `{ session_id: number, csv_text: string }`
- CSV 파싱 규칙:
  - 첫 번째 행 = 헤더 (타임스탬프, 기관선택, Q1, Q2, ...)
  - `기관선택` 값에서 `_` 앞부분 추출 → agency_code
  - Q1부터 순서대로 question_no 1, 2, 3...
  - 기존 동일 session_id + agency_code + question_no 데이터 있으면 REPLACE
- 반환: `{ inserted: number, skipped: number, errors: [] }`

**GET /api/responses**
- query: `session_id`, `agency_code`
- 반환: 응답 목록

---

## server\routes\dashboard.js

구현할 엔드포인트:

**GET /api/dashboard/status**
- query: `year` (필수)
- 반환 구조:
```json
{
  "agencies": [{ "agency_code": "A48310001", "agency_name": "거제노인통합지원센터", "district": "거제시" }],
  "sessions": [{ "session_id": 1, "survey_code": "S01", "survey_name": "상반기 통합설문" }],
  "matrix": {
    "A48310001": {
      "S01": { "status": "complete", "count": 55 },
      "S02": { "status": "none",     "count": 0  }
    }
  }
}
```
- status 판정:
  - `complete` : 응답 수 >= 목표 (일단 1 이상이면 complete로 처리)
  - `partial`  : 응답 있으나 미달
  - `none`     : 응답 없음

---

## 완료 조건

- `node index.js` 실행 시 오류 없음
- `GET http://localhost:3001/api/agencies` → 59개 기관 JSON 반환
- `GET http://localhost:3001/api/sessions?year=2026` → 18개 회차 JSON 반환
- `POST http://localhost:3001/api/responses/upload` 테스트 CSV 업로드 성공
- `GET http://localhost:3001/api/dashboard/status?year=2026` → matrix 구조 반환
