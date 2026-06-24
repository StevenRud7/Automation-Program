const { test, expect } = require('@playwright/test');

/**
 * Jones Automation Exercise — "Request a call back" flow on https://test.netlify.app/
 */

// Centralized test data so it's easy to see/change what the form gets filled with.
const TEST_DATA = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '123-456-7890',
  company: 'Company Inc',
  website: 'https://example.com',
};

// ---------------------------------------------------------------------------
// Phase 2 — locator strategy
//
// Using accessibility-based locators (getByLabel / getByRole) instead of CSS
// selectors or XPath, on purpose:
//   - They match what a user actually reads (the visible label / button text),
//     so they don't depend on ids, classes, or other markup we haven't inspected.
//   - getByLabel/getByRole match a case-insensitive SUBSTRING by default, so the
//     trailing " *" on required labels ("Name *", "Email *", "Phone *") doesn't
//     break the match — no regex needed.
//   - getByRole('button', ...) works whether the submit control is a <button>
//     or an <input type="submit">, since both expose the "button" role.
//
// Two things we can't verify without a real browser run (still true in this
// sandbox), so the code below is written to not depend on the answer either way:
//   - Whether "Number of Employees" option `value` attrs match their visible
//     text — selectOption uses { label: '51-500' } and the assertion below reads
//     the selected option's text directly, so the underlying value never matters.
//   - Whether submitting navigates to a new URL or swaps in an inline message —
//     the post-submit check waits for the success text itself, not a URL change.
// ---------------------------------------------------------------------------
function getLocators(page) {
  return {
    name: page.getByLabel('Name'),
    email: page.getByLabel('Email'),
    phone: page.getByLabel('Phone'),
    company: page.getByLabel('Company'),
    website: page.getByLabel('Website'),
    numberOfEmployees: page.getByLabel('Number of Employees'),
    submitButton: page.getByRole('button', { name: 'Request a call back' }),
  };
}

test.describe('Jones Automation Exercise', () => {
  test('fills out the request a call back form', async ({ page }) => {
    await page.goto('/');

    const locators = getLocators(page);

    await locators.name.fill(TEST_DATA.name);
    await locators.email.fill(TEST_DATA.email);
    await locators.phone.fill(TEST_DATA.phone);
    await locators.company.fill(TEST_DATA.company);
    await locators.website.fill(TEST_DATA.website);

    // Confirm each value actually landed in its field — if a locator matched
    // the wrong element this fails immediately here, instead of silently
    // submitting bad data three steps later.
    await expect(locators.name).toHaveValue(TEST_DATA.name);
    await expect(locators.email).toHaveValue(TEST_DATA.email);
    await expect(locators.phone).toHaveValue(TEST_DATA.phone);
    await expect(locators.company).toHaveValue(TEST_DATA.company);
    await expect(locators.website).toHaveValue(TEST_DATA.website);

    // Bonus: change Number of Employees from the default (1-10) to 51-500.
    await locators.numberOfEmployees.selectOption({ label: '51-500' });

    // Confirm by reading the selected option's visible text directly off the
    // DOM, rather than asserting on the <select>'s value attribute — we never
    // inspected that attribute, so we don't want the test depending on it.
    const selectedLabel = await locators.numberOfEmployees.evaluate(
      (select) => select.options[select.selectedIndex].text
    );
    expect(selectedLabel).toBe('51-500');

    // Required by the brief: capture the filled-out form before submitting.
    // Taken after the dropdown change above, so the screenshot reflects the
    // actual final state of the form (51-500), not the pre-bonus default.
    // fullPage: true so the whole form is visible, not just the viewport.
    await page.screenshot({ path: 'screenshots/before-submit.png', fullPage: true });

    // Submit the form.
    await locators.submitButton.click();

    // We don't know ahead of time whether this navigates to a dedicated
    // thank-you page or just swaps in an inline message, so wait for the
    // success text itself rather than a URL change — works either way.
    // Given the extra timeout: this is the one step in the flow that may
    // involve an actual network round trip (form submission + possible
    // navigation), unlike the earlier in-page assertions, so it gets a longer
    // budget than the config default.
    await expect(page.getByText(/thank/i)).toBeVisible({ timeout: 10_000 });
    console.log('Reached the thank you page.');
  });
});
