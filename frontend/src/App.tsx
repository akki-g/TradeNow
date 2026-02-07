import { useCallback, useEffect, useState } from 'react';
import { DatabaseExplorerPage } from './pages/DatabaseExplorerPage';
import { TickerDashboardPage } from './pages/TickerDashboardPage';

type AppRoute = 'ticker' | 'database';

function getRouteFromPath(pathname: string): AppRoute {
  if (pathname.startsWith('/database')) {
    return 'database';
  }

  return 'ticker';
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = useCallback((nextRoute: AppRoute) => {
    const targetPath = nextRoute === 'database' ? '/database' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setRoute(nextRoute);
  }, []);

  if (route === 'database') {
    return (
      <DatabaseExplorerPage onOpenTickerDashboard={() => navigateTo('ticker')} />
    );
  }

  return <TickerDashboardPage onOpenDatabaseExplorer={() => navigateTo('database')} />;
}

export default App;
