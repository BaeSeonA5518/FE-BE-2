import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeAngle } from '../utils/geo';

/** iOS Safari 나침반 각도 보정 */
export function getDeviceHeading(event) {
  if (event.webkitCompassHeading != null && !Number.isNaN(event.webkitCompassHeading)) {
    return normalizeAngle(event.webkitCompassHeading);
  }
  if (event.alpha != null && !Number.isNaN(event.alpha)) {
    return normalizeAngle(360 - event.alpha);
  }
  return null;
}

/** iOS 13+ 방향 센서 권한 */
export async function requestOrientationPermission() {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    const state = await DeviceOrientationEvent.requestPermission();
    if (state !== 'granted') {
      throw new Error('방향 센서 권한이 거부되었습니다.');
    }
    return true;
  }
  return true;
}

function useDeviceOrientation() {
  const [heading, setHeading] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const handlerRef = useRef(null);

  const stopListening = useCallback(() => {
    if (handlerRef.current) {
      window.removeEventListener('deviceorientation', handlerRef.current, true);
      handlerRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onUpdate) => {
      stopListening();

      const handler = (event) => {
        const next = getDeviceHeading(event);
        if (next == null) return;
        setHeading(next);
        onUpdate?.(next);
      };

      handlerRef.current = handler;
      window.addEventListener('deviceorientation', handler, true);
      setIsListening(true);
    },
    [stopListening]
  );

  useEffect(() => () => stopListening(), [stopListening]);

  return {
    heading,
    isListening,
    startListening,
    stopListening,
    requestPermission: requestOrientationPermission,
  };
}

export default useDeviceOrientation;
