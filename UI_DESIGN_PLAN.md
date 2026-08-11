# UI/UX Design System Specification — Ocean Blue ERP + CRM Portal

This document outlines the visual design system, color tokens, typography scale, component guidelines, theme switching architecture, lightweight 3D/scroll animation strategy, and responsive design guidelines for the **Mini ERP + CRM Operations Portal**.

---

## 🎨 1. Color System (BLACK + OCEAN BLUE)

The palette is engineered specifically for high-density enterprise operations software:

### Dark Theme Palette
- **Background Main**: `#090d16` (Deep near-black slate)
- **Surface Card / Container**: `#101726` (Charcoal container)
- **Surface Hover**: `#1a2336` (Elevated hover state)
- **Border Subtle**: `#1e293b` / `#293548` (Low-contrast divider)
- **Primary Accent**: `#0284c7` (Ocean Blue 600) / `#38bdf8` (Sky Blue 400 text highlights)
- **Text Main**: `#f8fafc` (Off-white)
- **Text Muted**: `#94a3b8` (Slate 400)

### Light Theme Palette
- **Background Main**: `#f8fafc` (Clean slate 50)
- **Surface Card / Container**: `#ffffff` (Pure white container)
- **Surface Hover**: `#f1f5f9` (Slate 100 hover state)
- **Border Subtle**: `#e2e8f0` (Clean light divider)
- **Primary Accent**: `#0284c7` (Ocean Blue 600) / `#0369a1` (Deep Ocean Blue 700)
- **Text Main**: `#0f172a` (Deep slate 900)
- **Text Muted**: `#64748b` (Slate 500)

### Semantic Color Coding
- **Primary / Action**: Ocean Blue (`#0284c7` / `#0369a1`)
- **Success / Positive**: Emerald Green (`#059669` / `#10b981`)
- **Warning / Low Stock**: Amber (`#d97706` / `#f59e0b`)
- **Danger / Error / Cancelled**: Rose (`#e11d48` / `#f43f5e`)

---

## 🌓 2. System Theme Architecture (`prefers-color-scheme`)

The application automatically adapts to the user's OS preference via CSS media queries and explicit theme state:

```typescript
type Theme = 'system' | 'light' | 'dark';
```

- **System Mode**: Uses `window.matchMedia('(prefers-color-scheme: dark)')` to listen to OS theme changes dynamically.
- **Explicit Override**: User can manually select `System`, `Light`, or `Dark` from the top Navbar theme selector.
- **Class Application**: Applies `dark` or `light` class to `document.documentElement` to control Tailwind dark mode styling.

---

## 🔤 3. Typography & Information Hierarchy

Font Family: `Inter`, system-ui, -apple-system, sans-serif.

| Level | Size / Weight | Application Scope |
| :--- | :--- | :--- |
| **Page Title** | `text-2xl font-bold tracking-tight` | Header title of major pages |
| **Section Title** | `text-lg font-semibold` | Modal titles, drawer headers, card headers |
| **KPI Stat Value** | `text-3xl font-extrabold font-mono tracking-tight` | Primary metric numbers on Dashboard |
| **Card Title / Header** | `text-sm font-semibold tracking-wide uppercase` | Table column headers, badge labels |
| **Body Text** | `text-sm font-normal` | Table body cells, form inputs, drawer details |
| **Metadata / Helper** | `text-xs text-muted` | Subtext, timestamps, SKU codes |

---

## 🌟 4. Subtle Lightweight 3D & Scroll Animation Strategy

To provide a polished, state-of-the-art enterprise feel without distracting from operational data or increasing CPU overhead:

1. **Hardware-Accelerated CSS Transforms**:
   - Uses `transform: translate3d(0, 0, 0)`, `perspective(1000px)`, `rotateX()`, and `scale()` for smooth 60fps rendering.
2. **Dashboard Card Depth Tilt**:
   - KPI cards feature a subtle hover elevation (`hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10`).
3. **Scroll-Driven Parallax Background**:
   - Light ambient glow background shifts at a subtle depth offset during page scrolling using CSS custom properties.
4. **Reduced Motion Respect**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

---

## 📱 5. Responsive Design & Screen Breakpoints

- **Desktop (1280px+)**: Sidebar expanded (w-64), 4-column KPI grid, high-density data tables.
- **Tablet (768px - 1024px)**: 2-column KPI grid, mobile top bar, responsive table scrolling.
- **Mobile (< 768px)**: Collapsible hamburger sidebar drawer, single-column KPI stacked layout, touch-friendly touch targets (min 44px height).

---

## 🖨️ 6. Professional Print Layout (`@media print`)

When printing delivery note dispatches (`/sales-challans/:id`):
- Navigation header, sidebar, theme switcher, and action buttons are hidden (`display: none`).
- Layout switches to clean white background (`bg-white`), dark black text (`text-black`), and high-contrast borders.
- Page margins and printable signature block preserved.
