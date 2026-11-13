// Shared constants and tokens for DNEXT List Views (Vodafone Theme)
import { C } from '../../styles/theme';

export { C };

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
