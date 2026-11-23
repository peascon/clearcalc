#!/usr/bin/env python3
"""
ClearCalc static site generator.

Usage:  python3 build.py
Output: ./public  (upload this folder to any static host)

YOUR SETTINGS live in site.json (next to this file), not here, so updating
build.py can never overwrite them. Example site.json:

    {
      "site_name": "ClearCalc",
      "domain": "https://clearcalc-ay2.pages.dev",
      "contact_email": "you@example.com",
      "adsense_client": "",
      "ga4_id": ""
    }

Pages live in src/pages/*.html (English) and src/pages/fr/*.html (French).
Each starts with a header block:

    <!--
    title: Page title for the <title> tag
    description: Meta description (keep under ~155 characters)
    path: /loan-calculator/
    h1: Visible page heading
    script: loan.js            (optional, file in src/assets/tools/)
    nav: Loan                  (optional: marks the page as a calculator in menus)
    lang: fr                   (optional, default en)
    -->

A page and its translation are linked automatically when they use the same
script (the home pages are linked by path). FAQ blocks written as
<details class="faq"><summary>Q</summary><div>A</div></details> become
FAQPage structured data.
"""
import html
import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "public"

DEFAULTS = {
    "site_name": "ClearCalc",
    "domain": "https://www.example.com",
    "contact_email": "hello@example.com",
    "adsense_client": "",
    "ga4_id": "",
}


def load_config():
    cfg = dict(DEFAULTS)
    path = ROOT / "site.json"
    if path.exists():
        cfg.update(json.loads(path.read_text(encoding="utf-8")))
    if "example.com" in cfg["domain"]:
        raise SystemExit(
            "site.json is missing or still uses example.com.\n"
            "Create site.json next to build.py with your real domain and email (see the top of build.py)."
        )
    cfg["domain"] = cfg["domain"].rstrip("/")
    return cfg


CONFIG = load_config()

LANGS = ["en", "fr"]
UI = {
    "en": {
        "locale": "en_US",
        "tagline": "Free, private money calculators",
        "private": "Every calculation runs in your browser — nothing you type is sent anywhere.",
        "calculators": "Calculators",
        "open": "Open calculator →",
        "site": "Site",
        "about": "About", "contact": "Contact", "privacy": "Privacy policy", "terms": "Terms of use",
        "fine": "Results are estimates for information only and are not financial advice.",
        "currency": "Currency",
        "switch_label": "Français",
        "switch_short": "FR",
    },
    "fr": {
        "locale": "fr_FR",
        "tagline": "Calculatrices financières gratuites et privées",
        "private": "Tous les calculs se font dans votre navigateur : rien de ce que vous saisissez n'est envoyé.",
        "calculators": "Calculatrices",
        "open": "Ouvrir la calculatrice →",
        "site": "Site",
        "about": "À propos (EN)", "contact": "Contact (EN)", "privacy": "Confidentialité (EN)", "terms": "Conditions d'utilisation (EN)",
        "fine": "Les résultats sont des estimations fournies à titre informatif et ne constituent pas un conseil financier.",
        "currency": "Devise",
        "switch_label": "English",
        "switch_short": "EN",
    },
}

HEADER_RE = re.compile(r"^\s*<!--(.*?)-->", re.S)
FAQ_RE = re.compile(
    r'<details class="faq">\s*<summary>(.*?)</summary>\s*<div>(.*?)</div>\s*</details>', re.S
)
TAG_RE = re.compile(r"<[^>]+>")


def parse_page(path: Path, default_lang: str):
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
    meta["lang"] = meta.get("lang", default_lang)
    meta["key"] = meta.get("key") or meta.get("script") or ("home" if meta["path"] in ("/", "/fr/") else meta["path"])
    return meta


def clean(s: str) -> str:
    return " ".join(html.unescape(TAG_RE.sub("", s)).split())


def ad_slot(name: str) -> str:
    if not CONFIG["adsense_client"]:
        return ""
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


