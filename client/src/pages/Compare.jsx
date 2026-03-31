import { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';

const groupByOptions = [
  { value: 'agency', label: '기관 개별' },
  { value: 'district', label: '시군구' },
  { value: 'size_category', label: '규모별' },
];

const years = [2025, 2026, 2027];

function Compare() {
  const [year, setYear] = useState(2026);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [labels, setLabels] = useState([]);
  const [questionLabel, setQuestionLabel] = useState('');
  const [groupBy, setGroupBy] = useState('district');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch options when year changes
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get(`/api/compare/options?year=${year}`);
        const data = res.data.sessions || [];
        setSessions(data);
        // Reset selections
        setSessionId('');
        setLabels([]);
        setQuestionLabel('');
        setResult(null);
      } catch (err) {
        console.error('옵션 조회 실패:', err);
        setSessions([]);
      }
    };
    fetchOptions();
  }, [year]);

  // Update labels when session changes
  useEffect(() => {
    if (!sessionId) {
      setLabels([]);
      setQuestionLabel('');
      return;
    }
    const found = sessions.find((s) => s.session_id === Number(sessionId));
    if (found) {
      setLabels(found.labels || []);
      setQuestionLabel('');
      setResult(null);
    }
  }, [sessionId, sessions]);

  // Auto-fetch when all three selected
  useEffect(() => {
    if (!sessionId || !questionLabel || !groupBy) return;

    const fetchCompare = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/compare', {
          params: { session_id: sessionId, question_label: questionLabel, group_by: groupBy },
        });
        setResult(res.data);
      } catch (err) {
        console.error('비교 조회 실패:', err);
        setResult(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCompare();
  }, [sessionId, questionLabel, groupBy]);

  const selectedSession = sessions.find((s) => s.session_id === Number(sessionId));

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: 20,
  };

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 14,
    minWidth: 180,
    outline: 'none',
  };

  const thStyle = {
    padding: '10px 14px',
    textAlign: 'center',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f3f4f6',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '10px 14px',
    textAlign: 'center',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 14,
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>기관 비교</h2>

      {/* Filters */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>
            연도
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ ...selectStyle, marginLeft: 8 }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 14, fontWeight: 600 }}>
            설문 선택
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              style={{ ...selectStyle, marginLeft: 8, minWidth: 260 }}
            >
              <option value="">-- 설문을 선택하세요 --</option>
              {sessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {s.survey_code} {s.survey_name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 14, fontWeight: 600 }}>
            문항 선택
            <select
              value={questionLabel}
              onChange={(e) => setQuestionLabel(e.target.value)}
              style={{ ...selectStyle, marginLeft: 8, minWidth: 260 }}
              disabled={labels.length === 0}
            >
              <option value="">-- 문항을 선택하세요 --</option>
              {labels.map((lb) => (
                <option key={lb} value={lb}>{lb}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>비교 기준</span>
          {groupByOptions.map((opt) => (
            <label key={opt.value} style={{ fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="radio"
                name="group_by"
                value={opt.value}
                checked={groupBy === opt.value}
                onChange={(e) => setGroupBy(e.target.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {loading && <p style={{ color: '#6b7280', fontSize: 14 }}>조회 중...</p>}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Table */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>비교 결과 테이블</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}>
                      {groupBy === 'agency' ? '기관' : groupBy === 'district' ? '시군구' : '규모'}
                    </th>
                    <th style={thStyle}>응답수</th>
                    <th style={thStyle}>평균</th>
                    <th style={thStyle}>전체평균 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {result.groups.map((g, idx) => {
                    const isPositive = g.diff_from_overall > 0;
                    const isNegative = g.diff_from_overall < 0;
                    const diffColor = isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#6b7280';
                    const arrow = isPositive ? ' \u25B2' : isNegative ? ' \u25BC' : '';
                    const diffText = (g.diff_from_overall > 0 ? '+' : '') + g.diff_from_overall.toFixed(2);

                    // Insert overall row before first negative (or at end)
                    const prevDiff = idx > 0 ? result.groups[idx - 1].diff_from_overall : null;
                    const showOverallBefore = prevDiff !== null && prevDiff >= 0 && g.diff_from_overall < 0;

                    return [
                      showOverallBefore && (
                        <tr key="overall-separator" style={{ backgroundColor: '#f9fafb' }}>
                          <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'left', color: '#374151' }} colSpan={1}>
                            --- 전체 ---
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#374151' }}>{result.overall_count}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#374151' }}>{result.overall_mean.toFixed(2)}</td>
                          <td style={tdStyle}></td>
                        </tr>
                      ),
                      <tr key={g.group_key}>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500 }}>{g.group_name}</td>
                        <td style={tdStyle}>{g.respondent_count}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{g.mean.toFixed(2)}</td>
                        <td style={{ ...tdStyle, color: diffColor, fontWeight: 600 }}>
                          {diffText}{arrow}
                        </td>
                      </tr>,
                    ];
                  })}
                  {/* If all groups are >= overall, show overall at bottom */}
                  {result.groups.every((g) => g.diff_from_overall >= 0) && (
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'left', color: '#374151' }} colSpan={1}>
                        --- 전체 ---
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#374151' }}>{result.overall_count}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#374151' }}>{result.overall_mean.toFixed(2)}</td>
                      <td style={tdStyle}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>막대 차트</h3>
            <ResponsiveContainer width="100%" height={Math.max(300, result.groups.length * 45)}>
              <BarChart
                data={result.groups}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(1)} />
                <YAxis type="category" dataKey="group_name" width={120} tick={{ fontSize: 13 }} />
                <Tooltip
                  formatter={(value) => [value.toFixed(2), '평균']}
                  labelFormatter={(label) => label}
                />
                <ReferenceLine x={result.overall_mean} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" label={{ value: `전체 ${result.overall_mean.toFixed(2)}`, position: 'top', fill: '#ef4444', fontSize: 12 }} />
                <Bar dataKey="mean" radius={[0, 4, 4, 0]} barSize={28}>
                  {result.groups.map((g) => (
                    <Cell key={g.group_key} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!result && !loading && sessionId && questionLabel && (
        <p style={{ color: '#6b7280', fontSize: 14 }}>데이터가 없습니다.</p>
      )}
    </div>
  );
}

export default Compare;
