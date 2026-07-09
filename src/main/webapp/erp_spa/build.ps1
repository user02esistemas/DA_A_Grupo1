$js = Get-Content app.js -Raw
$html = Get-Content index.html -Raw
$html = $html.Replace('<script src="app.js"></script>', ('<script>' + $js + '</script>'))
Set-Content index.html $html
