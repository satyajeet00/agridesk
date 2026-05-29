# AgriDesk End-to-End Test Script
# Black-box tests against the live running stack at http://127.0.0.1:8080
# Run: pwsh -File c:\trial\docs\e2e-test.ps1
#
# Exits with non-zero code if any scenario fails.

param(
    [string]$BaseUrl = "http://127.0.0.1:8080",
    [string]$Origin  = "http://127.0.0.1:5501"
)

$ErrorActionPreference = "Continue"
$ProgressPreference   = "SilentlyContinue"

# ---- counters --------------------------------------------------------------
$script:Passed = 0
$script:Failed = 0
$script:Results = @()

function Pass($name) {
    Write-Host "  [PASS] $name" -ForegroundColor Green
    $script:Passed++
    $script:Results += [pscustomobject]@{ Name = $name; Status = "PASS"; Detail = "" }
}

function Fail($name, $detail = "") {
    Write-Host "  [FAIL] $name" -ForegroundColor Red
    if ($detail) { Write-Host "         $detail" -ForegroundColor DarkRed }
    $script:Failed++
    $script:Results += [pscustomobject]@{ Name = $name; Status = "FAIL"; Detail = $detail }
}

function Section($title) {
    Write-Host ""
    Write-Host "=== $title ===" -ForegroundColor Cyan
}

function Assert-Eq($name, $expected, $actual) {
    if ($expected -eq $actual) { Pass $name }
    else { Fail $name "expected=$expected actual=$actual" }
}

function Assert-NotNull($name, $value) {
    if ($null -ne $value -and "$value" -ne "") { Pass $name }
    else { Fail $name "value was null or empty" }
}

# ---- HTTP helpers ----------------------------------------------------------
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        $Body = $null,
        [string]$Token = $null,
        [hashtable]$ExtraHeaders = @{}
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    foreach ($k in $ExtraHeaders.Keys) { $headers[$k] = $ExtraHeaders[$k] }

    $params = @{
        Method  = $Method
        Uri     = "$BaseUrl$Path"
        Headers = $headers
        UseBasicParsing = $true
    }
    if ($null -ne $Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 8 -Compress)
    }

    try {
        $resp = Invoke-WebRequest @params
        $obj = $null
        if ($resp.Content) {
            try { $obj = $resp.Content | ConvertFrom-Json -ErrorAction Stop } catch { $obj = $null }
        }
        return [pscustomobject]@{
            Status  = [int]$resp.StatusCode
            Body    = $obj
            Raw     = $resp.Content
            Headers = $resp.Headers
        }
    } catch [System.Net.WebException] {
        # Windows PowerShell 5.1 throws on non-2xx; pull body + status from the response
        $we = $_.Exception
        $status = 0
        $raw = $we.Message
        $obj = $null
        $hdrs = @{}
        if ($we.Response) {
            try { $status = [int]$we.Response.StatusCode } catch { $status = 0 }
            try {
                $stream = $we.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $raw = $reader.ReadToEnd()
                $reader.Close()
                if ($raw) { try { $obj = $raw | ConvertFrom-Json -ErrorAction Stop } catch { $obj = $null } }
            } catch {}
            try {
                foreach ($key in $we.Response.Headers.Keys) {
                    $hdrs[[string]$key] = [string]$we.Response.Headers[$key]
                }
            } catch {}
        }
        return [pscustomobject]@{
            Status  = $status
            Body    = $obj
            Raw     = $raw
            Headers = $hdrs
        }
    } catch {
        return [pscustomobject]@{
            Status  = 0
            Body    = $null
            Raw     = $_.Exception.Message
            Headers = @{}
        }
    }
}

