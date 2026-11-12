// Shared constants and tokens for DNEXT List Views (Vodafone Theme)
export const C = {
  bg:          '#ffffff',
  panel:       '#ffffff',
  border:      'var(--ds-border)',
  text:        'var(--ds-text)',
  muted:       'var(--ds-text-2)',
  accent:      'var(--ds-brand)',
  indigo:      'var(--ds-brand)',
  vodafoneRed: 'var(--ds-brand)',
  success:     'var(--ds-ok)',
  warning:     'var(--ds-warn)',
  danger:      'var(--ds-brand)',
};

export const ENTITY_CONFIG = {
  Category: {
    label: 'Category',
    endpoint: '/api/dnext/categories',
    color: { bg: 'var(--ds-surface-2)', border: 'var(--ds-border)', text: 'var(--ds-text)' },
    icon: 'folder'
  },
  ProductOffering: {
    label: 'Product Offering',
    endpoint: '/api/dnext/product-offerings',
    color: { bg: 'var(--ds-surface-2)', border: 'var(--ds-border)', text: 'var(--ds-text)' },
    icon: 'package'
  },
  ProductOfferingPrice: {
    label: 'Offering Price',
    endpoint: '/api/dnext/product-offering-prices',
    color: { bg: 'var(--ds-surface-2)', border: 'var(--ds-border)', text: 'var(--ds-text)' },
    icon: 'tag'
  },
  ProductSpecification: {
    label: 'Specification',
    endpoint: '/api/dnext/product-specifications',
    color: { bg: 'var(--ds-surface-2)', border: 'var(--ds-border)', text: 'var(--ds-text)' },
    icon: 'clipboard'
  }
};
