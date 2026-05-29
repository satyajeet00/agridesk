import { Page, expect, request as pwRequest } from "@playwright/test";

export const API_URL = "http://127.0.0.1:8080";

export interface SignupParams {
  shopName?: string;
  ownerName?: string;
  phone?: string;
  email: string;
  password?: string;
  language?: "hi" | "en";
}

export function uniqueEmail(prefix = "ui"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.com`;
}

/**
 * Create a dealer directly through the REST API (faster than driving the signup
 * form for every test). Returns the bearer token + dealer info so tests can
 * either pre-seed via API or sign in through the UI.
 */
export async function apiSignup(params: SignupParams) {
  const ctx = await pwRequest.newContext({ baseURL: API_URL });
  const resp = await ctx.post("/api/auth/signup", {
    data: {
      shopName: params.shopName ?? "UI Test Shop",
      ownerName: params.ownerName ?? "UI Tester",
      phone: params.phone ?? "9999900000",
      email: params.email,
      password: params.password ?? "secret123",
      language: params.language ?? "hi",
    },
  });
  if (!resp.ok()) {
    throw new Error(`apiSignup failed ${resp.status()}: ${await resp.text()}`);
  }
  const body = await resp.json();
  await ctx.dispose();
  return body as {
    token: string;
    userId: string;
    email: string;
    name: string;
    role: string;
    dealerId: string;
    shopName: string;
    language: string;
  };
}

/**
 * Pre-populate the browser's localStorage with a session and load the dashboard
 * directly — skips the login screen so feature tests are fast.
 */
export async function loginViaStorage(
  page: Page,
  session: Awaited<ReturnType<typeof apiSignup>>
) {
  // Go to the origin first so localStorage is available
  await page.goto("/login");
  await page.evaluate((s) => {
    localStorage.setItem(
      "agridesk.session",
      JSON.stringify({
        token: s.token,
        userId: s.userId,
        email: s.email,
        name: s.name,
        role: s.role,
        dealerId: s.dealerId,
        shopName: s.shopName,
        language: s.language,
      })
    );
  }, session);
  await page.goto("/dashboard");
  // Wait until the trial banner / dashboard header is visible (layout finished its API call)
  await expect(page.getByRole("heading", { name: /डैशबोर्ड/ })).toBeVisible();
}

export async function loginViaUi(page: Page, email: string, password = "secret123") {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("अपना पासवर्ड डालें").fill(password);
  await page.getByRole("button", { name: /लॉग इन करें/ }).click();
  await page.waitForURL("**/dashboard");
}

/** Wait briefly for any toast to disappear so it doesn't intercept clicks. */
export async function dismissToasts(page: Page) {
  // sonner toasts auto-dismiss; just give them a moment
  await page.waitForTimeout(300);
}

/** Helper to call any authenticated backend endpoint as a given dealer. */
export async function apiCall(
  token: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const ctx = await pwRequest.newContext({ baseURL: API_URL });
  const resp = await ctx.fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const status = resp.status();
  let parsed: unknown = null;
  try {
    parsed = await resp.json();
  } catch {
    parsed = null;
  }
  await ctx.dispose();
  return { status, body: parsed };
}
