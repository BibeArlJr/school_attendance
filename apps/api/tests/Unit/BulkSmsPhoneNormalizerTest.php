<?php

namespace Tests\Unit;

use App\Modules\BulkSms\Services\BulkSmsPhoneNormalizer;
use PHPUnit\Framework\TestCase;

/**
 * Pure logic, zero DB dependency — extends PHPUnit's own TestCase
 * directly, not Tests\TestCase (which forces RefreshDatabase and a real
 * Postgres test-database connection neither needed nor wanted here).
 */
class BulkSmsPhoneNormalizerTest extends TestCase
{
    private BulkSmsPhoneNormalizer $normalizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->normalizer = new BulkSmsPhoneNormalizer();
    }

    public function test_canonical_ten_digit_number_is_valid_unchanged(): void
    {
        $result = $this->normalizer->normalize('9841234567');

        $this->assertTrue($result['valid']);
        $this->assertSame('9841234567', $result['normalized']);
        $this->assertNull($result['reason']);
    }

    public function test_leading_domestic_zero_is_stripped(): void
    {
        $result = $this->normalizer->normalize('09841234567');

        $this->assertTrue($result['valid']);
        $this->assertSame('9841234567', $result['normalized']);
    }

    public function test_plus_977_country_code_is_stripped(): void
    {
        $result = $this->normalizer->normalize('+9779841234567');

        $this->assertTrue($result['valid']);
        $this->assertSame('9841234567', $result['normalized']);
    }

    public function test_bare_977_country_code_is_stripped(): void
    {
        $result = $this->normalizer->normalize('9779841234567');

        $this->assertTrue($result['valid']);
        $this->assertSame('9841234567', $result['normalized']);
    }

    public function test_00977_country_code_is_stripped(): void
    {
        $result = $this->normalizer->normalize('009779841234567');

        $this->assertTrue($result['valid']);
        $this->assertSame('9841234567', $result['normalized']);
    }

    public function test_spaces_dashes_and_parentheses_are_stripped(): void
    {
        $this->assertSame('9841234567', $this->normalizer->normalize('+977 984 123 4567')['normalized']);
        $this->assertSame('9841234567', $this->normalizer->normalize('(098) 412-34567')['normalized']);
        $this->assertSame('9841234567', $this->normalizer->normalize('984-123-4567')['normalized']);
    }

    public function test_empty_input_is_invalid(): void
    {
        $result = $this->normalizer->normalize('');

        $this->assertFalse($result['valid']);
        $this->assertNull($result['normalized']);
        $this->assertStringContainsString('empty', $result['reason']);
    }

    public function test_null_input_is_invalid(): void
    {
        $result = $this->normalizer->normalize(null);

        $this->assertFalse($result['valid']);
    }

    public function test_whitespace_only_input_is_invalid(): void
    {
        $result = $this->normalizer->normalize('   ');

        $this->assertFalse($result['valid']);
    }

    public function test_letters_with_no_digits_is_invalid(): void
    {
        $result = $this->normalizer->normalize('abcdefghij');

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('digits', $result['reason']);
    }

    public function test_letters_mixed_with_digits_is_invalid_not_silently_stripped(): void
    {
        // Must NOT silently drop the 'x' and treat this as if it were a
        // clean 10-digit number — letters are not formatting characters.
        $result = $this->normalizer->normalize('98x1234567');

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('other than digits', $result['reason']);
    }

    public function test_too_short_is_invalid(): void
    {
        $result = $this->normalizer->normalize('98412');

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('10 digits', $result['reason']);
    }

    public function test_too_long_is_invalid(): void
    {
        $result = $this->normalizer->normalize('98412345678901');

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('10 digits', $result['reason']);
    }

    public function test_number_not_starting_with_nine_is_invalid(): void
    {
        $result = $this->normalizer->normalize('8841234567');

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('start with 9', $result['reason']);
    }

    public function test_malformed_country_code_with_too_few_digits_is_invalid_not_reinterpreted(): void
    {
        // '977' + only 7 digits — must be rejected outright, never
        // reinterpreted a different way (e.g. treated as a domestic
        // number) just because it happens to be some other length.
        $result = $this->normalizer->normalize('9779841234');

        $this->assertFalse($result['valid']);
        $this->assertSame('Expected exactly 10 digits after removing the country code, found 7.', $result['reason']);
    }

    public function test_country_code_followed_by_domestic_leading_zero_is_invalid_not_double_stripped(): void
    {
        // '977' + '0' + 10 digits (14 total) — a real, valid international
        // number never combines the country code with the domestic trunk
        // zero. This must NOT be "fixed" by stripping both prefixes; it
        // must be rejected as malformed.
        $result = $this->normalizer->normalize('09779841234567');

        $this->assertFalse($result['valid']);
    }

    public function test_00977_with_wrong_remainder_length_is_invalid(): void
    {
        $result = $this->normalizer->normalize('0097798412345');

        $this->assertFalse($result['valid']);
    }
}
