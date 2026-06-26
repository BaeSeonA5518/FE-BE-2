const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/** Haversine — 두 GPS 좌표 간 거리(m) */
export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 목적지 방위각(0°=북, 시계방향) */
export function getBearing(lat1, lng1, lat2, lng2) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeAngle(toDeg(Math.atan2(y, x)));
}

export function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

/** 화살표 회전각 = 목적지 방위각 - 기기 heading */
export function getArrowRotation(bearing, heading) {
  return normalizeAngle(bearing - heading);
}

/** 나침반 링 위 목적지 점 좌표 (0°=위, 시계방향) */
export function getCompassDotPosition(cx, cy, radius, angleDeg, dotWidth, dotHeight) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = cx + radius * Math.sin(rad);
  const y = cy - radius * Math.cos(rad);
  return {
    left: x - dotWidth / 2,
    top: y - dotHeight / 2,
  };
}

export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

export const ARRIVAL_RADIUS_M = 3;

/** S5 UI용 거리 표시 — 역 안내는 m, 먼 경우 km */
export function formatGuideDistance(distanceM) {
  if (distanceM == null || Number.isNaN(distanceM)) {
    return { value: '…', unit: 'm', fontSize: 48, isReady: false };
  }

  const safe = Math.max(0, distanceM);

  if (safe >= 1000) {
    const km = safe / 1000;
    const value = km >= 100 ? String(Math.round(km)) : km.toFixed(1).replace(/\.0$/, '');
    return { value, unit: 'km', fontSize: value.length > 3 ? 36 : 42, isReady: true };
  }

  const meters = Math.round(safe);
  const value = String(meters);
  let fontSize = 48;
  if (value.length >= 3) fontSize = 40;
  if (value.length >= 4) fontSize = 32;

  return { value, unit: 'm', fontSize, isReady: true };
}

/** 거리에 따른 안내 문구 */
export function getGuideMessage(distanceM, fallback) {
  if (distanceM == null) return '현재 위치를 확인하고 있어요.';
  if (distanceM <= 15) return fallback ?? '에스컬레이터를 타고\n앞으로 직진하세요.';
  if (distanceM <= 80) return '안내 방향으로\n계속 이동하세요.';
  return '목적지 방향으로\n이동해 주세요.';
}

export function getGeolocationErrorMessage(code) {
  switch (code) {
    case 1:
      return '위치 권한이 거부되었습니다.';
    case 2:
      return '위치 정보를 사용할 수 없습니다.';
    case 3:
      return '위치 요청 시간이 초과되었습니다.';
    default:
      return '위치 정보를 가져오지 못했습니다.';
  }
}
