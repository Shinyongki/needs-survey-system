const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET / — 회차 목록 (year, survey_code, status 필터)
router.get('/', (req, res) => {
  try {
    const { year, survey_code, status } = req.query;
    const conditions = [];
    const params = [];

    if (year) {
      conditions.push('year = ?');
      params.push(year);
    }
    if (survey_code) {
      conditions.push('survey_code = ?');
      params.push(survey_code);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    let sql = 'SELECT * FROM survey_sessions';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY year DESC, half DESC, round_no DESC';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — 회차 등록
router.post('/', (req, res) => {
  try {
    const { survey_code, survey_name, year, half, round_no, target_role } = req.body;
    const result = db.prepare(
      `INSERT INTO survey_sessions (survey_code, survey_name, year, half, round_no, target_role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`
    ).run(survey_code, survey_name, year, half, round_no, target_role);

    res.status(201).json({ session_id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/close — status를 'closed'로 변경
router.patch('/:id/close', (req, res) => {
  try {
    const result = db.prepare(
      "UPDATE survey_sessions SET status = 'closed' WHERE session_id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '회차를 찾을 수 없습니다.' });
    }
    res.json({ closed: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
