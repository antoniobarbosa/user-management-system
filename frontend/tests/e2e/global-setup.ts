/** Test backend only (`backend/.env.test`, port 3002); dev API stays on :3001. */
const E2E_CLEANUP_BASE = "http://localhost:3002";

async function globalSetup(): Promise<void> {
  const base =
    process.env.PLAYWRIGHT_BACKEND_URL?.replace(/\/$/, "") ?? E2E_CLEANUP_BASE;
  const cleanupUrl = `${base}/api/test/cleanup`;
  try {
    const res = await fetch(cleanupUrl, { method: "DELETE" });
    if (res.status === 404) {
      console.warn(
        "[e2e global-setup] Cleanup route not registered (start backend with NODE_ENV=test to enable).",
      );
      return;
    }
    if (!res.ok) {
      console.warn(`[e2e global-setup] Cleanup returned ${res.status}`);
      return;
    }
    const body = (await res.json()) as { deleted?: number };
    console.log(`[e2e global-setup] Removed ${body.deleted ?? 0} e2e test user(s).`);
  } catch (err) {
    console.warn("[e2e global-setup] Cleanup request failed:", err);
  }
}

export default globalSetup;
