# AgriDesk Demo Seeding Script
# Populates the running backend with realistic Indian agri-input dealer data
# so the Loom recording, screenshots, and live demos look like a real dealer's
# shop, not an empty schema.
#
# Run:
#   1. Start the backend:    cd c:\trial\agridesk-api ; mvn spring-boot:run
#   2. (optional fresh DB)   Stop backend, delete agridesk-api\data\, restart
#   3. Run this script:      pwsh -File c:\trial\docs\seed-demo.ps1
#   4. Open the frontend at  http://127.0.0.1:5501
#   5. Log in with:          demo@agridesk.in  /  demo123
#
# The script is idempotent in the "signup-or-login" sense: if the demo dealer
# already exists it logs in instead of failing. But farmers/products/bills are
# created fresh each run, so re-running on the same DB will create duplicates.
# For a clean re-seed, delete agridesk-api\data\ first.

param(
    [string]$BaseUrl       = "http://127.0.0.1:8080",
    [string]$DealerEmail   = "demo@agridesk.in",
    [string]$DealerPassword = "demo123"
)

$ErrorActionPreference = "Continue"
$ProgressPreference   = "SilentlyContinue"

# ---- output helpers ---------------------------------------------------------
function Write-Step($msg)    { Write-Host "  $msg" -ForegroundColor Gray }
function Write-Ok($msg)      { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)     { Write-Host "  [ERROR] $msg" -ForegroundColor Red }
function Write-Section($t)   {
    Write-Host ""
    Write-Host "=== $t ===" -ForegroundColor Cyan
}

# ---- HTTP helper (PowerShell 5.1 compatible) --------------------------------
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        $Body = $null,
        [string]$Token = $null
    )
    $headers = @{ "Content-Type" = "application/json; charset=utf-8" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $params = @{
        Method  = $Method
        Uri     = "$BaseUrl$Path"
        Headers = $headers
        UseBasicParsing = $true
    }
    if ($null -ne $Body) {
        # Encode JSON body as UTF-8 bytes explicitly so Hindi text survives the
        # PS 5.1 Invoke-WebRequest pipeline (otherwise it defaults to ISO-8859-1).
        $json = $Body | ConvertTo-Json -Depth 8 -Compress
        $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($json)
    }

    try {
        $resp = Invoke-WebRequest @params
        $obj = $null
        if ($resp.Content) {
            try { $obj = $resp.Content | ConvertFrom-Json -ErrorAction Stop } catch { $obj = $null }
        }
        return [pscustomobject]@{ Status = [int]$resp.StatusCode; Body = $obj; Raw = $resp.Content }
    } catch [System.Net.WebException] {
        $we = $_.Exception
        $status = 0
        $raw = $we.Message
        $obj = $null
        if ($we.Response) {
            try { $status = [int]$we.Response.StatusCode } catch {}
            try {
                $stream = $we.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $raw = $reader.ReadToEnd()
                $reader.Close()
                if ($raw) { try { $obj = $raw | ConvertFrom-Json -ErrorAction Stop } catch {} }
            } catch {}
        }
        return [pscustomobject]@{ Status = $status; Body = $obj; Raw = $raw }
    } catch {
        return [pscustomobject]@{ Status = 0; Body = $null; Raw = $_.Exception.Message }
    }
}

function Require-Ok($resp, $what) {
    if ($resp.Status -ge 200 -and $resp.Status -lt 300) {
        return
    }
    Write-Err "$what failed: HTTP $($resp.Status) - $($resp.Raw)"
    exit 1
}

# ============================================================================
# 0. Pre-flight
# ============================================================================
Write-Host ""
Write-Host "AgriDesk Demo Seeder" -ForegroundColor Yellow
Write-Host "Target: $BaseUrl" -ForegroundColor Yellow
Write-Host "Dealer: $DealerEmail / $DealerPassword" -ForegroundColor Yellow

$health = Invoke-Api -Method Get -Path "/api/auth/me"
if ($health.Status -eq 0) {
    Write-Err "Backend at $BaseUrl is not reachable."
    Write-Err "Start it with:  cd c:\trial\agridesk-api ; mvn spring-boot:run"
    exit 2
}
Write-Ok "Backend reachable."

