import { useCallback, useEffect, useRef } from 'react';
import useFlowStore from '../store/useFlowStore';
import {
  ARRIVAL_RADIUS_M,
  getArrowRotation,
  getBearing,
  getDistanceMeters,
  OVERSHOOT_THRESHOLD_M,
  STEP_ARRIVAL_RADIUS_M,
} from '../utils/geo';
import useDeviceOrientation from './useDeviceOrientation';
import useGeolocation from './useGeolocation';

function useNavigationTracking({ enabled = true, onArrived } = {}) {
  const hasArrivedRef = useRef(false);
  const minDistanceRef = useRef(Infinity);
  const { startWatch, stopWatch, error: geoWatchError } = useGeolocation();
  const { startListening, stopListening } = useDeviceOrientation();

  const mapInstance = useFlowStore((s) => s.mapInstance);
  const setNavigation = useFlowStore((s) => s.setNavigation);
  const setGeoError = useFlowStore((s) => s.setGeoError);
  const setStep = useFlowStore((s) => s.setStep);
  const advanceStep = useFlowStore((s) => s.advanceStep);

  const stopTrackingRef = useRef(() => {});

  const handlePositionUpdate = useCallback(
    (pos) => {
      if (hasArrivedRef.current) return;

      const { destination: dest, routeSteps: steps, currentStepIndex: stepIndex } =
        useFlowStore.getState();

      if (!dest?.lat || !dest?.lng) return;

      const isLastStep = stepIndex >= steps.length - 1;
      const arrivalRadius = isLastStep ? ARRIVAL_RADIUS_M : STEP_ARRIVAL_RADIUS_M;

      const distanceM = getDistanceMeters(pos.lat, pos.lng, dest.lat, dest.lng);
      const bearing = getBearing(pos.lat, pos.lng, dest.lat, dest.lng);
      const heading = useFlowStore.getState().heading;
      const destinationAngle = getArrowRotation(bearing, heading);

      // 마지막 노드 지나침 감지: 최소 도달 거리보다 OVERSHOOT_THRESHOLD_M 이상 멀어지면 overshoot
      if (isLastStep && distanceM < minDistanceRef.current) {
        minDistanceRef.current = distanceM;
      }
      const isOvershoot =
        isLastStep &&
        !hasArrivedRef.current &&
        minDistanceRef.current < OVERSHOOT_THRESHOLD_M &&
        distanceM > minDistanceRef.current + OVERSHOOT_THRESHOLD_M;

      setNavigation({
        position: pos,
        distanceM,
        bearing,
        destinationAngle,
        overshoot: isOvershoot,
      });

      mapInstance?.setMarkerPosition?.(pos.lat, pos.lng);
      mapInstance?.setMarkerRotation?.(heading);
      mapInstance?.panTo?.({ lat: pos.lat, lng: pos.lng });

      if (distanceM > arrivalRadius) return;

      if (!isLastStep) {
        advanceStep();
        return;
      }

      hasArrivedRef.current = true;
      stopTrackingRef.current();
      onArrived?.();
      setStep('S5_1');
    },
    [advanceStep, mapInstance, onArrived, setNavigation, setStep]
  );

  const handleHeadingUpdate = useCallback(
    (heading) => {
      const { position, bearing: storedBearing, destination: dest } = useFlowStore.getState();
      if (!dest?.lat || !dest?.lng) return;

      const bearing =
        storedBearing ??
        (position ? getBearing(position.lat, position.lng, dest.lat, dest.lng) : null);
      const destinationAngle = bearing != null ? getArrowRotation(bearing, heading) : 0;

      setNavigation({ heading, bearing, destinationAngle });
      mapInstance?.setMarkerRotation?.(heading);
    },
    [mapInstance, setNavigation]
  );

  const startTracking = useCallback(() => {
    hasArrivedRef.current = false;
    minDistanceRef.current = Infinity;
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

    const { routeSteps: steps } = useFlowStore.getState();
    if (steps.length === 0) return undefined;

    startTracking();
    return () => stopTracking();
  }, [enabled, startTracking, stopTracking]);

  useEffect(() => {
    setGeoError(geoWatchError);
  }, [geoWatchError, setGeoError]);

  return { startTracking, stopTracking, geoError: geoWatchError };
}

export default useNavigationTracking;
