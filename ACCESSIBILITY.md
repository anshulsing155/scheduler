# Accessibility Guide

This document outlines the accessibility features and best practices implemented in the Calendly Scheduler application.

## Overview

The application follows WCAG 2.1 Level AA standards to ensure accessibility for all users, including those using assistive technologies.

## Key Features

### 1. Keyboard Navigation

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Skip Links**: "Skip to main content" link for keyboard users
- **Focus Indicators**: Clear visual focus indicators on all interactive elements
- **Keyboard Shortcuts**: Common shortcuts work as expected (Enter, Space, Escape, Arrow keys)

### 2. Screen Reader Support

- **ARIA Labels**: Proper ARIA labels on all interactive elements
- **ARIA Live Regions**: Dynamic content updates announced to screen readers
- **Semantic HTML**: Proper use of semantic HTML elements (nav, main, article, etc.)
- **Alt Text**: All images have descriptive alt text

### 3. Visual Accessibility

- **Color Contrast**: All text meets WCAG AA contrast ratios (4.5:1 for normal text)
- **Focus Indicators**: 2px blue ring on focused elements
- **Text Sizing**: Responsive text that scales properly
- **High Contrast Mode**: Support for high contrast preferences

### 4. Motion and Animation

- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **Optional Animations**: Animations can be disabled
- **Smooth Scrolling**: Smooth scrolling for users who prefer it

## Component Accessibility

### Navigation

```tsx
<Navigation />
```

- Proper ARIA labels and roles
- Mobile menu with proper ARIA expanded state
- Current page indication with `aria-current="page"`
- Keyboard accessible menu toggle

### Forms

```tsx
<FormField label="Email" required error={errors.email}>
  <Input type="email" />
</FormField>
```

- Associated labels with inputs
- Error messages linked via `aria-describedby`
- Required field indicators
- Validation feedback announced to screen readers

### Loading States

```tsx
<Loading text="Loading bookings..." />
```

- Loading spinners with `aria-label`
- Status updates via `aria-live` regions
- Skeleton loaders with proper ARIA attributes

### Toasts/Notifications

```tsx
const { showToast } = useToast()
showToast({ type: 'success', title: 'Booking confirmed!' })
```

- Toast notifications with `role="alert"`
- Dismissible with keyboard
- Auto-dismiss with configurable duration

### Error Boundaries

- Graceful error handling
- Clear error messages
- Recovery options
- Error IDs for support

## Testing Accessibility

### Automated Testing

Run accessibility checks:

```bash
npm run test:a11y
```

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test keyboard shortcuts

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content is announced
   - Check ARIA labels and descriptions

3. **Visual Testing**
   - Test with browser zoom (up to 200%)
   - Verify color contrast
   - Test in high contrast mode

4. **Motion Testing**
   - Enable "Reduce motion" in OS settings
   - Verify animations are disabled

## Best Practices

### When Creating New Components

1. **Use Semantic HTML**
   ```tsx
   // Good
   <button onClick={handleClick}>Click me</button>
   
   // Bad
   <div onClick={handleClick}>Click me</div>
   ```

2. **Add ARIA Labels**
   ```tsx
   <button aria-label="Close dialog">
     <X />
   </button>
   ```

3. **Manage Focus**
   ```tsx
   useEffect(() => {
     dialogRef.current?.focus()
   }, [])
   ```

4. **Provide Text Alternatives**
   ```tsx
   <img src="chart.png" alt="Booking trends showing 20% increase" />
   ```

5. **Use Form Field Component**
   ```tsx
   <FormField label="Name" required error={errors.name}>
     <Input {...register('name')} />
   </FormField>
   ```

### Common Patterns

#### Modal Dialogs

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">Confirm Action</DialogTitle>
    <DialogDescription>
      Are you sure you want to proceed?
    </DialogDescription>
    <DialogActions>
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogActions>
  </DialogContent>
</Dialog>
```

#### Loading States

```tsx
{loading ? (
  <Loading text="Loading data..." />
) : (
  <DataTable data={data} />
)}
```

#### Error States

```tsx
{error && (
  <div role="alert" className="error-message">
    <AlertCircle aria-hidden="true" />
    <span>{error.message}</span>
  </div>
)}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

## Reporting Issues

If you find an accessibility issue:

1. Check if it's already reported in GitHub Issues
2. Create a new issue with the "accessibility" label
3. Include:
   - Description of the issue
   - Steps to reproduce
   - Assistive technology used (if applicable)
   - Screenshots or screen recordings

## Continuous Improvement

We continuously monitor and improve accessibility:

- Regular accessibility audits
- User testing with assistive technologies
- Automated testing in CI/CD pipeline
- Community feedback and contributions