function Invoke-Preflight {
    param([string]$Path, [string]$OriginValue)
    $headers = @{
        "Origin"                         = $OriginValue
        "Access-Control-Request-Method"  = "GET"
        "Access-Control-Request-Headers" = "Authorization, Content-Type"
    }
    try {
        $resp = Invoke-WebRequest -Method Options -Uri "$BaseUrl$Path" -Headers $headers -UseBasicParsing
        return [pscustomobject]@{
            Status  = [int]$resp.StatusCode
            Headers = $resp.Headers
        }
    } catch [System.Net.WebException] {
        $we = $_.Exception
        $status = 0
        $hdrs = @{}
        if ($we.Response) {
            try { $status = [int]$we.Response.StatusCode } catch {}
            try {
                foreach ($key in $we.Response.Headers.Keys) {
                    $hdrs[[string]$key] = [string]$we.Response.Headers[$key]
                }
            } catch {}
        }
        return [pscustomobject]@{ Status = $status; Headers = $hdrs }
    } catch {
        return [pscustomobject]@{ Status = 0; Headers = @{} }
    }
}

# ---- run -------------------------------------------------------------------
Write-Host ""
Write-Host "AgriDesk E2E Test Script" -ForegroundColor Yellow
Write-Host "Target: $BaseUrl  Origin: $Origin" -ForegroundColor Yellow

# Health check
$health = Invoke-Api -Method Get -Path "/api/auth/me"
if ($health.Status -eq 0) {
    Write-Host ""
    Write-Host "ERROR: Backend at $BaseUrl is not reachable. Start agridesk-api first." -ForegroundColor Red
    exit 2
}

# unique data for this run
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$emailA = "e2e-a-$stamp@test.com"
$emailB = "e2e-b-$stamp@test.com"

Section "CORS"
$pf = Invoke-Preflight -Path "/api/farmers" -OriginValue $Origin
Assert-Eq "C1 - CORS preflight from allowed origin returns 200" 200 $pf.Status
$acao = $pf.Headers["Access-Control-Allow-Origin"]
if ($acao -is [array]) { $acao = $acao[0] }
Assert-Eq "C1b - Access-Control-Allow-Origin echoes origin" $Origin $acao

Section "Auth"
$signupA = @{
    shopName  = "ShopA-$stamp"
    ownerName = "OwnerA"
    phone     = "9000000001"
    email     = $emailA
    password  = "secret123"
    language  = "hi"
}
$r = Invoke-Api -Method Post -Path "/api/auth/signup" -Body $signupA
Assert-Eq "A1 - Signup valid payload returns 200" 200 $r.Status
Assert-NotNull "A1 - Token returned" $r.Body.token
$tokenA   = $r.Body.token
$dealerA  = $r.Body.dealerId

$r = Invoke-Api -Method Post -Path "/api/auth/signup" -Body $signupA
Assert-Eq "A2 - Duplicate signup returns 409" 409 $r.Status

$weak = @{
    shopName  = "X"; ownerName = "X"; phone = "1"
    email     = "weak-$stamp@test.com"
    password  = "123"
}
$r = Invoke-Api -Method Post -Path "/api/auth/signup" -Body $weak
Assert-Eq "A3 - Weak password returns 400" 400 $r.Status

$badEmail = @{
    shopName  = "X"; ownerName = "X"; phone = "1"
    email     = "not-email"
    password  = "secret123"
}
$r = Invoke-Api -Method Post -Path "/api/auth/signup" -Body $badEmail
Assert-Eq "A4 - Invalid email returns 400" 400 $r.Status

$r = Invoke-Api -Method Post -Path "/api/auth/login" -Body @{ email = $emailA; password = "secret123" }
Assert-Eq "A5 - Login correct credentials returns 200" 200 $r.Status

$r = Invoke-Api -Method Post -Path "/api/auth/login" -Body @{ email = $emailA; password = "wrong" }
Assert-Eq "A6 - Login wrong password returns 401" 401 $r.Status

$r = Invoke-Api -Method Get -Path "/api/auth/me" -Token $tokenA
Assert-Eq "A8 - /me with valid token returns 200" 200 $r.Status
Assert-Eq "A8 - /me returns dealerId" $dealerA $r.Body.dealerId

$r = Invoke-Api -Method Get -Path "/api/auth/me"
Assert-Eq "A9 - /me without token returns 401" 401 $r.Status

$r = Invoke-Api -Method Get -Path "/api/farmers" -Token "tampered.token.string"
Assert-Eq "SE3 - Tampered token returns 401" 401 $r.Status

