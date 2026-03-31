import { useState, useEffect, useMemo } from 'react';
import api from '../api';

function AgencyManager() {
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [editingCode, setEditingCode] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const res = await api.get('/api/agencies');
      setAgencies(res.data);
    } catch (err) {
      console.error('기관 목록 조회 실패:', err);
    }
  };

  const districts = useMemo(
    () => [...new Set(agencies.map((a) => a.district).filter(Boolean))].sort(),
    [agencies]
  );

  const filtered = useMemo(() => {
    return agencies.filter((a) => {
      if (search && !a.agency_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (districtFilter && a.district !== districtFilter) return false;
      if (sizeFilter && a.size_category !== sizeFilter) return false;
      return true;
    });
  }, [agencies, search, districtFilter, sizeFilter]);

  const startEdit = (agency) => {
    setEditingCode(agency.agency_code);
    setEditValues({
      sw_count: agency.sw_count ?? 0,
      ls_count: agency.ls_count ?? 0,
      client_count: agency.client_count ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingCode(null);
    setEditValues({});
  };

  const saveEdit = async (code) => {
    try {
      await api.put(`/api/agencies/${encodeURIComponent(code)}`, editValues);
      setEditingCode(null);
      setEditValues({});
      fetchAgencies();
    } catch (err) {
      console.error('수정 실패:', err);
      alert('수정에 실패했습니다.');
    }
  };

  const inputStyle = {
    width: 60,
    padding: '4px 6px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    textAlign: 'center',
  };

  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f3f4f6',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 14,
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>기관 관리</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="기관명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, width: 220 }}
        />
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          <option value="">전체 지자체</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          <option value="">전체 규모</option>
          <option value="소형">소형</option>
          <option value="중형">중형</option>
          <option value="대형">대형</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
          <thead>
            <tr>
              <th style={thStyle}>기관코드</th>
              <th style={thStyle}>기관명</th>
              <th style={thStyle}>지자체</th>
              <th style={thStyle}>시설유형</th>
              <th style={thStyle}>규모</th>
              <th style={thStyle}>전담사회복지사</th>
              <th style={thStyle}>생활지원사</th>
              <th style={thStyle}>대상자</th>
              <th style={thStyle}>수정</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.agency_code}>
                <td style={tdStyle}>{a.agency_code}</td>
                <td style={tdStyle}>{a.agency_name}</td>
                <td style={tdStyle}>{a.district}</td>
                <td style={tdStyle}>{a.facility_type}</td>
                <td style={tdStyle}>{a.size_category}</td>
                {editingCode === a.agency_code ? (
                  <>
                    <td style={tdStyle}>
                      <input
                        style={inputStyle}
                        type="number"
                        value={editValues.sw_count}
                        onChange={(e) =>
                          setEditValues({ ...editValues, sw_count: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        style={inputStyle}
                        type="number"
                        value={editValues.ls_count}
                        onChange={(e) =>
                          setEditValues({ ...editValues, ls_count: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        style={inputStyle}
                        type="number"
                        value={editValues.client_count}
                        onChange={(e) =>
                          setEditValues({ ...editValues, client_count: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => saveEdit(a.agency_code)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          marginRight: 4,
                          fontSize: 13,
                        }}
                      >
                        저장
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#6b7280',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        취소
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>{a.sw_count}</td>
                    <td style={tdStyle}>{a.ls_count}</td>
                    <td style={tdStyle}>{a.client_count}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => startEdit(a)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        수정
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AgencyManager;
