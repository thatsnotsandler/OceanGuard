export type FHEVM = {
  // Relayer SDK instance minimal surface used in this app
  userDecrypt: (
    items: { handle: string; contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contracts: string[],
    user: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, bigint>>;
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contracts: string[],
    startTimestamp: number,
    durationDays: number
  ) => any;
};






