# Wallie Design Files

## Overview

This directory contains interactive design references and visual examples for the Wallie design system. These files complement the main [DESIGN_DOC.md](../DESIGN_DOC.md) and provide hands-on, visual demonstrations of the design system in action.

---

## Files in This Directory

### 1. `color-palette.html`

**Interactive color system showcase**

**What it contains:**
- Complete color palette with hex and RGB values
- Visual swatches for all background, accent, semantic, and text colors
- Interactive copy-to-clipboard functionality
- Gradient examples
- Shadow system demonstration
- Usage examples (CSS variables, Tailwind config)

**How to use:**
1. Open `color-palette.html` in your browser
2. Click on any color swatch to explore details
3. Use "Copy Hex" buttons to copy color values to clipboard
4. Reference when implementing designs or writing code

**Best for:**
- Choosing colors for new components
- Ensuring color consistency across the app
- Quick color reference during development
- Sharing the palette with designers or stakeholders

---

### 2. `component-examples.html`

**Live UI component demonstrations**

**What it contains:**
- Interactive examples of all core components
- Buttons (primary, secondary, destructive, icon)
- Input fields (text, search, textarea)
- Cards (post cards, glass cards, hover effects)
- Chips/tags
- Navigation components
- Notifications (info, warning, error)
- Toggle switches
- Modals
- Profile cards

**How to use:**
1. Open `component-examples.html` in your browser
2. Interact with components (hover, click, type)
3. Inspect elements with browser DevTools to see exact CSS
4. Copy HTML/CSS snippets for your own implementation

**Best for:**
- Previewing component designs before coding
- Understanding hover and active states
- Copying markup for new components
- QA/design review reference

---

### 3. Bento Grid Example Images

**Visual references for 2025 design trends**

**What it contains:**
- 5 high-quality example images demonstrating bento grid layouts
- Dashboard layouts with asymmetric tile arrangements
- Analytics and data visualization using bento patterns
- UI design inspirations for mixed-size content grids

**Files:**
- `bento-grid-example-1.jpg` – Modern dashboard with varied tile sizes
- `bento-grid-example-2.jpg` – Data visualization bento layout
- `bento-grid-example-3.jpg` – Analytics interface with modular grids
- `bento-grid-dashboard-ui.jpg` – Dashboard UI with hero content tiles
- `bento-grid-analytics.jpg` – Analytics bento grid arrangement

**How to use:**
1. Reference these images when designing dashboard layouts
2. Use as inspiration for asymmetric grid compositions
3. Study tile sizing patterns and spacing
4. Apply similar patterns to Wallie's feed, profile, and explore pages

**Best for:**
- Designing the Wallie dashboard home page
- Creating dynamic profile layouts
- Planning the explore/discovery interface
- Understanding visual hierarchy in grid layouts

**Related documentation:**
See the "Bento Grid Layouts" section in [DESIGN_DOC.md](../DESIGN_DOC.md) for implementation code and Tailwind examples.

---

## How to Use These Files

### For Designers

1. **Color Selection:** Use `color-palette.html` to pick colors that fit the design system
2. **Component Reference:** Reference `component-examples.html` when creating mockups in Figma/Sketch
3. **Consistency Check:** Compare your designs against these examples to ensure consistency

### For Developers

1. **Implementation Guide:** Use these examples as implementation targets when building components
2. **Code Reference:** Inspect elements in browser DevTools to see exact CSS properties
3. **Visual QA:** Compare your implemented components against these references
4. **Copy Snippets:** Use HTML/CSS as starting points for new components (but prefer Tailwind classes in actual implementation)

### For Product/QA

1. **Design Review:** Use these files to review design decisions without needing design tools
2. **Bug Reporting:** Reference these examples when reporting design inconsistencies
3. **Acceptance Criteria:** Use as visual specification for user story acceptance

---

## Adding New Design Files

When adding new design reference files to this directory:

1. **Use Interactive HTML:** Prefer HTML files with live examples over static images
2. **Keep it Self-Contained:** Each file should work standalone (no external dependencies)
3. **Document in This README:** Add a new section explaining what the file contains
4. **Follow Naming Convention:** Use lowercase with hyphens (e.g., `icon-showcase.html`)
5. **Match Design System:** Ensure examples use colors, fonts, and styles from the design system

