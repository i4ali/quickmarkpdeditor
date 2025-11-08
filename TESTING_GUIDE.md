# QuickMark PDF Pro - Testing Guide

## Overview
This guide will help you test all features of QuickMark PDF including the new Premium Annotation Tools.

## Setup Instructions

1. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `quickmarkpdf` directory
   - The extension should now appear in your extensions list

2. **Open the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "QuickMark PDF" and click it
   - Click "Open PDF Editor" in the popup

## Test Plan

### Phase 1: Free Features (No Premium Required)

#### Test 1.1: Open PDF
- ✅ Click "📂 Open PDF" button
- ✅ Select a PDF file from your computer
- ✅ Verify PDF renders correctly with all pages visible

#### Test 1.2: Add Text
- ✅ Click "📝 Add Text" button
- ✅ A text box should appear on the current page
- ✅ Edit the text content
- ✅ Drag the text box to different positions
- ✅ Click the X button to delete the text box

#### Test 1.3: Signature Management
- ✅ Click "✍️ Manage Signature" button
- ✅ Draw a signature in the canvas
- ✅ Click "Save Signature"
- ✅ Close and reopen - signature should be preserved

#### Test 1.4: Add Signature
- ✅ Click "📋 Add Signature" button
- ✅ Signature image appears on the page
- ✅ Drag signature to reposition
- ✅ Resize signature by dragging corner handle
- ✅ Delete signature with X button

#### Test 1.5: Save & Download
- ✅ Add some text and signature to PDF
- ✅ Click "💾 Save & Download"
- ✅ A file named "annotated.pdf" should download
- ✅ Open the downloaded PDF - text and signature should be embedded

### Phase 2: Premium Feature Paywall

#### Test 2.1: Premium Features Locked
- ✅ All premium buttons (Highlight, Draw, Shapes, Notes, Text Line) should be **disabled** and show 🔒
- ✅ Try clicking any premium button
- ✅ Should show "Upgrade to Pro" modal with $3.99 pricing

#### Test 2.2: License Activation (Test Mode)
**Option A: Simulate Purchase**
- ✅ Click "⭐ Upgrade to Pro" button
- ✅ In the modal, click "💳 Purchase Now - $3.99"
- ✅ Confirm the simulated purchase
- ✅ Premium features should now be unlocked (🔒 icon removed)
- ✅ "Upgrade to Pro" button should be hidden

**Option B: License Key Activation**
- ✅ Generate a test key by running this in browser console:
  ```javascript
  licenseManager.generateTrialKey()
  ```
- ✅ Copy the generated key (format: QMPDF-XXXXX-XXXXX-XXXXX)
- ✅ Click "⭐ Upgrade to Pro"
- ✅ Paste the key in the license key input field
- ✅ Click "Activate License"
- ✅ Premium features should now be unlocked

### Phase 3: Premium Annotation Features

#### Test 3.1: Highlighting Tool 🖍️
- ✅ Click "🖍️ Highlight" button
- ✅ Color picker should appear
- ✅ Select a color (yellow, green, blue, pink, red)
- ✅ Click and drag on PDF to create a highlight
- ✅ Highlight should appear with semi-transparent color
- ✅ Try multiple highlights with different colors
- ✅ Drag handles to reposition highlights
- ✅ Delete highlights with X button

#### Test 3.2: Freehand Drawing Tool ✏️
- ✅ Click "✏️ Draw" button
- ✅ Color picker should appear
- ✅ Select a drawing color
- ✅ Draw freehand on the PDF by clicking and dragging
- ✅ Try drawing with different colors
- ✅ Drawings should be smooth and responsive

#### Test 3.3: Shapes Tool ⬜
- ✅ Click "⬜ Shapes" button
- ✅ A dropdown should appear with shape options

**Rectangle:**
- ✅ Select "Rectangle"
- ✅ Click and drag to draw a rectangle
- ✅ Try different colors from color picker
- ✅ Drag to reposition, delete with X button

**Circle:**
- ✅ Select "Circle"
- ✅ Click and drag to draw a circle
- ✅ Circle should maintain proper shape

**Line:**
- ✅ Select "Line"
- ✅ Click and drag to draw a line
- ✅ Line should follow mouse movement

**Arrow:**
- ✅ Select "Arrow"
- ✅ Click and drag to draw an arrow
- ✅ Arrowhead should appear at the end

#### Test 3.4: Sticky Notes Tool 📌
- ✅ Click "📌 Notes" button
- ✅ Click anywhere on the PDF to place a note
- ✅ A sticky note icon (📝) should appear
- ✅ Click the note icon to add/edit text
- ✅ Enter some text and click OK
- ✅ Hover over note - tooltip should show the text
- ✅ Drag note to reposition
- ✅ Delete note with X button

