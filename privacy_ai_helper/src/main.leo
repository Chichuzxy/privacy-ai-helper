// Privacy AI Helper — 隐私授权合约 v2
// 改进: 1.多类别独立授权 2.显式Poseidon2调用 3.单类别撤销 4.预设类别常量

program privacy_ai_helper.aleo {

    // 预设数据类别
    const CATEGORY_HEALTH: u8 = 1u8;   // 健康数据 (血压/心率/病史)
    const CATEGORY_GENE: u8 = 2u8;     // 基因数据 (DNA/遗传信息)
    const CATEGORY_FINANCE: u8 = 3u8;  // 财务数据 (收入/支出/投资)
    const CATEGORY_OTHER: u8 = 4u8;    // 其他数据

    // 授权存储: key = Poseidon2(user_addr, category_hash) => value = 授权时间戳
    mapping authorizations: field => field;

    // 类别名 → field 哈希 (Poseidon2, ZK友好)
    function hash_category(category_id: u8) -> field {
        return Poseidon2::hash_to_field(category_id);
    }

    // 授权某数据类别
    // 传入类别ID(1-4), 合约内部用Poseidon2生成哈希键
    transition grant_access(category_id: u8) -> field {
        // 只接受预设的4个类别
        match category_id {
            CATEGORY_HEALTH => {},
            CATEGORY_GENE => {},
            CATEGORY_FINANCE => {},
            CATEGORY_OTHER => {},
            _ => assert(false),
        };
        let caller: address = self.caller;
        let category_hash: field = hash_category(category_id);
        let key: field = Poseidon2::hash_to_field(caller, category_hash);
        return finalize(key, caller);
    }

    finalize grant_access(key: field, caller: address) {
        Mapping::set(authorizations, key, block.height);
    }

    // 撤销单个数据类别授权
    transition revoke_access(category_id: u8) -> field {
        let caller: address = self.caller;
        let category_hash: field = hash_category(category_id);
        let key: field = Poseidon2::hash_to_field(caller, category_hash);
        return finalize(key);
    }

    finalize revoke_access(key: field) {
        Mapping::set(authorizations, key, 0field);
    }

    // 查询某类别授权状态
    // 返回 0field = 未授权/已撤销, 非0 = 授权时的区块高度
    function check_access(category_id: u8) -> field {
        let caller: address = self.caller;
        let category_hash: field = hash_category(category_id);
        let key: field = Poseidon2::hash_to_field(caller, category_hash);
        return Mapping::get_or_use(authorizations, key, 0field);
    }

    // 验证授权是否有效 (含过期检查)
    function is_authorized(owner: address, category_id: u8, max_age: u32) -> bool {
        let category_hash: field = hash_category(category_id);
        let key: field = Poseidon2::hash_to_field(owner, category_hash);
        let stored: field = Mapping::get_or_use(authorizations, key, 0field);
        let ts: u32 = Mapping::get_or_use(authorizations, key, 0u32);
        return stored != 0field && (block.height - ts) <= max_age;
    }
}
