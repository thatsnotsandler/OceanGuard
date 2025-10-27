"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers, Contract } from "ethers";
import { useSearchParams } from "next/navigation";
import { OceanGuardABI } from "@/abi/OceanGuardABI";
import { OceanGuardAddresses } from "@/abi/OceanGuardAddresses";

export default function ActionDetailsPage() {
  const search = useSearchParams();
  const idParam = search.get("id");
  const id = Number(idParam || 0);

  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [readonly, setReadonly] = useState<ethers.ContractRunner | undefined>(undefined);
  const [action, setAction] = useState<any | undefined>(undefined);
  const [metadata, setMetadata] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const eth = (window as any).ethereum as ethers.Eip1193Provider;
      setProvider(eth);
    }
  }, []);

  useEffect(() => {
    if (!provider) return;
    (async () => {
      const cidHex = await provider.request?.({ method: "eth_chainId" });
      setChainId(cidHex ? parseInt(cidHex as string, 16) : undefined);
      setReadonly(new ethers.BrowserProvider(provider));
    })();
  }, [provider]);

  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    const entry = (OceanGuardAddresses as any)[String(chainId)];
    return entry?.address as string | undefined;
  }, [chainId]);

  useEffect(() => {
    if (!readonly || !contractAddress || !id) return;
    (async () => {
      const c = new Contract(contractAddress, OceanGuardABI.abi, readonly);
      const r = await c.getAction(id);
      setAction({
        id,
        owner: r[0],
        actionHash: r[1],
        metadataURI: r[2],
        timestamp: String(r[3]),
        visibility: Boolean(r[4]),
        endorsementHandle: r[5]
      });

      try {
        const uri = String(r[2] || "");
        if (uri.startsWith("ipfs://")) {
          const url = `https://gateway.pinata.cloud/ipfs/${uri.replace("ipfs://", "")}`;
          const res = await fetch(url, { cache: 'no-store' });
          const json = await res.json();
          setMetadata(json);
        }
      } catch {}
    })();
  }, [readonly, contractAddress, id]);

  const ipfsGatewayUrl = action?.metadataURI?.startsWith("ipfs://")
    ? `https://gateway.pinata.cloud/ipfs/${action.metadataURI.replace("ipfs://", "")}`
    : action?.metadataURI;

  return (
    <main className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--wave-cyan)' }}>Action Details</h1>
        <p style={{ color: 'var(--text-dim)' }}>Use /actions?id=123 to view details</p>
      </div>

      {!id ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Missing id</div>
      ) : !action ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Action #{action.id}</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{new Date(Number(action.timestamp) * 1000).toLocaleString()}</div>
            </div>
            <span className={`badge ${action.visibility ? 'badge-verified' : 'badge-anon'}`}>
              {action.visibility ? 'Public' : 'Anonymous'}
            </span>
          </div>

          <div style={{ background: 'rgba(10, 25, 41, 0.5)', borderRadius: '8px', padding: '12px', fontSize: '13px', wordBreak: 'break-all', marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Owner:</span> {action.owner}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Hash:</span> {action.actionHash}
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>URI:</span> {action.metadataURI}
            </div>
          </div>

          {metadata && (
            <div className="card" style={{ padding: '16px', background: 'rgba(30,58,95,0.35)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--light-cyan)', marginBottom: '12px' }}>Submitted Metadata</h3>
              {metadata.title && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Title:</span> {metadata.title}
                </div>
              )}
              {metadata.description && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Description:</span> {metadata.description}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                {metadata.location && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Location:</span> {metadata.location}
                  </div>
                )}
                {metadata.date && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Date:</span> {metadata.date}
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                {metadata.type && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Type:</span> {metadata.type}
                  </div>
                )}
                {metadata.participants !== undefined && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Participants:</span> {metadata.participants}
                  </div>
                )}
              </div>
              {metadata.mediaCid && (
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Media:</span> <a href={`https://gateway.pinata.cloud/ipfs/${String(metadata.mediaCid).replace('ipfs://','')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--wave-cyan)', textDecoration: 'none' }}>Open media</a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}


