"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { OceanGuardAddresses } from "@/abi/OceanGuardAddresses";
import { OceanGuardABI } from "@/abi/OceanGuardABI";
import { Contract } from "ethers";

export default function HomePage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [address, setAddress] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setProvider((window as any).ethereum);
      checkConnection();
    }
  }, []);

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

  const connect = async () => {
    if (!provider) return;
    try {
      const accounts = await provider.request?.({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0] as string);
        setConnected(true);
      }
      const cid = await provider.request?.({ method: "eth_chainId" });
      setChainId(cid ? parseInt(cid as string, 16) : undefined);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch recent actions from chain (last 3 ids)
  useEffect(() => {
    (async () => {
      try {
        if (!chainId) return;
        const entry = (OceanGuardAddresses as any)[String(chainId)];
        if (!entry?.address) return;

        const browser = new ethers.BrowserProvider((window as any).ethereum);
        const c = new Contract(entry.address, OceanGuardABI.abi, browser);

        const total = await c.getTotalActions();
        const arr: any[] = [];
        const start = Math.max(1, Number(total) - 2);
        for (let id = Number(total); id >= start; id--) {
          const r = await c.getAction(id);
          arr.push({
            id,
            owner: r[0] as string,
            actionHash: r[1] as string,
            metadataURI: r[2] as string,
            timestamp: Number(r[3]),
            visibility: Boolean(r[4])
          });
        }
        setRecent(arr.reverse());
      } catch (e) {
        // ignore on first load
      }
    })();
  }, [chainId]);

  const endorse = async (id: number) => {
    try {
      if (!provider || !chainId) {
        alert('Please connect wallet');
        return;
      }
      const entry = (OceanGuardAddresses as any)[String(chainId)];
      if (!entry?.address) return;
      const browser = new ethers.BrowserProvider(provider);
      const signer = await browser.getSigner();
      const c = new Contract(entry.address, OceanGuardABI.abi, signer);
      const tx = await c.endorseAction(id);
      alert('Transaction submitted: ' + tx.hash);
      await tx.wait();
      alert('Thanks for endorsing!');
    } catch (e: any) {
      alert(e?.shortMessage || e?.message || String(e));
    }
  };

  return (
    <main className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '80px' }}>
        <h1 style={{ 
          fontSize: '56px', 
          fontWeight: 700, 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, var(--wave-cyan), var(--green-glow))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Protect Our Oceans
        </h1>
        <p style={{ 
          fontSize: '20px', 
          color: 'var(--text-dim)', 
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px'
        }}>
          Every ocean protection action, permanently recorded on-chain
        </p>

        {!connected ? (
          <button onClick={connect} className="btn btn-primary" style={{ fontSize: '16px', padding: '16px 48px' }}>
            Connect Wallet
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/new">
              <button className="btn btn-primary" style={{ fontSize: '16px', padding: '16px 32px' }}>
                Record Action
              </button>
            </Link>
            <Link href="/my-actions">
              <button className="btn btn-secondary" style={{ fontSize: '16px', padding: '16px 32px' }}>
                My Actions
              </button>
            </Link>
          </div>
        )}

        {connected && (
          <div style={{ 
            marginTop: '24px', 
            padding: '12px 24px', 
            background: 'rgba(45, 212, 191, 0.1)',
            border: '1px solid rgba(45, 212, 191, 0.3)',
            borderRadius: '12px',
            display: 'inline-block',
            fontSize: '14px',
            color: 'var(--wave-cyan)'
          }}>
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </section>

      {/* Features */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ 
          fontSize: '32px', 
          fontWeight: 600, 
          marginBottom: '40px', 
          textAlign: 'center',
          color: 'var(--wave-cyan)'
        }}>
          Why OceanGuard?
        </h2>
        <div className="waterfall">
          {[
            { icon: '🔒', title: 'Immutable', desc: 'Actions are permanently recorded on blockchain' },
            { icon: '🌐', title: 'Transparent', desc: 'All data is publicly verifiable' },
            { icon: '🔐', title: 'Private', desc: 'Encrypted endorsement counts via FHEVM' },
            { icon: '🎖️', title: 'Rewarding', desc: 'Earn badges and reputation for your efforts' }
          ].map((f, i) => (
            <div key={i} className="card">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: 'var(--light-cyan)' }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Actions (from chain) */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--wave-cyan)' }}>
            Recent Actions
          </h2>
          <Link href="/my-actions" style={{ color: 'var(--wave-cyan)', fontSize: '14px', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>
        <div className="waterfall">
          {recent.length === 0 ? (
            <div className="card" style={{ padding: '24px' }}>No recent actions.</div>
          ) : (
            recent.map((a) => (
              <div key={a.id} className="card">
                <div style={{ 
                  height: '160px',
                  background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(16, 185, 129, 0.1))',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}></div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  Action #{a.id}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  {new Date(a.timestamp * 1000).toLocaleString()}
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                  {a.metadataURI}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <Link href={`/actions?id=${a.id}`}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View</button>
                  </Link>
                  {address && a.owner && address.toLowerCase() === a.owner.toLowerCase() ? (
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', opacity: 0.6, cursor: 'not-allowed' }} disabled>
                      Own Action
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => endorse(a.id)}
                      disabled={!connected}
                    >
                      ❤ Endorse
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
