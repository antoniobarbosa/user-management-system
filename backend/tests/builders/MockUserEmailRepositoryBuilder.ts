import type { IUserEmailRepository } from "@domain/repositories/IUserEmailRepository.js";
import { vi } from "vitest";

export function emptyUserEmailRepository(): vi.Mocked<IUserEmailRepository> {
  return new MockUserEmailRepositoryBuilder().build();
}

export class MockUserEmailRepositoryBuilder {
  private readonly findByEmail = vi
    .fn<IUserEmailRepository["findByEmail"]>()
    .mockResolvedValue(null);
  private readonly findByUserId = vi
    .fn<IUserEmailRepository["findByUserId"]>()
    .mockResolvedValue([]);
  private readonly create = vi
    .fn<IUserEmailRepository["create"]>()
    .mockImplementation(async (ue) => ue);

  withFindByEmail(implementation: IUserEmailRepository["findByEmail"]): this {
    this.findByEmail.mockImplementation(implementation);
    return this;
  }

  withFindByUserId(implementation: IUserEmailRepository["findByUserId"]): this {
    this.findByUserId.mockImplementation(implementation);
    return this;
  }

  withCreate(implementation: IUserEmailRepository["create"]): this {
    this.create.mockImplementation(implementation);
    return this;
  }

  build(): vi.Mocked<IUserEmailRepository> {
    return {
      findByEmail: this.findByEmail,
      findByUserId: this.findByUserId,
      create: this.create,
    } as vi.Mocked<IUserEmailRepository>;
  }
}
