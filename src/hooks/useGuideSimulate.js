import { useCallback, useEffect, useRef } from 'react';
import { fetchGuideSimulate } from '../api/tickets';
import useFlowStore from '../store/useFlowStore';
import { getBearing } from '../utils/geo';
import useDeviceOrientation from './useDeviceOrientation';

/** DEV: 틱마다 누적 걸음 증가량 */
const STEPS_PER_TICK = 5;
/** DEV: simulate 폴링 간격 */
const POLL_MS = 1500;
const STEP_LENGTH_M = 0.7;

/**
 * 경로 다음 노드 방향(방위각). 센서 heading이 없을 때 사용.
 */
function headingAlongRoute() {
  const { routeSteps, currentStepIndex, position } = useFlowStore.getState();
  if (!routeSteps.length) return 0;

  const idx = Math.min(currentStepIndex, routeSteps.length - 1);
  const cur = routeSteps[idx];
  const next = routeSteps[Math.min(idx + 1, routeSteps.length - 1)];

  const fromLat = position?.lat ?? cur?.lat;
  const fromLng = position?.lng ?? cur?.lng;
  if (fromLat == null || next?.lat == null) return 0;
  return getBearing(fromLat, fromLng, next.lat, next.lng);
}

/**
 * DEV용: guide/simulate로 S5 UI 구동 (걸음 누적 + 방위)
 * @param {{ enabled?: boolean, pollMs?: number, stepsPerTick?: number }} [options]
 */
function useGuideSimulate({
  enabled = true,
  pollMs = POLL_MS,
  stepsPerTick = STEPS_PER_TICK,
} = {}) {
  const arrivedRef = useRef(false);
  const stepsRef = useRef(0);
  const lastStepSeqRef = useRef(-1);
  const inFlightRef = useRef(false);
  const deviceHeadingRef = useRef(null);
  const timerRef = useRef(null);

  const applySimulateResult = useFlowStore((s) => s.applySimulateResult);
  const setStep = useFlowStore((s) => s.setStep);
  const setNavigation = useFlowStore((s) => s.setNavigation);
  const { startListening, stopListening } = useDeviceOrientation();

  const stopSimulate = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopListening();
    inFlightRef.current = false;
    setNavigation({ isTracking: false });
  }, [setNavigation, stopListening]);

  useEffect(() => {
    if (!enabled) return undefined;

    const { ticketInfo, fromNode, routeSteps } = useFlowStore.getState();
    const userId = Number(ticketInfo?.userId);
    if (!userId || userId <= 0) {
      console.warn('[simulate] userId 없음 — 시작 안 함');
      return undefined;
    }
    if (routeSteps.length === 0) return undefined;

    arrivedRef.current = false;
    stepsRef.current = 0;
    lastStepSeqRef.current = -1;
    deviceHeadingRef.current = null;
    setNavigation({ isTracking: true, distanceM: null, overshoot: false });

    startListening((heading) => {
      deviceHeadingRef.current = heading;
      setNavigation({ heading });
    });

    const finish = () => {
      if (arrivedRef.current) return;
      arrivedRef.current = true;
      stopSimulate();
      setStep('S5_1');
    };

    const tick = async () => {
      if (arrivedRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      stepsRef.current += stepsPerTick;
      const heading =
        deviceHeadingRef.current != null
          ? deviceHeadingRef.current
          : headingAlongRoute();

      try {
        const res = await fetchGuideSimulate(userId, {
          fromNode: fromNode || undefined,
          steps: stepsRef.current,
          heading,
          stepLength: STEP_LENGTH_M,
          lastStepSeq: lastStepSeqRef.current,
        });
        if (arrivedRef.current) return;

        console.log('[simulate]', {
          steps: res.steps,
          headingDeg: res.headingDeg,
          remainingAlongRouteM: res.remainingAlongRouteM,
          currentStepSeq: res.currentStepSeq,
          stepChanged: res.stepChanged,
          nearestNodeId: res.nearestNodeId,
          arrived: res.arrived,
          audioLen: res.stepChanged
            ? res.currentStep?.audioBase64?.length ?? 0
            : 0,
        });

        applySimulateResult(res);
        lastStepSeqRef.current = res.currentStepSeq;

        if (res.arrived) finish();
      } catch (err) {
        console.error('[simulate]', err);
      } finally {
        inFlightRef.current = false;
      }
    };

    console.log('[simulate] start', { userId, fromNode, pollMs, stepsPerTick });
    tick();
    timerRef.current = setInterval(tick, pollMs);

    return () => {
      if (timerRef.current != null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      stopListening();
    };
  }, [
    enabled,
    pollMs,
    stepsPerTick,
    applySimulateResult,
    setStep,
    setNavigation,
    startListening,
    stopListening,
    stopSimulate,
  ]);

  return { stopSimulate };
}

export default useGuideSimulate;
