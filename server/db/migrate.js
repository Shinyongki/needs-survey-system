const db = require('./connect');

// 작업 1: question_count 수정
db.prepare("UPDATE survey_sessions SET question_count = 61 WHERE survey_code = 'S01'").run();
db.prepare("UPDATE survey_sessions SET question_count = 65 WHERE survey_code = 'S02'").run();
db.prepare("UPDATE survey_sessions SET question_count = 14 WHERE survey_code = 'J04'").run();
db.prepare("UPDATE survey_sessions SET question_count = 14 WHERE survey_code = 'J06'").run();
console.log('S01 question_count -> 61, S02 question_count -> 65, J04/J06 -> 14 완료');

// 작업 2: participants 테이블 재생성
db.exec('DROP TABLE IF EXISTS participants');
db.exec(`
CREATE TABLE IF NOT EXISTS participants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    INTEGER REFERENCES survey_sessions(session_id),
  agency_code   TEXT REFERENCES agencies(agency_code),
  name          TEXT,
  gender        TEXT,
  role          TEXT,
  edu_type      TEXT,
  created_at    TEXT DEFAULT (datetime('now', 'localtime'))
);
`);
console.log('participants 테이블 재생성 완료');

// 검증
const s01 = db.prepare("SELECT question_count FROM survey_sessions WHERE survey_code = 'S01'").get();
const s02 = db.prepare("SELECT question_count FROM survey_sessions WHERE survey_code = 'S02'").get();
const j04 = db.prepare("SELECT question_count FROM survey_sessions WHERE survey_code = 'J04'").get();
const j06 = db.prepare("SELECT question_count FROM survey_sessions WHERE survey_code = 'J06'").get();
console.log(`검증: S01=${s01.question_count}, S02=${s02.question_count}, J04=${j04.question_count}, J06=${j06.question_count}`);

const tableInfo = db.prepare("PRAGMA table_info(participants)").all();
console.log('participants 컬럼:', tableInfo.map(c => c.name).join(', '));

// 작업 3: responses 테이블에 region, age_group, career 컬럼 추가
try { db.exec("ALTER TABLE responses ADD COLUMN region TEXT"); } catch (e) { /* column already exists */ }
try { db.exec("ALTER TABLE responses ADD COLUMN age_group TEXT"); } catch (e) { /* column already exists */ }
try { db.exec("ALTER TABLE responses ADD COLUMN career TEXT"); } catch (e) { /* column already exists */ }
console.log('responses 테이블 region/age_group/career 컬럼 추가 완료');

const responseCols = db.prepare("PRAGMA table_info(responses)").all();
console.log('responses 컬럼:', responseCols.map(c => c.name).join(', '));

// 작업 4: ANONYMOUS 기관 추가 (익명 응답용)
db.prepare("INSERT OR IGNORE INTO agencies (agency_code, agency_name, district) VALUES ('ANONYMOUS', '익명응답', '미지정')").run();
console.log('ANONYMOUS 기관 등록 완료');
