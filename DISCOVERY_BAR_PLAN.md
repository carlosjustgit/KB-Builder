# Smart Discovery Bar Implementation Plan

## Overview
Replace the current static footer with a context-aware Smart Discovery Bar that showcases Witfy features through rotating tips and provides environment-aware CTAs.

## Component Tree

```
Layout.tsx
└── SmartDiscoveryBar.tsx (new)
    ├── WitfyIcon (existing logo image)
    ├── AnimatedText.tsx (new)
    │   └── Rotating tips with fade transitions
    └── CTA Link
        ├── Public: https://witfy.social (external)
        └── In-app: /remix or /dashboard (internal)
```

## i18n Keys to Add

### New Namespace: `discovery-bar`
Location: `client/public/i18n/{locale}/kb-builder/discovery-bar.json`

**Structure:**
```json
{
  "tips": {
    "remix1": "...",  // Witfy Remix feature tip
    "remix2": "...",  // Second Remix tip
    "ai1": "...",     // AI training tip
    "sched1": "...",  // Scheduling tip
    "value1": "..."   // Overall value proposition
  },
  "cta": {
    "public": "...",  // External CTA text
    "inApp": "..."    // In-app CTA text
  }
}
```

### Locales to Create:
- en-US (color, organize)
- en-GB (colour, organise)
- pt-BR (Brazilian Portuguese spelling)
- pt-PT (European Portuguese, no em dashes)

## Step → Tips Mapping

**Route-based Content Selection:**

| Route      | Tips Array                     | Rationale                           |
|------------|--------------------------------|-------------------------------------|
| `/visual`  | [remix1, remix2, value1]       | Prioritise image/visual features    |
| `/export`  | [sched1, value1, ai1]          | Emphasize automation & next steps   |
| default    | [ai1, remix1, value1]          | Balanced introduction to features   |

## Routing Logic (CTA Target)

### Environment Detection:
```typescript
// Standalone (public build)
if (window.self === window.top && import.meta.env.VITE_IN_APP !== "1") {
  target = "https://witfy.social"
  rel = "noopener"
  openInNewTab = true
}

// Embedded in main app
else {
  target = "/remix" || "/dashboard"  // Use /remix if route exists, else /dashboard
  internalNavigation = true
}
```

## Technical Specifications

### SmartDiscoveryBar Component
- **File:** `client/src/components/discovery/SmartDiscoveryBar.tsx`
- **Height:** ~64px (fixed)
- **Layout:** `flex` with `justify-between`
- **Sections:**
  - Left: Witfy icon (32×32px)
  - Center: AnimatedText component
  - Right: CTA link/button

### AnimatedText Component
- **File:** `client/src/components/discovery/AnimatedText.tsx`
- **Props:**
  - `items: string[]` - array of tip strings
  - `intervalMs?: number` - default 7000 (7s)
- **Features:**
  - CSS fade-out/fade-in transition (200ms duration)
  - Pause on hover (user can read)
  - `aria-live="polite"` for screen readers
  - Auto-rotate through items cyclically

### Styling Tokens (from ui-kit-visual-guide.md)
- Background: `bg-muted/30` for subtle non-intrusive appearance
- Text: `text-muted-foreground` for tips, `text-foreground` for CTA
- Border: `border-t border-border`
- CTA: `text-primary hover:text-primary/80` with underline on hover

## Accessibility Requirements
- [x] CTA is keyboard focusable with visible focus ring
- [x] AnimatedText has `aria-label="Tips about Witfy features"`
- [x] No autoplaying media (text transitions only)
- [x] Sufficient contrast ratios (min 4.5:1)

## Performance
- No network calls (all content from i18n)
- CSS transitions only (no JS animations)
- Minimal bundle impact (~2KB total)

## Layout Integration
Replace lines 251-274 in `client/src/components/Layout.tsx` with:
```tsx
<SmartDiscoveryBar />
```

## i18n Wiring
Update `client/src/lib/i18n.ts`:
```typescript
ns: ['common', 'step-welcome', 'discovery-bar'],
```

Add lazy namespace loading in Layout or root component.

## Testing Checklist
- [ ] Renders on all routes (/, /visual, /export, /brand, etc.)
- [ ] Tips rotate every 7s with smooth fade transition
- [ ] Pause on hover works
- [ ] CTA shows correct text for public vs in-app
- [ ] CTA navigates to correct target
- [ ] All 4 locales load correct translations
- [ ] Keyboard navigation works (Tab to CTA, Enter activates)
- [ ] Focus ring visible
- [ ] Screen reader announces tips appropriately

## Deliverables

1. **Components:**
   - `client/src/components/discovery/SmartDiscoveryBar.tsx`
   - `client/src/components/discovery/AnimatedText.tsx`

2. **i18n Files:**
   - `client/public/i18n/en-US/kb-builder/discovery-bar.json`
   - `client/public/i18n/en-GB/kb-builder/discovery-bar.json`
   - `client/public/i18n/pt-BR/kb-builder/discovery-bar.json`
   - `client/public/i18n/pt-PT/kb-builder/discovery-bar.json`

3. **Updated Files:**
   - `client/src/components/Layout.tsx` (footer replacement)
   - `client/src/lib/i18n.ts` (namespace registration)

4. **Documentation:**
   - This plan document

## Implementation Order
1. ✅ Create DISCOVERY_BAR_PLAN.md
2. Create i18n files (4 locales)
3. Create AnimatedText component
4. Create SmartDiscoveryBar component
5. Update i18n config
6. Update Layout to use SmartDiscoveryBar
7. Test on all routes and locales
8. Create PR with demo

---

**Estimated Time:** ~2-3 hours
**Complexity:** Medium (route detection + environment detection + i18n wiring)
**Risk:** Low (isolated component, no breaking changes to existing functionality)

