# Billing Widget — QA Review

## a. Problems found

### Security

- **No CVV / security code field at all.** This is the biggest issue; 
  most payment processors require it, and its absence either blocks
  every transaction at the gateway or lets unverified card data through,
  raising fraud and chargeback risk.
- **No bot/fraud protection visible** (e.g. rate limiting or a challenge on
  repeated failed submissions) — payment forms are a common target for
  card-testing fraud, where stolen card numbers are validated in bulk.
- **Card Number has no masking strategy specified.** Best practice is to show
  digits while typing but mask once focus leaves the field, so a card number
  isn't left in plain view on a shared screen.
- **Raw card data is collected directly** rather than through a tokenizing
  field from a processor (Stripe, Braintree, Adyen, etc.). Every field the
  company's own servers touch directly adds to PCI DSS audit scope.

### Usability

- **Card Type defaults to "VISA"** — easy to miss if the customer's actual
  card is a different network, leading to a confusing failed charge.
- **No inline/real-time validation** — nothing suggests errors appear as you
  type or tab away; everything seems to defer to a single point of failure
  on "Continue."
- **Card Number and Postal Code both push formatting onto the user** ("no
  dashes or spaces") instead of the UI auto-stripping characters as typed.
- **No currency shown** next to "Payment Amount: 30.00" — ambiguous for a
  company described as global.
- **"Continue" and "Cancel" carry equal visual weight** — no clear primary
  action, raising the odds of an accidental cancel.

### Performance / Functional

- **No Country field** — only "State or Province." For a self-described
  global SaaS company, this breaks the form outright for any customer whose
  address doesn't fit a US/Canada model.
- **Card Type isn't cross-checked against the card number** — a user can
  select "VISA" and type a Mastercard/Amex number with no mismatch caught.
- **No validation that the expiration date is in the future** — nothing
  indicates past month/year combinations are disabled or rejected.
- **No visible protection against duplicate submission** — a double-click on
  "Continue" could plausibly submit (and charge) twice; needs idempotency
  handling client- or server-side.

## b. Sample test cases

> The three cases below are written as Playwright test code, in the same
> style as the automation built earlier in this exercise. The billing widget
> is a static mock-up with no live implementation to point a real browser at,
> so the selectors (`getByLabel('Card Number')`, etc.) are illustrative —
> based on the field labels visible in the mock-up — and would need
> confirming against the real page once it exists, the same way we confirmed
> the netlify form's selectors earlier. Test case 2 assumes the missing CVV
> field has been added per the fix recommended in part (c); it's written this
> way deliberately, as a regression test that should start passing once that
> fix ships.

### 1. Happy path — valid card submits successfully

- *Given* all required fields are filled with a valid Visa card number, a
  valid future expiration date, and matching CVV
- *When* "Continue" is clicked
- *Then* the form submits successfully and proceeds to the next step, with
  no validation errors shown.

```js
const { test, expect } = require('@playwright/test');

test('happy path — valid card submits successfully', async ({ page }) => {
  await page.goto('/billing'); // adjust to the real route once it exists

  await page.getByLabel('Card Type').selectOption({ label: 'VISA' });
  await page.getByLabel('Card Number').fill('4111111111111111'); // generic Visa test number
  await page.getByLabel('CVV').fill('123'); // assumes the recommended CVV field exists
  await page.getByLabel('Month').selectOption({ label: '12' });
  await page.getByLabel('Year').selectOption({ label: '2030' });
  await page.getByLabel('First Name').fill('Jane');
  await page.getByLabel('Last Name').fill('Doe');
  await page.getByLabel('Credit Card Billing Street Address').fill('123 Main St');
  await page.getByLabel('City').fill('Los Angeles');
  await page.getByLabel('State or Province').selectOption({ label: 'California' });
  await page.getByLabel('Postal Code').fill('90210');

  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText(/success|confirmation|thank/i)).toBeVisible();
});
```

### 2. Missing/invalid CVV is rejected

- *Given* a valid card number is entered but the CVV field is left blank, or
  filled with non-numeric characters
- *When* "Continue" is clicked
- *Then* submission is blocked and an inline error identifies the CVV field
  specifically (this case is also the one that would have caught the
  missing-field bug above, had the field existed to test).

```js
test('missing CVV is rejected', async ({ page }) => {
  await page.goto('/billing');

  await page.getByLabel('Card Type').selectOption({ label: 'VISA' });
  await page.getByLabel('Card Number').fill('4111111111111111');
  // CVV intentionally left blank
  await page.getByLabel('Month').selectOption({ label: '12' });
  await page.getByLabel('Year').selectOption({ label: '2030' });
  await page.getByLabel('First Name').fill('Jane');
  await page.getByLabel('Last Name').fill('Doe');
  await page.getByLabel('Credit Card Billing Street Address').fill('123 Main St');
  await page.getByLabel('City').fill('Los Angeles');
  await page.getByLabel('State or Province').selectOption({ label: 'California' });
  await page.getByLabel('Postal Code').fill('90210');

  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText(/cvv.*required|enter.*security code/i)).toBeVisible();
});
```

### 3. Card Type / card number mismatch is rejected

- *Given* "VISA" is selected in Card Type, but the entered card number
  matches a different network's numbering pattern (e.g. a Mastercard or
  Amex prefix)
