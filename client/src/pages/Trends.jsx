import { useState, useEffect, useMemo, Fragment } from 'react';
import api from '../api';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  border: '1px solid #e5e7eb',
};

const selectStyle = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  fontSize: 14,
  minWidth: 200,
  backgroundColor: '#fff',
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

function Trends() {
  const [available, setAvailable] = useState([]);
  const [surveyCode, setSurveyCode] = useState('');
  const [questionLabel, setQuestionLabel] = useState('');
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch available surveys on mount
  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const res = await api.get('/api/trends/available');
        setAvailable(res.data);
        if (res.data.length > 0) {
          setSurveyCode(res.data[0].survey_code);
        }
      } catch (err) {
        console.error('추세 데이터 목록 조회 실패:', err);
      }
    };
    fetchAvailable();
  }, []);

  // Current survey info
  const currentSurvey = useMemo(
    () => available.find((s) => s.survey_code === surveyCode),
    [available, surveyCode],
  );

  // Reset label when survey changes
  useEffect(() => {
    if (currentSurvey && currentSurvey.labels.length > 0) {
      setQuestionLabel(currentSurvey.labels[0]);
    } else {
      setQuestionLabel('');
    }
    setTrendsData(null);
  }, [surveyCode, currentSurvey]);

  // Fetch trends when both selections are made
  useEffect(() => {
    if (!surveyCode || !questionLabel || !currentSurvey) return;
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const yearsParam = currentSurvey.available_years.join(',');
        const res = await api.get('/api/trends', {
          params: { survey_code: surveyCode, question_label: questionLabel, years: yearsParam },
        });
        setTrendsData(res.data);
      } catch (err) {
        console.error('추세 데이터 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [surveyCode, questionLabel, currentSurvey]);

  // Determine if this is a mean-based (5-point scale) question
  const hasMean = useMemo(() => {
    if (!trendsData?.years) return false;
    return trendsData.years.some((y) => y.mean != null);
  }, [trendsData]);

  // Build line chart data for mean-based questions
  const lineChartData = useMemo(() => {
    if (!trendsData?.years || !hasMean) return [];
    return trendsData.years.map((y) => ({
      year: `${y.year}년`,
      평균: y.mean,
      응답수: y.respondent_count,
    }));
  }, [trendsData, hasMean]);

  // Build bar chart data for distribution-based questions
  const barChartData = useMemo(() => {
    if (!trendsData?.years || hasMean) return [];
    // Collect all unique values across years
    const allValues = new Set();
    trendsData.years.forEach((y) => {
      y.distribution.forEach((d) => allValues.add(d.value));
    });
    const sortedValues = [...allValues].sort();

    return sortedValues.map((value) => {
      const entry = { value };
      trendsData.years.forEach((y) => {
        const found = y.distribution.find((d) => d.value === value);
        entry[`${y.year}년`] = found ? found.count : 0;
        entry[`${y.year}년_ratio`] = found ? (found.ratio * 100).toFixed(1) : '0.0';
      });
      return entry;
    });
  }, [trendsData, hasMean]);

  // Build summary text
  const summaryText = useMemo(() => {
    if (!trendsData?.years || trendsData.years.length === 0) return '';

    if (hasMean) {
      const sorted = [...trendsData.years].sort((a, b) => a.year - b.year);
      if (sorted.length === 1) {
        return `${sorted[0].year}년 평균 ${sorted[0].mean?.toFixed(2)}`;
      }
      const parts = sorted.map((y) => y.mean?.toFixed(2)).join(' → ');
      const first = sorted[0].mean;
      const last = sorted[sorted.length - 1].mean;
      if (first != null && last != null) {
        const diff = last - first;
        const sign = diff >= 0 ? '+' : '';
        return `평균 ${parts} (${sign}${diff.toFixed(2)})`;
      }
      return `평균 ${parts}`;
    }

    // Distribution-based: show top-1 value change
    const sorted = [...trendsData.years].sort((a, b) => a.year - b.year);
    const topPerYear = sorted.map((y) => {
      const top = [...y.distribution].sort((a, b) => b.count - a.count)[0];
      return top ? { year: y.year, value: top.value, ratio: (top.ratio * 100).toFixed(0) } : null;
    }).filter(Boolean);

    if (topPerYear.length === 0) return '';
    const parts = topPerYear.map((t) => `${t.value}(${t.ratio}%)`).join(' → ');
    return `1순위: ${parts}`;
  }, [trendsData, hasMean]);

  const yearKeys = useMemo(() => {
    if (!trendsData?.years) return [];
    return trendsData.years.map((y) => `${y.year}년`);
  }, [trendsData]);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>
        시계열 추세
      </h2>

      {/* Filters */}
      <div style={{ ...cardStyle, display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={labelStyle}>설문 선택</div>
          <select
            style={selectStyle}
            value={surveyCode}
            onChange={(e) => setSurveyCode(e.target.value)}
          >
            {available.map((s) => (
              <option key={s.survey_code} value={s.survey_code}>
                {s.survey_code} — {s.survey_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>문항 선택</div>
          <select
            style={{ ...selectStyle, minWidth: 300 }}
            value={questionLabel}
            onChange={(e) => setQuestionLabel(e.target.value)}
          >
            {(currentSurvey?.labels || []).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {currentSurvey && (
          <div style={{ fontSize: 13, color: '#6b7280', paddingBottom: 4 }}>
            비교 연도: {currentSurvey.available_years.join(', ')}
          </div>
        )}
      </div>

      {/* Chart area */}
      {loading && (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#6b7280', padding: 40 }}>
          데이터를 불러오는 중...
        </div>
      )}

      {!loading && trendsData && trendsData.years.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            연도별 비교
          </h3>

          {hasMean ? (
            /* Line chart for 5-point scale questions */
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" fontSize={13} />
                <YAxis domain={[1, 5]} fontSize={13} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === '평균') return [value?.toFixed(2), name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="평균"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 5, fill: '#3b82f6' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            /* Bar chart for distribution-based questions */
            <ResponsiveContainer width="100%" height={Math.max(350, barChartData.length * 30 + 100)}>
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" fontSize={13} />
                <YAxis
                  dataKey="value"
                  type="category"
                  fontSize={12}
                  width={70}
                  tick={{ fill: '#374151' }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    // Find matching ratio
                    const yearKey = name;
                    return [`${value}명`, yearKey];
                  }}
                />
                <Legend />
                {yearKeys.map((yearKey, i) => (
                  <Bar
                    key={yearKey}
                    dataKey={yearKey}
                    fill={COLORS[i % COLORS.length]}
                    barSize={18}
                    radius={[0, 4, 4, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Distribution table for non-mean questions */}
          {!hasMean && trendsData.years.length > 0 && (
            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>응답값</th>
                    {trendsData.years.map((y) => (
                      <th key={y.year} style={thStyle} colSpan={2}>
                        {y.year}년 (n={y.respondent_count})
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th style={thStyle}></th>
                    {trendsData.years.map((y) => (
                      <Fragment key={y.year}>
                        <th style={{ ...thStyle, fontSize: 12 }}>건수</th>
                        <th style={{ ...thStyle, fontSize: 12 }}>비율</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {barChartData.map((row, idx) => (
                    <tr key={row.value} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={tdStyle}>{row.value}</td>
                      {trendsData.years.map((y) => {
                        const found = y.distribution.find((d) => d.value === row.value);
                        return (
                          <Fragment key={y.year}>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{found ? found.count : 0}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              {found ? `${(found.ratio * 100).toFixed(1)}%` : '0.0%'}
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {summaryText && (
            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                backgroundColor: '#f0f9ff',
                borderRadius: 6,
                border: '1px solid #bae6fd',
                fontSize: 14,
                color: '#0c4a6e',
                fontWeight: 500,
              }}
            >
              변화 요약: {summaryText}
            </div>
          )}
        </div>
      )}

      {!loading && trendsData && trendsData.years.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#6b7280', padding: 40 }}>
          선택한 조건에 해당하는 데이터가 없습니다.
        </div>
      )}

      {!loading && !trendsData && available.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#6b7280', padding: 40 }}>
          문항 라벨이 등록된 설문이 없습니다.
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '8px 10px',
  textAlign: 'center',
  borderBottom: '2px solid #e5e7eb',
  backgroundColor: '#f3f4f6',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '6px 10px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: 13,
};

export default Trends;