#### Test 3.5: Text Decoration Tool ↔️
- ✅ Click "↔️ Text Line" button
- ✅ Color picker should appear
- ✅ Select a color
- ✅ Click and drag horizontally to draw a line (for strikethrough/underline effect)
- ✅ Try multiple lines with different colors
- ✅ Reposition and delete as needed

### Phase 4: Complete Workflow Test

#### Test 4.1: Full Annotation Workflow
- ✅ Open a multi-page PDF
- ✅ **Page 1:**
  - Add yellow highlight over some text
  - Draw a red arrow pointing to something
  - Add a sticky note with comment
- ✅ Scroll to **Page 2:**
  - Add blue highlight
  - Draw freehand circle around something
  - Add a rectangle shape
- ✅ Click "💾 Save & Download"
- ✅ Open the downloaded PDF in another PDF viewer (Adobe, Preview, etc.)
- ✅ **Verify all annotations are embedded and visible**

#### Test 4.2: Mixed Free + Premium Features
- ✅ Open a PDF
- ✅ Add regular text (free feature)
- ✅ Add signature (free feature)
- ✅ Add highlight (premium)
- ✅ Add shapes (premium)
- ✅ Add sticky notes (premium)
- ✅ Save and verify all elements are in final PDF

### Phase 5: Edge Cases & Validation

#### Test 5.1: License Persistence
- ✅ Activate premium (simulate purchase or use license key)
- ✅ Close the editor tab
- ✅ Open extension again
- ✅ Premium features should still be unlocked (license should persist)

#### Test 5.2: Invalid License Key
- ✅ Deactivate premium (run in console: `licenseManager.deactivatePremium()`)
- ✅ Try activating with invalid key: "INVALID-KEY-12345"
- ✅ Should show error message

#### Test 5.3: Multi-Page Annotations
- ✅ Open PDF with 3+ pages
- ✅ Add different annotations to each page
- ✅ Verify each annotation appears only on its respective page
- ✅ Save and check final PDF

#### Test 5.4: Color Switching
- ✅ Select Highlight tool
- ✅ Create highlight with yellow
- ✅ Switch to green color
- ✅ Create another highlight - should be green
- ✅ Verify both highlights maintain their colors

## Testing Checklist Summary

- [ ] All free features work correctly
- [ ] Premium features are locked by default
- [ ] Upgrade modal displays correctly with $3.99 pricing
- [ ] Simulated purchase activates premium
- [ ] License key activation works
- [ ] License persists across sessions
- [ ] All 5 premium annotation tools work:
  - [ ] Highlighting (5 colors)
  - [ ] Freehand drawing
  - [ ] Shapes (rectangle, circle, line, arrow)
  - [ ] Sticky notes
  - [ ] Text decorations
- [ ] Color picker works for all tools
- [ ] All annotations can be repositioned
- [ ] All annotations can be deleted
- [ ] PDF export includes all annotations
- [ ] Multi-page PDFs work correctly
- [ ] Annotations appear in other PDF viewers

## Debugging Tips

### Check License Status
Open browser console (F12) and run:
```javascript
licenseManager.checkPremiumStatus()
```

### Generate Test License Key
```javascript
licenseManager.generateTrialKey()
```

### Manually Activate Premium (for testing)
```javascript
licenseManager.activatePremium()
```

### Deactivate Premium (reset for testing)
```javascript
licenseManager.deactivatePremium()
```

### Check Current Annotations
```javascript
annotationManager.getAnnotations()
```

## Known Limitations

1. **Drawing Tool:** Drawings are rasterized as images, not vector graphics
2. **Sticky Notes:** Text length is limited by prompt dialog
3. **Color Picker:** Fixed palette of 6 colors (can be extended if needed)
4. **Payment Integration:** Currently simulated - needs real payment processor for production

## Next Steps for Production

1. **Payment Integration:**
   - Integrate with Stripe, PayPal, or Chrome Web Store payments
   - Implement secure license key generation and validation server
   - Add receipt/invoice generation

2. **UI Enhancements:**
   - Add undo/redo functionality
   - Improve sticky notes with custom modal instead of prompt
   - Add annotation list/manager panel
   - Add keyboard shortcuts

3. **Performance:**
   - Optimize for large PDFs (100+ pages)
   - Lazy load annotations
   - Add progress indicators for save operations

4. **Features:**
   - Export annotations as separate metadata file
   - Import previously saved annotations
   - Annotation templates/presets
   - Text search and highlight

## Support

If you encounter any issues during testing:
1. Check browser console for errors (F12)
2. Verify all files are loaded correctly
3. Clear extension storage and retry
4. Reload the extension in chrome://extensions/

---

**Version:** 2.0
**Last Updated:** 2025-11-07
