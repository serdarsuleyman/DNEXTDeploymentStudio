// leftMenuService.js
// Utility service for parsing, filtering and navigating via leftMenuConfig.json

import defaultMenuConfig from '../../config/leftMenuConfig.json';

/**
 * Checks if an item or section is active.
 * Supports:
 * - active: true | false
 * - active: "true" | "false"
 * - status: "active" | "inactive"
 * - default: true if undefined
 */
export function isMenuItemActive(item) {
  if (!item) return false;
  if (item.active === false || item.active === 'false') return false;
  if (item.status && String(item.status).toLowerCase() === 'inactive') return false;
  return true;
}

/**
 * Filters the configuration to only active sections, items, and children.
 * If all items in a section are inactive, the section itself is omitted.
 */
export function getActiveMenuSections(config = defaultMenuConfig) {
  if (!config || !Array.isArray(config.sections)) return [];

  return config.sections
    .filter(isMenuItemActive)
    .map(section => {
      const activeItems = (section.items || [])
        .filter(isMenuItemActive)
        .map(item => {
          const activeChildren = (item.children || []).filter(isMenuItemActive);
          return {
            ...item,
            children: activeChildren
          };
        });

      return {
        ...section,
        items: activeItems
      };
    })
    .filter(section => section.items.length > 0);
}

/**
 * Checks if a given menu item matches the currently active filter context.
 */
export function isMenuItemSelected(item, currentContext) {
  if (!item || !item.filterContext || !currentContext) return false;

  const { typeFilter, subFilter, specFilter, statusFilter } = item.filterContext;

  // Status-only filter items (e.g. Launched, In study, Obsolete)
  if (statusFilter !== undefined && typeFilter === undefined) {
    return currentContext.statusFilter === statusFilter;
  }

  // Exact typeFilter match
  if (typeFilter !== undefined && typeFilter !== currentContext.typeFilter) {
    return false;
  }

  // Exact subFilter match
  if (subFilter !== undefined && subFilter !== currentContext.subFilter) {
    return false;
  }

  // If item represents parent category (subFilter is null), only match if current subFilter is also null
  if (subFilter === null && currentContext.subFilter !== null && currentContext.subFilter !== undefined) {
    return false;
  }

  // If specFilter specified, match it
  if (specFilter !== undefined && specFilter !== currentContext.specFilter) {
    return false;
  }

  return true;
}