Section "Farmers"
$r = Invoke-Api -Method Post -Path "/api/farmers" -Token $tokenA -Body @{
    name = "Suresh"; phone = "9111100001"; village = "Rampur"; crops = "wheat"
}
Assert-Eq "F1 - Create farmer returns 200" 200 $r.Status
Assert-Eq "F1 - Initial balance is 0" 0 $r.Body.outstandingBalance
$farmerA = $r.Body.id

$r = Invoke-Api -Method Post -Path "/api/farmers" -Token $tokenA -Body @{ name = ""; phone = "1" }
Assert-Eq "F2 - Missing name returns 400" 400 $r.Status

$r = Invoke-Api -Method Put -Path "/api/farmers/$farmerA" -Token $tokenA -Body @{
    name = "Suresh K"; phone = "9111100001"; village = "Rampur"; crops = "wheat,rice"
}
Assert-Eq "F4 - Update farmer returns 200" 200 $r.Status
Assert-Eq "F4 - Name updated" "Suresh K" $r.Body.name

Section "Inventory"
$r = Invoke-Api -Method Post -Path "/api/products" -Token $tokenA -Body @{
    name = "Urea"; category = "fertilizer"; unit = "kg"; hsnCode = "31021000"; gstRate = 5
}
Assert-Eq "I1 - Create product returns 200" 200 $r.Status
$productA = $r.Body.id

$expirySoon = (Get-Date).AddDays(10).ToString("yyyy-MM-ddTHH:mm:ssZ")
$expiryFar  = (Get-Date).AddDays(60).ToString("yyyy-MM-ddTHH:mm:ssZ")

$r = Invoke-Api -Method Post -Path "/api/stock" -Token $tokenA -Body @{
    productId = $productA; batchNo = "SOON-$stamp"; quantity = 100
    costPrice = 50; sellingPrice = 1000; expiryDate = $expirySoon; supplierName = "ACME"
}
Assert-Eq "I2 - Add stock batch returns 200" 200 $r.Status
$batchA = $r.Body.id

$r = Invoke-Api -Method Post -Path "/api/stock" -Token $tokenA -Body @{
    productId = $productA; batchNo = "LATER-$stamp"; quantity = 50
    costPrice = 50; sellingPrice = 1000; expiryDate = $expiryFar
}
Assert-Eq "I2b - Add second stock batch returns 200" 200 $r.Status

$r = Invoke-Api -Method Get -Path "/api/stock/expiring" -Token $tokenA
Assert-Eq "I3 - Expiring stock query returns 200" 200 $r.Status
$expiringNumbers = @($r.Body | ForEach-Object { $_.batchNo })
if ($expiringNumbers -contains "SOON-$stamp") { Pass "I3 - SOON batch is in expiring list" }
else { Fail "I3 - SOON batch in expiring list" "got: $($expiringNumbers -join ',')" }
if ($expiringNumbers -contains "LATER-$stamp") {
    Fail "I4 - LATER batch should NOT be in expiring list" "but was present"
} else {
    Pass "I4 - LATER batch correctly excluded from expiring list"
}

Section "Billing"
# 2 x Rs 1000 with 5% GST product => subtotal 2000, GST 100, total 2100, paid 0 => credit 2100
$bill = @{
    farmerId = $farmerA
    method   = "cash"
    paidAmount = 0
    items = @(
        @{ productId = $productA; batchId = $batchA; quantity = 2; unitPrice = 1000 }
    )
}
$r = Invoke-Api -Method Post -Path "/api/bills" -Token $tokenA -Body $bill
Assert-Eq "B1 - Create bill returns 200" 200 $r.Status
Assert-Eq "B1 - Total amount = subtotal + GST" 2100 $r.Body.totalAmount
Assert-Eq "B1 - GST amount = 100" 100 $r.Body.gstAmount
Assert-Eq "B1 - Credit amount = total - paid" 2100 $r.Body.creditAmount
Assert-Eq "B1 - Status = partial" "partial" $r.Body.status
$billNoA = $r.Body.billNo
Assert-Eq "B4 - First bill number is B-0001" "B-0001" $billNoA
$billIdA = $r.Body.id

