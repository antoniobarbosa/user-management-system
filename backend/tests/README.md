# Backend tests

## Two-PR workflow (`UserService`)

1. **`feat/user-service-tests` (red)** — Vitest suite + builders + `tests/fixtures/UserServiceStub.ts`. Tests import the stub; all four `UserService` tests are expected to **fail** until the real service exists.
2. **`feat/user-service-impl` (green)** — Add `src/application/user/UserService.ts` with domain rules, switch tests to `import { UserService } from "@application/user/UserService.js"`, remove `tests/fixtures/UserServiceStub.ts` if nothing else uses it.

### PR2 — reference `UserService` (copy into `src/application/user/UserService.ts`)

```typescript
import { randomUUID } from "node:crypto";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(input: {
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const now = new Date();
    const user = new User();
    user.id = randomUUID();
    user.firstName = input.firstName;
    user.lastName = input.lastName;
    user.status = UserStatus.ACTIVE;
    user.loginsCounter = 0;
    user.createdAt = now;
    user.updatedAt = now;
    return this.userRepository.create(user);
  }

  async updateUser(
    id: string,
    input: { firstName?: string; lastName?: string },
  ): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new Error("User not found");
    }

    if (existing.status === UserStatus.INACTIVE) {
      if (input.firstName !== undefined || input.lastName !== undefined) {
        throw new Error(
          "Cannot update first name or last name for an inactive user",
        );
      }
    }

    const now = new Date();
    const updated = new User();
    updated.id = existing.id;
    updated.createdAt = existing.createdAt;
    updated.firstName =
      input.firstName !== undefined ? input.firstName : existing.firstName;
    updated.lastName =
      input.lastName !== undefined ? input.lastName : existing.lastName;
    updated.status = existing.status;
    updated.loginsCounter = existing.loginsCounter;
    updated.updatedAt = now;

    return this.userRepository.update(updated);
  }
}
```

## Builder convention

Builders live under `tests/builders/`. They keep test data construction readable and reusable:

- **Object builders** (`UserBuilder`) produce domain entities with realistic defaults (via `@faker-js/faker`) and fluent `with*` overrides.
- **Mock builders** (`MockUserRepositoryBuilder`) assemble `vi.fn`-backed implementations of ports (`IUserRepository`) so each test wires only the behaviour it needs.

Prefer `new SomeBuilder()....build()` at the start of a test over ad-hoc literals or duplicated `vi.fn()` setup.

## `UserBuilder`

Defaults to an active user with random name, UUID, dates, and a small login count. Override any field before `build()`.

```typescript
import { UserBuilder } from "../builders/UserBuilder.js";

const active = UserBuilder.aUser().build();

const withFixedDates = UserBuilder.aUser()
  .withCreatedAt(new Date("2019-01-01"))
  .withUpdatedAt(new Date("2019-01-02"))
  .build();

const inactive = UserBuilder.anInactiveUser().withId(customId).build();
```

## `MockUserRepositoryBuilder`

Starts with `vi.fn()` for every `IUserRepository` method. Use `withCreate`, `withFindAll`, `withFindById`, `withUpdate`, or `withDelete` to install implementations; `build()` returns a `MockedObject<IUserRepository>` suitable for assertions (`toHaveBeenCalled`, etc.).

```typescript
import { MockUserRepositoryBuilder } from "../builders/MockUserRepositoryBuilder.js";
// PR1 (red): import from `../fixtures/UserServiceStub.js`
// PR2 (green): import from `@application/user/UserService.js`
import { UserService } from "../fixtures/UserServiceStub.js";

const repo = new MockUserRepositoryBuilder()
  .withFindById(async (id) => (id === knownId ? someUser : null))
  .withUpdate(async (user) => ({ ...user }))
  .build();

const service = new UserService(repo);
```
