import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';

export type Route = '/' | '/register' | '/review' | '/confirmation' | '/privacy' | '/help';

const ROUTES: Route[] = ['/', '/register', '/review', '/confirmation', '/privacy', '/help'];

const normalise = (pathname: string): Route => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean.startsWith('/confirmation')) return '/confirmation';
  return (ROUTES.find((route) => route === clean) ?? '/') as Route;
};

interface RouterValue {
  route: Route;
  navigate: (to: Route, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue>({ route: '/', navigate: () => {} });

export const RouterProvider = ({ children }: { children: ReactNode }) => {
  const [route, setRoute] = useState<Route>(() => normalise(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(normalise(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback<RouterValue['navigate']>((to, options) => {
    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setRoute(to);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const value = useMemo(() => ({ route, navigate }), [route, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const useRouter = (): RouterValue => useContext(RouterContext);

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: Route };

/** An ordinary anchor that upgrades to a client-side transition on plain clicks. */
export const Link = ({ to, onClick, children, ...rest }: LinkProps) => {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
};
