# FAQ Component Documentation

## Overview

A complete, production-ready FAQ section component for eLearning platforms with modern UI, smooth animations, and full accessibility support.

## Features

✅ **Category Grouping** - FAQs automatically grouped by category  
✅ **Pagination** - Shows 5 FAQs per category initially, "Show More" loads 5 more  
✅ **Smooth Animations** - Framer Motion powered accordion animations  
✅ **Accessibility** - Full ARIA attributes, keyboard navigation support  
✅ **Responsive Design** - Mobile-first, works on all screen sizes  
✅ **Strapi Integration** - Fetches from `/api/faqs` endpoint  
✅ **TypeScript** - Fully typed for better DX  
✅ **Error Handling** - Graceful loading and error states  

## Components

### `FAQSection` (Main Component)

The main FAQ section component that fetches data and renders categories.

**Usage:**
```tsx
import { FAQSection } from "@/components/faq"

<FAQSection />
```

**Features:**
- Fetches FAQs from `/api/faqs` endpoint
- Filters by `isPublished: true`
- Groups FAQs by category
- Handles loading and error states

### `FAQCategory`

Displays FAQs for a single category with pagination.

**Props:**
- `category: string` - Category name
- `faqs: ProcessedFAQ[]` - Array of FAQs
- `openIndex: number | null` - Currently open FAQ index
- `onToggle: (index: number) => void` - Toggle callback
- `itemsPerPage?: number` - Items per page (default: 5)

### `FAQAccordionItem`

Individual FAQ accordion item with animations.

**Props:**
- `faq: ProcessedFAQ` - FAQ data
- `isOpen: boolean` - Is accordion open
- `onToggle: () => void` - Toggle callback
- `index: number` - Index for ARIA

## Customization

### Change Items Per Page

Edit `FAQCategory` component:
```tsx
<FAQCategory itemsPerPage={10} /> // Show 10 instead of 5
```

### Add Custom Categories

Edit `CATEGORY_CONFIG` in `faq-section.tsx`:
```tsx
const CATEGORY_CONFIG: Record<string, { label: string; description: string }> = {
  platform: { label: "Platform", description: "..." },
  // Add your category
  support: { label: "Support", description: "Support questions" },
}
```

### Customize Colors

The component uses Tailwind CSS classes. Modify colors in:
- `faq-accordion.tsx` - Accordion item colors
- `faq-section.tsx` - Section background and text colors

### Change Animation Speed

Edit animation durations in components:
```tsx
// In FAQAccordionItem
transition={{ duration: 0.3 }} // Change to 0.5 for slower

// In FAQCategory
transition={{ duration: 0.4 }} // Change animation speed
```

### Disable Single-Open Mode

To allow multiple FAQs open at once, modify `faq-section.tsx`:
```tsx
// Change from single index to Set
const [openIndices, setOpenIndices] = useState<Set<number>>(new Set())

const handleToggle = (index: number) => {
  setOpenIndices(prev => {
    const next = new Set(prev)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    return next
  })
}
```

## API Requirements

The component expects FAQs from `/api/faqs` with this structure:

```json
{
  "data": [
    {
      "id": 1,
      "question": "Question text",
      "answer": "Answer text",
      "buttonText": "Optional button",
      "order": 1,
      "category": "platform",
      "isPublished": true,
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Accessibility

- ✅ ARIA labels and roles
- ✅ Keyboard navigation (Enter/Space to toggle)
- ✅ Focus management
- ✅ Screen reader friendly
- ✅ Semantic HTML

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- Lazy loading of FAQ content
- Optimized re-renders with React hooks
- Smooth 60fps animations
- Minimal bundle size

