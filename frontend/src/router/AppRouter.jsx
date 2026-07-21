import { lazy, useEffect } from 'react';

import {} from 'react-router-dom';
import {} from 'react-router-dom';
import { Navigate, useLocation, useRoutes } from 'react-router-dom';
import { useAppContext } from '@/context/appContext';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';

import routes from './routes';

export default function AppRouter() {
  let location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { app } = appContextAction;
  const currentAdmin = useSelector(selectCurrentAdmin);
  const allowedModules = currentAdmin?.permissionModules || [];

  const routesList = [];

  Object.entries(routes).forEach(([key, value]) => {
    routesList.push(...value);
  });

  function getAppNameByPath(path) {
    for (let key in routes) {
      for (let i = 0; i < routes[key].length; i++) {
        if (routes[key][i].path === path) {
          return key;
        }
      }
    }
    // Return 'default' app  if the path is not found
    return 'default';
  }

  function getModuleByPath(path) {
    const routeModuleMap = [
      { prefix: '/customer', module: 'customers' },
      { prefix: '/invoice', module: 'invoices' },
      { prefix: '/quote', module: 'quotes' },
      { prefix: '/payment/mode', module: 'paymentModes' },
      { prefix: '/payment', module: 'payments' },
      { prefix: '/attendance', module: 'attendance' },
      { prefix: '/taxes', module: 'taxes' },
      { prefix: '/enquiry', module: 'enquiries' },
      { prefix: '/settings', module: 'settings' },
      { prefix: '/employees', module: 'employees' },
      { prefix: '/about', module: 'about' },
      { prefix: '/profile', module: 'profile' },
    ];

    const matchedRoute = routeModuleMap.find(({ prefix }) => path.startsWith(prefix));
    if (matchedRoute) return matchedRoute.module;
    return 'dashboard';
  }

  function getFallbackPath() {
    const moduleRouteMap = {
      dashboard: '/',
      customers: '/customer',
      invoices: '/invoice',
      quotes: '/quote',
      payments: '/payment',
      attendance: '/attendance',
      paymentModes: '/payment/mode',
      taxes: '/taxes',
      enquiries: '/enquiry',
      settings: '/settings',
      employees: '/employees',
      profile: '/profile',
      about: '/about',
    };

    const firstAllowedModule =
      allowedModules.find((moduleKey) => moduleRouteMap[moduleKey]) || 'dashboard';

    return moduleRouteMap[firstAllowedModule] || '/';
  }

  const canAccessModule = (moduleKey) =>
    moduleKey === 'profile' || allowedModules.length === 0 || allowedModules.includes(moduleKey);

  useEffect(() => {
    if (location.pathname === '/') {
      app.default();
    } else {
      const path = getAppNameByPath(location.pathname);
      app.open(path);
    }
  }, [location]);

  let element = useRoutes(routesList);

  const requiredModule = getModuleByPath(location.pathname);
  if (!canAccessModule(requiredModule) && location.pathname !== '/logout') {
    return <Navigate to={getFallbackPath()} replace />;
  }

  return element;
}
