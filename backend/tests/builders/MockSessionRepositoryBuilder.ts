import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import { vi } from "vitest";

export class MockSessionRepositoryBuilder {
  private readonly create = vi.fn<ISessionRepository["create"]>();
  private readonly findById = vi.fn<ISessionRepository["findById"]>();
  private readonly terminate = vi.fn<ISessionRepository["terminate"]>();

  withCreate(implementation: ISessionRepository["create"]): this {
    this.create.mockImplementation(implementation);
    return this;
  }

  withFindById(implementation: ISessionRepository["findById"]): this {
    this.findById.mockImplementation(implementation);
    return this;
  }

  withTerminate(implementation: ISessionRepository["terminate"]): this {
    this.terminate.mockImplementation(implementation);
    return this;
  }

  build(): vi.Mocked<ISessionRepository> {
    return {
      create: this.create,
      findById: this.findById,
      terminate: this.terminate,
    } as vi.Mocked<ISessionRepository>;
  }
}
