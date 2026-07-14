import { useCallback, useEffect, useRef } from 'react';
import { openGuideWalkStream } from '../api/tickets';
import useFlowStore from '../store/useFlowStore';

/**
 * guide/walk/stream SSE로 S5 내비게이션 UI를 구동한다.
 * @param {{ enabled?: boolean, intervalMs?: number, jitterM?: number }} [options]
 */
function useWalkStream({
  enabled = true,
  intervalMs = 5000,
  jitterM = 1,
} = {}) {
  const esRef = useRef(null);
  const arrivedRef = useRef(false);

  const applyWalkStep = useFlowStore((s) => s.applyWalkStep);
  const setStep = useFlowStore((s) => s.setStep);
  const setNavigation = useFlowStore((s) => s.setNavigation);

  const stopStream = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setNavigation({ isTracking: false });
  }, [setNavigation]);

  useEffect(() => {
    if (!enabled) return undefined;

    const { ticketInfo, fromNode, routeSteps } = useFlowStore.getState();
    const userId = Number(ticketInfo?.userId);
    if (!userId || userId <= 0) {
      console.warn('[walk/stream] userId 없음 — 스트림 시작 안 함');
      return undefined;
    }
    if (routeSteps.length === 0) return undefined;

    arrivedRef.current = false;
    setNavigation({ isTracking: true, distanceM: null, overshoot: false });

    const finish = () => {
      if (arrivedRef.current) return;
      arrivedRef.current = true;
      esRef.current?.close();
      esRef.current = null;
      setNavigation({ isTracking: false });
      setStep('S5_1');
    };

    console.log('[walk/stream] start', { userId, fromNode, intervalMs, jitterM });

    esRef.current = openGuideWalkStream(userId, {
      fromNode: fromNode || undefined,
      intervalMs,
      jitterM,
      onStep: (step) => {
        if (arrivedRef.current) return;
        console.log('[walk/stream] step', {
          seq: step.seq,
          nodeId: step.nodeId,
          remainingAlongRouteM: step.remainingAlongRouteM,
          arrived: step.arrived,
          screenText: step.guide?.screenText,
          audioLen: step.guide?.audioBase64?.length ?? 0,
        });
        applyWalkStep(step);
        if (step.arrived) finish();
      },
      onDone: (data) => {
        console.log('[walk/stream] done', data);
        finish();
      },
      onInfo: (data) => {
        console.log('[walk/stream] info', data);
        stopStream();
      },
      onError: (err) => {
        console.error('[walk/stream] error', err);
      },
    });

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [
    enabled,
    intervalMs,
    jitterM,
    applyWalkStep,
    setStep,
    setNavigation,
    stopStream,
  ]);

  return { stopStream };
}

export default useWalkStream;
