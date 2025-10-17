"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useOceanGuard } from "@/hooks/useOceanGuard";
import { useRouter } from "next/navigation";

export default function MyActionsPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const eth = (window as any).ethereum as ethers.Eip1193Provider;
      setProvider(eth);
      eth.request({ method: "eth_chainId" }).then((cid) => {
        setChainId(parseInt(cid as string, 16));
      });
    }
  }, []);

  const ocean = useOceanGuard({ provider, chainId });

  useEffect(() => {
    if (ocean.signer && ocean.contractAddress) {
      ocean.refreshMyActions();
    }
  }, [ocean.signer, ocean.contractAddress]);

  const stats = useMemo(() => {
    const total = ocean.myActions?.length || 0;
    const verified = (ocean.myActions || []).filter(a => 
      ocean.decrypted[a.id] !== undefined && Number(ocean.decrypted[a.id]) > 0
    ).length;
    return { total, verified };
  }, [ocean.myActions, ocean.decrypted]);

  return (
    <main className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '16px', color: 'var(--wave-cyan)' }}>
          My Ocean Actions
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '16px' }}>
          Track your contributions to ocean conservation
        </p>
      </div>

      {!ocean.signer ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔌</div>
          <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Connect Your Wallet</h3>
          <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>
            Please connect your wallet to view your actions
          </p>
        </div>
      ) : !ocean.contractAddress ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Contract Not Found</h3>
          <p style={{ color: 'var(--text-dim)' }}>
            OceanGuard contract not deployed on this network
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
              <div style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '8px' }}>Total Actions</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--wave-cyan)' }}>{stats.total}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '8px' }}>Verified</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--green-glow)' }}>{stats.verified}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '8px' }}>Reputation</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--light-cyan)' }}>
                {stats.total + stats.verified}
              </div>
            </div>
          </div>

          {/* Actions Timeline */}
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Action Timeline</h2>
              <button onClick={() => ocean.refreshMyActions()} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                Refresh
              </button>
            </div>

            {ocean.myActions && ocean.myActions.length > 0 ? (
              <div className="timeline">
                {ocean.myActions.map((action) => (
                  <div key={action.id} className="timeline-item">
                    <div className="card" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                            Action #{action.id}
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                            {new Date(Number(action.timestamp) * 1000).toLocaleString()}
                          </p>
                        </div>
                        <span className={`badge ${action.visibility ? 'badge-verified' : 'badge-anon'}`}>
                          {action.visibility ? 'Public' : 'Anonymous'}
                        </span>
                      </div>

                      <div style={{ 
                        background: 'rgba(10, 25, 41, 0.5)', 
                        borderRadius: '8px', 
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        wordBreak: 'break-all'
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Hash:</span>{' '}
                          <span style={{ color: 'var(--wave-cyan)' }}>{action.actionHash.slice(0, 20)}...</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-dim)' }}>URI:</span>{' '}
                          <span style={{ color: 'var(--wave-cyan)' }}>{action.metadataURI}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Endorsements:</span>
                        {ocean.decrypted[action.id] !== undefined ? (
                          <span className="badge badge-verified" style={{ fontSize: '14px', padding: '6px 12px' }}>
                            {ocean.decrypted[action.id].toString()} ✓
                          </span>
                        ) : (
                          <button 
                            onClick={() => ocean.decryptEndorsement(action.id, action.endorsementHandle)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Decrypt Count
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => ocean.endorse(action.id)}
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          Endorse
                        </button>
                        {ocean.decrypted[action.id] !== undefined && (
                          <button
                            onClick={() => router.push(`/actions/${action.id}`)}
                            className="btn btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌊</div>
                <p>No actions recorded yet. Start making a difference!</p>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

