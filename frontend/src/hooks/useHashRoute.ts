import { useEffect, useState } from 'react';
import type { RouteId } from '../types/domain';

const routes = new Set<RouteId>([
  'projects', 'dashboard', 'operations', 'warroom', 'settings', 'conflicts', 'budget', 'finance',
  'tasks', 'guests', 'seating', 'vendors', 'timeline', 'invitations', 'attachments',
  'risks', 'materials'
]);

const read = (): RouteId => {
  const value = location.hash.replace(/^#\/?/, '') as RouteId;
  return routes.has(value) ? value : 'dashboard';
};

export function useHashRoute() {
  const [route, setRoute] = useState<RouteId>(read);
  useEffect(() => {
    const handleHashChange = () => setRoute(read());
    addEventListener('hashchange', handleHashChange);
    return () => removeEventListener('hashchange', handleHashChange);
  }, []);
  return [route, (value: RouteId) => {
    location.hash = `/${value}`;
    setRoute(value);
  }] as const;
}
