import { useState, useEffect, useRef } from 'react';
import api from '../api';

function ParticipantUpload() {
  const [year, setYear] = useState(2026);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, [year]);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/api/sessions?year=${year}`);
      const onsite = res.data.filter((s) => {
        const code = s.survey_code;
        return code === 'J01' || (code >= 'J03' && code <= 'J17');
      });
      setSessions(onsite);
      setSessionId('');
    } catch (err) {
      console.error('회차 목록 조회 실패:', err);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await api.get('/api/agencies');
      setAgencies(res.data);
    } catch (err) {
      console.error('기관 목록 조회 실패:', err);
    }
  };

  const parseCsv = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setPreview({ total: 0, matched: 0, unmatchedCodes: [], socialWorker: 0, lifeSupport: 0, newbie: 0, experienced: 0 });
      setParsedRows([]);
      return;
    }
    const header = lines[0].replace(/^\uFEFF/, '').split(',').map((h) => h.trim());
    const dataLines = lines.slice(1).filter((l) => l.trim());

    const codeIdx = header.indexOf('기관코드');
    const nameIdx = header.indexOf('성명');
    const genderIdx = header.indexOf('성별');
    const roleIdx = header.findIndex((h) => h.includes('사용자유형'));
    const eduIdx = header.findIndex((h) => h.includes('교육구분'));

    const agencyCodeSet = new Set(agencies.map((a) => a.agency_code));
    let matched = 0;
    let socialWorker = 0;
    let lifeSupport = 0;
    let newbie = 0;
    let experienced = 0;
    const unmatchedSet = new Set();
    const rows = [];

    dataLines.forEach((line) => {
      const cols = line.split(',').map((c) => c.trim());
      const agencyCode = codeIdx >= 0 ? cols[codeIdx] : '';
      const pName = nameIdx >= 0 ? cols[nameIdx] : '';
      const gender = genderIdx >= 0 ? cols[genderIdx] : '';
      const roleRaw = roleIdx >= 0 ? cols[roleIdx] : '';
      const eduRaw = eduIdx >= 0 ? cols[eduIdx] : '';

      let role = '';
      if (roleRaw.includes('전담사회복지사')) role = '전담사회복지사';
      else if (roleRaw.includes('생활지원사')) role = '생활지원사';

      let eduType = '';
      if (eduRaw.includes('신규자')) eduType = '신규자';
      else if (eduRaw.includes('경력자')) eduType = '경력자';

      const isMatched = agencyCode && agencyCodeSet.has(agencyCode);
      if (isMatched) {
        matched++;
      } else if (agencyCode) {
        unmatchedSet.add(agencyCode);
      }

      if (role === '전담사회복지사') socialWorker++;
      else if (role === '생활지원사') lifeSupport++;

      if (eduType === '신규자') newbie++;
      else if (eduType === '경력자') experienced++;

      rows.push({
        agency_code: agencyCode,
        name: pName,
        gender,
        role,
        edu_type: eduType,
        matched: isMatched,
      });
    });

    setParsedRows(rows);
    setPreview({
      total: dataLines.length,
      matched,
      unmatchedCodes: [...unmatchedSet],
      socialWorker,
      lifeSupport,
      newbie,
      experienced,
    });
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      parseCsv(e.target.result);
    };
    reader.readAsText(f, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) {
      handleFile(f);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleUpload = async () => {
    if (!sessionId) {
      alert('회차를 선택해주세요.');
      return;
    }
    if (!parsedRows.length) {
      alert('CSV 파일을 선택해주세요.');
      return;
    }
    const validRows = parsedRows.filter((r) => r.matched);
    if (!validRows.length) {
      alert('매칭된 신청자가 없습니다.');
      return;
    }
    try {
      const res = await api.post('/api/participants', {
        session_id: Number(sessionId),
        participants: validRows.map(({ agency_code, name, gender, role, edu_type }) => ({
          agency_code,
          name,
          gender,
          role,
          edu_type,
        })),
      });
      setResult(res.data);
    } catch (err) {
      console.error('저장 실패:', err);
      const msg = err.response?.data?.error || err.message;
      alert(`저장 실패: ${msg}`);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setParsedRows([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>신청자 명단 업로드</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
        </select>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, minWidth: 200 }}
        >
          <option value="">-- 회차 선택 --</option>
          {sessions.map((s) => (
            <option key={s.session_id} value={s.session_id}>
              {s.survey_code} {s.survey_name}
            </option>
          ))}
        </select>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: 8,
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: dragging ? '#eff6ff' : '#fff',
          cursor: 'pointer',
          marginBottom: 20,
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <span style={{ fontSize: 15, color: '#374151' }}>
            선택된 파일: <strong>{file.name}</strong>
          </span>
        ) : (
          <span style={{ fontSize: 15, color: '#6b7280' }}>
            CSV 파일을 드래그하거나 클릭하여 선택하세요
          </span>
        )}
      </div>

      {preview && (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>파싱 미리보기</h3>
          <div style={{ display: 'flex', gap: 24, fontSize: 14, flexWrap: 'wrap' }}>
            <div>
              총 신청자: <strong>{preview.total}</strong>명
            </div>
            <div>
              기관 매칭: <strong style={{ color: '#22c55e' }}>{preview.matched}</strong>명
            </div>
            <div>
              전담사회복지사: <strong>{preview.socialWorker}</strong>명 / 생활지원사: <strong>{preview.lifeSupport}</strong>명
            </div>
            <div>
              신규자: <strong>{preview.newbie}</strong>명 / 경력자: <strong>{preview.experienced}</strong>명
            </div>
          </div>
          {preview.unmatchedCodes.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#fef2f2',
                borderRadius: 6,
                fontSize: 13,
                color: '#b91c1c',
                maxHeight: 120,
                overflowY: 'auto',
              }}
            >
              <strong>매칭 실패 기관코드 (해당 행은 건너뜀):</strong>
              {preview.unmatchedCodes.map((code, i) => (
                <span key={i}> {code}{i < preview.unmatchedCodes.length - 1 ? ',' : ''}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {result && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          저장 완료 - 등록: <strong>{result.inserted ?? 0}</strong>건 / 오류:{' '}
          <strong>{result.errors?.length ?? 0}</strong>건
          {result.errors?.length > 0 && (
            <div style={{ marginTop: 12, maxHeight: 160, overflowY: 'auto', fontSize: 13, color: '#b91c1c' }}>
              {result.errors.slice(0, 20).map((e, i) => (
                <div key={i}>{e.row}행: {e.message}</div>
              ))}
              {result.errors.length > 20 && <div>...외 {result.errors.length - 20}건</div>}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleCancel}
          style={{
            padding: '10px 24px',
            backgroundColor: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          취소
        </button>
        <button
          onClick={handleUpload}
          style={{
            padding: '10px 24px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          DB에 저장
        </button>
      </div>
    </div>
  );
}

export default ParticipantUpload;
