import { test, expect } from "@playwright/test";
import { apiSignup, loginViaStorage, uniqueEmail } from "./helpers";

test.describe("Farmers UI", () => {
  test("empty state then add first farmer", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("farm-empty") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/farmers");

    await expect(page.getByText("अभी कोई किसान नहीं")).toBeVisible();

    await page.getByRole("button", { name: /पहला किसान जोड़ें/ }).click();
    await expect(page.getByRole("heading", { name: /नया किसान जोड़ें/ })).toBeVisible();

    await page.getByPlaceholder("किसान का नाम").fill("Suresh Kumar");
    await page.getByPlaceholder("+91...").fill("9111100001");
    await page.getByPlaceholder("गाँव का नाम").fill("Rampur");
    await page.getByPlaceholder("गेहूं, धान, सोयाबीन").fill("wheat");

    await page.getByRole("button", { name: /^जोड़ें$/ }).click();

    await expect(page.getByText("किसान जोड़ दिया गया")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Suresh Kumar" })).toBeVisible();
    await expect(page.getByText("9111100001")).toBeVisible();
    await expect(page.getByText("Rampur")).toBeVisible();
  });

  test("edit a farmer updates the row", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("farm-edit") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/farmers");

    // Add farmer
    await page.getByRole("button", { name: /पहला किसान जोड़ें/ }).click();
    await page.getByPlaceholder("किसान का नाम").fill("Old Name");
    await page.getByPlaceholder("+91...").fill("9111100002");
    await page.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByRole("cell", { name: "Old Name" })).toBeVisible();

    // Click the edit icon (Pencil) — aria-label "संपादित करें"
    await page.getByLabel("संपादित करें").click();
    await expect(page.getByRole("heading", { name: /किसान अपडेट करें/ })).toBeVisible();

    const nameField = page.getByPlaceholder("किसान का नाम");
    await nameField.fill("New Name");
    await page.getByRole("button", { name: /अपडेट करें/ }).click();

    await expect(page.getByText("किसान अपडेट हो गया")).toBeVisible();
    await expect(page.getByRole("cell", { name: "New Name" })).toBeVisible();
    await expect(page.getByText("Old Name")).toHaveCount(0);
  });

  test("delete a farmer removes the row", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("farm-del") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/farmers");

    await page.getByRole("button", { name: /पहला किसान जोड़ें/ }).click();
    await page.getByPlaceholder("किसान का नाम").fill("To Delete");
    await page.getByPlaceholder("+91...").fill("9111100003");
    await page.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByRole("cell", { name: "To Delete" })).toBeVisible();

    await page.getByLabel("हटाएं").click();
    // Delete confirm modal — click "Confirm" / "हटाएं"
    await page.getByRole("button", { name: /हटाएं|Delete/ }).last().click();

    await expect(page.getByText("किसान हटा दिया गया")).toBeVisible();
    await expect(page.getByText("अभी कोई किसान नहीं")).toBeVisible();
  });

  test("search filters the farmer list", async ({ page }) => {
    const dealer = await apiSignup({ email: uniqueEmail("farm-search") });
    await loginViaStorage(page, dealer);
    await page.goto("/dashboard/farmers");

    // Add two farmers
    await page.getByRole("button", { name: /पहला किसान जोड़ें/ }).click();
    await page.getByPlaceholder("किसान का नाम").fill("Ramesh");
    await page.getByPlaceholder("+91...").fill("9111111111");
    await page.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByRole("cell", { name: "Ramesh" })).toBeVisible();

    await page.getByRole("button", { name: /किसान जोड़ें/ }).first().click();
    await page.getByPlaceholder("किसान का नाम").fill("Mahesh");
    await page.getByPlaceholder("+91...").fill("9222222222");
    await page.getByRole("button", { name: /^जोड़ें$/ }).click();
    await expect(page.getByRole("cell", { name: "Mahesh" })).toBeVisible();

    // Type "Ramesh" in search; only Ramesh row should be visible
    await page.getByPlaceholder("नाम, फ़ोन या गाँव से खोजें...").fill("Ramesh");
    await expect(page.getByRole("cell", { name: "Ramesh" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mahesh" })).toHaveCount(0);

    // Clear search; both visible
    await page.getByPlaceholder("नाम, फ़ोन या गाँव से खोजें...").fill("");
    await expect(page.getByRole("cell", { name: "Ramesh" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mahesh" })).toBeVisible();
  });
});
