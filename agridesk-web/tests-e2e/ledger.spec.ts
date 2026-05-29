import { test, expect } from "@playwright/test";
import { apiSignup, loginViaStorage, uniqueEmail } from "./helpers";

async function createFarmerViaUi(page: import("@playwright/test").Page, name: string, phone: string) {
  await page.goto("/dashboard/farmers");
  await page.getByRole("button", { name: /किसान जोड़ें|पहला किसान जोड़ें/ }).first().click();
  await page.getByPlaceholder("किसान का नाम").fill(name);
  await page.getByPlaceholder("+91...").fill(phone);
  await page.getByRole("button", { name: /^जोड़ें$/ }).click();
  await expect(page.getByText("किसान जोड़ दिया गया")).toBeVisible();
}

test.describe("Ledger UI", () => {
  test("add credit then payment updates farmer balance through the UI", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("ledger") });
    await loginViaStorage(page, dealer);

    await createFarmerViaUi(page, "Anil", "9333300001");

    await page.goto("/dashboard/ledger");
    await expect(page.getByText("कुल बाकी उधारी")).toBeVisible();

    // Add credit
    await page.getByRole("button", { name: /उधारी दें/ }).click();
    const creditDialog = page.getByRole("dialog");
    await expect(creditDialog.getByRole("heading", { name: /उधारी दें/ })).toBeVisible();

    await creditDialog.locator('[role="combobox"]').click();
    await page.getByRole("option", { name: /Anil/ }).click();
    await creditDialog.locator('input[name="amount"]').fill("500");
    await creditDialog.locator('input[name="note"]').fill("seed");
    await creditDialog.getByRole("button", { name: /उधारी दर्ज करें/ }).click();

    await expect(page.getByText("उधारी दर्ज हो गई")).toBeVisible();
    // Outstanding card (the big bold red text) should now show ₹500
    await expect(page.getByText("₹500", { exact: true })).toBeVisible();
    await expect(page.getByText("+₹500")).toBeVisible(); // ledger row

    // Add payment ₹200
    await page.getByRole("button", { name: /भुगतान लें/ }).click();
    const payDialog = page.getByRole("dialog");
    await expect(payDialog.getByRole("heading", { name: /भुगतान लें/ })).toBeVisible();
    await payDialog.locator('[role="combobox"]').click();
    await page.getByRole("option", { name: /Anil/ }).click();
    await payDialog.locator('input[name="amount"]').fill("200");
    await payDialog.getByRole("button", { name: /भुगतान दर्ज करें/ }).click();
    await expect(page.getByText("भुगतान दर्ज हो गया")).toBeVisible();

    // After: outstanding card shows ₹300, payment row shows -₹200
    await expect(page.getByText("₹300", { exact: true })).toBeVisible();
    await expect(page.getByText("-₹200")).toBeVisible();
  });

  test("type filter narrows entries to credits only", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("ledger-flt") });
    await loginViaStorage(page, dealer);

    await createFarmerViaUi(page, "Bali", "9333300002");

    // Add one credit and one payment via UI
    await page.goto("/dashboard/ledger");
    await page.getByRole("button", { name: /उधारी दें/ }).click();
    let dlg = page.getByRole("dialog");
    await dlg.locator('[role="combobox"]').click();
    await page.getByRole("option", { name: /Bali/ }).click();
    await dlg.locator('input[name="amount"]').fill("400");
    await dlg.getByRole("button", { name: /उधारी दर्ज करें/ }).click();
    await expect(page.getByText("उधारी दर्ज हो गई")).toBeVisible();

    await page.getByRole("button", { name: /भुगतान लें/ }).click();
    dlg = page.getByRole("dialog");
    await dlg.locator('[role="combobox"]').click();
    await page.getByRole("option", { name: /Bali/ }).click();
    await dlg.locator('input[name="amount"]').fill("150");
    await dlg.getByRole("button", { name: /भुगतान दर्ज करें/ }).click();
    await expect(page.getByText("भुगतान दर्ज हो गया")).toBeVisible();

    // Two ledger rows visible
    await expect(page.getByText("+₹400")).toBeVisible();
    await expect(page.getByText("-₹150")).toBeVisible();

    // Apply credit filter — the type filter is the <select> that contains the
    // सभी / All option. There's also a reminder picker <select>, so target by option.
    const typeFilter = page
      .locator("select")
      .filter({ has: page.locator('option[value="credit"]') });
    await typeFilter.selectOption("credit");
    await expect(page.getByText("+₹400")).toBeVisible();
    await expect(page.getByText("-₹150")).toHaveCount(0);
  });
});
