// Privacy AI Helper v3 — basic smoke tests
// Leo testnet: `leo test` runs these locally
import privacy_ai_helper_v3.aleo;

program test_privacy_ai_helper_v3.aleo {

    // Verify grant_access succeeds for valid categories
    @test
    fn test_grant_health() {
        let result: field = privacy_ai_helper_v3.aleo/grant_access(1u8);
        // grant_access returns no value (Final), so reaching here = success
    }

    // Verify revoke_access succeeds for valid categories
    @test
    fn test_revoke_health() {
        let result: field = privacy_ai_helper_v3.aleo/revoke_access(1u8);
    }

    @noupgrade
    constructor() {}
}
