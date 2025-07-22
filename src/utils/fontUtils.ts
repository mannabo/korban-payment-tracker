// Font utility functions for consistent typography across the application

export const FONT_FAMILY = {
  // Main font - inherit from body (Inter)
  main: 'inherit',
  
  // Monospace for numbers, codes, account numbers
  mono: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
} as const;

// Common font styles
export const FONT_STYLES = {
  // Body text
  body: {
    fontFamily: FONT_FAMILY.main,
    fontSize: '0.875rem', // 14px
    fontWeight: '400',
  },
  
  // Headings
  heading: {
    fontFamily: FONT_FAMILY.main,
    fontWeight: '600',
  },
  
  // Labels
  label: {
    fontFamily: FONT_FAMILY.main,
    fontSize: '0.75rem', // 12px
    fontWeight: '500',
  },
  
  // Buttons
  button: {
    fontFamily: FONT_FAMILY.main,
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
  },
  
  // Numbers and codes
  monospace: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: '0.875rem', // 14px
  },
} as const;

// Helper function to get consistent font styles
export const getFontStyle = (type: keyof typeof FONT_STYLES) => FONT_STYLES[type];