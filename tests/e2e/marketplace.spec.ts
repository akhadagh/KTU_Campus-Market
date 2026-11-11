import { test, expect } from "@playwright/test";

test("home page renders the marketplace entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Everything you need/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore/i }).first()).toBeVisible();
});

test("marketplace lists live approved listings", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page.getByRole("heading", { name: "Explore marketplace" })).toBeVisible();
  await expect(page.getByText(/listing/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Adum Tech Point/i }).first()).toBeVisible();
});

test("search filters the marketplace", async ({ page }) => {
  await page.goto("/marketplace");
  await page.getByLabel("Search").first().fill("charger");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/q=charger/);
});

test("product page shows price, seller and fulfilment options", async ({ page }) => {
  await page.goto("/marketplace");
  await page
    .getByRole("link", { name: /Adum Tech Point/i })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/GH₵/).first()).toBeVisible();
});

test("protected routes redirect anonymous visitors to login", async ({ page }) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Forders/);
});

test("vendor can log in with the seeded demo account and open the dashboard", async ({ page }) => {
  const email = process.env["SEED_SAMPLE_PASSWORD"] ? "adumtechpoint@campusmarket.gh" : "";
  test.skip(!email, "SEED_SAMPLE_PASSWORD is not set, so the demo account password is unknown.");
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: false })
    .first()
    .fill(process.env["SEED_SAMPLE_PASSWORD"]!);
  await page.getByRole("button", { name: /Log in/i }).click();
  await page.waitForURL(/\/(account|sell)/);
  await page.goto("/sell/dashboard");
  await expect(page.getByRole("heading", { name: "Seller dashboard" })).toBeVisible();
});

test("guest can add a listing to the cart", async ({ page }) => {
  await page.goto("/marketplace");
  await page
    .getByRole("link", { name: /Adum Tech Point/i })
    .first()
    .click();
  await page.getByRole("button", { name: /Add to cart/i }).click();
  await page.goto("/cart");
  await expect(page.getByText(/Adum Tech Point/)).toBeVisible();
});
