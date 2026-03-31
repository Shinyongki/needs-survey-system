const express = require('express');
const router = express.Router();
const db = require('../db/connect');

const AUTO_LINKAGE_MAP = [
  { section: "A. 모니터링·점검",    need_code: "S01", need_labels: ["A-1%","A-2%","A-3%","A-4%","A-5%"], field_code: "J01", field_label: "공통5%" },
  { section: "B1. 역량강화(전담)",  need_code: "S01", need_labels: ["B1-1%","B1-2%","B1-3%","B1-4%"],    field_code: "J03", field_label: "공통5%" },
  { section: "B3. 심리지원(전담)",  need_code: "S01", need_labels: ["B3-1%","B3-2%","B3-3%","B3-4%"],    field_code: "J05", field_label: "공통5%" },
  { section: "C. 실무협의회",       need_code: "S01", need_labels: ["C-1%","C-2%","C-3%","C-4%","C-5%","C-6%"], field_code: "J07", field_label: "공통5%" },
  { section: "D1. 컨설팅",         need_code: "S01", need_labels: ["D1-1%","D1-2%"],  field_code: "J08", field_label: "공통5%" },
  { section: "D2. 특화·위기사례",   need_code: "S01", need_labels: ["D2-1%","D2-2%"],  field_code: "J09", field_label: "공통5%" },
  { section: "D3. 퇴원환자",       need_code: "S01", need_labels: ["D3-1%","D3-2%"],  field_code: "J10", field_label: "공통5%" },
  { section: "D4. 노무",           need_code: "S01", need_labels: ["D4-1%","D4-2%"],  field_code: "J11", field_label: "공통5%" },
  { section: "E1. ICT",            need_code: "S01", need_labels: ["E1-1%","E1-2%"],  field_code: "J12", field_label: "공통5%" },
  { section: "E2. 나눔사업",       need_code: "S01", need_labels: ["E2-1%","E2-2%"],  field_code: "J13", field_label: "공통5%" },
  { section: "E3. 캠페인",         need_code: "S01", need_labels: ["E3-1%","E3-2%"],  field_code: "J14", field_label: "공통5%" },
  { section: "F1. 홍보",           need_code: "S01", need_labels: ["F1-1%","F1-2%"],  field_code: "J15", field_label: "공통5%" },
  { section: "F2. 표창",           need_code: "S01", need_labels: ["F2-1%","F2-2%"],  field_code: "J16", field_label: "공통5%" },
  { section: "F3. 종사자 지원",     need_code: "S01", need_labels: ["F3-1%","F3-2%"],  field_code: "J17", field_label: "공통5%" },
];

// Helper: get session_id by survey_code and year
function getSessionId(surveyCode, year) {
  const row = db.prepare(
    'SELECT session_id FROM survey_sessions WHERE survey_code = ? AND year = ? LIMIT 1'
  ).get(surveyCode, year);
  return row ? row.session_id : null;
}

// Helper: get question labels matching a LIKE pattern
function getMatchingLabels(sessionId, pattern) {
  return db.prepare(
    'SELECT question_no, label FROM question_labels WHERE session_id = ? AND label LIKE ?'
  ).all(sessionId, pattern);
}

// Helper: get response distribution for a question
function getDistribution(sessionId, questionNo) {
  return db.prepare(
    'SELECT answer_value, COUNT(*) as cnt FROM responses WHERE session_id = ? AND question_no = ? GROUP BY answer_value ORDER BY cnt DESC'
  ).all(sessionId, questionNo);
}

// Helper: get mean and count for a question
function getMeanAndCount(sessionId, questionNo) {
  const row = db.prepare(
    'SELECT AVG(CAST(answer_value AS REAL)) as mean, COUNT(*) as cnt FROM responses WHERE session_id = ? AND question_no = ? AND answer_value IS NOT NULL'
  ).get(sessionId, questionNo);
  return row;
}

