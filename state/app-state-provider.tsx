import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clearPathCache, clearTagCache } from '@/actions/cache';
import {
  createGeoLocationCookie,
  getGeoLocationCookie,
} from '@/actions/cookies';
import {
  getCachedLocationFromLatLong,
  getUserGeoFromHeaders,
} from '@/actions/geo';
import { getCachedUserProfileById } from '@/actions/user';
import { getUserProfilePermalink } from '@/features/experiences/utils/experience-utils';
import type { Session } from 'next-auth';
import { signIn, signOut } from 'next-auth/react';
import { useGeolocated } from 'react-geolocated';
import useSWR from 'swr';
import { useDebouncedCallback } from 'use-debounce';

import { getUserFromSession } from '@/lib/session';
import {
  getUsersFirstNameFromName,
  mapAppUserToClientFriendlyUser,
  mapDbUserToClientFriendlyUser,
} from '@/lib/user/user-utils';
// import { getPhotosHiddenMetaCachedAction } from '@/photo/actions';

import { useLocalStorage } from '@/hooks/use-local-storage';
import usePathnames from '@/hooks/use-pathnames';

import {
  AppStateContext,
  DEFAULT_USER_PROFILE_STATE,
  type ClearUserProfileCacheType,
} from './app-state';
import {
  APP_STATE_USER_PROFILE_KEY,
  APP_STATE_USER_SESSION_KEY,
} from './app-state-constants';

import type { UserAppGeo } from '@/types/geo';
import type { User, USER_PROFILE_MODEL } from '@/types/user';

export type AppStateProviderProps = {
  children: ReactNode;
  userSession?: Session['user'];
  userProfile?: USER_PROFILE_MODEL;
  userLocation?: string;
};

