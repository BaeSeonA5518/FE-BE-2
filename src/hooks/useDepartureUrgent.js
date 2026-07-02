import { useEffect, useState } from 'react';
import { isDepartureUrgent } from '../utils/time';

/**
 * 기차 출발 시각까지 thresholdMin(기본 5분) 이하로 남으면 true.
 * 실시간 반영을 위해 주기적으로 재계산한다.
 */
export default function useDepartureUrgent(departureTime, thresholdMin = 5) {
  const [urgent, setUrgent] = useState(() => isDepartureUrgent(departureTime, thresholdMin));

  useEffect(() => {
    const update = () => setUrgent(isDepartureUrgent(departureTime, thresholdMin));

    update();
    const intervalId = setInterval(update, 15000);
    return () => clearInterval(intervalId);
  }, [departureTime, thresholdMin]);

  return urgent;
}
