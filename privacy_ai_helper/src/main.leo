// Privacy AI Helper — v3
// Fix: is_authorized / check_access now correctly use assert in final block
// Query functions in Leo v2 cannot return Mapping values directly;
// assert pattern: success = authorized, failure = transaction reverts

const CATEGORY_HEALTH: u8 = 1u8;
const CATEGORY_GENE: u8 = 2u8;
const CATEGORY_FINANCE: u8 = 3u8;
const CATEGORY_OTHER: u8 = 4u8;

program privacy_ai_helper_v3.aleo {

    mapping authorizations: field => field;

    @noupgrade constructor() {}

    fn grant_access(category_id: u8) -> Final {
        assert(category_id >= CATEGORY_HEALTH && category_id <= CATEGORY_OTHER);
        let caller: address = self.caller;
        let cat_hash: field = Poseidon2::hash_to_field(category_id);
        let addr_field: field = caller as field;
        let key: field = Poseidon2::hash_to_field(addr_field + cat_hash);
        return final {
            Mapping::set(authorizations, key, block.height as field);
        };
    }

    fn revoke_access(category_id: u8) -> Final {
        assert(category_id >= CATEGORY_HEALTH && category_id <= CATEGORY_OTHER);
        let caller: address = self.caller;
        let cat_hash: field = Poseidon2::hash_to_field(category_id);
        let addr_field: field = caller as field;
        let key: field = Poseidon2::hash_to_field(addr_field + cat_hash);
        return final {
            Mapping::set(authorizations, key, 0field);
        };
    }

    // check_access: succeeds if authorized, reverts if not
    // This is the Leo v2 pattern for on-chain queries (mapping reads require Final context,
    // and Final blocks can't return computed values — assert is the standard workaround)
    fn check_access(category_id: u8) -> Final {
        let caller: address = self.caller;
        let cat_hash: field = Poseidon2::hash_to_field(category_id);
        let addr_field: field = caller as field;
        let key: field = Poseidon2::hash_to_field(addr_field + cat_hash);
        return final {
            let hash: field = Mapping::get_or_use(authorizations, key, 0field);
            assert(hash != 0field);
        };
    }

    // is_authorized: succeeds if authorized + not expired, reverts otherwise
    // Leo v2 limitation: Mapping::get_or_use只能在Final块内调用,
    // 且Final块内的计算值无法作为函数返回值传出。
    // assert模式是标准做法: 调用成功=已授权, revert=未授权/已过期
    fn is_authorized(owner: address, category_id: u8, max_age: u32) -> Final {
        let cat_hash: field = Poseidon2::hash_to_field(category_id);
        let addr_field: field = owner as field;
        let key: field = Poseidon2::hash_to_field(addr_field + cat_hash);
        return final {
            let stored: field = Mapping::get_or_use(authorizations, key, 0field);
            assert(stored != 0field);
            assert((block.height - (stored as u32)) <= max_age);
        };
    }
}
