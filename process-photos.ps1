[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [Parameter(Mandatory=$true)]
  [string]$Folder,

  [switch]$CreateThumbs,

  [int]$ThumbWidth = 480
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
  Add-Type -AssemblyName System.Drawing
  $thumbDir = Join-Path $albumPath "thumbs"
  if ($PSCmdlet.ShouldProcess($thumbDir, "Create resized previews")) {
    New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null
  }

  $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object MimeType -eq "image/jpeg"
  $quality = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $quality.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]68
  )

  Get-ChildItem -LiteralPath $albumPath -Filter "*.jpg" -File | ForEach-Object {
    $out = Join-Path $thumbDir $_.Name
    if ($PSCmdlet.ShouldProcess($out, "Create 480px preview")) {
      $image = $null
      $preview = $null
      $graphics = $null
      try {
        $image = [System.Drawing.Image]::FromFile($_.FullName)
        try {
          $orientation = [int]$image.GetPropertyItem(0x112).Value[0]
          switch ($orientation) {
            2 { $image.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
            3 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
            4 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
            5 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
            6 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
            7 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
            8 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
          }
        } catch {
          # Images without EXIF orientation are already upright.
        }

        $width = [Math]::Min($ThumbWidth, $image.Width)
        $height = [Math]::Max(1, [int][Math]::Round($image.Height * $width / $image.Width))
        $preview = New-Object System.Drawing.Bitmap($width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($preview)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($image, 0, 0, $width, $height)
        $preview.Save($out, $jpegCodec, $quality)
      } finally {
        if ($graphics) { $graphics.Dispose() }
        if ($preview) { $preview.Dispose() }
        if ($image) { $image.Dispose() }
      }
    }
  }
}
Write-Host "Done - prepared $photoCount photos in $albumPath"
Write-Host "Update data.js count to $photoCount for this album."