### Suggested Future Files

Consider adding these files as the design system evolves:

- `typography-examples.html` – Showcase all type scales, weights, and hierarchies
- `icon-library.html` – Complete icon set with search functionality
- `animation-demos.html` – Interactive animation and transition examples
- `responsive-layouts.html` – Breakpoint and responsive design demonstrations
- `accessibility-examples.html` – WCAG-compliant component examples
- `dark-mode-comparison.html` – Side-by-side dark/light mode comparisons (if light mode is added)

---

## Design System Sync

These files should be kept in sync with the main design documentation:

**When updating the design system:**
1. Update [DESIGN_DOC.md](../DESIGN_DOC.md) with new specifications
2. Update corresponding HTML files with visual examples
3. Update this README if adding new files or sections
4. Commit all changes together to keep documentation synchronized

**Version Control:**
- These files are version-controlled alongside code
- Review changes during pull requests to catch design regressions
- Tag design system versions (e.g., `design-v1.0.0`) for major updates

---

## Opening the Files

### Local Development

```bash
# From project root
cd documentation/design-files

# Open in default browser (macOS)
open color-palette.html
open component-examples.html

# Open in default browser (Linux)
xdg-open color-palette.html
xdg-open component-examples.html

# Open in default browser (Windows)
start color-palette.html
start component-examples.html
```

### Using VS Code Live Server

If using VS Code with Live Server extension:
1. Right-click on any HTML file
2. Select "Open with Live Server"
3. File opens in browser with hot reload

### Deploying as Static Documentation

These files can be deployed as static documentation:

```bash
# Deploy to GitHub Pages, Netlify, or Vercel
# Serve from /documentation/design-files/

# Example: Netlify deployment
netlify deploy --dir=documentation/design-files --prod
```

**Public URL Example:**
- https://wallie-design.netlify.app/color-palette.html
- https://wallie-design.netlify.app/component-examples.html

---

## Screenshots vs Live Examples

**Why we use HTML files instead of screenshots:**

✅ **Advantages of HTML:**
- Interactive (hover, click, type)
- Always up-to-date (easy to edit)
- Inspectable (view exact CSS with DevTools)
- Copy-paste friendly
- Accessible (screen readers work)
- Version controlled (track changes with git)

❌ **Disadvantages of screenshots:**
- Static (no interaction)
- Stale quickly
- Can't inspect implementation details
- Large file sizes
- Not accessible

**Exception:** Screenshots are acceptable for:
- External design references (inspiration)
- Client presentations
- Marketing materials

---

## Feedback & Contributions

### Reporting Issues

If you notice inconsistencies between these examples and the implemented design:
1. Check if [DESIGN_DOC.md](../DESIGN_DOC.md) is the source of truth
2. File an issue with:
   - Which file has the inconsistency
   - Expected vs actual behavior
   - Screenshot if helpful

### Contributing Updates

To update these design files:
1. Edit the HTML/CSS directly
2. Test in multiple browsers (Chrome, Safari, Firefox)
3. Ensure examples match the design system
4. Update this README if adding new sections
5. Submit pull request with clear description

---

## Browser Compatibility

These HTML files are tested and work in:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Features used:**
- CSS Grid & Flexbox
- CSS Custom Properties (variables)
- Backdrop Filter (for glassmorphism)
- Modern JavaScript (ES6+)

**Note:** Older browsers (IE11, pre-Chromium Edge) are not supported.

---

## Related Documentation

- [DESIGN_DOC.md](../DESIGN_DOC.md) – Complete design system specification
- [TECHNICAL_GUIDE.md](../TECHNICAL_GUIDE.md) – Implementation details for developers
- [ARCHITECTURE.md](../ARCHITECTURE.md) – System architecture and data flow

---

## Quick Links

- [View Color Palette](./color-palette.html)
- [View Component Examples](./component-examples.html)
- [Design System Overview](../DESIGN_DOC.md)

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
