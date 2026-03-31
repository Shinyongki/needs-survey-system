const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const { parse } = require('csv-parse/sync');

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
    const skipColumns = new Set(['응답번호', '제출시간', '기관명']);
    const qColumns = headers.filter(h => !skipColumns.has(h));

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
    if (existingLabels.cnt === 0) {
      const insertLabel = db.prepare(
        'INSERT INTO question_labels (session_id, question_no, label) VALUES (?, ?, ?)'
      );
      qColumns.forEach((label, index) => {
        insertLabel.run(session_id, index + 1, label);
      });
    }

    // 기관명 → agency_code 역매칭 맵 구축
    const allAgencies = db.prepare('SELECT agency_code, agency_name FROM agencies').all();
    const nameToCode = {};
    for (const a of allAgencies) {
      nameToCode[a.agency_name] = a.agency_code;
    }

    const respondentCounter = {};

    const deleteStmt = db.prepare(
      'DELETE FROM responses WHERE session_id = ? AND agency_code = ? AND respondent_no = ? AND question_no = ?'
    );
    const insertStmt = db.prepare(
      `INSERT INTO responses (session_id, agency_code, respondent_no, respondent_role, question_no, answer_value, answer_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const transaction = db.transaction(() => {
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        try {
          const agencyName = (row['기관명'] || '').trim();
          if (!agencyName) {
            skipped++;
            errors.push({ row: i + 2, message: '기관명이 비어있습니다.' });
            continue;
          }
          const agency_code = nameToCode[agencyName];
          if (!agency_code) {
            skipped++;
            errors.push({ row: i + 2, message: `기관명 매칭 실패: ${agencyName}` });
            continue;
          }

          const counterKey = `${session_id}-${agency_code}`;
          if (!respondentCounter[counterKey]) respondentCounter[counterKey] = 0;
          respondentCounter[counterKey]++;
          const respondent_no = respondentCounter[counterKey];

          for (let q = 0; q < qColumns.length; q++) {
            const colName = qColumns[q];
            const answer = row[colName];
            const question_no = q + 1;

            const answerType = answer && answer.includes(';') ? 'multi' : 'single';
            deleteStmt.run(session_id, agency_code, respondent_no, question_no);
            insertStmt.run(session_id, agency_code, respondent_no, respondent_role, question_no, answer, answerType);
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
