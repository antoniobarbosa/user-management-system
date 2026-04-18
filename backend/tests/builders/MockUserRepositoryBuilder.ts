import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { vi } from "vitest";

export class MockUserRepositoryBuilder {
  private readonly create = vi.fn<IUserRepository["create"]>();
  private readonly findAll = vi.fn<IUserRepository["findAll"]>();
  private readonly findById = vi.fn<IUserRepository["findById"]>();
  private readonly update = vi.fn<IUserRepository["update"]>();
  private readonly delete = vi.fn<IUserRepository["delete"]>();

  withCreate(implementation: IUserRepository["create"]): this {
    this.create.mockImplementation(implementation);
    return this;
  }

  withFindAll(implementation: IUserRepository["findAll"]): this {
    this.findAll.mockImplementation(implementation);
    return this;
  }

  withFindById(implementation: IUserRepository["findById"]): this {
    this.findById.mockImplementation(implementation);
    return this;
  }

  withUpdate(implementation: IUserRepository["update"]): this {
    this.update.mockImplementation(implementation);
    return this;
  }

  withDelete(implementation: IUserRepository["delete"]): this {
    this.delete.mockImplementation(implementation);
    return this;
  }

  build(): vi.Mocked<IUserRepository> {
    return {
      create: this.create,
      findAll: this.findAll,
      findById: this.findById,
      update: this.update,
      delete: this.delete,
    } as vi.Mocked<IUserRepository>;
  }
}
