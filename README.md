# ClearCalc: free money calculators

A static website with six financial calculators, built to earn from ads and affiliate links.
There's no framework, database or server: the whole site is plain HTML, CSS and JavaScript, so it
hosts for free and loads fast.

**Calculators included:** Loan · Mortgage · Compound interest · Savings goal · Freelance rate · Salary ↔ hourly

Every calculator page also has:
- Its own SEO title, meta description, canonical URL and structured data (WebApplication + FAQ)
- 400–700 words of explanatory content, formulas and FAQs (Google and AdSense need real content, not only a tool)
- A currency picker (18 currencies, auto-guessed from the visitor's language settings, remembered across visits)
- A "copy link" button that reproduces the visitor's inputs, which encourages sharing
- Two ad slots that switch on automatically once you add your AdSense ID

---

## 1. Project layout

```
build.py              ← site generator + CONFIG (name, domain, email, AdSense ID)
src/pages/*.html      ← one file per page (content + small header block)
src/assets/style.css  ← all styles
src/assets/app.js     ← shared helpers: currency, formatting, charts, share links
src/assets/tools/*.js ← one script per calculator
public/               ← GENERATED. This is the folder you deploy.
```

## 2. Build and preview locally

```bash
python3 build.py                       # writes ./public
cd public && python3 -m http.server 8000
# open http://localhost:8000
```

Run `python3 build.py` again after every change.

## 3. Before going live

Open `build.py` and edit `CONFIG`:

| Setting | What to put |
|---|---|
| `site_name` | Your brand. "ClearCalc" is a placeholder; check the domain is available. |
| `domain` | Your real domain, e.g. `https://www.mycalcs.com` (no trailing slash) |
| `contact_email` | A real inbox. AdSense reviewers check the contact page works. |
| `adsense_client` | Leave empty for now (see step 6) |
| `ga4_id` | Optional Google Analytics ID |

Then rebuild.

> **Get a real domain.** AdSense generally won't approve free subdomains like `*.pages.dev` or `*.github.io`.
> A `.com` costs roughly $10–12/year (Cloudflare Registrar sells at cost). This is the only real expense.

## 4. Deploy for free (Cloudflare Pages recommended)

1. Push this folder to a GitHub repository.
2. In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, select the repo.
3. Build settings: **Build command:** `python3 build.py` · **Output directory:** `public`
4. Deploy, then under **Custom domains** add your domain.

Alternatives that work the same way: **Netlify** (build `python3 build.py`, publish `public`) or
**GitHub Pages** (run the build locally and commit the `public` folder to a `gh-pages` branch).

Clean URLs like `/loan-calculator/` and `404.html` work out of the box on all three.

## 5. Get found on Google

1. Add the site in **Google Search Console** (search.google.com/search-console) and verify it.
2. Submit `https://yourdomain/sitemap.xml`.
3. Use **URL Inspection → Request indexing** for the home page and each calculator.
4. Share the tools where people ask these questions: Reddit (r/personalfinance, r/freelance),
   Quora answers, Facebook/WhatsApp groups, LinkedIn, freelancer communities. Early links and visits help Google trust a new site.

Expect 2–6 months before search traffic picks up. That's normal.

## 6. Apply for AdSense

Apply once the site is live on your own domain with all pages up (it already has About, Contact,
Privacy and Terms, which reviewers look for).

1. Sign up at adsense.google.com with your domain. Use your real name and address in Rwanda.
2. AdSense gives you a publisher ID like `ca-pub-1234567890123456`.
3. Put it in `CONFIG["adsense_client"]`, rebuild and redeploy. This automatically:
   - adds the AdSense script to every page,
   - turns on the two ad slots per calculator page,
   - creates `/ads.txt`.
4. In AdSense, click **Request review**. Approval can take a few days to a few weeks.
5. Once approved, turn on **Auto ads** in the dashboard and set up the **consent message** under
   *Privacy & messaging* (required for European visitors).
6. Payments: add your bank details for **wire transfer** (available for Rwanda). Google pays once
   your balance passes the threshold (US$100). Ask your bank what it charges for incoming international wires.

If AdSense rejects the site for "low value content", add 2–3 more calculators and longer guides, then reapply.
Ezoic and Monetag are other ad networks to consider.

## 7. Affiliate income (often worth more than ads)

Add relevant partner links inside the content, and label them (the privacy policy already mentions affiliates). Ideas:

| Page | Affiliate idea |
|---|---|
| Freelance rate | Wise, Payoneer (getting paid by foreign clients), invoicing tools, Fiverr/Upwork |
| Compound interest / Savings | Investment apps and savings accounts available to your audience |
| Salary ↔ hourly | Course platforms (Coursera, Udemy), job/CV builders |
| Loan / Mortgage | Credit-score services, comparison sites (country-specific) |

Check each program's payout methods before joining. Many pay through Payoneer or bank transfer.

## 8. Growing the site

Traffic grows with the number of useful pages. Add 1–2 calculators a month. Good next ones:
- Currency/remittance fee comparison (send money to Rwanda, Kenya, Uganda…)
- Car loan / car affordability
- Debt payoff (snowball vs avalanche)
- Retirement / pension calculator
- VAT / sales tax calculator (with country presets, e.g. Rwanda 18%)
- Profit margin & markup calculator for small businesses
- Inflation calculator
- Budget planner (50/30/20 rule)

### Adding a new calculator

1. Copy `src/pages/savings-goal-calculator.html` to a new file and edit the header block
   (`title`, `description`, `path`, `h1`, `nav`, `order`, `script`, `blurb`).
2. Copy `src/assets/tools/savings.js` and change the maths. Use `CC.val(id)` to read inputs,
   `CC.money(n)` to format, and `CC.bind(root, calc)` to recalculate as the visitor types.
3. Write at least 400 words of useful explanation and a few FAQs.
4. `python3 build.py`. The page appears in the menu, footer, home page and sitemap automatically.

## Disclaimer

Results are estimates for information only, not financial advice. This wording appears in every page footer and in the Terms.
