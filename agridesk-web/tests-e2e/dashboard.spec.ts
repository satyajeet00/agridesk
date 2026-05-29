import { test, expect } from "@playwright/test";
import { apiSignup, loginViaStorage, uniqueEmail } from "./helpers";

test.describe("Dashboard UI", () => {
  test("empty dealer shows zero metrics and empty states", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("dash-empty") });
    await loginViaStorage(page, dealer);

    // The four metric cards are all visible
    await expect(page.getByText("कुल उधारी")).toBeVisible();
    await expect(page.getByText("आज की बिक्री")).toBeVisible();
    await expect(page.getByText("कुल किसान")).toBeVisible();
    await expect(page.getByText("एक्सपायरी जल्द")).toBeVisible();

    // The Top Debtors and Recent Bills cards show their empty states
    await expect(page.getByText("कोई उधारी नहीं")).toBeVisible();
    await expect(page.getByText("अभी कोई बिल नहीं")).toBeVisible();
  });

  test("sidebar links navigate between modules", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("dash-nav") });
    await loginViaStorage(page, dealer);

    await page.getByRole("link", { name: /किसान/ }).first().click();
    await page.waitForURL("**/dashboard/farmers");
    await expect(page.getByRole("heading", { name: /किसान \/ Farmers/ })).toBeVisible();

    await page.getByRole("link", { name: /स्टॉक/ }).first().click();
    await page.waitForURL("**/dashboard/inventory");

    await page.getByRole("link", { name: /बिलिंग/ }).first().click();
    await page.waitForURL("**/dashboard/billing");

    await page.getByRole("link", { name: /उधारी खाता/ }).first().click();
    await page.waitForURL("**/dashboard/ledger");

    await page.getByRole("link", { name: /सेटिंग्स/ }).first().click();
    await page.waitForURL("**/dashboard/settings");

    await page.getByRole("link", { name: /डैशबोर्ड/ }).first().click();
    await page.waitForURL(/.*\/dashboard$/);
  });
});
