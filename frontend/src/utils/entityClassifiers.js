/**
 * Shared entity classification helpers for DNEXT ProductOfferings.
 * Used by both list-view and detail-template registries.
 */

function getSpecSearchString(item) {
  const spec = item?.productSpecification || item?.raw?.productSpecification;
  if (!spec) return '';
  if (typeof spec === 'string') return spec.toLowerCase();
  if (typeof spec === 'object') {
    return `${spec.name || ''} ${spec.id || ''} ${spec['@id'] || ''} ${spec.href || ''}`.toLowerCase();
  }
  return '';
}

/**
 * Identifies whether an entity is an Option strictly based on its Product Specification.
 * Criteria: Entity must be a ProductOffering (or null entityType) and specification has "option" in its name or ID.
 */
export const isOptionSpec = (item) => {
  if (!item) return false;
  if (item.entityType && item.entityType !== 'ProductOffering') return false;
  return getSpecSearchString(item).includes('option');
};

/**
 * Identifies whether an entity is a Sales Package strictly based on its Product Specification,
 * NOT on characteristics.
 */
export const isSalesPackageSpec = (item) => {
  if (!item) return false;
  const specStr = getSpecSearchString(item);
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
 * Identifies whether an entity is a Hardware offering strictly based on its
 * Product Specification (productSpecification_FN_Hardware) or Hardware characteristics.
 */
export const isHardwareSpec = (item) => {
  if (!item) return false;
  if (item.entityType && item.entityType !== 'ProductOffering') return false;

  const specStr = getSpecSearchString(item);
  if (
    specStr.includes('fn_hardware') ||
    specStr.includes('productspecification_fn_hardware')
  ) {
    return true;
  }

  const charUses = item.prodSpecCharValueUse || item.raw?.prodSpecCharValueUse || [];
  for (const c of charUses) {
    const name = (c.name || '').toLowerCase();
    if (name === 'productfamilyname' || name === 'product_family_name') {
      const vals = c.productSpecCharacteristicValue || [];
      if (vals.some(v => String(v?.value || '').toLowerCase().includes('fn_hardware'))) {
        return true;
      }
    }
  }

  return false;
};
