import { expect, test } from "@playwright/test";
import { authAlert, signIn, signInForm, signOut, signUp } from "./helpers/auth";

test.describe("Auth", () => {
  test("redirects to /auth when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth/);
    await expect(page).toHaveURL(/\/auth/);
  });

  test("shows sign-up form by default", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("form").filter({ hasText: "First name" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Sign up" }).click();
    await page.getByLabel("First name").fill("A");
    await page.getByLabel("Last name").fill("B");
    await page.getByLabel("Email").fill(`mismatch-${Date.now()}@e2e.test`);
    await page.getByLabel("Password", { exact: true }).fill("secret12");
    await page.getByLabel("Confirm password").fill("otherpass12");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(authAlert(page)).toContainText("Passwords do not match");
  });

  test("signs up successfully and redirects to dashboard", async ({ page }) => {
    const email = `signup-${Date.now()}@e2e.test`;
    await signUp(page, {
      firstName: "Signup",
      lastName: "User",
      email,
      password: "password12",
    });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("signs in successfully and redirects to dashboard", async ({ page }) => {
    const email = `signin-${Date.now()}@e2e.test`;
    const password = "password12";
    await signUp(page, {
      firstName: "Signin",
      lastName: "User",
      email,
      password,
    });
    await signOut(page);
    await signIn(page, { email, password });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Sign in" }).first().click();
    const form = signInForm(page);
    await form.getByLabel("Email").fill("nobody-here@e2e.test");
    await form.getByLabel("Password").fill("wrongpassword");
    await form.getByRole("button", { name: "Sign in" }).click();
    await expect(authAlert(page)).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("logs out and redirects to /auth", async ({ page }) => {
    const email = `logout-${Date.now()}@e2e.test`;
    await signUp(page, {
      firstName: "Logout",
      lastName: "User",
      email,
      password: "password12",
    });
    await signOut(page);
    await expect(page).toHaveURL(/\/auth/);
  });
});
