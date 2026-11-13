import { useCallback, useEffect, useState } from 'react';

/*
 * Application areas (left navigation rail). Kept in one place so the rail,
 * header title and router agree.
 */
export const AREAS = [
  { id: 'catalog', label: 'Catalog', title: 'Live DNEXT Catalog', icon: 'globe', group: 'main' },
  { id: 'rules', label: 'Rule Engine', title: 'Rule Engine — Compatibility & Eligibility', icon: 'sliders', group: 'main' },
  { id: 'releases', label: 'Releases', title: 'Deployment Packages', icon: 'rocket', group: 'main' },
];

const DEFAULT_AREA = 'catalog';
const LEGACY_VIEW_KEY = 'dnext_active_view';
const LEGACY_MAP = { 'remote-catalog': 'catalog', deployment: 'releases' };

function readAreaFromHash() {
  const hashId = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  if (AREAS.some(a => a.id === hashId)) return hashId;

  const pathId = window.location.pathname.replace(/^\//, '').split('/')[0];
  if (AREAS.some(a => a.id === pathId)) return pathId;

  return null;
}

function initialArea() {
  const fromHash = readAreaFromHash();
  if (fromHash) return fromHash;
  const legacy = localStorage.getItem(LEGACY_VIEW_KEY);
  return LEGACY_MAP[legacy] || (AREAS.some(a => a.id === legacy) ? legacy : DEFAULT_AREA);
}

/* Minimal hash router: #/catalog, #/releases, ... (bookmarkable, back/forward aware). */
export function useAreaRoute() {
  const [area, setArea] = useState(initialArea);

  useEffect(() => {
    if (!readAreaFromHash()) window.history.replaceState(null, '', `#/${area}`);
    const onHash = () => {
      const next = readAreaFromHash();
      if (next) setArea(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(LEGACY_VIEW_KEY, area);
  }, [area]);

  const navigate = useCallback((id) => {
    if (window.location.hash !== `#/${id}`) window.location.hash = `/${id}`;
    setArea(id);
  }, []);

  return [area, navigate];
}
