import { useEffect, useState } from 'react';
import { normalizeAngle } from '../utils/geo';

function shortestDelta(from, to) {
  return normalizeAngle(to - from);
}

/** 목적지 각도에 화살표가 부드럽게 따라가도록 보간 */
export default function useFollowAngle(target = 0, { follow = 0.14 } = {}) {
  const [angle, setAngle] = useState(target);

  useEffect(() => {
    let raf;
    let active = true;

    const tick = () => {
      if (!active) return;

      setAngle((prev) => {
        const delta = shortestDelta(prev, target);
        if (Math.abs(delta) < 0.25) return target;
        raf = requestAnimationFrame(tick);
        return normalizeAngle(prev + delta * follow);
      });
    };

    raf = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [target, follow]);

  return angle;
}
