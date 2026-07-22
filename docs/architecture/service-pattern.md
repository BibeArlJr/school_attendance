# Mock-Service Architecture Pattern

Every integration with something outside our own application logic — SMS
gateways, barcode/label generation, gate scanner hardware input, payment
gateways, etc. — is built against this pattern from Phase 1 onward. It exists
so that Phases 2–13 can be developed and demoed entirely offline, without a
live SMS account, physical scanner, or printer, and so that swapping a mock
for the real integration later touches exactly one file.

The rule: **components and hooks never talk to a concrete implementation.
They only ever depend on an interface.** Which concrete class satisfies that
interface at runtime is decided in exactly one place — a factory — driven by
an environment/config flag.

## Frontend (TypeScript)

1. **Interface** lives with the feature that owns it:
   `features/<feature>/types/index.ts`

   ```ts
   export interface INotificationService {
     notify(message: string): Promise<void>;
   }
   ```

2. **Mock implementation** lives under the shared mock-service root:
   `shared/services/mock/MockNotificationService.ts`

   It must produce a visible, obviously-fake effect (console log, toast,
   fixture data) — never silently succeed, so it's unmistakable in a demo
   that you're looking at a mock.

3. **Factory** reads a `VITE_USE_MOCK_<X>` flag and returns the interface
   type, never the concrete type:

   ```ts
   export function getNotificationService(): INotificationService {
     return import.meta.env.VITE_USE_MOCK_NOTIFICATIONS !== 'false'
       ? new MockNotificationService()
       : new RealNotificationService();
   }
   ```

4. **Consumers** (components/hooks) import only the factory and the
   interface type. Adding `RealNotificationService` later and flipping the
   env flag requires zero changes to any call site.

## Backend (Laravel)

The same shape, mirrored:

1. **Interface** lives in `app/Support/Contracts/` (e.g.
   `SmsServiceInterface.php`).
2. **Mock implementation** lives alongside real implementations in the
   relevant module's `Services/` directory, named `Mock*Service`.
3. **Binding** happens in `AppServiceProvider::register()`, chosen by a
   config flag (backed by an env var, e.g. `SMS_DRIVER=mock|real`):

   ```php
   $this->app->bind(SmsServiceInterface::class, function () {
       return config('services.sms.driver') === 'mock'
           ? MockSmsService::class
           : RealSmsService::class;
   });
   ```

4. Controllers/Services type-hint the interface via constructor injection
   and never instantiate a concrete class directly.

## Reference implementation (Phase 1)

`INotificationService` / `MockNotificationService` is implemented end-to-end
in this phase purely as scaffolding to prove the pattern compiles and to give
every later phase a copy-pasteable example. It is not wired into any real
feature yet — see the `// example usage` comment at its call site.
