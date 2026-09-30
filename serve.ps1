$port = 8877
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    try {
        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/friends-quotes.html" }
        $filePath = Join-Path $root ($path.TrimStart("/"))
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            if ($filePath -like "*.html") { $response.ContentType = "text/html" }
            elseif ($filePath -like "*.js") { $response.ContentType = "application/javascript" }
            elseif ($filePath -like "*.css") { $response.ContentType = "text/css" }
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("Not found: $path")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
    } catch {
        $response.StatusCode = 500
    } finally {
        $response.OutputStream.Close()
    }
}
