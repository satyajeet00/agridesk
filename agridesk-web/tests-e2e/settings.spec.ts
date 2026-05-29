import { test, expect } from "@playwright/test";
import { apiSignup, loginViaStorage, uniqueEmail } from "./helpers";

test.describe("Settings UI", () => {
  test("update dealer shop details and GSTIN", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("set-update") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/settings");

    await expect(page.getByText(/दुकान की जानकारी \/ Shop Details/)).toBeVisible();

    const shopInput = page.locator('input[name="shopName"]');
    await shopInput.fill("Updated Shop Name");

    const gstinInput = page.locator('input[name="gstin"]');
    await gstinInput.fill("22AAAAA0000A1Z5");

    await page.getByRole("button", { name: /^सेव करें$/ }).click();
    await expect(page.getByText("जानकारी अपडेट हो गई")).toBeVisible();

    // Reload to confirm persistence
    await page.reload();
    await expect(page.locator('input[name="shopName"]')).toHaveValue("Updated Shop Name");
    await expect(page.locator('input[name="gstin"]')).toHaveValue("22AAAAA0000A1Z5");
  });

  test("switch language to English persists and updates sidebar labels", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("set-lang") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/settings");

    // Click the English radio button (peer-checked label)
    await page.getByText("English").click();
    await page.getByRole("button", { name: /^सेव करें$/ }).click();
    await expect(page.getByText("जानकारी अपडेट हो गई")).toBeVisible();

    // Update local session.language to en so layout re-reads it on next nav
    await page.evaluate(() => {
      const raw = localStorage.getItem("agridesk.session");
      if (raw) {
        const s = JSON.parse(raw);
        s.language = "en";
        localStorage.setItem("agridesk.session", JSON.stringify(s));
      }
    });
    await page.goto("/dashboard");
    // Sidebar should now show "Dashboard" label
    await expect(page.getByRole("link", { name: /^Dashboard$/ })).toBeVisible();
  });

  test("add a staff member, then remove them", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("set-staff") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/settings");

    // Owner is always listed
    await expect(page.getByText("UI Tester")).toBeVisible();
    await expect(page.getByText(/मालिक/)).toBeVisible();

    await page.getByRole("button", { name: /^स्टाफ जोड़ें$/ }).first().click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText(/स्टाफ जोड़ें \/ Add Staff/)).toBeVisible();

    const staffEmail = `staff-${Date.now()}@test.com`;
    await dlg.locator('input[name="name"]').fill("Helper Hari");
    await dlg.locator('input[name="email"]').fill(staffEmail);
    await dlg.locator('input[name="password"]').fill("secret123");
    await dlg.getByRole("button", { name: /^जोड़ें$/ }).click();

    await expect(page.getByText("स्टाफ जोड़ दिया गया")).toBeVisible();
    await expect(page.getByText("Helper Hari")).toBeVisible();
    await expect(page.getByText(staffEmail)).toBeVisible();

    // Now remove the staff member
    await page.getByLabel("हटाएं").click();
    await page.getByRole("button", { name: /^हटाएं$/ }).last().click();
    await expect(page.getByText("स्टाफ हटा दिया गया")).toBeVisible();
    await expect(page.getByText("Helper Hari")).toHaveCount(0);
  });

  test("adding staff with duplicate email shows error toast", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("set-dup") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/settings");

    const dupEmail = `dup-staff-${Date.now()}@test.com`;
    // First create
    await page.getByRole("button", { name: /^स्टाफ जोड़ें$/ }).first().click();
    let dlg = page.getByRole("dialog");
    await dlg.locator('input[name="name"]').fill("First");
    await dlg.locator('input[name="email"]').fill(dupEmail);
    await dlg.locator('input[name="password"]').fill("secret123");
    await dlg.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByText("स्टाफ जोड़ दिया गया")).toBeVisible();

    // Try again with same email
    await page.getByRole("button", { name: /^स्टाफ जोड़ें$/ }).first().click();
    dlg = page.getByRole("dialog");
    await dlg.locator('input[name="name"]').fill("Second");
    await dlg.locator('input[name="email"]').fill(dupEmail);
    await dlg.locator('input[name="password"]').fill("secret123");
    await dlg.getByRole("button", { name: /^जोड़ें$/ }).click();

    await expect(page.getByText("ईमेल पहले से इस्तेमाल हो रहा है")).toBeVisible();
  });
});
