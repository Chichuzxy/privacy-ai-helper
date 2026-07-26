// Privacy AI Helper — v2

const CATEGORY_HEALTH: u8 = 1u8;
const CATEGORY_GENE: u8 = 2u8;
const CATEGORY_FINANCE: u8 = 3u8;
const CATEGORY_OTHER: u8 = 4u8;

program privacy_ai_helper.aleo {

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
        let caller: address = self.caller;
        let cat_hash: field = Poseidon2::hash_to_field(category_id);
        let addr_field: field = caller as field;
        let key: field = Poseidon2::hash_to_field(addr_field + cat_hash);
        return final {
            Mapping::set(authorizations, key, 0field);
        };
    }

    fn check_access(category_id: u8) -> (field, Final) {
        let caller: address = self.caller;
        let cat_hash: field = Poseidon2::hash_to_field(category_id);
        let addr_field: field = caller as field;
        let key: field = Poseidon2::hash_to_field(addr_field + cat_hash);
        return (0field, final {
            let hash: field = Mapping::get_or_use(authorizations, key, 0field);
        });
    }

    fn is_authorized(owner: address, category_id: u8, max_age: u32) -> (bool, Final) {
        let cat_hash: field = Poseidon2::hash_to_field(category_id);
        let addr_field: field = owner as field;
        let key: field = Poseidon2::hash_to_field(addr_field + cat_hash);
        return (false, final {
            let stored: field = Mapping::get_or_use(authorizations, key, 0field);
            let valid: bool = stored != 0field && (block.height - (stored as u32)) <= max_age;
        });
    }
}
