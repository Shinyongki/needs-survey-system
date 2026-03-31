import { useState, useEffect, useMemo } from 'react';
import api from '../api';

function ResponseStatus() {
  const [year, setYear] = useState(2026);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, [year]);

  const fetchStatus = async () => {
    try {
      const res = await api.get(`/api/dashboard/status?year=${year}`);
      setData(res.data);
    } catch (err) {
      console.error('응답 현황 조회 실패:', err);
    }
  };

  const sessions = data?.sessions || [];
  const matrix = data?.matrix || {};

  const districts = useMemo(() => {
    if (!data?.agencies) return [];
    const grouped = {};
    for (const a of data.agencies) {
      if (!grouped[a.district]) grouped[a.district] = [];
      grouped[a.district].push(a);
    }
    return Object.keys(grouped).sort().map((district) => ({
      district,
      agencies: grouped[district],
    }));
  }, [data]);

  const formatCell = (entry) => {
    const count = entry?.count ?? 0;
    if (count === 0) {
      return { bg: '#e5e7eb', color: '#9ca3af', text: '\u2014' };
    }
    const denom = entry.denominator;
    const text = denom != null ? `${count}/${denom}` : `${count}`;
    return { bg: '#fff', color: '#111827', text };
  };

  const exportCsv = () => {
    if (!data) return;
    const header = ['지자체', '기관명', ...sessions.map((s) => s.survey_code)];
    const rows = [header.join(',')];

    districts.forEach((dist) => {
      dist.agencies.forEach((agency) => {
        const cells = sessions.map((s) => {
          const entry = matrix[agency.agency_code]?.[s.survey_code];
          return formatCell(entry).text;
        });
        rows.push([dist.district, agency.agency_name, ...cells].join(','));
      });
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `응답현황_${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
    textAlign: 'center',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>응답 현황</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
          <button
            onClick={exportCsv}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1e3a5f',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            CSV 내보내기
          </button>
        </div>
      </div>

      {data ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>기관명</th>
                {sessions.map((s) => (
                  <th key={s.survey_code} style={thStyle}>
                    {s.survey_code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {districts.map((dist) => (
                <DistrictGroup key={dist.district} dist={dist} sessions={sessions} matrix={matrix} formatCell={formatCell} tdStyle={tdStyle} />
              ))}
              {districts.length === 0 && (
                <tr>
                  <td colSpan={sessions.length + 1} style={{ ...tdStyle, color: '#9ca3af' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: '#9ca3af', fontSize: 14 }}>로딩 중...</div>
      )}
    </div>
  );
}

function DistrictGroup({ dist, sessions, matrix, formatCell, tdStyle }) {
  return (
    <>
      <tr>
        <td
          colSpan={sessions.length + 1}
          style={{
            padding: '10px 12px',
            fontWeight: 700,
            fontSize: 14,
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            textAlign: 'left',
          }}
        >
          {dist.district}
        </td>
      </tr>
      {dist.agencies.map((agency) => (
        <tr key={agency.agency_code}>
          <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: 24 }}>{agency.agency_name}</td>
          {sessions.map((s) => {
            const entry = matrix[agency.agency_code]?.[s.survey_code];
            const cell = formatCell(entry);
            return (
              <td
                key={s.survey_code}
                style={{
                  ...tdStyle,
                  backgroundColor: cell.bg,
                  color: cell.color,
                  fontWeight: 600,
                }}
              >
                {cell.text}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

export default ResponseStatus;
