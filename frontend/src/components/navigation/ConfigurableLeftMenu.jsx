import React, { useMemo } from 'react';
import Icon from '../ui/Icon';
import defaultMenuConfig from '../../config/leftMenuConfig.json';
import { getActiveMenuSections, isMenuItemSelected } from './leftMenuService';

function getCount(item, categoryCounts) {
  return item.countKey && categoryCounts[item.countKey] !== undefined
    ? categoryCounts[item.countKey]
    : null;
}

function formatCount(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value;
}

export default function ConfigurableLeftMenu({
  isOpen = true,
  onClose,
  currentContext,
  onSelectMenuItem,
  categoryCounts = {},
  expandedSections = new Set(),
  onToggleSection,
  config = defaultMenuConfig
}) {
  // Compute visible sections & items based on active/inactive flags
  const activeSections = useMemo(() => {
    return getActiveMenuSections(config);
  }, [config]);

  return (
    <aside className={`ds-nav${isOpen ? '' : ' is-collapsed'}`}>
      {/* Inner Fixed Width Wrapper so contents don't squish during transition */}
      <div className="ds-nav__inner">

        {/* Drawer Header */}
        <div className="ds-nav__header">
          <span className="ds-nav__title">Catalog Objects</span>
          <button
            type="button"
            onClick={onClose}
            className="ds-btn ds-btn--ghost ds-btn--icon"
            title="Collapse Sidebar"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
        </div>

        {/* Menu Content */}
        <div className="ds-nav__body">
          {activeSections.map(section => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="ds-nav__section-title">{section.title}</div>

              {/* Items List */}
              <div className="ds-nav__list">
                {section.items.map(item => {
                  const isSelected = isMenuItemSelected(item, currentContext);
                  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                  const isExpanded = expandedSections.has(item.id);
                  const countVal = getCount(item, categoryCounts);

                  return (
                    <div key={item.id}>
                      <div className={`ds-nav__row${isSelected ? ' is-active' : ''}`}>
                        <button
                          type="button"
                          onClick={() => onSelectMenuItem(item)}
                          className="ds-nav__item"
                        >
                          <Icon name={item.icon || 'file'} size={16} className="ds-nav__icon" />
                          <span className="ds-nav__label">{item.label}</span>
                          {countVal !== null && (
                            <span className="ds-nav__count">{formatCount(countVal)}</span>
                          )}
                        </button>

                        {/* Expand / Collapse arrow button for items with children */}
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => onToggleSection && onToggleSection(item.id)}
                            className={`ds-nav__toggle${isExpanded ? ' is-open' : ''}`}
                            title={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            aria-expanded={isExpanded}
                          >
                            <Icon name="chevronRight" size={14} />
                          </button>
                        )}
                      </div>

                      {/* Render active children if expanded */}
                      {hasChildren && isExpanded && (
                        <div className="ds-nav__children">
                          {item.children.map(child => {
                            const isChildSelected = isMenuItemSelected(child, currentContext);
                            const childCountVal = getCount(child, categoryCounts);

                            return (
                              <div key={child.id} className={`ds-nav__row${isChildSelected ? ' is-active' : ''}`}>
                                <button
                                  type="button"
                                  onClick={() => onSelectMenuItem(child)}
                                  className="ds-nav__item"
                                >
                                  {child.icon && <Icon name={child.icon} size={14} className="ds-nav__icon" />}
                                  <span className="ds-nav__label">{child.label}</span>
                                  {childCountVal !== null && (
                                    <span className="ds-nav__count">{formatCount(childCountVal)}</span>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
