#!/usr/bin/env python3
"""
ClearCalc static site generator.

Usage:  python3 build.py
Output: ./public  (upload this folder to any static host)

Edit the CONFIG block below, then rebuild. Each page lives in src/pages/*.html
and starts with a small header block:

    <!--
    title: Page title for the <title> tag
    description: Meta description (keep under ~155 characters)
    path: /loan-calculator/
    h1: Visible page heading
    script: loan.js            (optional, file in src/assets/tools/)
    nav: Loan                  (optional, label in the tools menu)
    -->

FAQ blocks written as <details class="faq"><summary>Q</summary><div>A</div></details>
are turned into FAQPage structured data automatically.
"""
import html
import json
import re
import shutil
from datetime import date
from pathlib import Path

# ----------------------------------------------------------------- CONFIG ---
CONFIG = {
    "site_name": "ClearCalc",
    "tagline": "Free, private money calculators",
    # Your real domain, no trailing slash. Used for canonical URLs + sitemap.
    "domain": "https://clearcalc-ay2.pages.dev",
    "contact_email": "papynsenga350@gmail.com",
    # Your AdSense publisher ID, e.g. "ca-pub-1234567890123456".
    # Leave empty until AdSense approves you: no ad code is output while empty.
    "adsense_client": "",
    # Google Analytics 4 measurement ID, e.g. "G-XXXXXXX". Optional.
    "ga4_id": "",
}
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "public"

HEADER_RE = re.compile(r"^\s*<!--(.*?)-->", re.S)
FAQ_RE = re.compile(
    r'<details class="faq">\s*<summary>(.*?)</summary>\s*<div>(.*?)</div>\s*</details>', re.S
)
TAG_RE = re.compile(r"<[^>]+>")


def parse_page(path: Path):
    text = path.read_text(encoding="utf-8")
    m = HEADER_RE.match(text)
    if not m:
        raise SystemExit(f"{path}: missing header block")
    meta = {}
    for line in m.group(1).strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for key in ("title", "description", "path", "h1"):
        if key not in meta:
            raise SystemExit(f"{path}: header missing '{key}'")
    meta["body"] = text[m.end():].strip()
    meta["order"] = int(meta.get("order", 99))
    return meta


def clean(s: str) -> str:
    return " ".join(html.unescape(TAG_RE.sub("", s)).split())


def ad_slot(name: str) -> str:
    if not CONFIG["adsense_client"]:
        return ""
    # Auto ads will also place units; these are manual slots you can fill
    # with a data-ad-slot ID from your AdSense dashboard.
    return (
        f'<div class="ad-slot ad-{name}"><ins class="adsbygoogle" style="display:block" '
        f'data-ad-client="{CONFIG["adsense_client"]}" data-ad-format="auto" '
        f'data-full-width-responsive="true"></ins>'
        f"<script>(adsbygoogle=window.adsbygoogle||[]).push({{}});</script></div>"
    )


def head_extras() -> str:
    parts = []
    if CONFIG["adsense_client"]:
        parts.append(
            '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
            f'?client={CONFIG["adsense_client"]}" crossorigin="anonymous"></script>'
        )
    if CONFIG["ga4_id"]:
        gid = CONFIG["ga4_id"]
        parts.append(
            f'<script async src="https://www.googletagmanager.com/gtag/js?id={gid}"></script>'
            "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
            f"gtag('js',new Date());gtag('config','{gid}');</script>"
        )
    return "\n".join(parts)


