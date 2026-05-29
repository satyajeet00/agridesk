import { test, expect } from "@playwright/test";
import { apiCall, apiSignup, loginViaStorage, uniqueEmail } from "./helpers";

test.describe("Billing UI", () => {
  test("create bill with GST math, partial payment becomes credit on farmer", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("bill") });

    // Seed farmer + product + stock via API (UI for these is exercised elsewhere)
    const farmerResp = await apiCall(dealer.token, "POST", "/api/farmers", {
      name: "Bill Farmer",
      phone: "9444400001",
    });
    expect(farmerResp.status).toBe(200);

    const productResp = await apiCall(dealer.token, "POST", "/api/products", {
      name: "DAP",
      category: "fertilizer",
      unit: "kg",
      hsnCode: "31021000",
      gstRate: 5,
    });
    expect(productResp.status).toBe(200);

    const stockResp = await apiCall(dealer.token, "POST", "/api/stock", {
      productId: productResp.body.id,
      batchNo: "B-1",
      quantity: 100,
      costPrice: 800,
      sellingPrice: 1000,
    });
    expect(stockResp.status).toBe(200);

    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/billing");
    await expect(page.getByText("अभी कोई बिल नहीं")).toBeVisible();

    await page.getByRole("button", { name: /पहला बिल बनाएं/ }).click();
    await expect(page.getByRole("heading", { name: /नया बिल बनाएं/ })).toBeVisible();

    // Pick farmer
    await page.locator('[role="combobox"]').nth(0).click();
    await page.getByRole("option", { name: /Bill Farmer/ }).click();

    // Pick product (first product combobox in line items)
    await page.locator('[role="combobox"]').nth(1).click();
    await page.getByRole("option", { name: /^DAP$/ }).click();

    // Quantity 2 — selling price auto-fills to 1000 from the batch
    await page.locator('input[placeholder="Qty"]').fill("2");

    // Scope assertions to the inside-dialog totals card.
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("₹2,000", { exact: true })).toBeVisible(); // subtotal
    await expect(dialog.getByText("₹100", { exact: true })).toBeVisible(); // GST
    await expect(dialog.getByText("₹2,100", { exact: true })).toBeVisible(); // total

    // Pay only ₹1000 — credit ₹1100 should be shown
    await page.locator('input[type="number"]').last().fill("1000");
    await expect(page.getByText(/उधारी: ₹1,100/)).toBeVisible();

    await page.getByRole("button", { name: /^बिल बनाएं$/ }).click();
    await expect(page.getByText("बिल बन गया!")).toBeVisible();

    // Bill row visible in the table: total ₹2,100 + credit ₹1,100
    await expect(page.getByRole("cell", { name: "Bill Farmer" })).toBeVisible();
    await expect(page.getByText(/उधारी: ₹1,100/)).toBeVisible();

    // Farmer page reflects the new balance
    await page.goto("/dashboard/farmers");
    await expect(page.getByRole("cell", { name: "Bill Farmer" })).toBeVisible();
    await expect(page.getByText("₹1,100").first()).toBeVisible();
  });

  test("bill detail dialog shows itemized table and totals", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("bill-detail") });

    // Seed farmer + product + stock + a bill
    const farmer = await apiCall(dealer.token, "POST", "/api/farmers", {
      name: "Det Farmer",
      phone: "9444400002",
    });
    const product = await apiCall(dealer.token, "POST", "/api/products", {
      name: "Seed Pack",
      category: "seed",
      unit: "packet",
      gstRate: 0,
    });
    await apiCall(dealer.token, "POST", "/api/stock", {
      productId: product.body.id,
      batchNo: "S-1",
      quantity: 50,
      costPrice: 100,
      sellingPrice: 150,
    });
    const billResp = await apiCall(dealer.token, "POST", "/api/bills", {
      farmerId: farmer.body.id,
      items: [{ productId: product.body.id, quantity: 3, unitPrice: 150 }],
      method: "cash",
      paidAmount: 450,
    });
    expect(billResp.status).toBe(200);

    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/billing");

    await expect(page.getByText("Det Farmer")).toBeVisible();
    // Click the "देखें" (Eye) icon
    await page.getByLabel("देखें").click();
    await expect(page.getByRole("heading", { name: /बिल #/ })).toBeVisible();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Seed Pack")).toBeVisible();
    await expect(dialog.getByText("कुल / Total")).toBeVisible();
    // "भुगतान / Paid" row should show ₹450
    await expect(dialog.getByText("भुगतान / Paid")).toBeVisible();
    await expect(dialog.getByText("₹450").first()).toBeVisible();
  });

  test("delete bill removes it from list", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("bill-del") });

    const farmer = await apiCall(dealer.token, "POST", "/api/farmers", {
      name: "Del Farmer",
      phone: "9444400003",
    });
    const product = await apiCall(dealer.token, "POST", "/api/products", {
      name: "ToDelete",
      category: "other",
      unit: "piece",
      gstRate: 0,
    });
    await apiCall(dealer.token, "POST", "/api/stock", {
      productId: product.body.id,
      quantity: 5,
      costPrice: 10,
      sellingPrice: 20,
    });
    await apiCall(dealer.token, "POST", "/api/bills", {
      farmerId: farmer.body.id,
      items: [{ productId: product.body.id, quantity: 1, unitPrice: 20 }],
      method: "cash",
      paidAmount: 20,
    });

    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/billing");
    await expect(page.getByText("Del Farmer")).toBeVisible();

    await page.getByLabel("हटाएं").click();
    // Confirm modal
    await page.getByRole("button", { name: /^हटाएं$/ }).last().click();

    await expect(page.getByText("बिल हटा दिया गया")).toBeVisible();
    await expect(page.getByText("अभी कोई बिल नहीं")).toBeVisible();
  });
});
