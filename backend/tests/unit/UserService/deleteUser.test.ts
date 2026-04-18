import { UserService } from "@application/user/UserService.js";
import { describe, expect, it } from "vitest";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

describe("UserService.deleteUser", () => {
  it("calls repository.delete with correct id", async () => {
    const user = UserBuilder.aUser().build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async (id) => (id === user.id ? user : null))
      .withDelete(async () => {})
      .build();

    const service = new UserService(mockRepo);

    await service.deleteUser(user.id);

    expect(mockRepo.delete).toHaveBeenCalledWith(user.id);
  });

  it("throws if user not found", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => null)
      .build();

    const service = new UserService(mockRepo);

    await expect(service.deleteUser("missing-id")).rejects.toThrow(
      "User not found",
    );

    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
