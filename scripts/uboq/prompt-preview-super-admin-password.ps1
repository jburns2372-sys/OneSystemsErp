param([switch]$SelfTest)
$ErrorActionPreference = 'Stop'
$Workspace = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location -LiteralPath $Workspace

function Send-PrivateUtf8Input($Process, [string]$Value) {
    # Windows PowerShell 5.1 has no ProcessStartInfo.StandardInputEncoding.
    # .NET Framework can emit a transport BOM when creating StandardInput.
    # A JSON frame distinguishes that BOM from a password's own leading characters.
    $Frame = @{ version = 1; value = $Value } | ConvertTo-Json -Compress
    $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Frame)
    $Frame = $null
    try {
        $Stream = $Process.StandardInput.BaseStream
        $Stream.Write($Bytes, 0, $Bytes.Length)
        $Stream.Flush()
        $Stream.Close()
    } finally { [Array]::Clear($Bytes, 0, $Bytes.Length) }
}

if ($SelfTest) {
    # Synthetic, disposable input only. Never contacts a database.
    $Sample = [char]0xFEFF + [guid]::NewGuid().ToString() + [char]0x00E9 + [char]0x4E2D + "`r`n"
    $Hash = [Security.Cryptography.SHA256]::Create()
    try { $Digest = ([BitConverter]::ToString($Hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($Sample)))).Replace('-','').ToLowerInvariant() }
    finally { $Hash.Dispose() }
    $Info = New-Object System.Diagnostics.ProcessStartInfo
    $Info.FileName = 'node.exe'
    $Info.Arguments = '"' + (Join-Path $PSScriptRoot 'activate-preview-super-admin.cjs') + '" --stdin-self-test ' + $Digest
    $Info.WorkingDirectory = $Workspace
    $Info.UseShellExecute = $false
    $Info.RedirectStandardInput = $true
    $Info.CreateNoWindow = $true
    $Process = [System.Diagnostics.Process]::Start($Info)
    try { Send-PrivateUtf8Input $Process $Sample; $Process.WaitForExit(); $Result = $Process.ExitCode }
    finally { $Sample = $null; $Process.Dispose() }
    exit $Result
}

function Record-LauncherResult([string]$ResultCode) {
    $ReceiptPath = Join-Path $Workspace 'artifacts/uboq/phase8/preview-super-admin-activation-receipt.json'
    $Receipt = Get-Content -LiteralPath $ReceiptPath -Raw | ConvertFrom-Json
    $Receipt | Add-Member -Force -NotePropertyName launcher -NotePropertyValue @{
        recordedAt = [DateTime]::UtcNow.ToString('o')
        result = $ResultCode
        powershellVersion = $PSVersionTable.PSVersion.ToString()
        privatePipeEncoding = 'UTF-8 JSON frame; optional transport BOM removed'
    }
    if ($ResultCode -like '*FAILED' -or $ResultCode -eq 'PASSWORD_CONFIRMATION_MISMATCH') {
        if ($Receipt.passwordActivation -ne 'PASS') {
            $Receipt.passwordActivation = 'FAIL'
            $Receipt.blockers = @($ResultCode, 'OWNER_MASKED_PASSWORD_ENTRY_REQUIRED')
        }
    }
    $TempPath = $ReceiptPath + '.launcher.tmp'
    [IO.File]::WriteAllText($TempPath, (($Receipt | ConvertTo-Json -Depth 20) + "`n"), (New-Object Text.UTF8Encoding($false)))
    Move-Item -LiteralPath $TempPath -Destination $ReceiptPath -Force
}
$Host.UI.RawUI.WindowTitle = 'OneSystemsERP Preview password activation'
Write-Host 'Preview ONLY: j.burns2372@gmail.com / oserp_uboq_preview'
Write-Host 'Keep the password private. Do not paste it into chat.'
# Verify before asking the Owner to enter any secret.
& node (Join-Path $PSScriptRoot 'activate-preview-super-admin.cjs') --preflight --wss
if ($LASTEXITCODE -ne 0) { Write-Host 'Preview preflight failed. No password requested.'; Read-Host 'Press Enter to close'; exit 1 }
Record-LauncherResult 'AWAITING_OWNER_MASKED_INPUT'
$One = $null; $Two = $null; $PlainOne = $null; $PlainTwo = $null
$PointerOne = [IntPtr]::Zero; $PointerTwo = [IntPtr]::Zero
$ExitCode = 1
$Stage = 'MASKED_INPUT_FAILED'
try {
    $One = Read-Host 'Enter a fresh password (minimum 12 characters; masked)' -AsSecureString
    $Two = Read-Host 'Confirm password (masked)' -AsSecureString
    $PointerOne = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($One)
    $PointerTwo = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Two)
    $PlainOne = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PointerOne)
    $PlainTwo = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PointerTwo)
    if ($PlainOne -cne $PlainTwo) { $Stage = 'PASSWORD_CONFIRMATION_MISMATCH'; throw 'Password mismatch' }
    $Stage = 'CHILD_LAUNCH_FAILED'
    $Info = New-Object System.Diagnostics.ProcessStartInfo
    $Info.FileName = 'node.exe'
    $Info.Arguments = '"' + (Join-Path $PSScriptRoot 'activate-preview-super-admin.cjs') + '" --stdin-password --wss'
    $Info.WorkingDirectory = $Workspace
    $Info.UseShellExecute = $false
    $Info.RedirectStandardInput = $true
    $Info.CreateNoWindow = $true
    $Process = [System.Diagnostics.Process]::Start($Info)
    try {
        $Stage = 'CHILD_INPUT_FAILED'
        Send-PrivateUtf8Input $Process $PlainOne
        $PlainOne = $null; $PlainTwo = $null
        $Process.WaitForExit()
        $ExitCode = $Process.ExitCode
        if ($ExitCode -eq 0) { $Stage = 'PASS' } else { $Stage = 'ACTIVATION_CHILD_FAILED' }
    } finally { $Process.Dispose() }
} catch {
    Write-Host ('Activation stopped: ' + $Stage + '. No secret details displayed.')
} finally {
    $PlainOne = $null; $PlainTwo = $null
    if ($PointerOne -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PointerOne) }
    if ($PointerTwo -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PointerTwo) }
    if ($null -ne $One) { $One.Dispose() }
    if ($null -ne $Two) { $Two.Dispose() }
}
Record-LauncherResult $Stage
if ($ExitCode -eq 0) {
    Write-Host 'Password activated and bcrypt verified. Personally sign in to the Preview page.'
    Start-Process 'https://one-systems-erp-git-release-oser-f0dd68-jburns2372-sys-projects.vercel.app/login'
} else { Write-Host 'Activation did not complete. Check the sanitized activation receipt.' }
Read-Host 'Press Enter to close'
exit $ExitCode
