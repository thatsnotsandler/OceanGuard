import { ethers } from "ethers";

export class FhevmDecryptionSignature {
  publicKey!: string;
  privateKey!: string;
  signature!: string;
  startTimestamp!: number;
  durationDays!: number;
  userAddress!: `0x${string}`;
  contractAddresses!: `0x${string}`[];
  eip712!: any;

  static async loadOrSign(
    instance: any,
    contractAddresses: string[],
    signer: ethers.Signer,
    storage: { getItem: (k: string) => any; setItem: (k: string, v: any) => any }
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = (await signer.getAddress()) as `0x${string}`;
    const key = `sig:${userAddress}:${contractAddresses.join(",")}`;
    const cached = storage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const s = new FhevmDecryptionSignature();
        Object.assign(s, parsed);
        if (Date.now() / 1000 < s.startTimestamp + s.durationDays * 86400) return s;
      } catch {}
    }

    const kp = instance.generateKeypair ? instance.generateKeypair() : { publicKey: "", privateKey: "" };
    const start = Math.floor(Date.now() / 1000);
    const durationDays = 365;
    const eip712 = instance.createEIP712(kp.publicKey, contractAddresses, start, durationDays);
    const signature = await (signer as any).signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message
    );

    const s = new FhevmDecryptionSignature();
    Object.assign(s, {
      publicKey: kp.publicKey,
      privateKey: kp.privateKey,
      signature,
      startTimestamp: start,
      durationDays,
      userAddress,
      contractAddresses,
      eip712
    });
    storage.setItem(key, JSON.stringify(s));
    return s;
  }
}




