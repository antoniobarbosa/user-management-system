import { UserService } from "@application/user/UserService.js";
import { describe, expect, it } from "vitest";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

describe("UserService.findById", () => {
  it("returns user if found", async () => {
    const user = UserBuilder.aUser().build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async (id) => (id === user.id ? user : null))
      .build();

    const service = new UserService(mockRepo);

    const result = await service.findById(user.id);

    expect(mockRepo.findById).toHaveBeenCalledWith(user.id);
    expect(result).toEqual(user);
  });

  it("returns null if not found", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => null)
      .build();

    const service = new UserService(mockRepo);

    const result = await service.findById("unknown-id");

    expect(mockRepo.findById).toHaveBeenCalledWith("unknown-id");
    expect(result).toBeNull();
  });
});