// Build auto linkage items
function buildAutoItems(year) {
  const items = [];

  for (const entry of AUTO_LINKAGE_MAP) {
    const needSessionId = getSessionId(entry.need_code, year);
    const fieldSessionId = getSessionId(entry.field_code, year);

    if (!needSessionId) {
      items.push({
        section: entry.section,
        need_survey: entry.need_code,
        need_questions: [],
        field_survey: entry.field_code,
        field_label: null,
        field_mean: null,
        field_respondent_count: 0,
        status: 'no_data',
        evidence: null,
        error: '욕구 설문 세션을 찾을 수 없습니다.',
      });
      continue;
    }

    // Collect need questions
    const needQuestions = [];
    for (const pattern of entry.need_labels) {
      const labels = getMatchingLabels(needSessionId, pattern);
      for (const lbl of labels) {
        const dist = getDistribution(needSessionId, lbl.question_no);
        const totalCount = dist.reduce((sum, d) => sum + d.cnt, 0);
        const topAnswers = dist.slice(0, 3).map(d => ({
          value: d.answer_value,
          count: d.cnt,
          ratio: totalCount > 0 ? Math.round((d.cnt / totalCount) * 1000) / 1000 : 0,
        }));
        needQuestions.push({
          label: lbl.label,
          question_no: lbl.question_no,
          top_answers: topAnswers,
        });
      }
    }

    // Field satisfaction
    let fieldLabel = null;
    let fieldMean = null;
    let fieldRespondentCount = 0;

    if (fieldSessionId) {
      const fieldLabels = getMatchingLabels(fieldSessionId, entry.field_label);
      if (fieldLabels.length > 0) {
        const fl = fieldLabels[0];
        fieldLabel = fl.label;
        const stats = getMeanAndCount(fieldSessionId, fl.question_no);
        if (stats && stats.cnt > 0) {
          fieldMean = Math.round(stats.mean * 100) / 100;
          fieldRespondentCount = stats.cnt;
        }
      }
    }

    // Determine status
    let status = 'no_data';
    if (fieldMean !== null) {
      status = fieldMean >= 4.0 ? 'fulfilled' : 'low_satisfaction';
    }

    // Evidence text
    let evidence = null;
    const top1 = needQuestions.length > 0 && needQuestions[0].top_answers.length > 0
      ? needQuestions[0].top_answers[0]
      : null;

    if (top1 && fieldMean !== null) {
      const fieldSession = db.prepare(
        'SELECT survey_name FROM survey_sessions WHERE session_id = ?'
      ).get(fieldSessionId);
      const fieldSurveyName = fieldSession ? fieldSession.survey_name : entry.field_code;
      const ratioPercent = (top1.ratio * 100).toFixed(1);
      evidence = `상반기 통합설문 결과 ${ratioPercent}%가 '${top1.value}'을(를) 선택하였으며, 이를 반영한 현장설문(${fieldSurveyName}) 결과 종합만족도 ${fieldMean}점으로 나타났다.`;
    } else if (top1) {
      const ratioPercent = (top1.ratio * 100).toFixed(1);
      evidence = `상반기 통합설문 결과 ${ratioPercent}%가 '${top1.value}'을(를) 선택하였으나, 현장설문 데이터가 없습니다.`;
    }

    items.push({
      section: entry.section,
      need_survey: entry.need_code,
      need_questions: needQuestions,
      field_survey: entry.field_code,
      field_label: fieldLabel,
      field_mean: fieldMean,
      field_respondent_count: fieldRespondentCount,
      status,
      evidence,
    });
  }

  return items;
}

// GET /api/linkage
router.get('/', (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2026;
    const mode = req.query.mode || 'auto';

    if (mode === 'auto') {
      const items = buildAutoItems(year);
      return res.json({ year, mode: 'auto', items });
    }

    // Manual mode: query linkages table
    const rows = db.prepare(`
      SELECT l.*,
        ns.survey_code AS need_survey_code, ns.survey_name AS need_survey_name,
        fs.survey_code AS field_survey_code, fs.survey_name AS field_survey_name
      FROM linkages l
      LEFT JOIN survey_sessions ns ON l.need_session_id = ns.session_id
      LEFT JOIN survey_sessions fs ON l.field_session_id = fs.session_id
      WHERE l.mode = 'manual'
        AND (ns.year = ? OR fs.year = ?)
      ORDER BY l.created_at DESC
    `).all(year, year);

    res.json({ year, mode: 'manual', items: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/linkage
router.post('/', (req, res) => {
  try {
    const { topic_label, need_session_id, need_label, field_session_id, field_label } = req.body;
    if (!topic_label || !need_session_id || !field_session_id) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }
    const result = db.prepare(`
      INSERT INTO linkages (need_session_id, field_session_id, topic_label, need_label, field_label, mode)
      VALUES (?, ?, ?, ?, ?, 'manual')
    `).run(need_session_id, field_session_id, topic_label, need_label || null, field_label || null);

    res.status(201).json({ linkage_id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/linkage/:linkage_id
router.delete('/:linkage_id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM linkages WHERE linkage_id = ?').run(req.params.linkage_id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '연결을 찾을 수 없습니다.' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/linkage/:linkage_id/evidence
router.get('/:linkage_id/evidence', (req, res) => {
  try {
    const linkage = db.prepare('SELECT * FROM linkages WHERE linkage_id = ?').get(req.params.linkage_id);
    if (!linkage) {
      return res.status(404).json({ error: '연결을 찾을 수 없습니다.' });
    }

    // Need side: get distribution
    let needInfo = null;
    if (linkage.need_session_id && linkage.need_label) {
      const labels = getMatchingLabels(linkage.need_session_id, linkage.need_label);
      if (labels.length > 0) {
        const dist = getDistribution(linkage.need_session_id, labels[0].question_no);
        const totalCount = dist.reduce((sum, d) => sum + d.cnt, 0);
        if (dist.length > 0) {
          needInfo = {
            label: labels[0].label,
            top_value: dist[0].answer_value,
            top_ratio: totalCount > 0 ? Math.round((dist[0].cnt / totalCount) * 1000) / 1000 : 0,
          };
        }
      }
    }

    // Field side: get mean
    let fieldMean = null;
    let fieldSurveyName = '';
    if (linkage.field_session_id && linkage.field_label) {
      const labels = getMatchingLabels(linkage.field_session_id, linkage.field_label);
      if (labels.length > 0) {
        const stats = getMeanAndCount(linkage.field_session_id, labels[0].question_no);
        if (stats && stats.cnt > 0) {
          fieldMean = Math.round(stats.mean * 100) / 100;
        }
      }
      const session = db.prepare('SELECT survey_name FROM survey_sessions WHERE session_id = ?').get(linkage.field_session_id);
      if (session) fieldSurveyName = session.survey_name;
    }

    let evidence = null;
    if (needInfo && fieldMean !== null) {
      const ratioPercent = (needInfo.top_ratio * 100).toFixed(1);
      evidence = `상반기 통합설문 결과 ${ratioPercent}%가 '${needInfo.top_value}'을(를) 선택하였으며, 이를 반영한 현장설문(${fieldSurveyName}) 결과 종합만족도 ${fieldMean}점으로 나타났다.`;
    }

    res.json({
      linkage_id: linkage.linkage_id,
      evidence,
      need_info: needInfo,
      field_mean: fieldMean,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