def render(page, tools):
    c = CONFIG
    url = c["domain"] + page["path"]
    for k in ("h1", "title", "description"):
        page[k] = page[k].replace("{{SITE_NAME}}", c["site_name"])
    current = ' aria-current="page"'
    nav_links = "".join(
        f'<a href="{t["path"]}"{current if t["path"] == page["path"] else ""}>{t["nav"]}</a>'
        for t in tools
    )
    footer_tools = "".join(f'<li><a href="{t["path"]}">{t["h1"]}</a></li>' for t in tools)

    ld = []
    if page.get("script"):
        ld.append({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": page["h1"],
            "url": url,
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Any",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
            "description": page["description"],
        })
    faqs = FAQ_RE.findall(page["body"])
    if faqs:
        ld.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": clean(q),
                 "acceptedAnswer": {"@type": "Answer", "text": clean(a)}}
                for q, a in faqs
            ],
        })
    ld_html = "".join(
        f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld
    )

    body = page["body"]
    body = body.replace("{{AD_TOP}}", ad_slot("top")).replace("{{AD_MID}}", ad_slot("mid"))
    body = body.replace("{{SITE_NAME}}", c["site_name"]).replace("{{EMAIL}}", c["contact_email"])
    body = body.replace("{{TOOL_CARDS}}", "".join(
        f'<a class="card" href="{t["path"]}"><h3>{t["h1"]}</h3><p>{t.get("blurb", "")}</p>'
        f'<span class="card-cta">Open calculator →</span></a>' for t in tools
    ))
    body = body.replace("{{UPDATED}}", date.today().strftime("%B %Y"))

    script_tag = f'<script src="/assets/tools/{page["script"]}" defer></script>' if page.get("script") else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(page["title"])}</title>
<meta name="description" content="{html.escape(page["description"])}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:title" content="{html.escape(page["title"])}">
<meta property="og:description" content="{html.escape(page["description"])}">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="{c["site_name"]}">
<meta name="theme-color" content="#0f5e4b">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
{head_extras()}
{ld_html}
</head>
<body>
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/"><img src="/assets/favicon.svg" alt="" width="28" height="28">{c["site_name"]}</a>
    <nav class="tools-nav" aria-label="Calculators">{nav_links}</nav>
    <label class="currency-pick">
      <span class="sr-only">Currency</span>
      <select id="currency" aria-label="Currency"></select>
    </label>
  </div>
</header>
<main class="wrap">
<h1>{page["h1"]}</h1>
{body}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="brand" href="/">{c["site_name"]}</a>
      <p>{c["tagline"]}. Every calculation runs in your browser — nothing you type is sent anywhere.</p>
    </div>
    <div><h4>Calculators</h4><ul>{footer_tools}</ul></div>
    <div><h4>Site</h4><ul>
      <li><a href="/about/">About</a></li>
      <li><a href="/contact/">Contact</a></li>
      <li><a href="/privacy-policy/">Privacy policy</a></li>
      <li><a href="/terms/">Terms of use</a></li>
    </ul></div>
  </div>
  <div class="wrap fine">Results are estimates for information only and are not financial advice. © {date.today().year} {c["site_name"]}</div>
</footer>
<script src="/assets/app.js" defer></script>
{script_tag}
</body>
</html>
"""


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "assets", OUT / "assets")
    for f in (SRC / "static").glob("*"):
        shutil.copy(f, OUT / f.name)

    pages = [parse_page(p) for p in sorted((SRC / "pages").glob("*.html"))]
    tools = sorted([p for p in pages if p.get("nav")], key=lambda p: p["order"])

    for page in pages:
        dest = OUT / page["path"].strip("/") / "index.html" if page["path"] != "/" else OUT / "index.html"
        if page["path"] == "/404/":
            dest = OUT / "404.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(render(page, tools), encoding="utf-8")

    today = date.today().isoformat()
    urls = "".join(
        f"<url><loc>{CONFIG['domain']}{p['path']}</loc><lastmod>{today}</lastmod></url>"
        for p in pages if p["path"] != "/404/"
    )
    (OUT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n'
    )
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {CONFIG['domain']}/sitemap.xml\n")
    if CONFIG["adsense_client"]:
        pub = CONFIG["adsense_client"].replace("ca-", "")
        (OUT / "ads.txt").write_text(f"google.com, {pub}, DIRECT, f08c47fec0942fa0\n")

    print(f"Built {len(pages)} pages into {OUT}")


if __name__ == "__main__":
    main()
