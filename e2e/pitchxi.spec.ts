import { test, expect } from '@playwright/test';

test.describe('PitchXI End-to-End User Journey', () => {
  const timestamp = Date.now();
  const testEmail = `manager_${timestamp}@pitchxi.test`;
  const testPassword = 'Password123!';
  const testDisplayName = `Coach Rohit ${timestamp.toString().slice(-4)}`;

  test('complete flow: register -> select match -> auto-pick -> submit -> leaderboard -> profile', async ({ page }) => {
    // 1. Visit PitchXI home page
    await page.goto('/');
    await expect(page).toHaveTitle(/PitchXI/);
    await expect(page.getByText('PitchXI', { exact: false }).first()).toBeVisible();

    // 2. Open Auth Modal and Register New Manager
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      
      // Switch to Register mode by clicking "Sign up"
      const signUpBtn = page.getByRole('button', { name: 'Sign up' });
      if (await signUpBtn.isVisible()) {
        await signUpBtn.click();
      }

      // Fill in registration form
      await page.getByPlaceholder('e.g. Captain Cool').fill(testDisplayName);
      await page.getByPlaceholder('you@example.com').fill(testEmail);
      await page.getByPlaceholder('At least 6 characters').fill(testPassword);
      
      // Submit registration
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Wait for auth modal to close and user pill to appear in navbar
      await expect(page.getByText(testDisplayName)).toBeVisible({ timeout: 5000 });
    }

    // 3. Navigate to All Matches & Select a Match
    await page.getByRole('button', { name: 'All Matches' }).click();
    await expect(page.getByText('IPL Match Fixtures')).toBeVisible();

    // Select the first match card
    await page.getByText(/Historical|Upcoming/).first().click();

    // Confirm redirected to Squad Builder
    await expect(page.getByText('Match Player Pool')).toBeVisible();

    // 4. Trigger Auto-Pick Knapsack Solver
    const autoPickBtn = page.getByRole('button', { name: /Auto-Pick/i });
    if (await autoPickBtn.count() > 0) {
      await autoPickBtn.first().click();
      // Wait for squad to be populated with 11 players
      await expect(page.getByText(/11\/11/i)).toBeVisible({ timeout: 5000 });
    }

    // 5. Submit & Lock Squad
    const submitBtn = page.getByRole('button', { name: /Submit Lineup|Lock & Submit/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for submission confirmation
    await expect(page.getByText(/Squad submitted successfully|Lineup Locked/i)).toBeVisible({ timeout: 5000 });

    // 6. Navigate to Leaderboard & Simulate Match Scoring
    await page.getByRole('button', { name: /Leaderboard/i }).click();
    await expect(page.getByText(/Match Standings & Leaderboard/i)).toBeVisible();

    // Trigger Simulate Match Scoring
    const simulateScoreBtn = page.getByRole('button', { name: /Simulate Match Scoring/i });
    if (await simulateScoreBtn.isVisible()) {
      await simulateScoreBtn.click();
      // Verify scoring success notification
      await expect(page.getByText(/Scored|Leaderboard updated/i)).toBeVisible({ timeout: 5000 });
    }

    // Verify current user squad appears in standings table
    await expect(page.getByText(testDisplayName)).toBeVisible();

    // 7. Navigate to Manager Profile & Verify Career Stats
    await page.getByRole('button', { name: /Profile/i }).click();
    await expect(page.getByText(/Career Points/i)).toBeVisible();
    await expect(page.getByText(/Squad Submission History/i)).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();

    // Verify at least 1 submitted squad in history
    await expect(page.getByText(/Rank #|Fantasy Points/i).first()).toBeVisible();
  });
});
