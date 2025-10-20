import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 扫描 oceanguard-hardhat/deployments/*/OceanGuard.json，生成 abi 与地址映射
const root = join(process.cwd(), "..", "oceanguard-hardhat", "deployments");

const networks = (() => {
  try { return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name); } catch { return []; }
})();

const deployments = [];
for (const net of networks) {
  try {
    const p = join(root, net, "OceanGuard.json");
    const json = JSON.parse(readFileSync(p, "utf8"));
    deployments.push({ net, json });
  } catch {}
}

if (deployments.length === 0) {
  console.error("OceanGuard deployments not found. Run hardhat deploy first.");
  process.exit(1);
}

// 选择优先写入的 ABI：优先 sepolia，否则取第一个
const preferred = deployments.find((d) => d.net === "sepolia") || deployments[0];

const abiOut = join(process.cwd(), "abi", "OceanGuardABI.ts");
const addrOut = join(process.cwd(), "abi", "OceanGuardAddresses.ts");

const abiCode = `export const OceanGuardABI = {\n  abi: ${JSON.stringify(preferred.json.abi, null, 2)}\n};\n`;
writeFileSync(abiOut, abiCode);

const netToId = { sepolia: 11155111, hardhat: 31337, anvil: 31337 };

const mapping = deployments.reduce((acc, d) => {
  const id = netToId[d.net] ?? d.json.chainId;
  if (!id) return acc;
  acc[String(id)] = {
    address: d.json.address,
    chainId: id,
    chainName: d.net,
  };
  return acc;
}, {});

const addrCode = `export const OceanGuardAddresses: Record<string, { address: string; chainId: number; chainName?: string }> = ${JSON.stringify(mapping, null, 2)};\n`;
writeFileSync(addrOut, addrCode);

console.log("ABI & addresses updated for:", Object.values(mapping).map(m => `${m.chainName}:${m.address}`).join(", "));


