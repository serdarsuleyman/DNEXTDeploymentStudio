// listViewRegistry.js
// Centralized, Configurable List View Registry for DNEXT Entities
// Routes catalog lists to customized visual list view components based on entityType and object field values

import AllObjectsListView from './AllObjectsListView';
import ProductOfferingsListView from './ProductOfferingsListView';
import SalesPackagesListView from './SalesPackagesListView';
import OptionsListView from './OptionsListView';
import ProductOfferingPricesListView from './ProductOfferingPricesListView';
import CategoriesListView from './CategoriesListView';

/**
 * Identifies whether an entity is an Option strictly based on its Product Specification.
 * Criteria: Entity must be a ProductOffering (or null entityType) and specification has "option" in its name or ID.
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

export const LIST_VIEW_TEMPLATES = {
  CATEGORIES: {
    id: 'categories',
    name: 'Categories Hierarchy View',
    icon: 'folder',
    badge: 'Categories',
    description: 'Dedicated category view with hierarchical tree structure from root element and flat table option',
    applicableTypes: ['Category'],
    component: CategoriesListView,
    matches: (context) => context.typeFilter === 'Category'
  },
  ALL_OBJECTS: {
    id: 'all_objects',
    name: 'All Objects Overview',
    icon: 'globe',
    badge: 'All Objects',
    description: 'General catalog table with ID, Type, Name, Version and Status (no spec column)',
    applicableTypes: ['all', 'ProductSpecification'],
    component: AllObjectsListView,
    matches: (context) => context.typeFilter === 'all' || !context.typeFilter || context.typeFilter === 'ProductSpecification'
  },
  PRODUCT_OFFERINGS: {
    id: 'product_offerings',
    name: 'Product Offerings View',
    icon: 'package',
    badge: 'Offerings',
    description: 'Dedicated offerings view with Product Specification column and specification filtering',
    applicableTypes: ['ProductOffering'],
    component: ProductOfferingsListView,
    matches: (context) => context.typeFilter === 'ProductOffering' && context.subFilter !== 'sales_packages' && context.subFilter !== 'options'
  },
  SALES_PACKAGES: {
    id: 'sales_packages',
    name: 'Sales Packages View',
    icon: 'bag',
    badge: 'Sales Packages',
    description: 'Dedicated sales packages broadband view with technology indicators and package specs',
    applicableTypes: ['ProductOffering'],
    component: SalesPackagesListView,
    matches: (context, sampleItem) => {
      if (context.typeFilter !== 'ProductOffering') return false;
      if (context.subFilter === 'sales_packages') return true;
      if (context.specFilter && (context.specFilter.toLowerCase().includes('sales') || context.specFilter.toLowerCase().includes('fn_salespackage'))) return true;
      if (sampleItem && isSalesPackageSpec(sampleItem)) return true;
      return false;
    }
  },
  OPTIONS: {
    id: 'options',
    name: 'Options View',
    icon: 'puzzle',
    badge: 'Options',
    description: 'Dedicated option offerings view where product specification has Option in the name',
    applicableTypes: ['ProductOffering'],
    component: OptionsListView,
    matches: (context, sampleItem) => {
      if (context.typeFilter !== 'ProductOffering') return false;
      if (context.subFilter === 'options') return true;
      if (context.specFilter && context.specFilter.toLowerCase().includes('option')) return true;
      if (sampleItem && isOptionSpec(sampleItem)) return true;
      return false;
    }
  },
  PRICE_MODELS: {
    id: 'price_models',
    name: 'Offering Prices View',
    icon: 'tag',
    badge: 'Pricing Matrix',
    description: 'Dedicated pricing view with Charge Type (Recurring/One-Time) and currency amounts',
    applicableTypes: ['ProductOfferingPrice'],
    component: ProductOfferingPricesListView,
    matches: (context) => context.typeFilter === 'ProductOfferingPrice'
  }
};

/**
 * Resolves the default/recommended list view template ID based on:
 * 1. Current entityType context
 * 2. Field values / sub-filters / specification values of objects
 */
export function resolveListViewTemplateId(context = {}, sampleItem = null) {
  // 1. Categories
  if (LIST_VIEW_TEMPLATES.CATEGORIES.matches(context, sampleItem)) {
    return 'categories';
  }

  // 2. Sales Packages (subFilter, or spec matches sales package)
  if (LIST_VIEW_TEMPLATES.SALES_PACKAGES.matches(context, sampleItem)) {
    return 'sales_packages';
  }

  // 2. Options (subFilter, or spec matches option)
  if (LIST_VIEW_TEMPLATES.OPTIONS.matches(context, sampleItem)) {
    return 'options';
  }

  // 3. Product Offering Price
  if (LIST_VIEW_TEMPLATES.PRICE_MODELS.matches(context, sampleItem)) {
    return 'price_models';
  }

  // 4. Product Offerings
  if (LIST_VIEW_TEMPLATES.PRODUCT_OFFERINGS.matches(context, sampleItem)) {
    return 'product_offerings';
  }

  // 5. Default: All Objects
  return 'all_objects';
}

/**
 * Returns available list view templates for the current context
 */
export function getAvailableListViewTemplates(context = {}) {
  const currentType = context.typeFilter || 'all';
  if (currentType === 'all') {
    return Object.values(LIST_VIEW_TEMPLATES);
  }
  const relevant = Object.values(LIST_VIEW_TEMPLATES).filter(t => t.applicableTypes.includes(currentType));
  return relevant.length > 0 ? relevant : Object.values(LIST_VIEW_TEMPLATES);
}

/**
 * Returns the list view component for a given template ID
 */
export function getListViewComponent(templateId) {
  const entry = Object.values(LIST_VIEW_TEMPLATES).find(t => t.id === templateId);
  return entry ? entry.component : AllObjectsListView;
}
