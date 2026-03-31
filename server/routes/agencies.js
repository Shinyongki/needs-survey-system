const express = require('express');
const router = express.Router();
const db = require('../db/connect');

// GET / — 전체 기관 목록 (district, size 필터 지원)
router.get('/', (req, res) => {
  try {
    const { district, size } = req.query;
    const conditions = [];
    const params = [];

    if (district) {
      conditions.push('district = ?');
      params.push(district);
    }
    if (size) {
      conditions.push('size_category = ?');
      params.push(size);
    }

    let sql = 'SELECT * FROM agencies';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:code — 기관 단건 조회
router.get('/:code', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM agencies WHERE agency_code = ?').get(req.params.code);
    if (!row) return res.status(404).json({ error: '기관을 찾을 수 없습니다.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:code — 수정 (sw_count, ls_count, client_count만 수정 가능)
router.put('/:code', (req, res) => {
  try {
    const { sw_count, ls_count, client_count } = req.body;
    const result = db.prepare(
      'UPDATE agencies SET sw_count = ?, ls_count = ?, client_count = ? WHERE agency_code = ?'
    ).run(sw_count, ls_count, client_count, req.params.code);

    if (result.changes === 0) {
      return res.status(404).json({ error: '기관을 찾을 수 없습니다.' });
    }
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
