const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET /status — 응답 현황 매트릭스
router.get('/status', (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ error: 'year 파라미터가 필요합니다.' });
    }

    // 1. 해당 연도의 agencies 전체 조회
    const agencies = db.prepare(
      'SELECT agency_code, agency_name, district, sw_count FROM agencies'
    ).all();

    // 2. 해당 연도의 survey_sessions 조회
    const sessions = db.prepare(
      'SELECT session_id, survey_code, survey_name FROM survey_sessions WHERE year = ?'
    ).all(year);

    // 3. responses 테이블에서 session_id, agency_code별 응답 수 집계
    const sessionIds = sessions.map(s => s.session_id);
    let counts = [];
    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map(() => '?').join(',');
      counts = db.prepare(
        `SELECT session_id, agency_code, COUNT(DISTINCT respondent_no) as count
         FROM responses
         WHERE session_id IN (${placeholders})
         GROUP BY session_id, agency_code`
      ).all(...sessionIds);
    }

    // session_id → survey_code 매핑
    const sessionToSurvey = {};
    for (const s of sessions) {
      sessionToSurvey[s.session_id] = s.survey_code;
    }

    // 4. participants 집계 (현장설문용)
    const fieldSessionIds = sessions
      .filter(s => s.survey_code !== 'S01' && s.survey_code !== 'S02')
      .map(s => s.session_id);
    let participantCounts = [];
    if (fieldSessionIds.length > 0) {
      const ph = fieldSessionIds.map(() => '?').join(',');
      participantCounts = db.prepare(
        `SELECT session_id, agency_code, COUNT(*) as count
         FROM participants
         WHERE session_id IN (${ph})
         GROUP BY session_id, agency_code`
      ).all(...fieldSessionIds);
    }
    // participantMap[session_id][agency_code] = count
    const participantMap = {};
    for (const row of participantCounts) {
      if (!participantMap[row.session_id]) participantMap[row.session_id] = {};
      participantMap[row.session_id][row.agency_code] = row.count;
    }

    // 5. matrix 구성
    const matrix = {};
    for (const agency of agencies) {
      matrix[agency.agency_code] = {};
      for (const session of sessions) {
        const isHalf = session.survey_code === 'S01' || session.survey_code === 'S02';
        matrix[agency.agency_code][session.survey_code] = {
          count: 0,
          denominator: isHalf ? agency.sw_count : (participantMap[session.session_id]?.[agency.agency_code] ?? null),
        };
      }
    }

    // 집계 결과 반영
    for (const row of counts) {
      const survey_code = sessionToSurvey[row.session_id];
      if (matrix[row.agency_code] && survey_code) {
        matrix[row.agency_code][survey_code].count = row.count;
      }
    }

    res.json({ agencies, sessions, matrix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
