// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title OceanGuard – 海洋保护行动存证合约（FHE 版）
/// @notice 记录环保行动（链上锚点）与同态加密的认证计数/积分
contract OceanGuard is SepoliaConfig {
    struct ActionData {
        address owner;
        // 行为锚点：metadata JSON 写 IPFS，链上存其 keccak256 (string) 与 URI
        string actionHash; // keccak256(metadata) 的 hex 字符串表示，或直接传入前端计算的哈希字符串
        string metadataURI; // ipfs://...
        uint64 timestamp;
        bool visibility; // true: 公开；false: 匿名 UI 展示
        // 认证计数（同态加密）
        euint32 endorsementCount;
    }

    // 自增 id → 行为数据
    uint256 private _nextId;
    mapping(uint256 => ActionData) private _actions;

    // 防重复认证：actionId => endorser => bool
    mapping(uint256 => mapping(address => bool)) private _endorsed;

    // 用户行动索引
    mapping(address => uint256[]) private _userActions;

    // 用户积分（同态加密），每条有效行动 +1（可按需调整）
    mapping(address => euint32) private _reputation;

    // Badges: simple claimable badges gated by activity
    mapping(address => mapping(uint256 => bool)) private _badgeClaimed; // user => badgeId => claimed

    event ActionRecorded(uint256 indexed actionId, address indexed owner, string actionHash, string metadataURI, uint64 timestamp, bool visibility);
    event ActionEndorsed(uint256 indexed actionId, address indexed endorser);
    event BadgeClaimed(address indexed user, uint256 indexed badgeId);

    constructor() {
        _nextId = 1;
    }

    /// @notice 记录环保行动锚点
    function recordAction(string calldata actionHash, string calldata metadataURI, bool visibility) external returns (uint256 actionId) {
        actionId = _nextId++;

        ActionData storage a = _actions[actionId];
        a.owner = msg.sender;
        a.actionHash = actionHash;
        a.metadataURI = metadataURI;
        a.timestamp = uint64(block.timestamp);
        a.visibility = visibility;

        // 初始化同态计数为 0（trivial encryption）
        a.endorsementCount = FHE.asEuint32(0);

        // ACL：拥有者与本合约可访问计数
        FHE.allowThis(a.endorsementCount);
        FHE.allow(a.endorsementCount, msg.sender);

        // 用户积分 +1
        _reputation[msg.sender] = FHE.add(_reputation[msg.sender], FHE.asEuint32(1));
        FHE.allowThis(_reputation[msg.sender]);
        FHE.allow(_reputation[msg.sender], msg.sender);

        _userActions[msg.sender].push(actionId);
        emit ActionRecorded(actionId, msg.sender, actionHash, metadataURI, a.timestamp, visibility);
    }

    /// @notice 认证某个行动；防重复与自认证
    function endorseAction(uint256 actionId) external {
        ActionData storage a = _actions[actionId];
        require(a.owner != address(0), "Action not found");
        require(a.owner != msg.sender, "Cannot endorse own action");
        require(!_endorsed[actionId][msg.sender], "Already endorsed");

        _endorsed[actionId][msg.sender] = true;

        // 计数 +1（同态加法）
        a.endorsementCount = FHE.add(a.endorsementCount, FHE.asEuint32(1));
        FHE.allowThis(a.endorsementCount);
        FHE.allow(a.endorsementCount, a.owner);

        // 可选：给行动拥有者加积分
        _reputation[a.owner] = FHE.add(_reputation[a.owner], FHE.asEuint32(1));
        FHE.allowThis(_reputation[a.owner]);
        FHE.allow(_reputation[a.owner], a.owner);

        emit ActionEndorsed(actionId, msg.sender);
    }

    /// @notice 获取行动的基础视图（返回加密句柄用于前端解密）
    function getAction(uint256 actionId) external view returns (
        address owner,
        string memory actionHash,
        string memory metadataURI,
        uint64 timestamp,
        bool visibility,
        euint32 endorsementCount
    ) {
        ActionData storage a = _actions[actionId];
        require(a.owner != address(0), "Action not found");
        return (a.owner, a.actionHash, a.metadataURI, a.timestamp, a.visibility, a.endorsementCount);
    }

    /// @notice 获取某用户的行动列表
    function getActionsByUser(address user) external view returns (uint256[] memory) {
        return _userActions[user];
    }

    /// @notice 全网行动总数（用于主页 recent actions 枚举）
    function getTotalActions() external view returns (uint256) {
        if (_nextId == 0) return 0;
        return _nextId - 1;
    }

    /// @notice 获取用户积分（返回加密句柄）
    function getReputation(address user) external view returns (euint32) {
        return _reputation[user];
    }

    /// -----------------------
    /// Badges (example):
    /// badgeId = 1 => "Ocean Newbie" (at least 1 action recorded)
    /// -----------------------

    function isBadgeClaimable(address user, uint256 badgeId) public view returns (bool) {
        if (badgeId == 1) {
            // Ocean Newbie: user has >= 1 action
            return _userActions[user].length >= 1 && !_badgeClaimed[user][badgeId];
        }
        return false;
    }

    function claimBadge(uint256 badgeId) external {
        require(isBadgeClaimable(msg.sender, badgeId), "Badge not claimable");
        _badgeClaimed[msg.sender][badgeId] = true;
        emit BadgeClaimed(msg.sender, badgeId);
    }

    function hasBadge(address user, uint256 badgeId) external view returns (bool) {
        return _badgeClaimed[user][badgeId];
    }
}


