"use client";

import { useEffect, useState, useMemo } from "react";
import { ethers, Contract } from "ethers";
import { OceanGuardABI } from "@/abi/OceanGuardABI";
import { OceanGuardAddresses } from "@/abi/OceanGuardAddresses";
import { useRouter } from "next/navigation";

export default function NewActionPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [actionType, setActionType] = useState("cleanup");
  const [participants, setParticipants] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const eth = (window as any).ethereum as ethers.Eip1193Provider;
      setProvider(eth);
    }
  }, []);

  useEffect(() => {
    if (!provider) return;
    (async () => {
      try {
        const p = new ethers.BrowserProvider(provider);
        const s = await p.getSigner();
        setSigner(s);
        const cidHex = await provider.request?.({ method: "eth_chainId" });
        setChainId(cidHex ? parseInt(cidHex as string, 16) : undefined);
      } catch (e) {
        console.error("Failed to get signer:", e);
      }
    })();
  }, [provider]);

  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    const entry = (OceanGuardAddresses as any)[String(chainId)];
    return entry?.address as string | undefined;
  }, [chainId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setCid(""); // Reset CID when new file selected
    }
  };

  const uploadToIPFS = async () => {
    if (!imageFile) {
      alert("Please select a file first");
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxNTdkZjg5OS0wZjNhLTQxYTUtOTEyMi02YTAxNGM1ZDVjNmQiLCJlbWFpbCI6InN1bmpmNjI2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI0M2U5N2ZmMDI1YmUzY2Q3NzJiMiIsInNjb3BlZEtleVNlY3JldCI6IjlhMTViY2I2ZmZkZjE4YWVlZDUwM2I5Zjk1ZTMzZDIyOTBjYTI2YmM2MzU3NWI2ODM1ODkyMGRjNzZiMjZmYTciLCJleHAiOjE3OTE1OTQwNzB9.bLafx4ZoPiKe8Yew08DlqFHhNW7Aaz74dLCoOxc_264`
        },
        body: formData
      });
      
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
      
      const json = await res.json();
      if (json.IpfsHash) {
        const ipfsUrl = `ipfs://${json.IpfsHash}`;
        setCid(ipfsUrl);
        alert(`Upload successful! IPFS: ${ipfsUrl}`);
      } else {
        throw new Error("No IPFS hash returned");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !contractAddress) {
      alert("Please connect wallet and ensure contract is deployed");
      return;
    }
    
    setSubmitting(true);
    try {
      const metadata = { 
        title, 
        description, 
        location, 
        date: date || new Date().toISOString(), 
        type: actionType,
        participants: parseInt(participants) || 1,
        mediaCid: cid || '', 
        visibility 
      };

      // 1) 上传 metadata JSON 到 IPFS（Pinata）
      const jsonRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxNTdkZjg5OS0wZjNhLTQxYTUtOTEyMi02YTAxNGM1ZDVjNmQiLCJlbWFpbCI6InN1bmpmNjI2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI0M2U5N2ZmMDI1YmUzY2Q3NzJiMiIsInNjb3BlZEtleVNlY3JldCI6IjlhMTViY2I2ZmZkZjE4YWVlZDUwM2I5Zjk1ZTMzZDIyOTBjYTI2YmM2MzU3NWI2ODM1ODkyMGRjNzZiMjZmYTciLCJleHAiOjE3OTE1OTQwNzB9.bLafx4ZoPiKe8Yew08DlqFHhNW7Aaz74dLCoOxc_264`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pinataContent: metadata })
      });

      if (!jsonRes.ok) {
        const t = await jsonRes.text();
        throw new Error(`pinJSON failed: ${t}`);
      }
      const json = await jsonRes.json();
      const metadataURI = json.IpfsHash ? `ipfs://${json.IpfsHash}` : 'ipfs://placeholder';

      // 2) 计算 hash（对 metadata JSON 串本身哈希）
      const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)));

      // 3) 上链
      const c = new Contract(contractAddress, OceanGuardABI.abi, signer);
      const tx = await c.recordAction(hash, metadataURI, visibility);
      
      alert('Transaction submitted! Waiting for confirmation...');
      await tx.wait();
      
      alert('Action recorded successfully!');
      router.push('/my-actions');
    } catch (e: any) {
      console.error("Submit error:", e);
      alert(`Transaction failed: ${e.message || String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '720px' }}>
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '16px', color: 'var(--wave-cyan)' }}>
          Record New Action
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '16px' }}>
          Share your ocean protection efforts with the community
        </p>
      </div>

      {!signer ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔌</div>
          <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Connect Your Wallet</h3>
          <p style={{ color: 'var(--text-dim)' }}>
            Please connect your wallet to record an action
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Action Title *
              </label>
              <input 
                placeholder="e.g. Beach Cleanup at Santa Monica" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Description *
              </label>
              <textarea 
                placeholder="Describe what you did and its impact..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Location & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Location
                </label>
                <input 
                  placeholder="e.g. Miami Beach, FL" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Date
                </label>
                <input 
                  type="date"
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Action Type & Participants */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Action Type
                </label>
                <select 
                  value={actionType} 
                  onChange={(e) => setActionType(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    background: 'rgba(10, 25, 41, 0.5)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    color: 'var(--text-light)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="cleanup">Cleanup</option>
                  <option value="rescue">Animal Rescue</option>
                  <option value="education">Education</option>
                  <option value="research">Research</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Participants
                </label>
                <input 
                  type="number"
                  min="1"
                  value={participants} 
                  onChange={(e) => setParticipants(e.target.value)}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Media (Photo/Video)
              </label>
              <div style={{ 
                border: '2px dashed var(--card-border)', 
                borderRadius: '12px', 
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(10, 25, 41, 0.3)'
              }}>
                {!imageFile ? (
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                    <div style={{ color: 'var(--wave-cyan)', marginBottom: '8px' }}>Click to upload</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '12px' }}>PNG, JPG, GIF up to 10MB</div>
                    <input 
                      type="file" 
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  <div>
                    <div style={{ marginBottom: '12px', color: 'var(--wave-cyan)', fontSize: '14px' }}>
                      📎 {imageFile.name}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        onClick={uploadToIPFS} 
                        disabled={uploading || !!cid}
                        className="btn btn-primary"
                        style={{ padding: '10px 20px', fontSize: '14px' }}
                      >
                        {uploading ? 'Uploading...' : cid ? '✓ Uploaded' : 'Upload to IPFS'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setCid("");
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '10px 20px', fontSize: '14px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {cid && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--green-glow)',
                  wordBreak: 'break-all'
                }}>
                  ✓ Uploaded: {cid}
                </div>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={visibility} 
                  onChange={(e) => setVisibility(e.target.checked)}
                  style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                    Public Action
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    Allow others to view your action details
                  </div>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={submitting || !title || !description}
              className="btn btn-primary"
              style={{ 
                padding: '16px', 
                fontSize: '16px', 
                marginTop: '16px',
                opacity: (submitting || !title || !description) ? 0.5 : 1,
                cursor: (submitting || !title || !description) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Recording...' : 'Record to Blockchain'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
