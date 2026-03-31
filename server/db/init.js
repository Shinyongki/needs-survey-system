const db = require('./connect');

// 1. Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS agencies (
  agency_code     TEXT PRIMARY KEY,
  agency_name     TEXT NOT NULL,
  district        TEXT NOT NULL,
  facility_type   TEXT,
  sw_count        INTEGER,
  ls_count        INTEGER,
  client_count    INTEGER,
  size_category   TEXT GENERATED ALWAYS AS (
    CASE
      WHEN client_count >= 1000 THEN '대형'
      WHEN client_count >= 700  THEN '중형'
      ELSE '소형'
    END
  ) STORED,
  created_at      TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS survey_sessions (
  session_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_code     TEXT NOT NULL,
  survey_name     TEXT NOT NULL,
  year            INTEGER NOT NULL,
  half            TEXT,
  round_no        INTEGER DEFAULT 1,
  target_role     TEXT NOT NULL,
  question_count  INTEGER,
  status          TEXT DEFAULT 'open',
  created_at      TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS responses (
  response_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER NOT NULL REFERENCES survey_sessions(session_id),
  agency_code     TEXT NOT NULL REFERENCES agencies(agency_code),
  respondent_no   INTEGER,
  respondent_role TEXT NOT NULL,
  question_no     INTEGER NOT NULL,
  answer_value    TEXT,
  answer_type     TEXT,
  submitted_at    TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS linkages (
  linkage_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  need_session_id INTEGER NOT NULL REFERENCES survey_sessions(session_id),
  field_session_id INTEGER NOT NULL REFERENCES survey_sessions(session_id),
  topic_label     TEXT NOT NULL,
  need_ratio      REAL,
  satisfaction    REAL,
  created_at      TEXT DEFAULT (datetime('now', 'localtime'))
);

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

CREATE TABLE IF NOT EXISTS question_labels (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   INTEGER REFERENCES survey_sessions(session_id),
  question_no  INTEGER,
  label        TEXT,
  UNIQUE(session_id, question_no)
);

CREATE TABLE IF NOT EXISTS documents (
  doc_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_type        TEXT NOT NULL,
  year            INTEGER NOT NULL,
  content_json    TEXT,
  is_confirmed    INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now', 'localtime')),
  confirmed_at    TEXT
);
`);

// 2. Seed 59 agencies
db.exec(`
INSERT OR IGNORE INTO agencies (agency_code, agency_name, district, facility_type, sw_count, ls_count, client_count) VALUES
('A48310001', '거제노인통합지원센터', '거제시', '재가노인복지시설', 6, 59, 571),
('A48310002', '거제사랑노인복지센터', '거제시', '재가노인복지시설', 4, 61, 525),
('A48310003', '하청교회 행복늘푸른대학', '거제시', '노인여가복지시설', NULL, NULL, 495),
('A48310004', '은빛노인통합지원센터', '거제시', '사회복지법인', NULL, NULL, 498),
('A48880002', '거창노인통합지원센터', '거창군', '사회복지법인', 3, 46, 746),
('A48880003', '거창인애노인통합지원센터', '거창군', '재가노인복지시설', 3, 46, 706),
('A48880004', '해월노인복지센터', '거창군', '재가노인복지시설', 3, 44, 672),
('A48820003', '대한노인회 고성군지회(노인맞춤돌봄서비스)', '고성군', '사단법인', 5, 80, 1188),
('A48820005', '사회적협동조합 노인세상', '고성군', '협동조합', NULL, NULL, 985),
('A48250001', '효능원노인통합지원센터', '김해시', '재가노인복지시설', 5, 37, 702),
('A48250004', '김해시종합사회복지관', '김해시', '사회복지관', 4, 42, 615),
('A48250005', '생명의전화노인통합지원센터', '김해시', '재가노인복지시설', 5, 42, 619),
('A48250006', '보현행원노인통합지원센터', '김해시', '사회복지법인', 4, 33, 535),
('A48250007', '김해돌봄지원센터', '김해시', '협동조합', 3, 31, 435),
('A48840001', '화방남해노인통합지원센터', '남해군', '재가노인복지시설', 4, 68, 1070),
('A48840002', '화방재가복지센터', '남해군', '재가노인복지시설', 4, 68, 962),
('A48270001', '밀양시자원봉사단체협의회', '밀양시', '사단법인', 4, 61, 915),
('A48270002', '밀양노인통합지원센터', '밀양시', '재가노인복지시설', 4, 62, 994),
('A48270003', '우리들노인통합지원센터', '밀양시', '재가노인복지시설', 5, 50, 837),
('A48240001', '사랑원노인지원센터', '사천시', '재가노인복지시설', 5, 80, 723),
('A48240002', '사천노인통합지원센터', '사천시', '재가노인복지시설', 6, 96, 715),
('A48240003', '남양양로원', '사천시', '노인주거복지시설', NULL, NULL, 722),
('A48240004', '사천건양주야간보호센터', '사천시', '재가노인복지시설', NULL, NULL, 645),
('A48860001', '산청한일노인통합지원센터', '산청군', '재가노인복지시설', 2, 35, 534),
('A48860002', '산청복음노인통합지원센터', '산청군', '재가노인복지시설', 2, 34, 495),
('A48860003', '산청해민노인통합지원센터', '산청군', '재가노인복지시설', 2, 34, 572),
('A48860004', '산청성모노인통합지원센터', '산청군', '재가노인복지시설', 2, 34, 534),
('A48330001', '사회복지법인신생원양산재가노인복지센터', '양산시', '재가노인복지시설', 6, 59, 1093),
('A48330004', '양산행복한돌봄 사회적협동조합', '양산시', '협동조합', 4, 59, 835),
('A48330005', '성요셉소규모노인종합센터', '양산시', '노인주거복지시설', 4, 59, 835),
('A48720001', '의령노인통합지원센터', '의령군', '재가노인복지시설', 5, 80, 1089),
('A48170001', '진양노인통합지원센터', '진주시', '재가노인복지시설', 3, 48, 720),
('A48170002', '진주노인통합지원센터', '진주시', '재가노인복지시설', 3, 48, 720),
('A48170003', '나누리노인통합지원센터', '진주시', '재가노인복지시설', 4, 62, 930),
('A48170004', '공덕의집노인통합지원센터', '진주시', '재가노인복지시설', 3, 48, 723),
('A48170005', '하늘마음노인통합지원센터', '진주시', '재가노인복지시설', 3, 48, 736),
('A48740001', '창녕지역자활센터', '창녕군', '지역자활센터', 5, 80, 1299),
('A48740002', '창녕군새누리노인종합센터', '창녕군', '재가노인복지시설', 5, 80, 1248),
('A48120001', '동진노인통합지원센터', '창원시', '재가노인복지시설', 3, 36, 537),
('A48120002', '창원도우누리노인통합재가센터', '창원시', '재가노인복지시설', 5, 52, 837),
('A48120004', '명진노인통합지원센터', '창원시', '재가노인복지시설', 3, 43, 662),
('A48120005', '플러스희망 사회적협동조합', '창원시', '협동조합', 4, 45, 717),
('A48120008', '경남노인통합지원센터', '창원시', '재가노인복지시설', 4, 47, 873),
('A48120011', '정현사회적협동조합', '창원시', '협동조합', 4, 55, 817),
('A48120012', '진해서부노인종합복지관', '창원시', '노인여가복지시설', 3, 52, 727),
('A48120013', '진해노인종합복지관', '창원시', '노인여가복지시설', 4, 46, 717),
('A48120014', '경남고용복지센터', '창원시', '사단법인', 4, 39, 747),
('A48120015', '마산회원노인종합복지관', '창원시', '사회복지관', 2, 29, 447),
('A48220002', '통영시종합사회복지관', '통영시', '사회복지관', 4, 63, 897),
('A48220003', '통영노인통합지원센터', '통영시', '재가노인복지시설', 7, 77, 1228),
('A48850001', '하동노인통합지원센터', '하동군', '재가노인복지시설', 4, 54, 861),
('A48850002', '경남하동지역자활센터', '하동군', '지역자활센터', 3, 52, 843),
('A48730001', '(사)대한노인회함안군지회', '함안군', '사단법인', 4, 69, 1005),
('A48730002', '함안군재가노인통합지원센터', '함안군', '재가노인복지시설', 4, 69, 1007),
('A48870002', '사단법인 대한노인회 함양군지회', '함양군', '사단법인', 6, 96, 1303),
('A48890003', '미타재가복지센터', '합천군', '재가노인복지시설', 3, 48, 735),
('A48890004', '합천노인통합지원센터', '합천군', '재가노인복지시설', 4, 64, 977),
('A48890005', '코끼리행복복지센터', '합천군', '사회복지법인', 4, 50, 767),
('A48890006', '사회적협동조합 합천종합복지공동체', '합천군', '협동조합', 6, 85, 1377);
`);

// 3. Seed 18 survey_sessions (only if table is empty)
const sessionCount = db.prepare('SELECT COUNT(*) as cnt FROM survey_sessions').get().cnt;
if (sessionCount === 0) {
db.exec(`
INSERT INTO survey_sessions (survey_code, survey_name, year, half, round_no, target_role, question_count) VALUES
('S01', '상반기 통합설문', 2026, 'first', 1, 'sw', 56),
('S02', '하반기 통합설문', 2026, 'second', 1, 'sw', 59),
('J01', '현장설문_방문형서비스', 2026, NULL, 1, 'sw', 13),
('J03', '현장설문_집단프로그램', 2026, NULL, 1, 'sw', 13),
('J04', '현장설문_역량강화교육', 2026, NULL, 1, 'ls', 13),
('J05', '현장설문_특화지원', 2026, NULL, 1, 'sw', 13),
('J06', '현장설문_심리지원교육', 2026, NULL, 1, 'ls', 13),
('J07', '현장설문_사례관리', 2026, NULL, 1, 'sw', 13),
('J08', '현장설문_연계서비스', 2026, NULL, 1, 'sw', 13),
('J09', '현장설문_자원봉사연계', 2026, NULL, 1, 'sw', 13),
('J10', '현장설문_후원연계', 2026, NULL, 1, 'sw', 13),
('J11', '현장설문_실무협의회', 2026, NULL, 1, 'sw', 13),
('J12', '현장설문_슈퍼비전', 2026, NULL, 1, 'sw', 13),
('J13', '현장설문_교육훈련', 2026, NULL, 1, 'sw', 13),
('J14', '현장설문_안전지원', 2026, NULL, 1, 'sw', 13),
('J15', '현장설문_생활교육', 2026, NULL, 1, 'sw', 13),
('J16', '현장설문_사회참여', 2026, NULL, 1, 'sw', 13),
('J17', '현장설문_퇴원환자단기집중', 2026, NULL, 1, 'sw', 13);
`);
}

// 3-1. ALTER linkages table — add columns if missing
try { db.exec(`ALTER TABLE linkages ADD COLUMN mode TEXT DEFAULT 'manual'`); } catch (e) { /* column already exists */ }
try { db.exec(`ALTER TABLE linkages ADD COLUMN need_label TEXT`); } catch (e) { /* column already exists */ }
try { db.exec(`ALTER TABLE linkages ADD COLUMN field_label TEXT`); } catch (e) { /* column already exists */ }

// 4. Print row counts
const tables = ['agencies', 'survey_sessions', 'responses', 'participants', 'linkages', 'documents'];
console.log('=== DB 초기화 완료 ===');
for (const t of tables) {
  const row = db.prepare(`SELECT COUNT(*) AS cnt FROM ${t}`).get();
  console.log(`  ${t}: ${row.cnt}행`);
}
