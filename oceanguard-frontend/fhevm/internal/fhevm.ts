import { Eip1193Provider } from "ethers";

declare global {
  interface Window {
    relayerSDK: any & { __initialized__?: boolean };
  }
}

export async function createFhevmInstance(params: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
}) {
  const { provider, mockChains } = params;

  const chainId = await (async () => {
    if (typeof provider === "string") return 0;
    const cid = await provider.request!({ method: "eth_chainId" });
    return parseInt(cid as string, 16);
  })();

  const mocks = { 31337: "http://localhost:8545", ...(mockChains ?? {}) };
  const isMock = Object.keys(mocks).some((k) => Number(k) === chainId);

  if (isMock) {
    const url = mocks[chainId as keyof typeof mocks];
    const { fhevmMockCreateInstance } = await import("./mock/fhevmMock");
    // 直接调用本地/远程 JSON-RPC，无需依赖 Next API 路由（支持静态导出）
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "fhevm_relayer_metadata", params: [] })
    });
    const json = await res.json();
    const metadata = json?.result ?? json; // 容错
    return fhevmMockCreateInstance({ rpcUrl: url, chainId, metadata });
  }

  // 动态加载 UMD
  if (!("relayerSDK" in window)) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";
      s.type = "text/javascript";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Relayer SDK"));
      document.head.appendChild(s);
    });
  }

  if (!window.relayerSDK.__initialized__) {
    const ok = await window.relayerSDK.initSDK();
    if (!ok) throw new Error("relayerSDK.initSDK failed");
    window.relayerSDK.__initialized__ = true;
  }

  const config = { ...window.relayerSDK.SepoliaConfig, network: provider };
  const instance = await window.relayerSDK.createInstance(config);
  return instance;
}




