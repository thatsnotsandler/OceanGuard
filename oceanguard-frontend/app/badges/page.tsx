"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers, Contract } from "ethers";
import { OceanGuardAddresses } from "@/abi/OceanGuardAddresses";
import { OceanGuardABI } from "@/abi/OceanGuardABI";

const BADGES = [
  { id: 1, name: "Ocean Newbie", icon: "🌊", desc: "Record at least 1 action" },
  { id: 2, name: "Sea Turtle Rescuer", icon: "🐢", desc: "Participated in animal rescue operations" },
  { id: 3, name: "Anti-Plastic Pioneer", icon: "🧴", desc: "Removed 100kg+ of plastic waste" },
  { id: 4, name: "Ocean Educator", icon: "📚", desc: "Conducted 3+ educational sessions" },
  { id: 5, name: "Marine Researcher", icon: "🔬", desc: "Contributed to scientific observations" },
  { id: 6, name: "Wave Maker", icon: "⚡", desc: "Inspired 10+ people to take action" },
];

export default function BadgesPage() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [claimable, setClaimable] = useState<Record<number, boolean>>({});
  const [claimed, setClaimed] = useState<Record<number, boolean>>({});
  const [userActions, setUserActions] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      checkConnection();
    }
  }, []);

  // centralized state loader
  const loadState = async () => {
    try {
      if (!connected || !chainId) return;
      const entry = (OceanGuardAddresses as any)[String(chainId)];
      if (!entry?.address) return;
      setLoading(true);
      const browser = new ethers.BrowserProvider((window as any).ethereum);
      const c = new Contract(entry.address, OceanGuardABI.abi, browser);
      // badge 1 states
      const has = await c.hasBadge(address, 1);
      // optional cross-check: user's actions length
      let count = 0;
      try {
        const ids: bigint[] = await c.getActionsByUser(address);
        count = Number(ids.length);
      } catch {}
      setUserActions(count);
      const isClaimableLocal = !Boolean(has) && count > 0;
      setClaimed({ 1: Boolean(has) });
      setClaimable({ 1: isClaimableLocal });
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadState(); }, [connected, chainId, address]);

  const checkConnection = async () => {
    if (!(window as any).ethereum) return;
    const eth = (window as any).ethereum;
    const accounts = await eth.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      setAddress(accounts[0]);
      setConnected(true);
    }
    const cid = await eth.request({ method: "eth_chainId" });
    setChainId(parseInt(cid as string, 16));
  };

  return (
    <main className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '16px', color: 'var(--wave-cyan)' }}>
          Green Badges
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '16px' }}>
          Earn recognition for your ocean conservation achievements
        </p>
      </div>

      {!connected ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏆</div>
          <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Connect to View Badges</h3>
          <p style={{ color: 'var(--text-dim)' }}>
            Connect your wallet to see your achievements
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div className="card">
              <div style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '8px' }}>Total Badges</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--wave-cyan)' }}>
                {Object.values(claimed).filter(Boolean).length} / {BADGES.length}
              </div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '8px' }}>Next Milestone</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--green-glow)', marginTop: '8px' }}>
                {BADGES.find(b => !claimed[b.id as number])?.name || 'All Complete!'}
              </div>
              <div style={{ marginTop: '8px', color: 'var(--text-dim)', fontSize: '12px' }}>
                {loading ? 'Checking eligibility…' : `Your actions on chain: ${userActions}`}
              </div>
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary" onClick={loadState} style={{ padding: '6px 12px', fontSize: '12px' }}>Refresh</button>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="waterfall">
            {BADGES.map((badge) => (
              <div 
                key={badge.id} 
                className="card"
                style={{ 
                  opacity: claimed[badge.id] ? 1 : 0.5,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {claimed[badge.id] && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'var(--green-glow)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    ✓
                  </div>
                )}
                
                <div style={{ 
                  fontSize: '64px', 
                  marginBottom: '16px',
                  textAlign: 'center',
                  filter: claimed[badge.id] ? 'none' : 'grayscale(100%)'
                }}>
                  {badge.icon}
                </div>
                
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: claimed[badge.id] ? 'var(--light-cyan)' : 'var(--text-dim)'
                }}>
                  {badge.name}
                </h3>
                
                <p style={{ 
                  color: 'var(--text-dim)', 
                  fontSize: '14px', 
                  lineHeight: '1.6'
                }}>
                  {badge.desc}
                </p>

                {claimed[badge.id] && (
                  <div style={{
                    marginTop: '16px',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--green-glow)',
                    textAlign: 'center'
                  }}>
                    Unlocked
                  </div>
                )}

                {badge.id === 1 && !claimed[1] && (
                  <div style={{ marginTop: '12px' }}>
                    {claimable[1] ? (
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            if (!chainId) return;
                            const entry = (OceanGuardAddresses as any)[String(chainId)];
                            if (!entry?.address) return;
                            const browser = new ethers.BrowserProvider((window as any).ethereum);
                            const signer = await browser.getSigner();
                            const c = new Contract(entry.address, OceanGuardABI.abi, signer);
                            const tx = await c.claimBadge(1);
                            alert('Claim submitted: ' + tx.hash);
                            await tx.wait();
                            await loadState();
                          } catch (e: any) {
                            alert(e?.shortMessage || e?.message || String(e));
                          }
                        }}
                      >
                        Claim
                      </button>
                    ) : (
                      <button className="btn btn-secondary" disabled style={{ opacity: 0.7 }}>
                        Record 1 action to unlock
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Coming Soon */}
          <div className="card" style={{ marginTop: '48px', textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎁</div>
            <h3 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--wave-cyan)' }}>
              More Badges Coming Soon
            </h3>
            <p style={{ color: 'var(--text-dim)' }}>
              We're designing new achievements to celebrate your conservation journey
            </p>
          </div>
        </>
      )}
    </main>
  );
}