# ============================================================================
# 1. Sign up (or log in) the demo dealer
# ============================================================================
Write-Section "1. Demo dealer"

$signup = @{
    shopName  = "Demo Krishi Kendra"
    ownerName = "Demo Owner"
    phone     = "9876543210"
    email     = $DealerEmail
    password  = $DealerPassword
    language  = "hi"
}

$r = Invoke-Api -Method Post -Path "/api/auth/signup" -Body $signup
if ($r.Status -eq 200) {
    Write-Ok "Created new dealer 'Demo Krishi Kendra' ($DealerEmail)"
    $token = $r.Body.token
} elseif ($r.Status -eq 409) {
    Write-Warn "Dealer $DealerEmail already exists; logging in instead."
    $r = Invoke-Api -Method Post -Path "/api/auth/login" -Body @{ email = $DealerEmail; password = $DealerPassword }
    Require-Ok $r "Login as existing demo dealer"
    $token = $r.Body.token
    Write-Ok "Logged in. Note: any data created below is in addition to existing data."
} else {
    Require-Ok $r "Demo dealer signup"
}

# ============================================================================
# 2. Farmers (5 with mixed Hindi/English names)
# ============================================================================
Write-Section "2. Farmers"

$farmers = @(
    @{ name = "रामेश्वर सिंह (Rameshwar Singh)"; phone = "9811100001"; village = "रामपुर";  crops = "गेहूं, सरसों" },
    @{ name = "सुरेश पटेल (Suresh Patel)";       phone = "9811100002"; village = "नवादा";   crops = "धान, चना" },
    @{ name = "अनिता देवी (Anita Devi)";          phone = "9811100003"; village = "खानपुर";  crops = "कपास, सोयाबीन" },
    @{ name = "विजय यादव (Vijay Yadav)";          phone = "9811100004"; village = "जलालपुर"; crops = "मक्का, बाजरा" },
    @{ name = "मोहन कुमार (Mohan Kumar)";         phone = "9811100005"; village = "पुरानी बाजार"; crops = "गन्ना" }
)

$farmerIds = @{}
foreach ($f in $farmers) {
    $r = Invoke-Api -Method Post -Path "/api/farmers" -Body $f -Token $token
    Require-Ok $r "Create farmer $($f.name)"
    $farmerIds[$f.name] = $r.Body.id
    Write-Ok "Farmer: $($f.name)"
}

# ============================================================================
# 3. Products (8 covering fertilizer, pesticide, seed; GST 0/5/18%)
# ============================================================================
Write-Section "3. Products"

$products = @(
    @{ name = "यूरिया 50kg (Urea)";              category = "fertilizer"; unit = "bag";    hsnCode = "31021000"; gstRate = 5 },
    @{ name = "DAP 50kg";                          category = "fertilizer"; unit = "bag";    hsnCode = "31053000"; gstRate = 5 },
    @{ name = "MOP 50kg";                          category = "fertilizer"; unit = "bag";    hsnCode = "31042000"; gstRate = 5 },
    @{ name = "NPK 19:19:19";                      category = "fertilizer"; unit = "bag";    hsnCode = "31052000"; gstRate = 5 },
    @{ name = "Roundup 1L (Glyphosate)";           category = "pesticide";  unit = "bottle"; hsnCode = "38083040"; gstRate = 18 },
    @{ name = "Confidor 250ml (Imidacloprid)";     category = "pesticide";  unit = "bottle"; hsnCode = "38089199"; gstRate = 18 },
    @{ name = "Hybrid Maize Seed 1kg";             category = "seed";       unit = "packet"; hsnCode = "12099100"; gstRate = 0 },
    @{ name = "Cotton BG-II Seed 450g";            category = "seed";       unit = "packet"; hsnCode = "12092100"; gstRate = 0 }
)

$productIds = @{}
foreach ($p in $products) {
    $r = Invoke-Api -Method Post -Path "/api/products" -Body $p -Token $token
    Require-Ok $r "Create product $($p.name)"
    $productIds[$p.name] = $r.Body.id
    Write-Ok "Product: $($p.name) (GST $($p.gstRate)%)"
}