# Farmer balance should now be 2100
$farmers = (Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenA).Body
$f = $farmers | Where-Object { $_.id -eq $farmerA }
Assert-Eq "B2 - Farmer balance increased by credit amount" 2100 $f.outstandingBalance

# Stock batch should now be 98 (100 - 2)
$prods = (Invoke-Api -Method Get -Path "/api/products" -Token $tokenA).Body
$prod  = $prods | Where-Object { $_.id -eq $productA }
$batch = $prod.stockBatches | Where-Object { $_.id -eq $batchA }
Assert-Eq "B3 - Stock batch quantity decremented" 98 $batch.quantity

# Second bill should be B-0002
$bill2 = @{
    farmerId = $farmerA; method = "cash"; paidAmount = 0
    items = @(@{ productId = $productA; quantity = 1; unitPrice = 100 })
}
$r = Invoke-Api -Method Post -Path "/api/bills" -Token $tokenA -Body $bill2
Assert-Eq "B4 - Second bill number is B-0002" "B-0002" $r.Body.billNo
$billIdB = $r.Body.id

# Delete bill 2 => farmer balance reduces back to 2100 (was 2100 + 105)
$creditFromBill2 = [double]$r.Body.creditAmount
$balanceBeforeDel = (Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenA).Body |
                    Where-Object { $_.id -eq $farmerA } | ForEach-Object { $_.outstandingBalance }
$r = Invoke-Api -Method Delete -Path "/api/bills/$billIdB" -Token $tokenA
Assert-Eq "B7 - Delete bill returns 200" 200 $r.Status
$balanceAfterDel = (Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenA).Body |
                   Where-Object { $_.id -eq $farmerA } | ForEach-Object { $_.outstandingBalance }
Assert-Eq "B7 - Farmer balance reverted on bill delete" ($balanceBeforeDel - $creditFromBill2) $balanceAfterDel

Section "Ledger"
$startBal = (Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenA).Body |
            Where-Object { $_.id -eq $farmerA } | ForEach-Object { $_.outstandingBalance }
$r = Invoke-Api -Method Post -Path "/api/ledger/credit" -Token $tokenA -Body @{
    farmerId = $farmerA; amount = 500; note = "extra credit"
}
Assert-Eq "L1 - Add credit returns 200" 200 $r.Status
$creditEntryId = $r.Body.id

$afterCredit = (Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenA).Body |
               Where-Object { $_.id -eq $farmerA } | ForEach-Object { $_.outstandingBalance }
Assert-Eq "L1 - Balance incremented by credit amount" ($startBal + 500) $afterCredit

$r = Invoke-Api -Method Post -Path "/api/ledger/payment" -Token $tokenA -Body @{
    farmerId = $farmerA; amount = 200; note = "partial payment"
}
Assert-Eq "L2 - Add payment returns 200" 200 $r.Status
$afterPayment = (Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenA).Body |
                Where-Object { $_.id -eq $farmerA } | ForEach-Object { $_.outstandingBalance }
Assert-Eq "L2 - Balance decremented by payment amount" ($startBal + 300) $afterPayment

# Delete credit entry => balance reverts
$r = Invoke-Api -Method Delete -Path "/api/ledger/$creditEntryId" -Token $tokenA
Assert-Eq "L3 - Delete credit entry returns 200" 200 $r.Status
$afterDel = (Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenA).Body |
            Where-Object { $_.id -eq $farmerA } | ForEach-Object { $_.outstandingBalance }
Assert-Eq "L3 - Balance reverted after deleting credit" ($startBal - 200) $afterDel

Section "Dashboard"
$r = Invoke-Api -Method Get -Path "/api/dashboard" -Token $tokenA
Assert-Eq "D1 - Dashboard returns 200" 200 $r.Status
Assert-Eq "D2 - totalFarmers = 1" 1 $r.Body.totalFarmers
if ($r.Body.recentBills.Count -ge 1) { Pass "D4 - recentBills populated" }
else { Fail "D4 - recentBills populated" "got $($r.Body.recentBills.Count)" }

