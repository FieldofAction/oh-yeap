#!/bin/bash
# Convert TIFF drawings to JPGs at two sizes:
#   thumbs/  — 600px long side, for grid view
#   full/    — 1800px long side, for lightbox view

SRC="/Users/danielalfred_1/Downloads/oh-yeap/public/media/drawings"
THUMBS="$SRC/thumbs"
FULL="$SRC/full"

mkdir -p "$THUMBS" "$FULL"

count=0
total=$(ls "$SRC"/*.tif 2>/dev/null | wc -l | tr -d ' ')

echo "Converting $total TIFFs..."

for f in "$SRC"/*.tif; do
  [ -f "$f" ] || continue
  name=$(basename "$f" .tif)
  count=$((count + 1))
  echo "[$count/$total] $name"

  # Full size — 1800px on longest side
  if [ ! -f "$FULL/$name.jpg" ]; then
    sips -s format jpeg -s formatOptions 85 --resampleHeightWidthMax 1800 "$f" --out "$FULL/$name.jpg" > /dev/null 2>&1
  fi

  # Thumbnail — 600px on longest side
  if [ ! -f "$THUMBS/$name.jpg" ]; then
    sips -s format jpeg -s formatOptions 80 --resampleHeightWidthMax 600 "$f" --out "$THUMBS/$name.jpg" > /dev/null 2>&1
  fi
done

echo ""
echo "Done! $count images converted."
echo "  Thumbnails: $THUMBS/"
echo "  Full size:  $FULL/"
echo ""
ls -lh "$THUMBS" | head -5
echo "..."
ls -lh "$FULL" | head -5