- *When* "Continue" is clicked
- *Then* the form rejects the mismatch with a clear error, rather than
  silently submitting a card type that doesn't match the actual card.

```js
test('card type and card number mismatch is rejected', async ({ page }) => {
  await page.goto('/billing');

  await page.getByLabel('Card Type').selectOption({ label: 'VISA' });
  await page.getByLabel('Card Number').fill('5555555555554444'); // generic Mastercard test number, despite VISA selected above
  await page.getByLabel('CVV').fill('123');
  await page.getByLabel('Month').selectOption({ label: '12' });
  await page.getByLabel('Year').selectOption({ label: '2030' });
  await page.getByLabel('First Name').fill('Jane');
  await page.getByLabel('Last Name').fill('Doe');
  await page.getByLabel('Credit Card Billing Street Address').fill('123 Main St');
  await page.getByLabel('City').fill('Los Angeles');
  await page.getByLabel('State or Province').selectOption({ label: 'California' });
  await page.getByLabel('Postal Code').fill('90210');

  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText(/card type.*match|doesn.?t match/i)).toBeVisible();
});
```

### How to implement and run these

These follow the exact same project setup as the netlify automation built
earlier in this exercise:

1. Drop the three `test(...)` blocks above into a single file, e.g.
   `tests/billing-widget.spec.js`, wrapped in one `test.describe(...)` block
   and with the `require('@playwright/test')` line at the top (only needed
   once per file).
2. Swap `page.goto('/billing')` for whatever the real route is once the page
   exists, and double check each `getByLabel(...)` call actually matches the
   live markup — exactly as we did with `playwright codegen` reasoning for
   the netlify form earlier.
3. Run it the same way as the existing test:
   ```bash
   npx playwright test tests/billing-widget.spec.js --headed
   ```
   (or just `npm test` to run it alongside the netlify automation, since both
   files live under the same `tests/` directory and config).

## c. Suggested product solution

**For the most severe issue (missing CVV):** add a required CVV/CVC field
next to Card Number, with a masked numeric input whose expected length is
validated against the selected Card Type (3 digits for Visa/Mastercard, 4 for
Amex). Beyond just adding the field, the better long-term fix is routing card
data — number *and* CVV — through a PCI-compliant tokenizing field hosted by
the payment processor itself, so raw card data never reaches the company's
own backend at all. That single change fixes the missing-field bug, removes
the card-type/number mismatch problem (the processor validates that), and
meaningfully shrinks PCI compliance scope, all at once — usually worth the
integration cost on a billing form.

As a secondary recommendation: add the missing Country field, with State/
Province and Postal Code rendered dynamically based on the selected country,
since "State or Province" as a single fixed dropdown won't work for most
countries outside North America.