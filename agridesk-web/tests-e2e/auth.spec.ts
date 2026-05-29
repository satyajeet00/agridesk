import { test, expect } from "@playwright/test";
import { apiSignup, loginViaUi, uniqueEmail } from "./helpers";

test.describe("Auth UI", () => {
  test("signup form creates dealer and lands on dashboard", async ({ page }) => {
    const email = uniqueEmail("signup");

    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /नया अकाउंट बनाएं/ })).toBeVisible();

    await page.getByPlaceholder("श्री कृषि सेवा केंद्र").fill("UI Test Krishi");
    await page.getByPlaceholder("राजेश कुमार").fill("UI Tester");
    await page.getByPlaceholder("+91 98765 43210").fill("9999900001");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("कम से कम 6 अक्षर").fill("secret123");

    await page.getByRole("button", { name: /अकाउंट बनाएं/ }).click();

    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: /डैशबोर्ड/ })).toBeVisible();
  });

  test("signup with duplicate email shows a toast and stays on the page", async ({ page }) => {
    const email = uniqueEmail("dup");
    // First pre-create the dealer via API so we know the email is taken
    await apiSignup({ email });

    await page.goto("/signup");
    await page.getByPlaceholder("श्री कृषि सेवा केंद्र").fill("Other Shop");
    await page.getByPlaceholder("राजेश कुमार").fill("Other");
    await page.getByPlaceholder("+91 98765 43210").fill("9999900002");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("कम से कम 6 अक्षर").fill("secret123");
    await page.getByRole("button", { name: /अकाउंट बनाएं/ }).click();

    // toast contains "यह ईमेल पहले से रजिस्टर्ड है"
    await expect(page.getByText("यह ईमेल पहले से रजिस्टर्ड है")).toBeVisible();
    await expect(page).toHaveURL(/.*\/signup/);
  });

  test("login with valid credentials lands on dashboard", async ({ page }) => {
    const email = uniqueEmail("login");
    await apiSignup({ email });

    await loginViaUi(page, email);
    await expect(page.getByRole("heading", { name: /डैशबोर्ड/ })).toBeVisible();
  });

  test("login with wrong password shows toast and stays on login", async ({ page }) => {
    const email = uniqueEmail("badpw");
    await apiSignup({ email });

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("अपना पासवर्ड डालें").fill("wrong-password");
    await page.getByRole("button", { name: /लॉग इन करें/ }).click();

    await expect(page.getByText("ईमेल या पासवर्ड गलत है")).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("dashboard without session redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: /वापस स्वागत है/ })).toBeVisible();
  });

  test("logout from sidebar clears session and redirects to login", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("logout") });
    await page.goto("/login");
    await page.evaluate((s) => {
      localStorage.setItem("agridesk.session", JSON.stringify(s));
    }, dealer);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /डैशबोर्ड/ })).toBeVisible();

    // Click the desktop sidebar Log out button
    await page.getByRole("button", { name: /लॉग आउट/ }).click();
    await page.waitForURL("**/login");
    const stored = await page.evaluate(() => localStorage.getItem("agridesk.session"));
    expect(stored).toBeNull();
  });
});
