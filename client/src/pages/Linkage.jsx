import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const STATUS_MAP = {
  fulfilled: { bg: '#d1fae5', color: '#065f46', label: '✅ 이행 확인' },
  low_satisfaction: { bg: '#fef3c7', color: '#92400e', label: '⚠️ 만족도 낮음' },
  no_data: { bg: '#e5e7eb', color: '#6b7280', label: '❌ 데이터 없음' },
};

const cardStyle = {
  background: '#fff',
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
  border: '1px solid #e5e7eb',
};

export default function Linkage() {
  const [year, setYear] = useState(2026);
  const [mode, setMode] = useState('auto');
  const [autoItems, setAutoItems] = useState([]);
  const [manualItems, setManualItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    topic_label: '',
    need_session_id: '',
    need_label: '',
    field_session_id: '',
    field_label: '',
  });

  // Session & label options for manual form
  const [sessions, setSessions] = useState([]);
  const [needLabels, setNeedLabels] = useState([]);
  const [fieldLabels, setFieldLabels] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/linkage?year=${year}&mode=${mode}`);
      if (mode === 'auto') {
        setAutoItems(res.data.items || []);
      } else {
        setManualItems(res.data.items || []);
      }
    } catch (err) {
      console.error('이행 확인 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [year, mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load sessions for manual form
  useEffect(() => {
    api.get(`/api/sessions?year=${year}`)
      .then(r => setSessions(r.data || []))
      .catch(() => {});
  }, [year]);

  // Load labels when need_session_id changes
  useEffect(() => {
    if (!formData.need_session_id) { setNeedLabels([]); return; }
    api.get(`/api/questions?session_id=${formData.need_session_id}`)
      .then(r => setNeedLabels(r.data?.questions || []))
      .catch(() => setNeedLabels([]));
  }, [formData.need_session_id]);

  // Load labels when field_session_id changes
  useEffect(() => {
    if (!formData.field_session_id) { setFieldLabels([]); return; }
    api.get(`/api/questions?session_id=${formData.field_session_id}`)
      .then(r => setFieldLabels(r.data?.questions || []))
      .catch(() => setFieldLabels([]));
  }, [formData.field_session_id]);

  const handleCopy = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/api/linkage', formData);
      setShowForm(false);
      setFormData({ topic_label: '', need_session_id: '', need_label: '', field_session_id: '', field_label: '' });
      setMode('manual');
      fetchData();
    } catch (err) {
      alert('저장 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await api.delete(`/api/linkage/${id}`);
      fetchData();
    } catch (err) {
      alert('삭제 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 22, fontWeight: 700 }}>이행 확인</h2>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <label style={{ fontWeight: 600 }}>
          연도:&nbsp;
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="radio" name="mode" value="auto"
              checked={mode === 'auto'} onChange={() => setMode('auto')}
            />{' '}자동 매칭
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="radio" name="mode" value="manual"
              checked={mode === 'manual'} onChange={() => setMode('manual')}
            />{' '}수동 지정
          </label>
        </div>
      </div>

      {loading && <p style={{ color: '#6b7280' }}>불러오는 중...</p>}

      {/* AUTO MODE */}
      {mode === 'auto' && !loading && (
        <div>
          {autoItems.length === 0 && (
            <p style={{ color: '#6b7280' }}>자동 매칭 결과가 없습니다.</p>
          )}
          {autoItems.map((item, idx) => {
            const st = STATUS_MAP[item.status] || STATUS_MAP.no_data;
            return (
              <div key={idx} style={cardStyle}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
                  {item.section}
                </div>

                {/* Need questions */}
                {item.need_questions.length === 0 ? (
                  <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>
                    라벨 매칭 없음 (욕구 문항)
                  </div>
                ) : (
                  item.need_questions.map((nq, nqi) => (
                    <div key={nqi} style={{ fontSize: 14, marginBottom: 4 }}>
                      <span style={{ color: '#4b5563' }}>{item.need_survey}</span>{' '}
                      <span style={{ fontWeight: 600 }}>{nq.label}</span>
                      {nq.top_answers.length > 0 && (
                        <span style={{ marginLeft: 8, color: '#1d4ed8' }}>
                          → 1순위: {nq.top_answers[0].value} ({(nq.top_answers[0].ratio * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  ))
                )}

                {/* Arrow */}
                <div style={{ fontSize: 13, color: '#6b7280', margin: '8px 0' }}>↓ 반영</div>

                {/* Field */}
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: '#4b5563' }}>{item.field_survey}</span>{' '}
                  <span style={{ fontWeight: 600 }}>{item.field_label || '라벨 매칭 없음'}</span>
                  {item.field_mean !== null && (
                    <span style={{ marginLeft: 8, color: '#1d4ed8' }}>
                      → {item.field_mean}점 (N={item.field_respondent_count})
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: st.bg,
                  color: st.color,
                  marginBottom: 8,
                }}>
                  상태: {st.label}
                </div>

                {/* Evidence */}
                {item.evidence && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 6,
                    fontSize: 13,
                    lineHeight: 1.6,
                    position: 'relative',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>근거 문장:</div>
                    <div style={{ color: '#4b5563' }}>"{item.evidence}"</div>
                    <button
                      onClick={() => handleCopy(item.evidence, idx)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: copiedIdx === idx ? '#d1fae5' : '#e5e7eb',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 10px',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedIdx === idx ? '복사됨' : '📋 복사'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MANUAL MODE */}
      {mode === 'manual' && !loading && (
        <div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '8px 20px',
              background: '#1e3a5f',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            + 연결 추가
          </button>

          {/* Inline form */}
          {showForm && (
            <div style={{ ...cardStyle, border: '2px solid #1e3a5f' }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>새 연결 추가</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>주제 라벨</label>
                  <input
                    type="text"
                    value={formData.topic_label}
                    onChange={e => setFormData(p => ({ ...p, topic_label: e.target.value }))}
                    placeholder="예: 역량강화 교육"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4, boxSizing: 'border-box' }}
                  />
                </div>

                {/* Need side */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>욕구 출처 설문</label>
                  <select
                    value={formData.need_session_id}
                    onChange={e => setFormData(p => ({ ...p, need_session_id: e.target.value, need_label: '' }))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}
                  >
                    <option value="">-- 설문 선택 --</option>
                    {sessions.map(s => (
                      <option key={s.session_id} value={s.session_id}>
                        {s.survey_code} - {s.survey_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>욕구 문항 라벨</label>
                  <select
                    value={formData.need_label}
                    onChange={e => setFormData(p => ({ ...p, need_label: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}
                    disabled={!formData.need_session_id}
                  >
                    <option value="">-- 문항 선택 --</option>
                    {needLabels.map(l => (
                      <option key={l.question_no} value={l.label}>
                        Q{l.question_no} - {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field side */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>이행 확인 설문</label>
                  <select
                    value={formData.field_session_id}
                    onChange={e => setFormData(p => ({ ...p, field_session_id: e.target.value, field_label: '' }))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}
                  >
                    <option value="">-- 설문 선택 --</option>
                    {sessions.map(s => (
                      <option key={s.session_id} value={s.session_id}>
                        {s.survey_code} - {s.survey_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>이행 문항 라벨</label>
                  <select
                    value={formData.field_label}
                    onChange={e => setFormData(p => ({ ...p, field_label: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}
                    disabled={!formData.field_session_id}
                  >
                    <option value="">-- 문항 선택 --</option>
                    {fieldLabels.map(l => (
                      <option key={l.question_no} value={l.label}>
                        Q{l.question_no} - {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowForm(false); setFormData({ topic_label: '', need_session_id: '', need_label: '', field_session_id: '', field_label: '' }); }}
                  style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.topic_label || !formData.need_session_id || !formData.field_session_id}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 4,
                    border: 'none',
                    background: formData.topic_label && formData.need_session_id && formData.field_session_id ? '#1e3a5f' : '#9ca3af',
                    color: '#fff',
                    cursor: formData.topic_label && formData.need_session_id && formData.field_session_id ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          )}

          {/* Manual linkage list */}
          {manualItems.length === 0 && !showForm && (
            <p style={{ color: '#6b7280' }}>수동 연결이 없습니다.</p>
          )}
          {manualItems.map(item => (
            <div key={item.linkage_id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                    {item.topic_label}
                  </div>
                  <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 2 }}>
                    욕구: {item.need_survey_code} - {item.need_survey_name}
                    {item.need_label && <span> / {item.need_label}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#4b5563' }}>
                    이행: {item.field_survey_code} - {item.field_survey_name}
                    {item.field_label && <span> / {item.field_label}</span>}
                  </div>
                  {item.satisfaction != null && (
                    <div style={{ fontSize: 13, marginTop: 4, color: '#1d4ed8' }}>
                      만족도: {item.satisfaction}점
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.linkage_id)}
                  style={{
                    padding: '4px 12px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
