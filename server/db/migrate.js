const db = require('./connect');

// 작업 1: question_count 수정
db.prepare("UPDATE survey_sessions SET question_count = 56 WHERE survey_code = 'S01'").run();
db.prepare("UPDATE survey_sessions SET question_count = 59 WHERE survey_code = 'S02'").run();
console.log('S01 question_count -> 56, S02 question_count -> 59 완료');

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
console.log(`검증: S01=${s01.question_count}, S02=${s02.question_count}`);

const tableInfo = db.prepare("PRAGMA table_info(participants)").all();
console.log('participants 컬럼:', tableInfo.map(c => c.name).join(', '));
