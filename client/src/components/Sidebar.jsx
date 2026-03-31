import { NavLink } from 'react-router-dom';

const menuItems = [
  { path: '/agencies', label: '기관 관리' },
  { path: '/upload', label: 'CSV 업로드' },
  { path: '/participants', label: '신청자 명단' },
  { path: '/status', label: '응답 현황' },
  { divider: true },
  { path: '/trends', label: '시계열 추세' },
  { path: '/compare', label: '기관 비교' },
  { path: '/linkage', label: '이행 확인' },
];

function Sidebar() {
  return (
    <div
      style={{
        width: 220,
        minHeight: '100vh',
        backgroundColor: '#1e3a5f',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '24px 20px',
          fontSize: 20,
          fontWeight: 700,
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        설문시스템
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
        {menuItems.map((item, index) =>
          item.divider ? (
            <div
              key={`divider-${index}`}
              style={{
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.15)',
                margin: '8px 16px',
              }}
            />
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'block',
                padding: '12px 20px',
                color: '#fff',
                textDecoration: 'none',
                backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 15,
                transition: 'background-color 0.15s',
              })}
            >
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
}

export default Sidebar;
