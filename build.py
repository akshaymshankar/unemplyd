import base64, re, pathlib
P = pathlib.Path('/home/claude/site')
html = (P/'index.html').read_text()
css = (P/'css/app.css').read_text()
def font(m):
    f = m.group(1); return 'url(data:font/woff;base64,' + base64.b64encode((P/'css'/f).resolve().read_bytes()).decode() + ')'
css = re.sub(r'url\("(\.\./fonts/[^"]+)"\)', font, css)
icon = 'data:image/svg+xml;base64,' + base64.b64encode((P/'brand/unemplyd-icon-dark.svg').read_bytes()).decode()
html = html.replace('href="brand/unemplyd-icon-dark.svg"', 'href="' + icon + '"')
html = html.replace('<link rel="stylesheet" href="css/app.css">', '<style>\n' + css + '\n</style>')
html = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n' + (P/m.group(1)).read_text().replace('</script', '<\\/script') + '\n</script>', html)
out = P/'dist'; out.mkdir(exist_ok=True)
(out/'index.html').write_text(html)
head = html.split('<head>')[1].split('</head>')[0]
body = html.split('<body>')[1].split('</body>')[0]
head = re.sub(r'<meta charset[^>]*>\s*', '', head); head = re.sub(r'<meta name="viewport"[^>]*>\s*', '', head)
head = head.replace('<title>unemplyd. — Build beyond the classroom</title>', '<title>unemplyd. Website</title>\n<meta name="claude:viewport-fit-sides" content="cover">')
art = head + '\n<script>document.documentElement.classList.add("pre")</script>\n' + body
(out/'artifact.html').write_text(art)
print(round(len(html)/1024), 'KB')