Section "Settings"
$r = Invoke-Api -Method Put -Path "/api/settings/dealer" -Token $tokenA -Body @{
    shopName = "ShopA-Renamed-$stamp"
    phone    = "9000000099"
    address  = "Main Road"
    gstin    = "29ABCDE1234F2Z5"
    language = "en"
}
Assert-Eq "S1 - Update dealer returns 200" 200 $r.Status
Assert-Eq "S1 - shopName persisted" "ShopA-Renamed-$stamp" $r.Body.shopName

$staffEmail = "staff-$stamp@test.com"
$r = Invoke-Api -Method Post -Path "/api/settings/staff" -Token $tokenA -Body @{
    name = "Helper"; email = $staffEmail; password = "secret123"
}
Assert-Eq "S2 - Add staff returns 200" 200 $r.Status
$staffId = $r.Body.id

$r = Invoke-Api -Method Post -Path "/api/settings/staff" -Token $tokenA -Body @{
    name = "Helper2"; email = $staffEmail; password = "secret123"
}
Assert-Eq "S3 - Duplicate staff email returns 409" 409 $r.Status

# Try to remove the owner (current user) - should fail
$me = (Invoke-Api -Method Get -Path "/api/auth/me" -Token $tokenA).Body
$r = Invoke-Api -Method Delete -Path "/api/settings/staff/$($me.userId)" -Token $tokenA
Assert-Eq "S5 - Remove owner returns 400" 400 $r.Status

Section "Multi-Tenant Isolation"
$signupB = @{
    shopName = "ShopB-$stamp"; ownerName = "OwnerB"; phone = "9000000002"
    email = $emailB; password = "secret123"
}
$r = Invoke-Api -Method Post -Path "/api/auth/signup" -Body $signupB
$tokenB  = $r.Body.token

$r = Invoke-Api -Method Get -Path "/api/farmers" -Token $tokenB
Assert-Eq "SE4 - Dealer B sees zero farmers" 0 $r.Body.Count

# Dealer B should NOT be able to delete dealer A's farmer
$r = Invoke-Api -Method Delete -Path "/api/farmers/$farmerA" -Token $tokenB
Assert-Eq "SE5 - Dealer B cannot delete dealer A's farmer (404)" 404 $r.Status

# Dealer B should NOT be able to delete dealer A's bill
$r = Invoke-Api -Method Delete -Path "/api/bills/$billIdA" -Token $tokenB
Assert-Eq "SE6 - Dealer B cannot delete dealer A's bill (404)" 404 $r.Status

# Dealer B should NOT be able to remove dealer A's staff
$r = Invoke-Api -Method Delete -Path "/api/settings/staff/$staffId" -Token $tokenB
Assert-Eq "SE7 - Dealer B cannot remove dealer A's staff (403)" 403 $r.Status

Section "Payment"
$r = Invoke-Api -Method Post -Path "/api/payment/create-order" -Token $tokenA
Assert-Eq "P1 - create-order returns 503 when Razorpay not configured" 503 $r.Status

$r = Invoke-Api -Method Post -Path "/api/payment/verify" -Token $tokenA -Body @{
    razorpayOrderId = "order_X"; razorpayPaymentId = "pay_X"; razorpaySignature = "deadbeef"
}
# In dev the keys are empty so verify returns 503. In a configured environment
# it would return 400 invalid_signature for this bad signature.
if ($r.Status -eq 503 -or $r.Status -eq 400) { Pass "P2 - verify rejects bad/missing-key request (got $($r.Status))" }
else { Fail "P2 - verify rejects bad/missing-key request" "expected 400 or 503, got $($r.Status)" }

# ---- summary ---------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
$summaryColor = if ($script:Failed -eq 0) { "Green" } else { "Red" }
Write-Host "  PASSED $script:Passed / FAILED $script:Failed" -ForegroundColor $summaryColor
Write-Host "============================================================" -ForegroundColor Yellow

if ($script:Failed -gt 0) {
    Write-Host ""
    Write-Host "Failed scenarios:" -ForegroundColor Red
    $script:Results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host ("  * " + $_.Name) -ForegroundColor Red
        if ($_.Detail) { Write-Host ("      " + $_.Detail) -ForegroundColor DarkRed }
    }
    exit 1
}
exit 0
