<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * @return array{user: User, token: string, refresh_token: string, expires_at: string}
     */
    public function login(string $email, string $password, ?string $ip = null): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            $this->logFailedLogin($email, $ip);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // The one authorized touch to auth this phase: a resigned staff
        // member's account is flipped inactive (see StaffService), not
        // deleted — this is what actually enforces that at login.
        if (! $user->is_active) {
            $this->logFailedLogin($email, $ip);

            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated. Contact your school administrator.'],
            ]);
        }

        // School-level suspension (Prompt 35 Part E) — deliberately
        // blocks 100% of login, including that school's own admin, unlike
        // license expiry (which still allows read-only login). Never
        // applies to super_admin: they have no school_id at all.
        if ($user->school && ! $user->school->is_active) {
            $this->logFailedLogin($email, $ip);

            throw ValidationException::withMessages([
                'email' => ["This school's access has been suspended. Contact your platform administrator."],
            ]);
        }

        return ['user' => $user, ...$this->issueTokenPair($user)];
    }

    /**
     * Rotate a refresh token: the one used to authenticate this request is
     * invalidated and a brand-new access+refresh pair is issued. Prevents
     * replay if a refresh token is stolen — it's single-use.
     *
     * @return array{token: string, refresh_token: string, expires_at: string}
     */
    public function refresh(User $user, PersonalAccessToken $currentRefreshToken): array
    {
        $currentRefreshToken->delete();

        return $this->issueTokenPair($user);
    }

    public function logout(User $user): void
    {
        // Deletes both the access and refresh token from this session,
        // not just the current token — a stolen refresh token left behind
        // after logout would defeat the point of logging out.
        $user->tokens()->delete();
    }

    /**
     * @return array{token: string, refresh_token: string, expires_at: string}
     */
    private function issueTokenPair(User $user): array
    {
        $accessTtl = (int) config('auth_tokens.access_ttl_minutes');
        $refreshTtl = (int) config('auth_tokens.refresh_ttl_minutes');

        $accessExpiresAt = now()->addMinutes($accessTtl);

        $accessToken = $user->createToken('access-token', ['access'], $accessExpiresAt)->plainTextToken;
        $refreshToken = $user->createToken('refresh-token', ['refresh'], now()->addMinutes($refreshTtl))->plainTextToken;

        return [
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_at' => $accessExpiresAt->toIso8601String(),
        ];
    }

    private function logFailedLogin(string $email, ?string $ip): void
    {
        Log::warning('Failed login attempt', [
            'email' => $email,
            'ip' => $ip,
        ]);
    }
}
