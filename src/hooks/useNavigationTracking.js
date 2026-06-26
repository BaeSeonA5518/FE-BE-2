import { useCallback, useEffect, useRef } from 'react';
import useFlowStore from '../store/useFlowStore';
import { completeGuide } from '../api/guide';
import { DEFAULT_DESTINATION } from '../data/destination';
import {
  ARRIVAL_RADIUS_M,
  getArrowRotation,
  getBearing,
  getDistanceMeters,
} from '../utils/geo';
import useDeviceOrientation from './useDeviceOrientation';
import useGeolocation from './useGeolocation';

function vibrateOnArrival() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

function useNavigationTracking({ enabled = true, onArrived } = {}) {
  const hasArrivedRef = useRef(false);
  const { startWatch, stopWatch, error: geoWatchError } = useGeolocation();
  const { startListening, stopListening } = useDeviceOrientation();

  const reservationId = useFlowStore((s) => s.reservationId);
  const destination = useFlowStore((s) => s.destination);
  const mapInstance = useFlowStore((s) => s.mapInstance);
  const setNavigation = useFlowStore((s) => s.setNavigation);
  const setGeoError = useFlowStore((s) => s.setGeoError);
  const setStep = useFlowStore((s) => s.setStep);

  const dest = destination ?? DEFAULT_DESTINATION;

  const stopTrackingRef = useRef(() => {});

  const handlePositionUpdate = useCallback(
    (pos) => {
      if (hasArrivedRef.current) return;

      const distanceM = getDistanceMeters(pos.lat, pos.lng, dest.lat, dest.lng);
      const bearing = getBearing(pos.lat, pos.lng, dest.lat, dest.lng);
      const heading = useFlowStore.getState().heading;
      const destinationAngle = getArrowRotation(bearing, heading);

      setNavigation({
        position: pos,
        distanceM,
        bearing,
        destinationAngle,
      });

      mapInstance?.setMarkerPosition?.(pos.lat, pos.lng);
      mapInstance?.setMarkerRotation?.(heading);
      mapInstance?.panTo?.({ lat: pos.lat, lng: pos.lng });

      if (distanceM <= ARRIVAL_RADIUS_M) {
        hasArrivedRef.current = true;
        stopTrackingRef.current();

        vibrateOnArrival();

        if (reservationId) {
          completeGuide(reservationId).catch((err) => {
            console.error('[guide/complete]', err);
          });
        }

        onArrived?.();
        setStep('S5_1');
      }
    },
    [dest.lat, dest.lng, mapInstance, onArrived, reservationId, setNavigation, setStep]
  );

  const handleHeadingUpdate = useCallback(
    (heading) => {
      const { position, bearing: storedBearing } = useFlowStore.getState();
      const bearing =
        storedBearing ??
        (position ? getBearing(position.lat, position.lng, dest.lat, dest.lng) : null);
      const destinationAngle = bearing != null ? getArrowRotation(bearing, heading) : 0;

      setNavigation({ heading, bearing, destinationAngle });
      mapInstance?.setMarkerRotation?.(heading);
    },
    [dest.lat, dest.lng, mapInstance, setNavigation]
  );

  const startTracking = useCallback(() => {
    hasArrivedRef.current = false;
    setNavigation({
      position: null,
      distanceM: null,
      bearing: null,
      destinationAngle: 0,
      heading: 0,
      isTracking: true,
    });
    startWatch(handlePositionUpdate);
    startListening(handleHeadingUpdate);
  }, [handleHeadingUpdate, handlePositionUpdate, setNavigation, startListening, startWatch]);

  const stopTracking = useCallback(() => {
    stopWatch();
    stopListening();
    setNavigation({ isTracking: false });
  }, [setNavigation, stopListening, stopWatch]);

  stopTrackingRef.current = stopTracking;

  useEffect(() => {
    if (!enabled) return undefined;

    startTracking();
    return () => stopTracking();
  }, [enabled, startTracking, stopTracking]);

  useEffect(() => {
    setGeoError(geoWatchError);
  }, [geoWatchError, setGeoError]);

  return { startTracking, stopTracking, geoError: geoWatchError };
}

export default useNavigationTracking;
