import { test, expect } from "@playwright/test";
import { apiSignup, loginViaStorage, uniqueEmail } from "./helpers";

test.describe("Inventory UI", () => {
  test("empty state then create first product", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("inv-empty") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/inventory");

    await expect(page.getByText("अभी कोई प्रोडक्ट नहीं")).toBeVisible();

    await page.getByRole("button", { name: /पहला प्रोडक्ट जोड़ें/ }).click();
    await expect(page.getByRole("heading", { name: /नया प्रोडक्ट/ })).toBeVisible();

    await page.getByPlaceholder("जैसे: DAP 50kg").fill("Urea 50kg");

    // Category select (shadcn/base-ui Select). Click trigger, then option.
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole("option", { name: /खाद \/ Fertilizer/ }).click();

    await page.getByPlaceholder("Optional").first().fill("31021000");
    // GST input is a number input with default 0; clear and type 5
    const gstInput = page.locator('input[name="gstRate"]');
    await gstInput.fill("5");

    await page.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByText("प्रोडक्ट जोड़ दिया गया")).toBeVisible();
    await expect(page.getByText("Urea 50kg")).toBeVisible();
    await expect(page.getByText("0 kg")).toBeVisible(); // no stock yet
  });

  test("add stock batch to a product updates total quantity", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("inv-stock") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/inventory");

    // Create product
    await page.getByRole("button", { name: /पहला प्रोडक्ट जोड़ें/ }).click();
    await page.getByPlaceholder("जैसे: DAP 50kg").fill("DAP 50kg");
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole("option", { name: /खाद \/ Fertilizer/ }).click();
    await page.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByText("DAP 50kg")).toBeVisible();

    // Add stock
    await page.getByRole("button", { name: /^स्टॉक जोड़ें$/ }).click();
    await expect(page.getByRole("heading", { name: /स्टॉक जोड़ें/ })).toBeVisible();

    await page.locator('input[name="batchNo"]').fill("B-1");
    await page.locator('input[name="quantity"]').fill("100");
    await page.locator('input[name="costPrice"]').fill("50");
    await page.locator('input[name="sellingPrice"]').fill("70");

    await page.getByRole("button", { name: /^स्टॉक जोड़ें$/ }).last().click();
    await expect(page.getByText("स्टॉक जोड़ दिया गया")).toBeVisible();

    // Card now shows 100 kg total stock — the big bold span is exactly "100 kg"
    await expect(page.getByText("100 kg", { exact: true })).toBeVisible();
    await expect(page.getByText("₹70/kg")).toBeVisible();
  });

  test("expiring stock card shows batches expiring in 30 days", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("inv-exp") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/inventory");

    // Create a product
    await page.getByRole("button", { name: /पहला प्रोडक्ट जोड़ें/ }).click();
    await page.getByPlaceholder("जैसे: DAP 50kg").fill("Soon Expiry");
    await page.locator('[role="combobox"]').first().click();
    await page.getByRole("option", { name: /खाद \/ Fertilizer/ }).click();
    await page.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByText("Soon Expiry")).toBeVisible();

    // Add stock with expiry 10 days from today
    const inTen = new Date();
    inTen.setDate(inTen.getDate() + 10);
    const yyyy = inTen.getFullYear();
    const mm = String(inTen.getMonth() + 1).padStart(2, "0");
    const dd = String(inTen.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    await page.getByRole("button", { name: /^स्टॉक जोड़ें$/ }).click();
    await page.locator('input[name="batchNo"]').fill("EXP-SOON");
    await page.locator('input[name="quantity"]').fill("20");
    await page.locator('input[name="costPrice"]').fill("10");
    await page.locator('input[name="sellingPrice"]').fill("15");
    await page.locator('input[name="expiryDate"]').fill(dateStr);
    await page.getByRole("button", { name: /^स्टॉक जोड़ें$/ }).last().click();

    await expect(page.getByText("स्टॉक जोड़ दिया गया")).toBeVisible();

    // The "expiring in 30 days" alert card should now show
    await expect(page.getByText("30 दिनों में एक्सपायर होने वाला स्टॉक")).toBeVisible();
    await expect(page.getByText("#EXP-SOON")).toBeVisible();
  });
});
