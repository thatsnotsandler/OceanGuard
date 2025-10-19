OceanGuard (action/)

该目录包含两个子项目：

- oceanguard-hardhat：FHEVM 智能合约（Hardhat + hardhat-deploy），支持本地与 Sepolia 部署。
- oceanguard-frontend：前端应用（Next.js + React + TypeScript），本地使用 @fhevm/mock-utils，测试网使用 relayer-sdk 与合约交互。

快速开始（Sepolia）：

1. 进入 oceanguard-hardhat 并安装依赖，然后配置变量：
   - 运行 npx hardhat vars setup 并设置 MNEMONIC、INFURA_API_KEY、（可选）ETHERSCAN_API_KEY。
2. 部署合约到 Sepolia：
   - npm run deploy:sepolia
3. 生成前端 ABI 与地址映射：
   - 进入 oceanguard-frontend 运行 npm run genabi
4. 启动前端：
   - npm run dev



