$folder = "C:\Users\yevin\OneDrive\Desktop\yevink15.github.io\albums\philly-lan-edited"

# get only image files (ignore anything weird)
$files = Get-ChildItem -Path $folder -File | Where-Object {
    $_.Extension.ToLower() -in @(".jpg",".jpeg",".png")
} | Sort-Object Name

$count = 1

# STEP 1: rename everything to temp names (prevents conflicts)
foreach ($file in $files) {
    $tempName = "temp_$count.jpg"
    Rename-Item $file.FullName -NewName $tempName
    $count++
}

# STEP 2: rename temp files to final names
$files = Get-ChildItem -Path $folder -Filter "temp_*.jpg" | Sort-Object Name

$count = 1
foreach ($file in $files) {
    $newName = "{0:D2}.jpg" -f $count
    Rename-Item $file.FullName -NewName $newName
    $count++
}

# STEP 3: create cover
if (Test-Path "$folder\01.jpg") {
    Copy-Item "$folder\01.jpg" "$folder\cover.jpg" -Force
}

Write-Host "DONE - Renamed $($count - 1) files"