def render(page, tools, alternates, home_of):
    c = CONFIG
    lang = page["lang"]
    t = UI[lang]
    url = c["domain"] + page["path"]
    for k in ("h1", "title", "description"):
        page[k] = page[k].replace("{{SITE_NAME}}", c["site_name"])

    current = ' aria-current="page"'
    nav_links = "".join(
        f'<a href="{x["path"]}"{current if x["path"] == page["path"] else ""}>{x["h1"]}</a>'
        for x in tools
    )
    footer_tools = "".join(f'<li><a href="{x["path"]}">{x["h1"]}</a></li>' for x in tools)

    # Language links: the translated version of this page, or the other language's home page.
    alt = alternates.get(page["key"], {})
    other = "fr" if lang == "en" else "en"
    switch_href = alt[other]["path"] if other in alt else home_of[other]
    hreflang = ""
    if len(alt) > 1:
        hreflang = "".join(
            f'<link rel="alternate" hreflang="{lg}" href="{c["domain"]}{p["path"]}">' for lg, p in alt.items()
        )
        if "en" in alt:
            hreflang += f'<link rel="alternate" hreflang="x-default" href="{c["domain"]}{alt["en"]["path"]}">'

    ld = []
    if page.get("script"):
        ld.append({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": page["h1"],
            "url": url,
            "inLanguage": lang,
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
            "inLanguage": lang,
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
        f'<a class="card" href="{x["path"]}"><h3>{x["h1"]}</h3><p>{x.get("blurb", "")}</p>'
        f'<span class="card-cta">{t["open"]}</span></a>' for x in tools
    ))
    body = body.replace("{{UPDATED}}", date.today().strftime("%B %Y"))

    script_tag = f'<script src="/assets/tools/{page["script"]}" defer></script>' if page.get("script") else ""
    home = home_of[lang]

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(page["title"])}</title>
<meta name="description" content="{html.escape(page["description"])}">
<link rel="canonical" href="{url}">
{hreflang}
<meta property="og:type" content="website">
<meta property="og:locale" content="{t["locale"]}">
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
    <a class="brand" href="{home}" aria-label="{c["site_name"]}"><img src="/assets/favicon.svg" alt="" width="28" height="28">{c["site_name"]}</a>
    <details class="menu">
      <summary>{t["calculators"]} <span aria-hidden="true">▾</span></summary>
      <nav class="menu-panel" aria-label="{t["calculators"]}">{nav_links}</nav>
    </details>
    <a class="lang-switch" href="{switch_href}" hreflang="{other}" lang="{other}" title="{t["switch_label"]}">{t["switch_short"]}</a>
    <label class="currency-pick">
      <span class="sr-only">{t["currency"]}</span>
      <select id="currency" aria-label="{t["currency"]}"></select>
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
      <a class="brand" href="{home}">{c["site_name"]}</a>
      <p>{t["tagline"]}. {t["private"]}</p>
    </div>
    <div><h4>{t["calculators"]}</h4><ul>{footer_tools}</ul></div>
    <div><h4>{t["site"]}</h4><ul>
      <li><a href="/about/">{t["about"]}</a></li>
      <li><a href="/contact/">{t["contact"]}</a></li>
      <li><a href="/privacy-policy/">{t["privacy"]}</a></li>
      <li><a href="/terms/">{t["terms"]}</a></li>
      <li><a href="{switch_href}" hreflang="{other}" lang="{other}">{t["switch_label"]}</a></li>
    </ul></div>
  </div>
  <div class="wrap fine">{t["fine"]} © {date.today().year} {c["site_name"]}</div>
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
    static = SRC / "static"
    if static.exists():
        for f in static.glob("*"):
            shutil.copy(f, OUT / f.name)

    pages = [parse_page(p, "en") for p in sorted((SRC / "pages").glob("*.html"))]
    fr_dir = SRC / "pages" / "fr"
    if fr_dir.exists():
        pages += [parse_page(p, "fr") for p in sorted(fr_dir.glob("*.html"))]

    tools = {lg: sorted([p for p in pages if p.get("nav") and p["lang"] == lg], key=lambda p: p["order"]) for lg in LANGS}
    alternates = {}
    for p in pages:
        alternates.setdefault(p["key"], {})[p["lang"]] = p
    home_of = {lg: ("/" if lg == "en" else f"/{lg}/") for lg in LANGS}
    if "fr" not in alternates.get("home", {}):
        home_of["fr"] = "/"

    for page in pages:
        if page["path"] == "/404/":
            dest = OUT / "404.html"
        elif page["path"] == "/":
            dest = OUT / "index.html"
        else:
            dest = OUT / page["path"].strip("/") / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(render(page, tools[page["lang"]], alternates, home_of), encoding="utf-8")

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
