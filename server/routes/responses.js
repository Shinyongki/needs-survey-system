const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const { parse } = require('csv-parse/sync');
const { REGION_LABELS, AGE_GROUP_LABELS, CAREER_LABELS } = require('../constants/regions');

/**
 * 헤더명에서 Q번호를 추출한다.
 * "Q01. 문항내용" → 1, "Q12. 문항내용" → 12
 * 매칭 실패 시 null 반환 (폴백용)
 */
function extractQuestionNo(header) {
  const match = header.match(/^Q(\d+)\.\s/);
  return match ? parseInt(match[1], 10) : null;
}

// POST /upload — CSV 업로드
router.post('/upload', (req, res) => {
  try {
    const { session_id, csv_text } = req.body;
    if (!session_id || !csv_text) {
      return res.status(400).json({ error: 'session_id와 csv_text가 필요합니다.' });
    }

    // session의 target_role, question_count 조회
    const session = db.prepare(
      'SELECT target_role, question_count FROM survey_sessions WHERE session_id = ?'
    ).get(session_id);
    if (!session) {
      return res.status(404).json({ error: '회차를 찾을 수 없습니다.' });
    }
    const respondent_role = session.target_role;

    // CSV 파싱 (BOM 제거 + relaxed 옵션)
    const records = parse(csv_text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
      relax_quotes: true,
    });

    if (records.length === 0) {
      return res.json({ inserted: 0, skipped: 0, errors: [{ row: 0, message: 'CSV에 데이터 행이 없습니다.' }] });
    }

    let inserted = 0;
    let skipped = 0;
    const errors = [];
    const warnings = [];

    const headers = Object.keys(records[0]);
    const skipColumns = new Set(['응답번호', '제출시간']);
    // 도입부 메타 열 (연령대, 경력, 권역) — 문항이 아닌 메타 데이터로 추출
    const metaColumns = new Set();
    const ageHeader = headers.find(h => h.includes('연령대'));
    const careerHeader = headers.find(h => h.includes('경력'));
    const regionHeader = headers.find(h => h.includes('권역'));
    if (ageHeader) metaColumns.add(ageHeader);
    if (careerHeader) metaColumns.add(careerHeader);
    if (regionHeader) metaColumns.add(regionHeader);

    const qColumns = headers.filter(h => !skipColumns.has(h) && !metaColumns.has(h));

    const actualQuestionCount = qColumns.length;

    // question_count가 NULL이면 자동 설정
    if (!session.question_count) {
      db.prepare('UPDATE survey_sessions SET question_count = ? WHERE session_id = ?')
        .run(actualQuestionCount, session_id);
    } else if (session.question_count !== actualQuestionCount) {
      // 불일치 시 경고 (업로드는 계속)
      warnings.push(`설정된 문항 수(${session.question_count})와 CSV 문항 수(${actualQuestionCount})가 다릅니다.`);
    }

    // question_labels 자동 저장 (해당 session에 labels가 없으면)
    const existingLabels = db.prepare(
      'SELECT COUNT(*) as cnt FROM question_labels WHERE session_id = ?'
    ).get(session_id);
    // Q번호 매핑 배열 생성 (헤더 기반 + 폴백)
    const qNumberMap = [];
    let fallbackIndex = 0;
    for (const col of qColumns) {
      fallbackIndex++;
      const qFromHeader = extractQuestionNo(col);
      qNumberMap.push(qFromHeader !== null ? qFromHeader : fallbackIndex);
    }

    if (existingLabels.cnt === 0) {
      const insertLabel = db.prepare(
        'INSERT INTO question_labels (session_id, question_no, label) VALUES (?, ?, ?)'
      );
      qColumns.forEach((label, index) => {
        insertLabel.run(session_id, qNumberMap[index], label);
      });
    }

    // 메타 데이터 추출 함수
    function extractMeta(row) {
      return {
        age_group: ageHeader ? (AGE_GROUP_LABELS[row[ageHeader]] ?? null) : null,
        career: careerHeader ? (CAREER_LABELS[row[careerHeader]] ?? null) : null,
        region: regionHeader ? (REGION_LABELS[row[regionHeader]] ?? null) : null,
      };
    }

    // 기관명 → agency_code 역매칭 맵 구축
    const allAgencies = db.prepare('SELECT agency_code, agency_name FROM agencies').all();
    const nameToCode = {};
    for (const a of allAgencies) {
      nameToCode[a.agency_name] = a.agency_code;
    }

    // 기관명 열이 CSV에 존재하는지 확인 (하위 호환)
    const hasAgencyName = headers.includes('기관명');

    const respondentCounter = {};

    const deleteStmt = db.prepare(
      'DELETE FROM responses WHERE session_id = ? AND agency_code = ? AND respondent_no = ? AND question_no = ?'
    );
    const insertStmt = db.prepare(
      `INSERT INTO responses (session_id, agency_code, respondent_no, respondent_role, question_no, answer_value, answer_type, region, age_group, career)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const transaction = db.transaction(() => {
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        try {
          // 메타 데이터 추출
          const meta = extractMeta(row);

          // 기관명 처리: CSV에 기관명 열이 있으면 사용, 없으면 'UNKNOWN' 코드 사용
          let agency_code;
          if (hasAgencyName) {
            const agencyName = (row['기관명'] || '').trim();
            if (!agencyName) {
              skipped++;
              errors.push({ row: i + 2, message: '기관명이 비어있습니다.' });
              continue;
            }
            agency_code = nameToCode[agencyName];
            if (!agency_code) {
              skipped++;
              errors.push({ row: i + 2, message: `기관명 매칭 실패: ${agencyName}` });
              continue;
            }
          } else {
            // 기관명 열 없는 새 CSV 형식: 권역 정보로 대체, agency_code는 'ANONYMOUS'
            agency_code = 'ANONYMOUS';
          }

          const counterKey = `${session_id}-${agency_code}`;
          if (!respondentCounter[counterKey]) respondentCounter[counterKey] = 0;
          respondentCounter[counterKey]++;
          const respondent_no = respondentCounter[counterKey];

          for (let q = 0; q < qColumns.length; q++) {
            const colName = qColumns[q];
            const answer = row[colName];
            const question_no = qNumberMap[q];

            const answerType = answer && answer.includes(';') ? 'multi' : 'single';
            deleteStmt.run(session_id, agency_code, respondent_no, question_no);
            insertStmt.run(session_id, agency_code, respondent_no, respondent_role, question_no, answer, answerType, meta.region, meta.age_group, meta.career);
            inserted++;
          }
        } catch (rowErr) {
          skipped++;
          errors.push({ row: i + 2, message: rowErr.message });
        }
      }
    });

    transaction();

    res.json({ inserted, skipped, errors, warnings });
  } catch (err) {
    console.error('POST /upload 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET / — 응답 목록
router.get('/', (req, res) => {
  try {
    const { session_id, agency_code } = req.query;
    const conditions = [];
    const params = [];

    if (session_id) {
      conditions.push('session_id = ?');
      params.push(session_id);
    }
    if (agency_code) {
      conditions.push('agency_code = ?');
      params.push(agency_code);
    }

    let sql = 'SELECT * FROM responses';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY agency_code, question_no';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
