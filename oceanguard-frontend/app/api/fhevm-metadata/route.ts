import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rpcUrl = url.searchParams.get("rpcUrl");
  if (!rpcUrl) return NextResponse.json({ error: "missing rpcUrl" }, { status: 400 });

  const provider = new JsonRpcProvider(rpcUrl);
  try {
    const version = await provider.send("fhevm_relayer_metadata", []);
    return NextResponse.json(version);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  } finally {
    provider.destroy();
  }
}






