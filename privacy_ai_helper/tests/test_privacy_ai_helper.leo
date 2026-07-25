// The 'test_privacy_ai_helper' test program.
import privacy_ai_helper.aleo;
program test_privacy_ai_helper.aleo {
    @test
    @should_fail
    fn test_main_fails() {
        let result: u32 = privacy_ai_helper.aleo::main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    constructor() {}
}
