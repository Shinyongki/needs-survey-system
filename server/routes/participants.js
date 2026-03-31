const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET / — 참여자 목록
router.get('/', (req, res) => {
  try {
    const { session_id, agency_code } = req.query;
    const conditions = [];
    const params = [];

    if (session_id) {
      conditions.push('p.session_id = ?');
      params.push(session_id);
    }
    if (agency_code) {
      conditions.push('p.agency_code = ?');
      params.push(agency_code);
    }

    let sql = `SELECT p.*, a.agency_name, ss.survey_code
               FROM participants p
               JOIN agencies a ON p.agency_code = a.agency_code
               JOIN survey_sessions ss ON p.session_id = ss.session_id`;
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY p.agency_code, p.name';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — 신청자 명단 일괄 저장
// body: { session_id, participants: [{ agency_code, name, gender, role, edu_type }] }
router.post('/', (req, res) => {
  try {
    const { session_id, participants } = req.body;
    if (!session_id || !participants?.length) {
      return res.status(400).json({ error: 'session_id와 participants 배열이 필요합니다.' });
    }

    const session = db.prepare('SELECT session_id FROM survey_sessions WHERE session_id = ?').get(session_id);
    if (!session) {
      return res.status(404).json({ error: '회차를 찾을 수 없습니다.' });
    }

    // 유효 기관코드 세트
    const validCodes = new Set(
      db.prepare('SELECT agency_code FROM agencies').all().map(a => a.agency_code)
    );

    // 중복 시 REPLACE (session_id + agency_code + name 기준)
    const deleteStmt = db.prepare(
      'DELETE FROM participants WHERE session_id = ? AND agency_code = ? AND name = ?'
    );
    const insertStmt = db.prepare(
      `INSERT INTO participants (session_id, agency_code, name, gender, role, edu_type)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    const transaction = db.transaction(() => {
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        try {
          if (!p.agency_code || !validCodes.has(p.agency_code)) {
            skipped++;
            errors.push({ index: i, message: `기관코드 미매칭: ${p.agency_code}` });
            continue;
          }
          deleteStmt.run(session_id, p.agency_code, p.name || null);
          insertStmt.run(session_id, p.agency_code, p.name || null, p.gender || null, p.role || null, p.edu_type || null);
          inserted++;
        } catch (err) {
          skipped++;
          errors.push({ index: i, message: err.message });
        }
      }
    });

    transaction();
    res.json({ inserted, skipped, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE / — 회차별 참여자 전체 삭제
router.delete('/', (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id가 필요합니다.' });
    }
    const result = db.prepare('DELETE FROM participants WHERE session_id = ?').run(session_id);
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /summary — 기관별 참여자 수 집계
router.get('/summary', (req, res) => {
  try {
    const { session_id } = req.query;
    const conditions = [];
    const params = [];

    if (session_id) {
      conditions.push('session_id = ?');
      params.push(session_id);
    }

    let sql = `SELECT session_id, agency_code, COUNT(*) as participant_count
               FROM participants`;
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' GROUP BY session_id, agency_code';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
