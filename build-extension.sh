#!/bin/bash

# QuickMark PDF - Chrome Web Store Package Builder
# This script creates a clean ZIP file ready for Chrome Web Store submission

echo "🚀 Building QuickMark PDF for Chrome Web Store..."
echo ""

# Create build directory
BUILD_DIR="build"
ZIP_NAME="quickmark-pdf-v2.0.zip"

# Clean previous build
if [ -d "$BUILD_DIR" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf "$BUILD_DIR"
fi

mkdir "$BUILD_DIR"

# Copy essential files
echo "📦 Copying extension files..."

cp manifest.json "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp popup.js "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp editor.html "$BUILD_DIR/"
cp editor.js "$BUILD_DIR/"
cp annotations.js "$BUILD_DIR/"
cp license.js "$BUILD_DIR/"

# Copy directories
cp -r images "$BUILD_DIR/"
cp -r lib "$BUILD_DIR/"

echo "✅ Files copied successfully"
echo ""

# Create ZIP file
echo "📦 Creating ZIP package..."
cd "$BUILD_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store"
cd ..

# Get file size
SIZE=$(du -h "$ZIP_NAME" | cut -f1)

echo ""
echo "✨ Build complete!"
echo ""
echo "📦 Package: $ZIP_NAME"
echo "📏 Size: $SIZE"
echo ""
echo "📋 Contents:"
echo "  ✓ manifest.json"
echo "  ✓ popup.html, popup.js"
echo "  ✓ background.js"
echo "  ✓ editor.html, editor.js"
echo "  ✓ annotations.js"
echo "  ✓ license.js"
echo "  ✓ images/ folder"
echo "  ✓ lib/ folder (pdf.js, pdf-lib, signature_pad)"
echo ""
echo "🎯 Next steps:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Click 'New Item'"
echo "  3. Upload $ZIP_NAME"
echo "  4. Fill in store listing (see CHROME_STORE_GUIDE.md)"
echo "  5. Submit for review"
echo ""
echo "💡 Tip: Before submitting, test the extension by loading the build/ folder"
echo "   in Chrome's extension developer mode to ensure everything works."
echo ""
