# Jones Automation Exercise

Playwright automation for the "Request a call back" form on https://test.netlify.app/.
Answers to the questions are in the ANSWERS.MD file. 

## What this does

Navigates to https://test.netlify.app/, fills in Name / Email / Phone / Company /
Website, screenshots the filled form, changes Number of Employees to 51-500,
submits, and logs to the console once the thank-you confirmation appears.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (LTS version recommended)

## Setup

```bash
npm install
npx playwright install chromium
```

> The second command downloads the actual Chromium browser binary Playwright drives.
> This could not be run inside the sandboxed environment these files were generated in
> (it tries to reach `cdn.playwright.dev`, which was blocked there) — run it once on your
> own machine after downloading these files, and you only need to do it once.

## Running the tests

```bash
npm test            # headless run
npm run test:headed # watch the browser do it live
npm run test:debug  # step through with Playwright Inspector
npm run report      # open the HTML report from the last run
```

## Project structure

```
jones-automation-exercise/
├── package.json
├── playwright.config.js     # base URL, reporter, timeouts, browser projects
├── tests/
│   └── request-call-back.spec.js   # the automation itself
├── screenshots/              # screenshot captured before clicking submit (generated on run)
├── ANSWERS.md                # written answers to the billing UI mock-up questions
└── README.md
```

## Notes for submission

The brief asks for two things — this repo covers both:

- **(a) Automation files** — everything under `tests/` and `playwright.config.js`.
- **(b) Written answers** — see `ANSWERS.md` for the billing widget QA review.

`screenshots/` is gitignored since it's a generated artifact. After running the
test once, grab the resulting `before-submit.png` from that folder and include
it alongside the code as proof of execution when you send this in.
