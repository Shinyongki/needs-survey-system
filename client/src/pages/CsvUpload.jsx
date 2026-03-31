import { useState, useEffect, useRef } from 'react';
import api from '../api';

function CsvUpload() {
  const [year, setYear] = useState(2026);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [agencyNames, setAgencyNames] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    fetchAgencyNames();
  }, [year]);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/api/sessions?year=${year}`);
      setSessions(res.data);
      setSessionId('');
    } catch (err) {
      console.error('회차 목록 조회 실패:', err);
    }
  };

  const fetchAgencyNames = async () => {
    try {
      const res = await api.get('/api/agencies');
      setAgencyNames(res.data.map((a) => a.agency_name));
    } catch (err) {
      console.error('기관 목록 조회 실패:', err);
    }
  };

  const parsePreview = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setPreview({ rows: 0, matched: 0, unmatched: [], questions: 0 });
      return;
    }
    const header = lines[0].replace(/^\uFEFF/, '').split(',').map((h) => h.trim());
    const dataLines = lines.slice(1).filter((l) => l.trim());
    const nameIdx = header.indexOf('기관명');
    const skipCols = new Set(['응답번호', '제출시간', '기관명']);
    const questionCount = header.filter((h) => !skipCols.has(h)).length;

    const nameSet = new Set(agencyNames);
    let matched = 0;
    const unmatchedSet = new Set();
    dataLines.forEach((line) => {
      const cols = line.split(',');
      const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : '';
      if (name && nameSet.has(name)) {
        matched++;
      } else if (name) {
        unmatchedSet.add(name);
      }
    });
    setPreview({
      rows: dataLines.length,
      matched,
      unmatched: [...unmatchedSet],
      questions: questionCount,
    });
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setCsvText(text);
      parsePreview(text);
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
    if (!csvText) {
      alert('CSV 파일을 선택해주세요.');
      return;
    }
    try {
      const res = await api.post('/api/responses/upload', {
        session_id: Number(sessionId),
        csv_text: csvText,
      });
      setResult(res.data);
    } catch (err) {
      console.error('업로드 실패:', err);
      const msg = err.response?.data?.error || err.message;
      alert(`업로드 실패: ${msg}`);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setCsvText('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>CSV 업로드</h2>

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
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <div>
              총 응답 행: <strong>{preview.rows}</strong>건
            </div>
            <div>
              DB 매칭 성공: <strong style={{ color: '#22c55e' }}>{preview.matched}</strong>건
            </div>
            <div>
              매칭 실패: <strong style={{ color: preview.unmatched?.length ? '#ef4444' : '#9ca3af' }}>{preview.unmatched?.length ?? 0}</strong>개 기관
            </div>
            <div>
              문항 수: <strong>{preview.questions}</strong>개
            </div>
          </div>
          {preview.unmatched?.length > 0 && (
            <div style={{ marginTop: 12, padding: 12, backgroundColor: '#fef2f2', borderRadius: 6, fontSize: 13, color: '#b91c1c', maxHeight: 120, overflowY: 'auto' }}>
              <strong>DB에 없는 기관명 (건너뜀):</strong>
              {preview.unmatched.map((n, i) => (
                <span key={i}> {n}{i < preview.unmatched.length - 1 ? ',' : ''}</span>
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
          저장 완료 - 삽입: <strong>{result.inserted ?? 0}</strong>건 / 건너뜀:{' '}
          <strong>{result.skipped ?? 0}</strong>건 / 오류:{' '}
          <strong>{result.errors?.length ?? 0}</strong>건
          {result.errors?.length > 0 && (
            <div style={{ marginTop: 12, maxHeight: 160, overflowY: 'auto', fontSize: 13, color: '#b91c1c' }}>
              {result.errors.slice(0, 20).map((e, i) => (
                <div key={i}>{e.row}행: {e.message}</div>
              ))}
              {result.errors.length > 20 && <div>...외 {result.errors.length - 20}건</div>}
            </div>
          )}
          {result.warnings?.length > 0 && (
            <div style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#fffbeb',
              border: '1px solid #fbbf24',
              borderRadius: 6,
              fontSize: 13,
              color: '#92400e',
            }}>
              {result.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
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
      </div>
    </div>
  );
}

export default CsvUpload;
