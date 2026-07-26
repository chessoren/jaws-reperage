import base64, pathlib, re, sys

root = pathlib.Path("/home/user/jaws-reperage/mira-landing-page")
dist = root / "dist"
out = root / "dist-single" / "index.html"
out.parent.mkdir(parents=True, exist_ok=True)

html = (dist / "index.html").read_text()

def data_uri(path: pathlib.Path) -> str:
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:image/svg+xml;base64,{b64}"

# every public svg the runtime references by absolute path
assets = {}
for p in list((dist / "assets").glob("*.svg")) + list((dist / "tiles").glob("*.svg")):
    assets[f"/{p.parent.name}/{p.name}"] = data_uri(p)
assets["/mira-logo.svg"] = data_uri(dist / "mira-logo.svg")

# inline the js bundle, rewriting asset urls inside it
js_src = re.search(r'<script type="module"[^>]*src="([^"]+)"', html).group(1)
js = (dist / js_src.lstrip("/")).read_text()
for url, uri in sorted(assets.items(), key=lambda kv: -len(kv[0])):
    js = js.replace(f'"{url}"', f'"{uri}"')
leftover = re.findall(r'"/(?:assets|tiles)/[^"]+"|"/mira-logo\.svg"', js)
if leftover:
    print("WARNING un-inlined asset refs:", set(leftover), file=sys.stderr)

css_src = re.search(r'<link rel="stylesheet"[^>]*href="([^"]+)"', html)
css = (dist / css_src.group(1).lstrip("/")).read_text() if css_src else ""

html = re.sub(r'<script type="module"[^>]*></script>', "", html)
if css_src:
    html = re.sub(r'<link rel="stylesheet"[^>]*>', "", html)
html = html.replace("</head>", f"<style>{css}</style></head>")
html = html.replace("</body>", f"<script type=\"module\">{js}</script></body>")

out.write_text(html)
print("wrote", out, f"{out.stat().st_size/1024:.0f} KB", "| inlined", len(assets), "assets")
