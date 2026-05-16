$serviceKey = "YOUR_SUPABASE_SERVICE_ROLE_KEY"
$supabaseUrl = "https://okgkghrlxsdkhzbpzlus.supabase.co"

$headers = @{
    "apikey"        = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=minimal"
}

# Use Supabase's pg endpoint for raw SQL
$sql = @"
create table if not exists public.site_assets (key text primary key, label text not null, category text not null default 'other', image_url text not null, updated_at timestamptz default now());
"@

$body = @{ query = $sql } | ConvertTo-Json

try {
    $res = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/rpc/exec" `
        -Method POST `
        -Headers $headers `
        -Body $body
    Write-Output "SUCCESS via rpc/exec"
} catch {
    Write-Output "rpc/exec failed: $($_.Exception.Message)"
}

# Try another approach - direct table creation check
Write-Output "`nChecking existing tables..."
try {
    $checkHeaders = @{
        "apikey"        = $serviceKey
        "Authorization" = "Bearer $serviceKey"
    }
    $tables = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/site_assets?limit=1" `
        -Method GET `
        -Headers $checkHeaders
    Write-Output "Table site_assets already EXISTS!"
} catch {
    Write-Output "Table site_assets does NOT exist yet. Error: $($_.Exception.Message)"
}
