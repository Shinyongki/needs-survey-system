const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET /available — 설문코드별 이용 가능한 연도 및 문항 라벨 목록
router.get('/available', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        ss.survey_code,
        ss.survey_name,
        ss.year,
        ql.label
      FROM survey_sessions ss
      JOIN question_labels ql ON ql.session_id = ss.session_id
      ORDER BY ss.survey_code, ss.year, ql.label
    `).all();

    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.survey_code]) {
        grouped[row.survey_code] = {
          survey_code: row.survey_code,
          survey_name: row.survey_name,
          yearsSet: new Set(),
          labelsSet: new Set(),
        };
      }
      grouped[row.survey_code].yearsSet.add(row.year);
      grouped[row.survey_code].labelsSet.add(row.label);
    }

    const result = Object.values(grouped).map((g) => ({
      survey_code: g.survey_code,
      survey_name: g.survey_name,
      available_years: [...g.yearsSet].sort((a, b) => a - b),
      labels: [...g.labelsSet].sort(),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — 시계열 추세 데이터
router.get('/', (req, res) => {
  try {
    const { survey_code, question_label, years } = req.query;

    if (!survey_code || !question_label || !years) {
      return res.status(400).json({ error: 'survey_code, question_label, years 파라미터가 필요합니다.' });
    }

    const yearList = years.split(',').map(Number).filter((n) => !isNaN(n));
    if (yearList.length === 0) {
      return res.status(400).json({ error: '유효한 연도가 없습니다.' });
    }

    // 1. Find session_id + question_no for each year
    const placeholders = yearList.map(() => '?').join(',');
    const mappings = db.prepare(`
      SELECT ss.year, ss.session_id, ql.question_no, ql.label
      FROM survey_sessions ss
      JOIN question_labels ql ON ql.session_id = ss.session_id
      WHERE ss.survey_code = ?
        AND ql.label = ?
        AND ss.year IN (${placeholders})
      ORDER BY ss.year
    `).all(survey_code, question_label, ...yearList);

    // 2. For each mapping, query responses
    const yearsData = [];

    for (const m of mappings) {
      // Get respondent count
      const countRow = db.prepare(`
        SELECT COUNT(DISTINCT respondent_no) AS respondent_count
        FROM responses
        WHERE session_id = ? AND question_no = ?
      `).get(m.session_id, m.question_no);

      const respondentCount = countRow.respondent_count;

      // Get distribution
      const distRows = db.prepare(`
        SELECT answer_value AS value, COUNT(*) AS count
        FROM responses
        WHERE session_id = ? AND question_no = ?
        GROUP BY answer_value
        ORDER BY answer_value
      `).all(m.session_id, m.question_no);

      const totalResponses = distRows.reduce((sum, r) => sum + r.count, 0);
      const distribution = distRows.map((r) => ({
        value: r.value,
        count: r.count,
        ratio: totalResponses > 0 ? Math.round((r.count / totalResponses) * 1000) / 1000 : 0,
      }));

      // Determine if mean should be calculated
      // Check answer_type and whether all values are numeric 1-5
      const typeRow = db.prepare(`
        SELECT DISTINCT answer_type
        FROM responses
        WHERE session_id = ? AND question_no = ?
      `).all(m.session_id, m.question_no);

      const isMulti = typeRow.some((t) => t.answer_type === 'multi');
      const allNumeric = distribution.every((d) => {
        const num = Number(d.value);
        return Number.isInteger(num) && num >= 1 && num <= 5;
      });

      let mean = null;
      if (!isMulti && allNumeric && distribution.length > 0) {
        const meanRow = db.prepare(`
          SELECT AVG(CAST(answer_value AS REAL)) AS mean
          FROM responses
          WHERE session_id = ? AND question_no = ?
        `).get(m.session_id, m.question_no);
        mean = meanRow.mean != null ? Math.round(meanRow.mean * 100) / 100 : null;
      }

      yearsData.push({
        year: m.year,
        session_id: m.session_id,
        question_no: m.question_no,
        respondent_count: respondentCount,
        distribution,
        mean,
      });
    }

    res.json({
      survey_code,
      question_label,
      years: yearsData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