export default function AppStateProvider({
  children,
  userSession: userSessionProp,
  userProfile: userProfileProp,
  userLocation: userLocationProp = '',
}: AppStateProviderProps) {
  // console.log(`**** userSessionProp`, { userSessionProp });
  // const { currentPathname, previousPathname } = usePathnames();

  try {
    const router = useRouter();
    // CORE
    // const [swrTimestamp, setSwrTimestamp] = useState(Date.now());
    const [
      shouldRespondToKeyboardCommands,
      setShouldRespondToKeyboardCommands,
    ] = useState(true);
    const [isCommandKOpen, setIsCommandKOpen] = useState(false);

    // DEBUG
    const [shouldDebugImageFallbacks, setShouldDebugImageFallbacks] =
      useState(false);
    const [shouldShowBaselineGrid, setShouldShowBaselineGrid] = useState(false);

    const { currentPathname, isCurrentPathRouteReady } = usePathnames();

    // Readiness and loading states
    const [isMounted, setIsMounted] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // User Session and Profile
    const {
      data: userSession,
      mutate: mutateUserSession,
      isLoading: isUserSessionLoading,
    } = useSWR(
      isMounted && isCurrentPathRouteReady
        ? [currentPathname, APP_STATE_USER_SESSION_KEY]
        : null,
      (args) => {
        // console.log('**** userSessionProp', { args, userSessionProp });
        return getUserFromSession();
      },
      {
        suspense: false,
        fallbackData: userSessionProp,
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnMount: true,
        revalidateOnReconnect: false,
        refreshInterval: 0,
        shouldRetryOnError: false,
      }
    );

    const userSessionId = userSession?.id || '';

    const userProfileFallback = userProfileProp
      ? mapDbUserToClientFriendlyUser(userProfileProp)
      : userSessionProp
        ? mapAppUserToClientFriendlyUser(userSessionProp as User)
        : DEFAULT_USER_PROFILE_STATE;

    const invokeUserProfileReady =
      userSessionId && isMounted && isCurrentPathRouteReady;

    const {
      data: userProfile,
      mutate: mutateUserProfile,
      isLoading,
    } = useSWR(
      invokeUserProfileReady
        ? [APP_STATE_USER_PROFILE_KEY, userSessionId]
        : null,
      async (...args) => {
        const [_, userId] = args[0];
        // console.log('**** userProfileProp', { args, userProfileProp });
        return getCachedUserProfileById(String(userId));
      },
      {
        suspense: false,
        keepPreviousData: true,
        fallbackData: userProfileFallback,
        refreshInterval: 0, //60000,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnMount: true,
        revalidateOnReconnect: false,
        // shouldRetryOnError: false,
      }
    );

    // Values for User Session
    const isAuthenticated = Boolean(userSession);

    // Values for User Profile
    const activeUserId = userProfile?.id || userSessionId || '';
    const activeUsername = userProfile?.username || '';
    const profileUserDisplayName = userProfile?.name ?? userSession?.name ?? '';
    const profileUserFirstName = getUsersFirstNameFromName(
      profileUserDisplayName
    );
    const profileUserLastName = null;

    const profileUsername = userProfile?.username || '';
    const profilePermalink = profileUsername
      ? getUserProfilePermalink(profileUsername)
      : '';

    const profileUserAvatar =
      userProfile?.avatar ||
      userProfile?.image ||
      userSession?.avatar ||
      userSession?.image ||
      '';

    const isUserAllowed = Boolean(userProfile?.allowed);
    const isProfilePublic = Boolean(userProfile?.public);
    const isInPrivateBeta = Boolean(userProfile?.privateBeta);

    /**
     * User Geo Location
     *
     * @note - We lean on the user's precise location for a more personalized experience. If they have not allowed location access, we will fallback to headers.
     */
    const [isPreciseLocation, setIsPreciseLocation] = useState(false);
    const [userLocation, setUserLocation] = useLocalStorage(
      'user-location',
      userLocationProp
    );
    const [userLatitude, setUserLatitude] = useState('');
    const [userLongitude, setUserLongitude] = useState('');

    const debouncedOnGeoSuccess = useDebouncedCallback(
      async (geoPosition) => {
        // console.log('**** GEO API coords onSuccess', {
        //   geoPosition,
        // });
        if (!isCurrentPathRouteReady) {
          return;
        }

        setIsPreciseLocation(true);

        let lat = '';
        let long = '';
        if (geoPosition.coords.latitude) {
          lat = String(geoPosition.coords.latitude);
          setUserLatitude(String(geoPosition.coords.latitude));
        }
        if (geoPosition.coords.longitude) {
          long = String(geoPosition.coords.longitude);
          setUserLongitude(String(geoPosition.coords.longitude));
        }

        // Get the location from the lat and long
        if (lat && long) {
          const location = await getCachedLocationFromLatLong(
            lat,
            long
            // activeUserId
          );

          if (location) {
            setUserLocation(location);
            await handleSettingGeoUserLocationToCookies(location);
          }

          // Save the location to KV (as a lookup backup for the future)
          // await saveGeoLatLongLocation({
          //   lat,
          //   long,
          //   location,
          //   fixedLength: 3,
          // });
        }
      },
      2500,
      { leading: true, trailing: false }
    );

    // Establish User Geo Location
    const {
      coords,
      timestamp,
      isGeolocationAvailable,
      isGeolocationEnabled,
      positionError,
      getPosition: getGeoPosition,
    } = useGeolocated({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: Number.POSITIVE_INFINITY,
      },
      watchPosition: true,
      userDecisionTimeout: Number.POSITIVE_INFINITY,
      suppressLocationOnMount: true,
      // geolocationProvider: navigator.geolocation,
      isOptimisticGeolocationEnabled: true,
      watchLocationPermissionChange: false,
      onError: async (positionError) => {
        // console.error(`**** GEO API coords onError`, {
        //   positionError,
        // });
        setIsPreciseLocation(false);
        const { success, geo } = await getUserGeoFromHeaders();
        if (success && geo) {
          if (geo.city) setUserLocation(geo.city);
          if (geo.latitude) setUserLatitude(String(geo.latitude));
          if (geo.longitude) setUserLongitude(String(geo.longitude));
        }
      },
      // In case the user is moving around, we want to debounce the location update
      onSuccess: debouncedOnGeoSuccess,
    });
    // console.log(`**** coords and location`, { coords, userLocation });

    const handleGettingUserGeo = (): UserAppGeo => {
      return {
        coords,
        timestamp,
        location: userLocation,
        isGeolocationAvailable,
        isGeolocationEnabled,
        isPreciseLocation,
        positionError,
        getPosition: getGeoPosition,
      };
    };

    const handleSettingGeoUserLocationFromCookies = async () => {
      const userCookieLocation = await getGeoLocationCookie();
      if (userCookieLocation?.value) {
        setUserLocation(userCookieLocation.value);
      }
    };

    const handleSettingGeoUserLocationToCookies = async (
      value = userLocation
    ) => {
      if (userLocation) {
        await createGeoLocationCookie(value);
      }
    };

    // Handlers for User Session and Profile
    const handleClearingUserProfileCacheById = (userId?: string) => {
      // User ID
      const uid = activeUserId;
      if (uid) {
        clearTagCache(uid);
      }
    };

    const handleClearingUserProfileCacheByUsername = (username?: string) => {
      const profilePathKey = username ? username : activeUsername || '';
      if (profilePathKey) {
        const profilePath = getUserProfilePermalink(profilePathKey);
        clearPathCache(profilePath);
        router.refresh();
      }
    };

    const handleClearingCache = (type: ClearUserProfileCacheType = 'id') => {
      if (type === 'id') {
        handleClearingUserProfileCacheById();
      } else {
        handleClearingUserProfileCacheByUsername();
      }
    };

    const handleRefreshingUserSession = async () => {
      const session = await mutateUserSession();
      return session;
    };

    const handleRefreshingUserProfile = async () => {
      const userProfile = await mutateUserProfile();
      return userProfile;
    };

    const handleUpdatingAuthUserProfile = (
      payload: USER_PROFILE_MODEL,
      clearCache = false
    ) => {
      const scrubbedPayload = mapDbUserToClientFriendlyUser(payload);
      mutateUserProfile(scrubbedPayload, {
        optimisticData: scrubbedPayload,
      });

      if (clearCache) {
        const id = payload.id;
        const username = payload.username;
        const cacheType = username ? 'username' : id ? 'id' : '';
        if (cacheType) {
          handleClearingCache(cacheType);
        }
      }
    };

    const handleNavigateToUserProfile = (
      profilePath: string = profilePermalink
    ) => {
      if (profilePath) {
        router.push(profilePath);
      }
    };

    const handleSigningOut = async (redirectTo?: string) => {
      await mutateUserSession(undefined);
      await mutateUserProfile(undefined);
      await signOut({ redirectTo });
      await mutateUserSession(undefined);
      await mutateUserProfile(undefined);
      return true;
    };

    const handleSigningIn = async (...args: Parameters<typeof signIn>) => {
      await signIn(...args);
    };

    // Ensure the user session and profile are loaded
    useEffect(() => {
      if (isMounted) return;
      if (!isCurrentPathRouteReady) return;

      setIsMounted(true);
      // handleRefreshingUserSession();
      // handleRefreshingUserProfile();
      if (isReady) return;

      // Set the user location from cookies on mount
      // Main geo location hook will override this if it has a more precise location and the user has allowed it
      handleSettingGeoUserLocationFromCookies();

      setIsReady(true);
    }, [isMounted, isReady, isCurrentPathRouteReady]);

    // Prepare the context value
    const providerProps = useMemo<AppStateContext>(
      () => ({
        isReady,

        // User Session
        userSession,
        userId: activeUserId,

        // User Geo Location
        userLocation,
        userLatitude,
        userLongitude,
        isPreciseLocation,

        // Auth User
        userProfile,
        userProfileUsername: activeUsername,
        userDisplayName: profileUserDisplayName,
        userFirstName: profileUserFirstName,
        userLastName: profileUserLastName,
        userAvatar: profileUserAvatar,
        userProfilePermalink: profilePermalink,

        isUserAllowed,
        isAuthenticated,
        isProfilePublic,
        isInPrivateBeta,

        // Core Handlers
        // User Geo
        handleGettingUserGeo,

        // User Data
        handleRefreshingUserProfile,
        handleUpdatingAuthUser: handleUpdatingAuthUserProfile,
        handleClearingCacheById: handleClearingUserProfileCacheById,
        handleClearingCacheByUsername: handleClearingUserProfileCacheByUsername,
        handleClearingCache,

        // Navigation and Auth
        handleNavigateToUserProfile,
        handleSigningOut,
        handleSigningIn,

        // ADMIN

        // MISC
        // currentPathname,
        // previousPathname,
        // swrTimestamp,
        shouldRespondToKeyboardCommands,
        setShouldRespondToKeyboardCommands,
        isCommandKOpen,
        setIsCommandKOpen,

        // DEBUG
        shouldDebugImageFallbacks,
        setShouldDebugImageFallbacks,
        shouldShowBaselineGrid,
        setShouldShowBaselineGrid,
      }),
      [
        isReady,
        isUserAllowed,
        isAuthenticated,
        isProfilePublic,
        isInPrivateBeta,
        activeUserId,
        userSession,
        userProfile,
        userLocation,
      ]
    );

    // if (!isReady) {
    //   return null;
    // }

    return (
      <AppStateContext.Provider value={providerProps}>
        {children}
      </AppStateContext.Provider>
    );
  } catch (error) {
    console.error('AppStateProvider error:', error);
    return children;
  }
}
