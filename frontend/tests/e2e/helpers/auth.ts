import type { Page } from "@playwright/test";

/** Mensagem de erro do formulário de auth (exclui o route announcer do Next.js, também `role="alert"`). */
export function authAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

export type SignUpFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type SignInFields = {
  email: string;
  password: string;
};

export function signInForm(page: Page) {
  return page
    .locator("form")
    .filter({ has: page.getByLabel("Email") })
    .filter({ hasNot: page.getByLabel("First name") });
}

export async function signUp(page: Page, fields: SignUpFields): Promise<void> {
  await page.goto("/auth");
  await page.locator("form").filter({ hasText: "First name" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("First name").fill(fields.firstName);
  await page.getByLabel("Last name").fill(fields.lastName);
  await page.getByLabel("Email").fill(fields.email);
  await page.getByLabel("Password", { exact: true }).fill(fields.password);
  await page.getByLabel("Confirm password").fill(fields.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/dashboard/);
}

export async function signIn(page: Page, fields: SignInFields): Promise<void> {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Sign in" }).first().click();
  const form = signInForm(page);
  await form.waitFor({ state: "visible" });
  await form.getByLabel("Email").fill(fields.email);
  await form.getByLabel("Password").fill(fields.password);
  await form.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/);
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/auth/);
}
