# Witfy UI Kit Visual Guide

A comprehensive design system documentation for Witfy's user interface components, design tokens, and styling conventions.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Theme Configuration](#theme-configuration)
3. [Typography & Visual Hierarchy](#typography--visual-hierarchy)
4. [Component Library](#component-library)
5. [Internationalization (i18n)](#internationalization-i18n)
6. [Accessibility Guidelines](#accessibility-guidelines)
7. [Usage Examples](#usage-examples)

---

## Design Tokens

### Color Palette

#### Primary Brand Colors (Witfy Purple)
| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--witfy-50` | `244 100% 97%` | `#F4F1FF` | Lightest tint, backgrounds |
| `--witfy-100` | `248 100% 95%` | `#EBE5FF` | Very light backgrounds |
| `--witfy-200` | `247 100% 90%` | `#D9CEFF` | Light backgrounds, borders |
| `--witfy-300` | `246 100% 83%` | `#BFA8FF` | Subtle highlights |
| `--witfy-400` | `245 100% 73%` | `#A173FF` | Secondary actions |
| `--witfy-500` | `267 84% 63%` | `#8943FE` | **Primary brand color** |
| `--witfy-600` | `258 85% 58%` | `#7C3AED` | Primary hover states |
| `--witfy-700` | `250 74% 50%` | `#6D28D9` | Active states |
| `--witfy-800` | `243 75% 42%` | `#5B21B6` | Dark variants |
| `--witfy-900` | `244 69% 35%` | `#4C1D95` | Darkest shade |

#### Semantic Colors
| Token | Light Mode HSL | Dark Mode HSL | Usage |
|-------|----------------|---------------|-------|
| `--primary` | `267 84% 63%` | `267 84% 63%` | Primary actions, CTAs |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | Text on primary |
| `--secondary` | `60 4.8% 95.9%` | `240 3.7% 15.9%` | Secondary actions |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Error states, warnings |
| `--background` | `0 0% 100%` | `240 10% 3.9%` | Main background |
| `--foreground` | `20 14.3% 4.1%` | `0 0% 98%` | Primary text |
| `--muted` | `60 4.8% 95.9%` | `240 3.7% 15.9%` | Muted backgrounds |
| `--border` | `20 5.9% 90%` | `240 3.7% 15.9%` | Component borders |
| `--input` | `20 5.9% 90%` | `240 3.7% 15.9%` | Input field borders |
| `--ring` | `20 14.3% 4.1%` | `240 4.9% 83.9%` | Focus rings |

#### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `8px` | Base radius |
| `lg` | `var(--radius)` | Large components |
| `md` | `calc(var(--radius) - 2px)` | Medium components |
| `sm` | `calc(var(--radius) - 4px)` | Small components |

---

## Theme Configuration

### Tailwind CSS Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

### CSS Variables Definition

```css
/* client/src/index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 20 14.3% 4.1%;
  --primary: 267 84% 63%; /* #8943FE - Witfy Purple */
  --primary-foreground: 0 0% 100%;
  --secondary: 60 4.8% 95.9%;
  --secondary-foreground: 24 9.8% 10%;
  --muted: 60 4.8% 95.9%;
  --muted-foreground: 25 5.3% 44.7%;
  --accent: 60 4.8% 95.9%;
  --accent-foreground: 24 9.8% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 60 9.1% 97.8%;
  --border: 20 5.9% 90%;
  --input: 20 5.9% 90%;
  --ring: 20 14.3% 4.1%;
  --radius: 8px;

  /* Witfy Brand Colors */
  --witfy-50: 244 100% 97%;
  --witfy-100: 248 100% 95%;
  --witfy-200: 247 100% 90%;
  --witfy-300: 246 100% 83%;
  --witfy-400: 245 100% 73%;
  --witfy-500: 267 84% 63%; /* Primary brand color */
  --witfy-600: 258 85% 58%;
  --witfy-700: 250 74% 50%;
  --witfy-800: 243 75% 42%;
  --witfy-900: 244 69% 35%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

### Brand Color Utilities

```css
@layer utilities {
  /* Text Colors */
  .text-witfy-50 { color: hsl(var(--witfy-50)); }
  .text-witfy-500 { color: hsl(var(--witfy-500)); }
  .text-witfy-900 { color: hsl(var(--witfy-900)); }

  /* Background Colors */
  .bg-witfy-50 { background-color: hsl(var(--witfy-50)); }
  .bg-witfy-500 { background-color: hsl(var(--witfy-500)); }
  .bg-witfy-900 { background-color: hsl(var(--witfy-900)); }

  /* Border Colors */
  .border-witfy-500 { border-color: hsl(var(--witfy-500)); }

  /* Hover States */
  .hover\:bg-witfy-600:hover { background-color: hsl(var(--witfy-600)); }
}
```

---

## Typography & Visual Hierarchy

### Font Family
- **Primary**: Poppins (fallback: ui-sans-serif, system-ui, sans-serif)
- **Weight Range**: 300-700
- **Features**: Antialiased rendering

### Typography Scale
| Class | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-3xl` | 30px | 36px | 700 | Page titles |
| `text-2xl` | 24px | 32px | 600 | Section headers |
| `text-xl` | 20px | 28px | 600 | Card titles |
| `text-lg` | 18px | 28px | 500 | Large body text |
| `text-base` | 16px | 24px | 400 | Body text |
| `text-sm` | 14px | 20px | 400 | Small text |
| `text-xs` | 12px | 16px | 400 | Captions |

---

## Component Library

### Button Component

#### Variants
```typescript
// Button variants using class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

#### Usage Examples
```tsx
// Primary CTA Button
<Button 
  size="lg" 
  className="bg-witfy-500 hover:bg-witfy-600 text-white"
>
  Get Started
</Button>

// Secondary Button
<Button variant="outline">
  Learn More
</Button>

// Loading State
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>
```

### Input Components

#### Basic Input
```tsx
// Input component with validation states
<Input
  type="email"
  placeholder="Enter your email"
  className="focus-visible:ring-purple-500"
  aria-describedby="email-error"
/>

// With error state
<Input
  type="email"
  placeholder="Enter your email"
  className="border-destructive focus-visible:ring-destructive"
  aria-invalid="true"
/>
```

#### Textarea
```tsx
<Textarea
  placeholder="Enter your message"
  className="min-h-[100px] resize-none"
  maxLength={500}
/>
```

### Card Component

```tsx
// Basic card structure
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dialog/Modal Component

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description or instructions
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Sheet/Drawer Component

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Navigation Menu</SheetTitle>
    </SheetHeader>
    <div className="space-y-4">
      {/* Sheet content */}
    </div>
  </SheetContent>
</Sheet>
```

### Alert/Toast Component

```tsx
// Toast usage
const { toast } = useToast()

// Success toast
toast({
  title: "Success!",
  description: "Your action was completed successfully.",
})

// Error toast
toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong. Please try again.",
})
```

---

## Internationalization (i18n)

### Translation System Overview

The project uses a custom i18n system with hierarchical translation keys and automatic language detection.

#### Supported Languages
- `en` - English (US)
- `en-gb` - English (UK)
- `pt-br` - Portuguese (Brazil)
- `pt-pt` - Portuguese (Portugal)

#### Hook Usage
```tsx
import { useTranslations } from "@/app/website/lib/i18n";

function MyComponent() {
  const { t, language, setLanguage } = useTranslations();
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.description')}</p>
    </div>
  );
}
```

#### Translation Key Conventions

##### Namespace Structure
```json
{
  "seo": {
    "homepage": {
      "title": "Page title for SEO",
      "description": "Meta description"
    }
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "hero": {
    "title": "Main headline",
    "subtitle": "Supporting text",
    "badge": "New Feature",
    "cta": {
      "primary": "Get Started",
      "secondary": "Learn More"
    }
  },
  "forms": {
    "labels": {
      "email": "Email Address",
      "password": "Password",
      "firstName": "First Name",
      "lastName": "Last Name",
      "company": "Company Name",
      "message": "Message"
    },
    "placeholders": {
      "email": "Enter your email address",
      "password": "Enter your password",
      "firstName": "Your first name",
      "message": "Type your message here..."
    },
    "validation": {
      "required": "This field is required",
      "emailInvalid": "Please enter a valid email address",
      "passwordTooShort": "Password must be at least 8 characters",
      "fieldTooLong": "This field is too long"
    },
    "buttons": {
      "submit": "Submit",
      "cancel": "Cancel",
      "save": "Save Changes",
      "delete": "Delete",
      "edit": "Edit",
      "submitting": "Submitting...",
      "processing": "Processing...",
      "confirm": "Confirm"
    }
  },
  "feedback": {
    "success": {
      "saved": "Changes saved successfully",
      "sent": "Message sent successfully",
      "deleted": "Item deleted successfully"
    },
    "error": {
      "generic": "Something went wrong. Please try again.",
      "network": "Network error. Check your connection.",
      "validation": "Please fix the errors above",
      "notFound": "The requested item was not found"
    }
  },
  "cookieConsent": {
    "message": "We use cookies to enhance your experience",
    "acceptAll": "Accept All",
    "rejectAll": "Reject All",
    "preferences": {
      "title": "Cookie Preferences",
      "description": "Manage your cookie settings",
      "essential": {
        "title": "Essential Cookies",
        "description": "Required for basic website functionality"
      },
      "analytics": {
        "title": "Analytics Cookies", 
        "description": "Help us understand how you use our website"
      },
      "marketing": {
        "title": "Marketing Cookies",
        "description": "Used to show you relevant advertisements"
      }
    }
  }
}
```

##### Key Naming Conventions
- Use **camelCase** for all keys
- Group related keys under namespaces
- Use descriptive names that indicate context
- Separate words with dots for hierarchy

##### Examples by Use Case

**Form Elements:**
```tsx
// Labels
<Label>{t('forms.labels.email')}</Label>

// Placeholders
<Input placeholder={t('forms.placeholders.email')} />

// Validation Messages
{error && <span className="text-destructive">{t('forms.validation.emailInvalid')}</span>}

// Buttons
<Button>{t('forms.buttons.submit')}</Button>
```

**Navigation:**
```tsx
<nav>
  <Link href="/">{t('navigation.home')}</Link>
  <Link href="/about">{t('navigation.about')}</Link>
</nav>
```

**CTAs and Marketing Copy:**
```tsx
<section>
  <h1>{t('hero.title')}</h1>
  <p>{t('hero.subtitle')}</p>
  <Badge>{t('hero.badge')}</Badge>
  <Button>{t('hero.cta.primary')}</Button>
</section>
```

**Error Handling:**
```tsx
// Generic error
toast({
  variant: "destructive",
  title: t('feedback.error.generic')
});

// Specific validation error
<span className="text-destructive">
  {t('forms.validation.required')}
</span>
```

**Cookie Consent:**
```tsx
<div>
  <p>{t('cookieConsent.message')}</p>
  <Button>{t('cookieConsent.acceptAll')}</Button>
  <Button variant="outline">{t('cookieConsent.rejectAll')}</Button>
</div>
```

---

## Accessibility Guidelines

### Focus Management

#### Focus Rings
- Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Purple focus rings: `focus-visible:ring-purple-500`
- Minimum contrast ratio: **4.5:1**

#### Focus Indicators
```css
/* Custom focus styles */
.focus-visible:focus-visible {
  outline: 2px solid hsl(var(--witfy-500));
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Color Contrast

#### Minimum Requirements
- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio

#### Validated Combinations
| Background | Text Color | Contrast Ratio | Status |
|------------|------------|----------------|--------|
| `#FFFFFF` | `#8943FE` | 4.52:1 | ✅ Pass |
| `#8943FE` | `#FFFFFF` | 4.52:1 | ✅ Pass |
| `#F4F1FF` | `#4C1D95` | 8.12:1 | ✅ Pass |

### Keyboard Navigation

#### Requirements
- All interactive elements must be keyboard accessible
- Tab order should be logical and predictable
- Escape key closes modals/dropdowns
- Enter/Space activates buttons

#### Implementation
```tsx
// Proper keyboard handling
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  }}
>
  Action
</Button>
```

### ARIA Labels and Descriptions

```tsx
// Form inputs
<Input
  type="email"
  aria-label="Email address"
  aria-describedby="email-help"
  aria-invalid={hasError ? "true" : "false"}
/>
<div id="email-help">We'll never share your email</div>

// Buttons with icons
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Loading states
<Button disabled aria-busy="true">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>
```

### Screen Reader Support

#### Best Practices
- Use semantic HTML elements
- Provide descriptive alt text for images
- Use proper heading hierarchy (h1, h2, h3...)
- Include skip links for navigation

```tsx
// Semantic structure
<main>
  <h1>{t('page.title')}</h1>
  <section aria-labelledby="section-1">
    <h2 id="section-1">{t('section.title')}</h2>
    <p>{t('section.content')}</p>
  </section>
</main>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

---

## Usage Examples

### Complete Form Example

```tsx
import { useTranslations } from "@/app/website/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";

function ContactForm() {
  const { t } = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('forms.contact.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('forms.labels.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('forms.placeholders.email')}
              className="focus-visible:ring-purple-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t('forms.labels.message')}</Label>
            <Textarea
              id="message"
              placeholder={t('forms.placeholders.message')}
              className="min-h-[100px]"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-witfy-500 hover:bg-witfy-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('forms.buttons.submitting')}
              </>
            ) : (
              t('forms.buttons.submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Modal with Loading State

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/app/website/lib/i18n";
import { Loader2 } from "lucide-react";

function ConfirmationModal({ isOpen, onClose, onConfirm, isLoading }) {
  const { t } = useTranslations();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modals.confirmation.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          {t('modals.confirmation.message')}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('forms.buttons.cancel')}
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="bg-witfy-500 hover:bg-witfy-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('forms.buttons.processing')}
              </>
            ) : (
              t('forms.buttons.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Cookie Consent Banner

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/app/website/lib/i18n";
import { Cookie } from "lucide-react";

function CookieBanner() {
  const { t } = useTranslations();
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false
  });

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <p className="text-sm text-muted-foreground">
            {t('cookieConsent.message')}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              Manage Preferences
            </Button>
            <Button 
              size="sm"
              className="bg-witfy-500 hover:bg-witfy-600"
            >
              {t('cookieConsent.acceptAll')}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-witfy-500" />
              {t('cookieConsent.preferences.title')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base font-medium">
                  {t('cookieConsent.preferences.essential.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('cookieConsent.preferences.essential.description')}
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base font-medium">
                  {t('cookieConsent.preferences.analytics.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('cookieConsent.preferences.analytics.description')}
                </p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## Development Guidelines

### Component Creation Checklist

- [ ] Use TypeScript for all components
- [ ] Implement proper prop interfaces
- [ ] Include all necessary accessibility attributes
- [ ] Support dark mode via CSS variables
- [ ] Use translation keys for all user-facing text
- [ ] Include focus management
- [ ] Implement proper loading states
- [ ] Test keyboard navigation
- [ ] Validate color contrast ratios
- [ ] Add comprehensive PropTypes/TypeScript types

### Code Quality Standards

- **ESLint**: Use the project's ESLint configuration
- **TypeScript**: Strict mode enabled
- **Accessibility**: Follow WCAG 2.1 AA guidelines
- **Performance**: Use React.memo and useMemo where appropriate
- **Testing**: Component unit tests with accessibility testing

### File Organization

```
client/src/
├── components/
│   └── ui/           # Shadcn UI components
├── app/
│   └── website/
│       ├── components/   # Website-specific components
│       └── lib/
│           └── i18n.ts   # Translation system
├── providers/        # React context providers
├── hooks/           # Custom React hooks
└── lib/             # Utility functions
```

---

*This documentation is a living document and should be updated as the design system evolves.*