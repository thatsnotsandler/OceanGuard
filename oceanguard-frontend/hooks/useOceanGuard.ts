"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Contract, JsonRpcProvider, ethers } from "ethers";

import { FHEVM } from "@/fhevm/types";
import { createFhevmInstance } from "@/fhevm/internal/fhevm";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

import { OceanGuardABI } from "@/abi/OceanGuardABI";
import { OceanGuardAddresses } from "@/abi/OceanGuardAddresses";

type ActionView = {
  id: number;
  owner: string;
  actionHash: string;
  metadataURI: string;
  timestamp: string;
  visibility: boolean;
  endorsementHandle: string;
};

export function useOceanGuard(params: {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
}) {
  const { provider, chainId } = params;

  const [instance, setInstance] = useState<FHEVM | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [readonly, setReadonly] = useState<ethers.ContractRunner | undefined>(undefined);
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
  const [myActions, setMyActions] = useState<ActionView[]>([]);
  const [decrypted, setDecrypted] = useState<Record<number, bigint>>({});

  useEffect(() => {
    if (!provider || !chainId) return;
    const run = async () => {
      try {
        const inst = await createFhevmInstance({ provider, mockChains: { 31337: "http://localhost:8545" } });
        setInstance(inst as unknown as FHEVM);

        const ethersProvider = new ethers.BrowserProvider(provider);
        const s = await ethersProvider.getSigner();
        setSigner(s);
        setReadonly(ethersProvider);

        const addrEntry = (OceanGuardAddresses as any)[String(chainId)];
        if (addrEntry && addrEntry.address) setContractAddress(addrEntry.address);
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [provider, chainId]);

  const recordSampleAction = useCallback(async () => {
    if (!signer || !contractAddress) return;
    const c = new Contract(contractAddress, OceanGuardABI.abi, signer);
    const meta = {
      title: "海滩清洁行动",
      description: "与志愿者一起清洁海岸线",
      location: "鼓浪屿",
      date: Date.now(),
      cid: "ipfs://sample",
      type: "clean",
      participants: 3,
      visibility: true
    };
    const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(meta)));
    const tx = await c.recordAction(hash, meta.cid, true);
    await tx.wait();
  }, [signer, contractAddress]);

  const refreshMyActions = useCallback(async () => {
    if (!readonly || !signer || !contractAddress) return;
    const c = new Contract(contractAddress, OceanGuardABI.abi, readonly);
    const owner = await signer.getAddress();
    const ids: bigint[] = await c.getActionsByUser(owner);
    const list: ActionView[] = [];
    for (const id of ids) {
      const r = await c.getAction(id);
      list.push({
        id: Number(id),
        owner: r[0],
        actionHash: r[1],
        metadataURI: r[2],
        timestamp: String(r[3]),
        visibility: Boolean(r[4]),
        endorsementHandle: r[5]
      });
    }
    setMyActions(list);
  }, [readonly, signer, contractAddress]);

  const endorse = useCallback(async (id: number) => {
    if (!signer || !contractAddress) return;
    const c = new Contract(contractAddress, OceanGuardABI.abi, signer);
    const tx = await c.endorseAction(id);
    await tx.wait();
    await refreshMyActions();
  }, [signer, contractAddress, refreshMyActions]);

  const decryptEndorsement = useCallback(async (id: number, handle: string) => {
    if (!instance || !signer || !contractAddress) return;
    const sig = await FhevmDecryptionSignature.loadOrSign(
      instance as any,
      [contractAddress as `0x${string}`],
      signer as any,
      { getItem: () => null, setItem: () => {}, removeItem: () => {} } as any
    );
    if (!sig) return;
    const res = await (instance as any).userDecrypt(
      [{ handle, contractAddress }],
      sig.privateKey,
      sig.publicKey,
      sig.signature,
      sig.contractAddresses,
      sig.userAddress,
      sig.startTimestamp,
      sig.durationDays
    );
    setDecrypted((prev) => ({ ...prev, [id]: res[handle] }));
  }, [instance, signer, contractAddress]);

  return { instance, signer, readonly, contractAddress, myActions, decrypted, recordSampleAction, refreshMyActions, endorse, decryptEndorsement };
}




