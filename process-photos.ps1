[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [Parameter(Mandatory=$true)]
  [string]$Folder,

  [switch]$CreateThumbs,

  [int]$ThumbWidth = 900
)

$resolved = Resolve-Path -LiteralPath $Folder -ErrorAction Stop
$albumPath = $resolved.Path

$files = Get-ChildItem -LiteralPath $albumPath -File | Where-Object {
  $_.Extension.ToLower() -in @(".jpg", ".jpeg") -and $_.Name -ne "cover.jpg"
} | Sort-Object Name

if (-not $files.Count) {
  Write-Host "No JPG files found in $albumPath"
  exit 0
}

$count = 1
foreach ($file in $files) {
  $tempName = "temp_$count$($file.Extension.ToLower())"
  if ($PSCmdlet.ShouldProcess($file.FullName, "Rename to $tempName")) {
    Rename-Item -LiteralPath $file.FullName -NewName $tempName
  }
  $count++
}

$files = if ($WhatIfPreference) {
  $files | ForEach-Object {
    $script:i = if ($null -eq $script:i) { 1 } else { $script:i + 1 }
    [PSCustomObject]@{ FullName = Join-Path $albumPath "temp_$script:i$($_.Extension.ToLower())"; Name = "temp_$script:i$($_.Extension.ToLower())" }
  }
} else {
  Get-ChildItem -LiteralPath $albumPath -Filter "temp_*" -File | Sort-Object Name
}

$count = 1
foreach ($file in $files) {
  $newName = "{0:D2}.jpg" -f $count
  if ($PSCmdlet.ShouldProcess($file.FullName, "Rename to $newName")) {
    Rename-Item -LiteralPath $file.FullName -NewName $newName
  }
  $count++
}

$photoCount = $count - 1
$cover = Join-Path $albumPath "cover.jpg"
$firstPhoto = Join-Path $albumPath "01.jpg"

if ($PSCmdlet.ShouldProcess($cover, "Create cover from 01.jpg")) {
  if (Test-Path -LiteralPath $firstPhoto) {
    Copy-Item -LiteralPath $firstPhoto -Destination $cover -Force
  }
}

if ($CreateThumbs) {
  $magick = Get-Command magick -ErrorAction SilentlyContinue
  if (-not $magick) {
    Write-Host "ImageMagick was not found, so thumbnails were skipped. Install ImageMagick or rerun without -CreateThumbs."
  } else {
    $thumbDir = Join-Path $albumPath "thumbs"
    if ($PSCmdlet.ShouldProcess($thumbDir, "Create thumbnail directory")) {
      New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null
    }

    Get-ChildItem -LiteralPath $albumPath -Filter "*.jpg" -File | Where-Object { $_.Name -ne "cover.jpg" } | ForEach-Object {
      $out = Join-Path $thumbDir $_.Name
      if ($PSCmdlet.ShouldProcess($out, "Create resized thumbnail")) {
        & $magick.Source $_.FullName -auto-orient -resize "$($ThumbWidth)x" -quality 82 $out
      }
    }
  }
}

Write-Host "Done - prepared $photoCount photos in $albumPath"
Write-Host "Update data.js count to $photoCount for this album."