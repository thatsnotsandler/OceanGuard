import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'OceanGuard – Protect Our Oceans',
  description: 'Decentralized ocean protection action certification platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wave-bg">
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        
        <nav style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          background: 'rgba(10, 25, 41, 0.8)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(94, 234, 212, 0.2)'
        }}>
          <div className="container" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px 24px'
          }}>
            <Link href="/" style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              textDecoration: 'none', 
              color: 'var(--wave-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '28px' }}>🌊</span>
              OceanGuard
            </Link>
            
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link href="/" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                Home
              </Link>
              <Link href="/my-actions" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                My Actions
              </Link>
              <Link href="/new" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                New Action
              </Link>
              <Link href="/badges" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                Badges
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