# ============================================================================
# 4. Stock batches
#    Includes 2 batches expiring in next 30 days so the dashboard alert lights up
# ============================================================================
Write-Section "4. Stock batches"

function IsoDate($daysFromNow) {
    return (Get-Date).AddDays($daysFromNow).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$batches = @(
    # productKey, batchNo, qty, cost, sell, expiry days, supplier
    @($products[0].name, "UREA-Q1-25",  200, 350,  400, 25,  "IFFCO"),       # EXPIRING SOON
    @($products[0].name, "UREA-Q2-25",  150, 350,  400, 180, "IFFCO"),
    @($products[1].name, "DAP-2025-A",   80, 1350, 1450, 200, "Coromandel"),
    @($products[2].name, "MOP-25-B",     60, 900,  980, 220, "Tata"),
    @($products[3].name, "NPK-Q1-25",    40, 1200, 1350, 18,  "Coromandel"),  # EXPIRING SOON
    @($products[4].name, "RND-1L-25",    50, 400,  500, 540, "Bayer"),
    @($products[5].name, "CFD-250-25",   30, 250,  350, 420, "Bayer"),
    @($products[6].name, "MAIZE-HYB-25", 25, 180,  250, 270, "Mahyco"),
    @($products[7].name, "COT-BGII-25",  15, 730,  880, 210, "Mahyco")
)

$batchIds = @{}
foreach ($b in $batches) {
    $body = @{
        productId    = $productIds[$b[0]]
        batchNo      = $b[1]
        quantity     = [double]$b[2]
        costPrice    = [double]$b[3]
        sellingPrice = [double]$b[4]
        expiryDate   = IsoDate $b[5]
        supplierName = $b[6]
    }
    $r = Invoke-Api -Method Post -Path "/api/stock" -Body $body -Token $token
    Require-Ok $r "Add stock batch $($b[1])"
    $batchIds[$b[1]] = $r.Body.id
    $tag = if ($b[5] -le 30) { " [EXPIRING in $($b[5]) days]" } else { "" }
    Write-Ok "Batch $($b[1]): $($b[2]) units of $($b[0])$tag"
}

# ============================================================================
# 5. Bills (3 bills: one fully paid, one fully on credit, one partial)
# ============================================================================
Write-Section "5. Bills"

# Bill 1 - Rameshwar Singh, 5 bags Urea, fully paid cash
# subtotal 2000, GST 5% = 100, total 2100, paid 2100
$bill1 = @{
    farmerId   = $farmerIds[$farmers[0].name]
    method     = "cash"
    paidAmount = 2100
    items = @(
        @{
            productId = $productIds[$products[0].name]
            batchId   = $batchIds["UREA-Q1-25"]
            quantity  = 5
            unitPrice = 400
        }
    )
}
$r = Invoke-Api -Method Post -Path "/api/bills" -Body $bill1 -Token $token
Require-Ok $r "Bill 1 (Rameshwar Singh, paid cash)"
Write-Ok "Bill 1: $($r.Body.billNo) | Rameshwar Singh | Rs $($r.Body.totalAmount) | $($r.Body.status)"

# Bill 2 - Suresh Patel, DAP + Roundup, fully on credit
# 2 DAP @ 1450 = 2900 + 5% = 145
# 1 Roundup @ 500 = 500 + 18% = 90
# Total = 3635, paid 0, credit 3635
$bill2 = @{
    farmerId   = $farmerIds[$farmers[1].name]
    method     = "cash"
    paidAmount = 0
    items = @(
        @{ productId = $productIds[$products[1].name]; batchId = $batchIds["DAP-2025-A"]; quantity = 2; unitPrice = 1450 },
        @{ productId = $productIds[$products[4].name]; batchId = $batchIds["RND-1L-25"];  quantity = 1; unitPrice = 500 }
    )
}
$r = Invoke-Api -Method Post -Path "/api/bills" -Body $bill2 -Token $token
Require-Ok $r "Bill 2 (Suresh Patel, full credit)"
Write-Ok "Bill 2: $($r.Body.billNo) | Suresh Patel  | Rs $($r.Body.totalAmount) | $($r.Body.status) (Rs $($r.Body.creditAmount) udhari)"

# Bill 3 - Anita Devi, mixed seeds + pesticide, partial payment
# 1 Cotton seed @ 880 = 880 (0% GST)
# 1 Maize seed @ 250 = 250 (0% GST)
# 1 Confidor @ 350 = 350 + 18% = 63
# Total = 1543, paid 1000, credit 543
$bill3 = @{
    farmerId   = $farmerIds[$farmers[2].name]
    method     = "cash"
    paidAmount = 1000
    items = @(
        @{ productId = $productIds[$products[7].name]; batchId = $batchIds["COT-BGII-25"];  quantity = 1; unitPrice = 880 },
        @{ productId = $productIds[$products[6].name]; batchId = $batchIds["MAIZE-HYB-25"]; quantity = 1; unitPrice = 250 },
        @{ productId = $productIds[$products[5].name]; batchId = $batchIds["CFD-250-25"];   quantity = 1; unitPrice = 350 }
    )
}
$r = Invoke-Api -Method Post -Path "/api/bills" -Body $bill3 -Token $token
Require-Ok $r "Bill 3 (Anita Devi, partial)"
Write-Ok "Bill 3: $($r.Body.billNo) | Anita Devi    | Rs $($r.Body.totalAmount) | $($r.Body.status) (Rs $($r.Body.creditAmount) udhari)"

# ============================================================================
# 6. Standalone ledger entries (older udhari + a recent payment)
# ============================================================================
Write-Section "6. Ledger entries (manual udhari)"

# Vijay Yadav - opening credit
$r = Invoke-Api -Method Post -Path "/api/ledger/credit" -Body @{
    farmerId = $farmerIds[$farmers[3].name]
    amount   = 800
    note     = "पुरानी उधारी / Old udhari (carry-forward)"
} -Token $token
Require-Ok $r "Ledger credit for Vijay Yadav"
Write-Ok "Credit Rs 800 to Vijay Yadav  (old udhari)"

# Mohan Kumar - opening credit
$r = Invoke-Api -Method Post -Path "/api/ledger/credit" -Body @{
    farmerId = $farmerIds[$farmers[4].name]
    amount   = 1200
    note     = "गन्ने का सीजन उधार / Sugarcane season udhari"
} -Token $token
Require-Ok $r "Ledger credit for Mohan Kumar"
Write-Ok "Credit Rs 1200 to Mohan Kumar (season udhari)"

# Vijay Yadav - partial payment
$r = Invoke-Api -Method Post -Path "/api/ledger/payment" -Body @{
    farmerId = $farmerIds[$farmers[3].name]
    amount   = 500
    note     = "नकद भुगतान / Cash payment"
} -Token $token
Require-Ok $r "Ledger payment from Vijay Yadav"
Write-Ok "Payment Rs 500 from Vijay Yadav"

# ============================================================================
# 7. Summary
# ============================================================================
Write-Section "Summary"

$dash = (Invoke-Api -Method Get -Path "/api/dashboard" -Token $token).Body
$farmers = (Invoke-Api -Method Get -Path "/api/farmers" -Token $token).Body

Write-Host ""
Write-Host "Dashboard snapshot:" -ForegroundColor Cyan
Write-Host ("  Total farmers       : {0}" -f $dash.totalFarmers)
Write-Host ("  Outstanding udhari  : Rs {0}" -f $dash.totalOutstanding)
Write-Host ("  Today's sales       : Rs {0}" -f $dash.todaySales)
Write-Host ("  This month's sales  : Rs {0}" -f $dash.monthSales)
Write-Host ("  Stock expiring soon : {0} batches" -f $dash.expiringStock)
Write-Host ("  Recent bills        : {0}" -f $dash.recentBills.Count)

Write-Host ""
Write-Host "Top debtors:" -ForegroundColor Cyan
$farmers | Sort-Object -Property outstandingBalance -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host ("  Rs {0,6} - {1}" -f [int]$_.outstandingBalance, $_.name)
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Demo data seeded. Log in at:" -ForegroundColor Green
Write-Host "    URL      : http://127.0.0.1:5501" -ForegroundColor Green
Write-Host "    Email    : $DealerEmail" -ForegroundColor Green
Write-Host "    Password : $DealerPassword" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
exit 0
