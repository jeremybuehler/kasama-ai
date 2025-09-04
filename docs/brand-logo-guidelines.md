# Kasama Logo Guidelines

## Logo Components

The Kasama logo consists of two main components:
1. **Flame Icon**: A stylized flame representing warmth and empowerment
2. **Wordmark**: "KASAMA" text in clean, modern typography

## Logo Formats

### Recommended File Formats
- **SVG**: Preferred for all digital applications (scalability, quality, small file size)
- **PNG**: For email signatures, social media, or legacy systems (export at 2x or 3x resolution with transparency)
- **ICO**: For favicons (16x16 and 32x32 pixels)

## Standard Sizes

### Full Logo with Text (10:3 aspect ratio)
| Use Case | Dimensions | Component |
|----------|------------|-----------|
| Desktop Header | 200 × 60 px | `<KasamaLogoDesktop />` |
| Mobile Header | 150 × 45 px | `<KasamaLogoMobile />` |
| Login/Splash Screen | 300 × 90 px | `<KasamaLogoSplash />` |
| Email Signature | 180 × 54 px | `<KasamaLogo width={180} height={54} />` |
| Marketing Materials | 400 × 120 px | `<KasamaLogo width={400} height={120} />` |
| Minimum Size | 120 × 36 px | `<KasamaLogo width={120} height={36} />` |

### Icon-Only Flame (1:1 aspect ratio)
| Use Case | Size | Component |
|----------|------|-----------|
| Large App Icon | 512 × 512 px | `<KasamaIcon size={512} />` |
| Medium App Icon | 192 × 192 px | `<KasamaIconLarge />` |
| Small App Icon | 96 × 96 px | `<KasamaIconMedium />` |
| Navigation Icon | 40 × 40 px | `<KasamaIconSmall />` |
| Favicon Large | 32 × 32 px | `<KasamaFavicon size={32} />` |
| Favicon Small | 16 × 16 px | `<KasamaFavicon size={16} />` |
| Minimum Size | 24 × 24 px | `<KasamaIcon size={24} />` |

## Color Variations

### Full Color (Default)
- Flame: Gradient from Kasama Rose (#FAD0C4) to Kasama Purple (#7E55B1)
- Text: Trustworthy Gray (#4A4A4A)
- Usage: Primary brand representation on light backgrounds

### White
- Flame & Text: White (#FFFFFF)
- Usage: Dark backgrounds, overlays on images or gradient backgrounds

### Kasama Purple
- Flame & Text: Kasama Purple (#7E55B1)
- Usage: Monochromatic applications, secondary branding

### Gray
- Flame & Text: Trustworthy Gray (#4A4A4A)
- Usage: Subtle branding, documents, or when color printing is limited

## Implementation Examples

```tsx
// Full logo with default sizing
<KasamaLogo width={200} />

// Icon-only flame
<KasamaIcon size={40} />

// Custom sized logo (height auto-calculated)
<KasamaLogo width={250} />

// Pre-defined components
<KasamaLogoDesktop />   // 200px width
<KasamaLogoMobile />    // 150px width  
<KasamaIconMedium />    // 96px size
```

## Spacing Guidelines

### Clear Space
Maintain a clear space around the logo equal to at least:
- Full logo: 0.5× the height of the flame icon
- Icon only: 0.25× the icon size

### Minimum Sizes
- Full logo: Do not use smaller than 120px width
- Icon only: Do not use smaller than 24px

## Usage Best Practices

### DO:
- Use SVG format whenever possible
- Maintain the 10:3 aspect ratio for the full logo
- Use appropriate color variants for different backgrounds
- Ensure sufficient contrast with the background
- Use the icon-only version when space is limited

### DON'T:
- Distort or stretch the logo
- Add effects like drop shadows or outlines
- Change the colors outside of provided variants
- Place the logo on busy or low-contrast backgrounds
- Rotate or skew the logo
- Separate the flame icon from the text in the full logo version

## File Naming Convention

Use descriptive file names following this pattern:
- `kasama-logo-[type]-[size]-[variant].[format]`

Examples:
- `kasama-logo-full-200px-color.svg`
- `kasama-logo-icon-40px-white.png`
- `kasama-logo-icon-512px-color.png`

## Accessibility

- Always include appropriate `alt` text or `aria-label` attributes
- Ensure color contrast ratios meet WCAG guidelines:
  - Full color logo: Use on light backgrounds (contrast ratio > 4.5:1)
  - White variant: Use on dark backgrounds
  - Consider using the gray or purple variants for better contrast on medium-toned backgrounds
