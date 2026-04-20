import { expect, test } from "@playwright/test";
import { signUp } from "./helpers/auth";

/** Unique numeric id per call (serial tests + random reduce collision risk). */
function nextUid(): number {
  return Date.now() + Math.floor(Math.random() * 1_000_000);
}

test.describe("Dashboard", () => {
  test.describe.configure({ mode: "serial" });

  let account: { firstName: string; lastName: string; email: string; password: string };

  test.beforeEach(async ({ page }) => {
    const uid = nextUid();
    account = {
      firstName: `Test${uid}`,
      lastName: `User${uid}`,
      email: `test${uid}@e2e.test`,
      password: "password12",
    };
    await signUp(page, account);
    await expect(page.getByTestId("user-table")).toBeVisible();
    await page.getByText("Loading list…").waitFor({ state: "hidden" });
  });

  test("shows user table with pagination", async ({ page }) => {
    await expect(page.getByTestId("user-table")).toBeVisible();
    await expect(page.getByTestId("user-pagination")).toBeVisible();
  });

  test("creates a new user", async ({ page }) => {
    const uid = nextUid();
    const firstName = `Test${uid}`;
    const lastName = `User${uid}`;
    const email = `test${uid}@e2e.test`;
    await page.getByRole("button", { name: "New user" }).click();
    const modal = page.getByTestId("create-user-modal");
    await expect(modal).toBeVisible();
    await modal.getByLabel("First name").fill(firstName);
    await modal.getByLabel("Last name").fill(lastName);
    await modal.getByLabel("Email").fill(email);
    await modal.getByLabel("Password").fill("password12");
    await modal.getByLabel("Status").selectOption("active");
    await modal.getByRole("button", { name: "Create" }).click();
    await expect(modal).toBeHidden();
    await page.getByText("Loading list…").waitFor({ state: "hidden" });
    await expect(
      page.locator("tbody tr").filter({ hasText: firstName }).filter({ hasText: lastName }),
    ).toHaveCount(1);
  });

  test("edits a user", async ({ page }) => {
    await page
      .locator("tbody tr")
      .filter({ hasText: account.firstName })
      .filter({ hasText: account.lastName })
      .getByRole("button", { name: "Edit" })
      .click();
    const modal = page.getByTestId("edit-user-modal");
    await expect(modal).toBeVisible();
    const newFirst = `Test${nextUid()}`;
    const newLast = `User${nextUid()}`;
    await modal.getByLabel("First name").fill(newFirst);
    await modal.getByLabel("Last name").fill(newLast);
    await modal.getByRole("button", { name: "Save" }).click();
    await expect(modal).toBeHidden();
    await page.getByText("Loading list…").waitFor({ state: "hidden" });
    await expect(
      page.locator("tbody tr").filter({ hasText: newFirst }).filter({ hasText: newLast }),
    ).toHaveCount(1);
  });

  test("deletes a user with confirmation", async ({ page }) => {
    const uid = nextUid();
    const firstName = `Test${uid}`;
    const lastName = `User${uid}`;
    const email = `test${uid}@e2e.test`;
    await page.getByRole("button", { name: "New user" }).click();
    const createModal = page.getByTestId("create-user-modal");
    await createModal.getByLabel("First name").fill(firstName);
    await createModal.getByLabel("Last name").fill(lastName);
    await createModal.getByLabel("Email").fill(email);
    await createModal.getByLabel("Password").fill("password12");
    await createModal.getByRole("button", { name: "Create" }).click();
    await expect(createModal).toBeHidden();
    await page.getByText("Loading list…").waitFor({ state: "hidden" });

    await page
      .locator("tbody tr")
      .filter({ hasText: firstName })
      .filter({ hasText: lastName })
      .getByRole("button", { name: "Delete" })
      .click();
    const deleteModal = page.getByTestId("delete-user-modal");
    await expect(deleteModal).toBeVisible();
    await deleteModal.getByRole("button", { name: "Delete" }).click();
    await expect(deleteModal).toBeHidden();
    await page.getByText("Loading list…").waitFor({ state: "hidden" });
    await expect(
      page.locator("tbody tr").filter({ hasText: firstName }).filter({ hasText: lastName }),
    ).toHaveCount(0);
  });

  test("cannot edit name of inactive user", async ({ page }) => {
    const uid = nextUid();
    const firstName = `Test${uid}`;
    const lastName = `User${uid}`;
    const email = `test${uid}@e2e.test`;
    await page.getByRole("button", { name: "New user" }).click();
    const createModal = page.getByTestId("create-user-modal");
    await createModal.getByLabel("First name").fill(firstName);
    await createModal.getByLabel("Last name").fill(lastName);
    await createModal.getByLabel("Email").fill(email);
    await createModal.getByLabel("Password").fill("password12");
    await createModal.getByLabel("Status").selectOption("inactive");
    await createModal.getByRole("button", { name: "Create" }).click();
    await expect(createModal).toBeHidden();
    await page.getByText("Loading list…").waitFor({ state: "hidden" });

    await page
      .locator("tbody tr")
      .filter({ hasText: firstName })
      .filter({ hasText: lastName })
      .getByRole("button", { name: "Edit" })
      .click();
    const editModal = page.getByTestId("edit-user-modal");
    await expect(editModal.getByRole("note")).toContainText("First and last name locked");
    const nameReadOnly = editModal.getByRole("group", { name: "Current name (read-only)" });
    await expect(nameReadOnly).toBeVisible();
    await expect(nameReadOnly).toContainText(firstName);
    await expect(nameReadOnly).toContainText(lastName);
    await expect(editModal.getByRole("textbox", { name: "First name" })).toHaveCount(0);
    await editModal.getByRole("button", { name: "Cancel" }).click();
  });

  test("navigates to page 2 via URL", async ({ page }) => {
    const runUid = nextUid();
    for (let i = 0; i < 6; i++) {
      const uid = nextUid();
      await page.getByRole("button", { name: "New user" }).click();
      const createModal = page.getByTestId("create-user-modal");
      await createModal.getByLabel("First name").fill(`Test${runUid}Fill${i}`);
      await createModal.getByLabel("Last name").fill(`User${runUid}`);
      await createModal.getByLabel("Email").fill(`test${uid}@e2e.test`);
      await createModal.getByLabel("Password").fill("password12");
      await createModal.getByRole("button", { name: "Create" }).click();
      await expect(createModal).toBeHidden();
      await page.getByText("Loading list…").waitFor({ state: "hidden" });
    }

    await page.getByRole("button", { name: "2", exact: true }).click();
    await page.waitForURL(/\/dashboard\?page=2/);
    await expect(page).toHaveURL(/\/dashboard\?page=2/);
    await expect(page.getByTestId("user-pagination")).toBeVisible();
  });
});
