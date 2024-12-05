import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const usePathnames = () => {
  // const router = useRouter();
  const pathname = usePathname();

  const currentRef = useRef<string>();
  const previousRef = useRef<string>();

  // Store the previous and current pathname
  useEffect(() => {
    previousRef.current = currentRef.current;
    currentRef.current = pathname;
  }, [pathname]);

  const isCurrentPathRouteReady = currentRef.current
    ? currentRef.current !== previousRef.current
    : false;

  // Log the router change events
  // useEffect(() => {
  //   const startHandler = () => {
  //     console.log('Router change started');
  //   };

  //   const completeHandler = () => {
  //     console.log('Router change completed');
  //   };

  //   router..on('routeChangeStart', startHandler);

  //   router.events.on('routeChangeComplete', completeHandler);

  //   return () => {
  //     router.events.off('routeChangeStart', startHandler);
  //     router.events.off('routeChangeComplete', completeHandler);
  //   };
  // }, []);

  return {
    isCurrentPathRouteReady,
    currentPathname: currentRef.current,
    previousPathname: previousRef.current,
  };
};

export default usePathnames;
