import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AgencyManager from './pages/AgencyManager';
import CsvUpload from './pages/CsvUpload';
import ParticipantUpload from './pages/ParticipantUpload';
import ResponseStatus from './pages/ResponseStatus';
import Trends from './pages/Trends';
import Compare from './pages/Compare';
import Linkage from './pages/Linkage';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '24px 32px', backgroundColor: '#f9fafb' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/agencies" replace />} />
            <Route path="/agencies" element={<AgencyManager />} />
            <Route path="/upload" element={<CsvUpload />} />
            <Route path="/participants" element={<ParticipantUpload />} />
            <Route path="/status" element={<ResponseStatus />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/linkage" element={<Linkage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
