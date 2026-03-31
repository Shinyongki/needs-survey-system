const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET /api/compare/options?year=2026
// Returns sessions for the given year with their question labels
router.get('/options', (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ error: 'year 파라미터가 필요합니다.' });
    }

    const sessions = db.prepare(
      'SELECT session_id, survey_code, survey_name FROM survey_sessions WHERE year = ? ORDER BY session_id'
    ).all(Number(year));

    const labelStmt = db.prepare(
      'SELECT label FROM question_labels WHERE session_id = ? ORDER BY question_no'
    );

    const result = sessions.map((s) => ({
      ...s,
      labels: labelStmt.all(s.session_id).map((r) => r.label),
    }));

    res.json({ sessions: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compare?session_id=1&question_label=공통5_종합만족도&group_by=district
router.get('/', (req, res) => {
  try {
    const { session_id, question_label, group_by } = req.query;

    if (!session_id || !question_label || !group_by) {
      return res.status(400).json({ error: 'session_id, question_label, group_by 파라미터가 필요합니다.' });
    }

    const validGroupBy = ['agency', 'district', 'size_category'];
    if (!validGroupBy.includes(group_by)) {
      return res.status(400).json({ error: 'group_by는 agency, district, size_category 중 하나여야 합니다.' });
    }

    // 1. Find question_no from question_labels
    const labelRow = db.prepare(
      'SELECT question_no FROM question_labels WHERE session_id = ? AND label = ?'
    ).get(Number(session_id), question_label);

    if (!labelRow) {
      return res.status(404).json({ error: '해당 문항 라벨을 찾을 수 없습니다.' });
    }

    const questionNo = labelRow.question_no;

    // 2. Calculate overall stats
    const overall = db.prepare(
      'SELECT COUNT(*) as total_count, AVG(CAST(answer_value AS REAL)) as overall_mean FROM responses WHERE session_id = ? AND question_no = ?'
    ).get(Number(session_id), questionNo);

    const overallMean = overall.overall_mean !== null ? Math.round(overall.overall_mean * 100) / 100 : 0;
    const overallCount = overall.total_count;

    // 3. Query per-group stats
    let sql;
    if (group_by === 'agency') {
      sql = `SELECT r.agency_code as group_key, a.agency_name as group_name,
                    COUNT(*) as respondent_count,
                    AVG(CAST(r.answer_value AS REAL)) as mean_score
             FROM responses r
             JOIN agencies a ON r.agency_code = a.agency_code
             WHERE r.session_id = ? AND r.question_no = ?
             GROUP BY r.agency_code
             ORDER BY mean_score DESC`;
    } else if (group_by === 'district') {
      sql = `SELECT a.district as group_key, a.district as group_name,
                    COUNT(*) as respondent_count,
                    AVG(CAST(r.answer_value AS REAL)) as mean_score
             FROM responses r
             JOIN agencies a ON r.agency_code = a.agency_code
             WHERE r.session_id = ? AND r.question_no = ?
             GROUP BY a.district
             ORDER BY mean_score DESC`;
    } else {
      sql = `SELECT a.size_category as group_key, a.size_category as group_name,
                    COUNT(*) as respondent_count,
                    AVG(CAST(r.answer_value AS REAL)) as mean_score
             FROM responses r
             JOIN agencies a ON r.agency_code = a.agency_code
             WHERE r.session_id = ? AND r.question_no = ?
             GROUP BY a.size_category
             ORDER BY mean_score DESC`;
    }

    const rows = db.prepare(sql).all(Number(session_id), questionNo);

    const groups = rows.map((r) => ({
      group_key: r.group_key,
      group_name: r.group_name,
      respondent_count: r.respondent_count,
      mean: Math.round(r.mean_score * 100) / 100,
      diff_from_overall: Math.round((r.mean_score - overallMean) * 100) / 100,
    }));

    res.json({
      session_id: Number(session_id),
      question_label: question_label,
      group_by: group_by,
      overall_mean: overallMean,
      overall_count: overallCount,
      groups: groups,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
