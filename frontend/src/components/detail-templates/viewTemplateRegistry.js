// viewTemplateRegistry.js
// Configurable Detail View Registry for DNEXT Entities
// Routes entities to customized visual templates based on entityType, isBundle flag, and Product Specification

/**
 * Identifies whether an entity is a Sales Package strictly based on its Product Specification,
 * NOT on characteristics.
 *
 * Checks specification name, id, @id, and href for Sales Package designations:
 * - VF_DE_SPEC_SALES_PACKAGE / VF_DE_Sales_Package_Specification / VF_DE_SALES_SPEC / spec_sales_package
 * - productspecification_fn_salespackage_dsl / productspecification_fn_salespackage_ftth
 * - Any specification whose id or name contains 'sales_package', 'salespackage', 'sales_spec', 'salesspec', or 'fn_salespackage'
 */
export const isSalesPackageSpec = (item) => {
  if (!item) return false;
  const spec = item.productSpecification || item.raw?.productSpecification;
  if (!spec) return false;

  let specStr = '';
  if (typeof spec === 'string') {
    specStr = spec.toLowerCase();
  } else if (typeof spec === 'object') {
    specStr = `${spec.name || ''} ${spec.id || ''} ${spec['@id'] || ''} ${spec.href || ''}`.toLowerCase();
  }

  if (!specStr.trim()) return false;

  return (
    specStr.includes('sales_package') ||
    specStr.includes('salespackage') ||
    specStr.includes('sales_spec') ||
    specStr.includes('salesspec') ||
    specStr.includes('fn_salespackage') ||
    specStr.includes('sales-package')
  );
};

/**
 * Identifies whether an entity is an Option Offering based on its Product Specification
 * containing 'option'.
 */
export const isOptionSpec = (item) => {
  if (!item) return false;
  if (item.entityType && item.entityType !== 'ProductOffering') return false;

  const spec = item.productSpecification || item.raw?.productSpecification;
  if (!spec) return false;

  let specStr = '';
  if (typeof spec === 'string') {
    specStr = spec.toLowerCase();
  } else if (typeof spec === 'object') {
    specStr = `${spec.name || ''} ${spec.id || ''} ${spec['@id'] || ''} ${spec.href || ''}`.toLowerCase();
  }

  return specStr.includes('option');
};

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

  // 1b. Check Option Offering criteria next
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
