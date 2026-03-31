const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET / — 특정 session의 문항 목록
router.get('/', (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id 파라미터가 필요합니다.' });
    }
    const questions = db.prepare(
      'SELECT question_no, label FROM question_labels WHERE session_id = ? ORDER BY question_no'
    ).all(session_id);
    res.json({ session_id: Number(session_id), questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /labels — 설문 코드별 label 합집합 (시계열 드롭다운용)
router.get('/labels', (req, res) => {
  try {
    const { survey_code } = req.query;
    if (!survey_code) {
      return res.status(400).json({ error: 'survey_code 파라미터가 필요합니다.' });
    }
    const rows = db.prepare(`
      SELECT ql.label, ss.year
      FROM question_labels ql
      JOIN survey_sessions ss ON ql.session_id = ss.session_id
      WHERE ss.survey_code = ?
      ORDER BY ql.label, ss.year
    `).all(survey_code);

    const labelMap = {};
    for (const row of rows) {
      if (!labelMap[row.label]) labelMap[row.label] = [];
      if (!labelMap[row.label].includes(row.year)) {
        labelMap[row.label].push(row.year);
      }
    }

    const labels = Object.entries(labelMap).map(([label, available_years]) => ({
      label,
      available_years: available_years.sort(),
    }));

    res.json({ survey_code, labels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
