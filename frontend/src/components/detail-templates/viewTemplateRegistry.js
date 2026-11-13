// viewTemplateRegistry.js
// Configurable Detail View Registry for DNEXT Entities
// Routes entities to customized visual templates based on entityType, isBundle flag, and Product Specification

import { isSalesPackageSpec, isOptionSpec, isHardwareSpec } from '../../utils/entityClassifiers';

export { isSalesPackageSpec, isOptionSpec, isHardwareSpec };

export const TEMPLATES = {
  SALES_PACKAGE_NEW: {
    id: 'sales_package_new',
    name: 'New Sales Package Form',
    icon: 'sparkles',
    badge: 'Creation Form',
    description: 'Create and configure a new commercial Sales Package broadband offer',
    applicableTypes: ['ProductOffering'],
    matches: (item) => item?.isNew === true || item?.templateId === 'sales_package_new'
  },
  SALES_PACKAGE: {
    id: 'sales_package',
    name: 'Sales Package View',
    icon: 'bag',
    badge: 'Sales Package',
    description: 'Broadband access speed, specifications, recurring fees & contract terms',
    applicableTypes: ['ProductOffering'],
    matches: (item) => item?.entityType === 'ProductOffering' && isSalesPackageSpec(item)
  },
  HARDWARE: {
    id: 'hardware',
    name: 'Hardware View',
    icon: 'cpu',
    badge: 'Hardware',
    description: 'Hardware product offering specifications, attributes, and details',
    applicableTypes: ['ProductOffering'],
    matches: (item) => item?.entityType === 'ProductOffering' && isHardwareSpec(item)
  },
  OPTION_OFFERING: {
    id: 'option_offering',
    name: 'Option Offering View',
    icon: 'sliders',
    badge: 'Option Offering',
    description: 'Component options, bandwidth profiles, voice features, and associated pricing',
    applicableTypes: ['ProductOffering'],
    matches: (item) => item?.entityType === 'ProductOffering' && isOptionSpec(item)
  },
  BUNDLE_COMPOSITION: {
    id: 'bundle_composition',
    name: 'Bundle Composition View',
    icon: 'layers',
    badge: 'Bundle Hierarchy',
    description: 'Component tree, cardinality (min/max), sub-offerings and aggregate pricing',
    applicableTypes: ['ProductOffering'],
    matches: (item) => {
      if (item?.entityType !== 'ProductOffering') return false;
      const isBundle = Boolean(item.raw?.isBundle);
      const hasBundled = Array.isArray(item.raw?.bundledProductOffering) && item.raw.bundledProductOffering.length > 0;
      return isBundle || hasBundled;
    }
  },
  STANDARD_OFFERING: {
    id: 'standard_offering',
    name: 'Standard Offering View',
    icon: 'package',
    badge: 'Standard Offer',
    description: 'Complete TMF620 product offering attributes, specifications and commercial terms',
    applicableTypes: ['ProductOffering'],
    matches: (item) => item?.entityType === 'ProductOffering'
  },
  PRICE_MODEL: {
    id: 'price_model',
    name: 'Pricing Model View',
    icon: 'tag',
    badge: 'Pricing Matrix',
    description: 'Charge types, recurring periods, alterations, taxes and validity periods',
    applicableTypes: ['ProductOfferingPrice'],
    matches: (item) => item?.entityType === 'ProductOfferingPrice'
  },
  SPECIFICATION: {
    id: 'specification',
    name: 'Technical Spec View',
    icon: 'clipboard',
    badge: 'Technical Spec',
    description: 'Specification characteristics, permissible values, and entity relationships',
    applicableTypes: ['ProductSpecification'],
    matches: (item) => item?.entityType === 'ProductSpecification'
  },
  CATEGORY: {
    id: 'category',
    name: 'Category Hierarchy View',
    icon: 'folder',
    badge: 'Category',
    description: 'Catalog placement, parent-child hierarchies and subcategories',
    applicableTypes: ['Category'],
    matches: (item) => item?.entityType === 'Category'
  }
};

/**
 * Resolves the default/recommended template ID for a given entity item
 */
export function resolveTemplateId(item) {
  if (!item) return 'standard_offering';

  // 0. Creation mode for New Sales Package
  if (item?.isNew || item?.templateId === 'sales_package_new') {
    return 'sales_package_new';
  }

  // 1. Check Sales Package specific criteria first (highest priority for offerings)
  if (TEMPLATES.SALES_PACKAGE.matches(item)) {
    return 'sales_package';
  }

  // 1b. Check Hardware Offering criteria next
  if (TEMPLATES.HARDWARE.matches(item)) {
    return 'hardware';
  }

  // 1c. Check Option Offering criteria next
  if (TEMPLATES.OPTION_OFFERING.matches(item)) {
    return 'option_offering';
  }

  // 2. Check Bundle composition criteria next
  if (TEMPLATES.BUNDLE_COMPOSITION.matches(item)) {
    return 'bundle_composition';
  }

  // 3. Entity type based matchers
  if (TEMPLATES.PRICE_MODEL.matches(item)) {
    return 'price_model';
  }
  if (TEMPLATES.SPECIFICATION.matches(item)) {
    return 'specification';
  }
  if (TEMPLATES.CATEGORY.matches(item)) {
    return 'category';
  }

  // Fallback to standard offering
  return 'standard_offering';
}

/**
 * Returns available templates for an item (either relevant to its type or all for switching)
 */
export function getAvailableTemplates(item) {
  if (!item) return Object.values(TEMPLATES);
  const relevant = Object.values(TEMPLATES).filter(t => t.applicableTypes.includes(item.entityType));
  return relevant.length > 0 ? relevant : Object.values(TEMPLATES);
}
