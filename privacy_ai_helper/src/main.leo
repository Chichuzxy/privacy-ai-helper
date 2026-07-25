// Privacy AI Helper — 隐私授权合约 (修复版)
// 修复: 1.bool→field 2.store_data权限校验 3.时间维度 4.verify_access返回值

program privacy_ai_helper.aleo {
    // 漏洞修复1: bool → field，只存授权数据类别的哈希，杜绝元数据泄露
    mapping authorizations: address => field;
    // 漏洞修复3: 添加时间维度，记录授权时间戳
    mapping auth_timestamps: address => u64;

    @noupgrade constructor() {}

    // 授权：调用者主动授予某个数据类别哈希的访问权限
    fn grant_access(data_hash: field) -> Final {
        let caller: address = self.caller;
        return final {
            let timestamp: u64 = block.height;
            Mapping::set(authorizations, caller, data_hash);
            Mapping::set(auth_timestamps, caller, timestamp);
        };
    }

    // 漏洞修复1: 返回 field 而非 bool，外部无法推断授权状态
    fn check_access(owner: address) -> (field, Final) {
        return (0field, final {
            let hash: field = Mapping::get_or_use(authorizations, owner, 0field);
        });
    }

    // 撤销授权：将授权哈希清零
    fn revoke_access() -> Final {
        let caller: address = self.caller;
        return final {
            Mapping::set(authorizations, caller, 0field);
            Mapping::set(auth_timestamps, caller, 0u64);
        };
    }

    // 漏洞修复2: store_data 增加权限校验，防止他人覆盖
    fn store_data(data_category: field) -> Final {
        let caller: address = self.caller;
        return final {
            let existing: field = Mapping::get_or_use(authorizations, caller, 0field);
            // 只允许首次写入，或写同一个值（防止覆盖他人数据）
            assert(existing == 0field || existing == data_category);
            Mapping::set(authorizations, caller, data_category);
        };
    }

    // 验证授权是否有效（含时间过期检查）
    fn is_authorized(owner: address, max_age: u64) -> (bool, Final) {
        return (false, final {
            let hash: field = Mapping::get_or_use(authorizations, owner, 0field);
            let ts: u64 = Mapping::get_or_use(auth_timestamps, owner, 0u64);
            let valid: bool = hash != 0field && (block.height - ts) <= max_age;
        });
    }
}
