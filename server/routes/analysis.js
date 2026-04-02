const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET /api/analysis?survey_code=S01&region=북부&age_group=30대&career=1~3년
// 기존 전체 집계 + 필터 파라미터 지원
router.get('/', (req, res) => {
  try {
    const { survey_code, region, age_group, career } = req.query;
    if (!survey_code) {
      return res.status(400).json({ error: 'survey_code 파라미터가 필요합니다.' });
    }

    // session_id 조회
    const session = db.prepare(
      'SELECT session_id FROM survey_sessions WHERE survey_code = ? ORDER BY year DESC LIMIT 1'
    ).get(survey_code);
    if (!session) {
      return res.status(404).json({ error: '설문 세션을 찾을 수 없습니다.' });
    }
    const sessionId = session.session_id;

    // 필터 조건 동적 생성
    const filters = ['r.session_id = ?'];
    const params = [sessionId];

    if (region) { filters.push('r.region = ?'); params.push(region); }
    if (age_group) { filters.push('r.age_group = ?'); params.push(age_group); }
    if (career) { filters.push('r.career = ?'); params.push(career); }

    const whereClause = filters.join(' AND ');

    // 문항별 집계
    const rows = db.prepare(`
      SELECT
        r.question_no,
        COUNT(*) as count,
        AVG(CASE WHEN r.answer_value GLOB '[1-5]' THEN CAST(r.answer_value AS REAL) END) as avg,
        r.answer_value
      FROM responses r
      WHERE ${whereClause}
      GROUP BY r.question_no, r.answer_value
      ORDER BY r.question_no, r.answer_value
    `).all(...params);

    // 문항별로 그룹핑
    const questions = {};
    for (const row of rows) {
      if (!questions[row.question_no]) {
        questions[row.question_no] = { question_no: row.question_no, total: 0, distribution: [] };
      }
      questions[row.question_no].distribution.push({
        value: row.answer_value,
        count: row.count,
      });
      questions[row.question_no].total += row.count;
    }

    // 평균 계산
    const avgRows = db.prepare(`
      SELECT
        r.question_no,
        AVG(CAST(r.answer_value AS REAL)) as avg,
        COUNT(*) as count
      FROM responses r
      WHERE ${whereClause}
        AND r.answer_value GLOB '[1-5]'
      GROUP BY r.question_no
      ORDER BY r.question_no
    `).all(...params);

    for (const row of avgRows) {
      if (questions[row.question_no]) {
        questions[row.question_no].avg = Math.round(row.avg * 100) / 100;
        questions[row.question_no].numeric_count = row.count;
      }
    }

    // question_labels 조회
    const labels = db.prepare(
      'SELECT question_no, label FROM question_labels WHERE session_id = ? ORDER BY question_no'
    ).all(sessionId);
    const labelMap = {};
    for (const l of labels) {
      labelMap[l.question_no] = l.label;
    }

    const result = Object.values(questions).map(q => ({
      ...q,
      label: labelMap[q.question_no] || null,
    }));

    res.json({
      survey_code,
      session_id: sessionId,
      filters: { region: region || null, age_group: age_group || null, career: career || null },
      questions: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/by-region?survey_code=S01&question_no=1
// 권역별 비교
router.get('/by-region', (req, res) => {
  try {
    const { survey_code, question_no } = req.query;
    if (!survey_code || !question_no) {
      return res.status(400).json({ error: 'survey_code, question_no 파라미터가 필요합니다.' });
    }

    const session = db.prepare(
      'SELECT session_id FROM survey_sessions WHERE survey_code = ? ORDER BY year DESC LIMIT 1'
    ).get(survey_code);
    if (!session) {
      return res.status(404).json({ error: '설문 세션을 찾을 수 없습니다.' });
    }

    const rows = db.prepare(`
      SELECT
        r.region,
        r.answer_value,
        COUNT(*) as answer_count
      FROM responses r
      WHERE r.session_id = ?
        AND r.question_no = ?
        AND r.region IS NOT NULL
      GROUP BY r.region, r.answer_value
      ORDER BY r.region, r.answer_value
    `).all(session.session_id, Number(question_no));

    const avgRows = db.prepare(`
      SELECT
        r.region,
        AVG(CAST(r.answer_value AS REAL)) as avg,
        COUNT(*) as count
      FROM responses r
      WHERE r.session_id = ?
        AND r.question_no = ?
        AND r.region IS NOT NULL
        AND r.answer_value GLOB '[1-5]'
      GROUP BY r.region
    `).all(session.session_id, Number(question_no));

    const avgMap = {};
    for (const row of avgRows) {
      avgMap[row.region] = { avg: Math.round(row.avg * 100) / 100, count: row.count };
    }

    // 그룹핑
    const byRegion = {};
    for (const row of rows) {
      if (!byRegion[row.region]) {
        byRegion[row.region] = { count: 0, avg: avgMap[row.region]?.avg || null, distribution: {} };
      }
      byRegion[row.region].distribution[row.answer_value] = row.answer_count;
      byRegion[row.region].count += row.answer_count;
    }

    res.json({ question_no: Number(question_no), survey_code, by_region: byRegion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/by-group?survey_code=S01&question_no=1&group_by=age_group
// 연령대별·경력별 비교
router.get('/by-group', (req, res) => {
  try {
    const { survey_code, question_no, group_by } = req.query;
    if (!survey_code || !question_no || !group_by) {
      return res.status(400).json({ error: 'survey_code, question_no, group_by 파라미터가 필요합니다.' });
    }

    // SQL injection 방지: 화이트리스트
    const ALLOWED_GROUPS = ['age_group', 'career'];
    if (!ALLOWED_GROUPS.includes(group_by)) {
      return res.status(400).json({ error: 'group_by는 age_group 또는 career만 허용됩니다.' });
    }

    const session = db.prepare(
      'SELECT session_id FROM survey_sessions WHERE survey_code = ? ORDER BY year DESC LIMIT 1'
    ).get(survey_code);
    if (!session) {
      return res.status(404).json({ error: '설문 세션을 찾을 수 없습니다.' });
    }

    const rows = db.prepare(`
      SELECT
        r.${group_by} as group_key,
        COUNT(*) as count,
        AVG(CAST(r.answer_value AS REAL)) as avg
      FROM responses r
      WHERE r.session_id = ?
        AND r.question_no = ?
        AND r.${group_by} IS NOT NULL
        AND r.answer_value GLOB '[1-5]'
      GROUP BY r.${group_by}
      ORDER BY r.${group_by}
    `).all(session.session_id, Number(question_no));

    const byGroup = {};
    for (const row of rows) {
      byGroup[row.group_key] = { count: row.count, avg: Math.round(row.avg * 100) / 100 };
    }

    res.json({ question_no: Number(question_no), group_by, by_group: byGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
