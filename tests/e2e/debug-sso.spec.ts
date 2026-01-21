import { test, expect } from "@playwright/test";

test("Debug Google SSO Failure", async ({ page }) => {
  // Go to login page
  await page.goto("https://taaforthemasses.com/login");

  // Monitor Network
  const requestPromise = page.waitForRequest((req) =>
    req.url().includes("/api/auth/sign-in/social"),
  );
  const responsePromise = page.waitForResponse((res) =>
    res.url().includes("/api/auth/sign-in/social"),
  );

  // Click Google Button
  await page.getByRole("button", { name: /Google/i }).click();

  // Capture Request
  const request = await requestPromise;
  console.log(
    ">> REQUEST BODY:",
    JSON.stringify(request.postDataJSON(), null, 2),
  );

  // Capture Response
  const response = await responsePromise;
  console.log("<< RESPONSE STATUS:", response.status());
  const body = await response.json();
  console.log("<< RESPONSE BODY:", JSON.stringify(body, null, 2));

  // Check if we redirected
  await page.waitForTimeout(3000);
  console.log("📍 FINAL URL:", page.url());
});
