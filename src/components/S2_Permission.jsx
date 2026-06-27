import { useState } from 'react';
import styled from 'styled-components';
import useFlowStore from '../store/useFlowStore';
import S1_Join from './S1_Join';
import PermissionModal from './common/PermissionModal';
import GeolocationDeniedModal from './common/GeolocationDeniedModal';
import { requestGeolocationPermission } from '../hooks/useGeolocation';
import {
  needsIOSOrientationPermission,
  requestOrientationPermission,
} from '../hooks/useDeviceOrientation';

const OverlayRoot = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const LOCATION_HINT = `iPhone: 주소창 왼쪽 aA → 웹사이트 설정 → 위치 → 허용
또는 설정 → Safari → 위치 → 허용

Android: 주소창 자물쇠 → 권한 → 위치 허용`;

const ORIENTATION_HINT = `iPhone: 설정 → Safari → 동작 및 방향 → 허용
또는 주소창 왼쪽 aA → 웹사이트 설정`;

const INAPP_HINT =
  '카카오톡 등 앱 안 브라우저에서는 권한이 동작하지 않을 수 있습니다. Safari·Chrome에서 직접 열어 주세요.';

function buildPermissionErrorMessage(geoError, orientError, orientGranted) {
  if (geoError && orientError) {
    return `${geoError.message}\n${orientError.message}\n\n${LOCATION_HINT}\n\n${ORIENTATION_HINT}\n\n${INAPP_HINT}`;
  }

  if (geoError && orientGranted) {
    return `방향 센서는 허용되었습니다.\n${geoError.message}\n\n위치 권한만 추가로 허용해 주세요.\n\n${LOCATION_HINT}\n\n${INAPP_HINT}`;
  }

  if (geoError) {
    return `${geoError.message}\n\n${LOCATION_HINT}\n\n${INAPP_HINT}`;
  }

  if (orientError) {
    return `${orientError.message}\n\n${ORIENTATION_HINT}\n\n${INAPP_HINT}`;
  }

  return `권한을 확인하지 못했습니다.\n\n${LOCATION_HINT}\n\n${INAPP_HINT}`;
}

/** iOS는 방향 → 위치 순서. 그 외는 동시 요청 후 모두 완료될 때까지 대기 */
async function requestAllPermissions() {
  if (needsIOSOrientationPermission()) {
    try {
      await requestOrientationPermission();
    } catch (orientError) {
      throw new Error(buildPermissionErrorMessage(null, orientError, false));
    }

    try {
      await requestGeolocationPermission();
    } catch (geoError) {
      throw new Error(buildPermissionErrorMessage(geoError, null, true));
    }
    return;
  }

  const [geoResult, orientResult] = await Promise.allSettled([
    requestGeolocationPermission(),
    requestOrientationPermission(),
  ]);

  const geoError = geoResult.status === 'rejected' ? geoResult.reason : null;
  const orientError = orientResult.status === 'rejected' ? orientResult.reason : null;

  if (geoError || orientError) {
    const orientGranted = !orientError;
    throw new Error(buildPermissionErrorMessage(geoError, orientError, orientGranted));
  }
}

function S2_Permission() {
  const { setStep, mapInstance } = useFlowStore();
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handlePermissionSuccess = () => {
    if (mapInstance) {
      mapInstance.panTo({ lat: 37.1282075, lng: 128.2052678 });
    }
    setIsRequesting(false);
    setErrorMessage(null);
    setStep('S3');
  };

  const handleRequestPermissions = () => {
    if (isRequesting) return;

    setIsRequesting(true);
    setErrorMessage(null);

    requestAllPermissions()
      .then(() => handlePermissionSuccess())
      .catch((error) => {
        console.error('권한 요청 실패', error);
        setIsRequesting(false);
        setErrorMessage(error?.message || '위치 정보를 가져오지 못했습니다.');
      });
  };

  const isIOS = needsIOSOrientationPermission();

  return (
    <OverlayRoot>
      <S1_Join dimmed />
      <PermissionModal
        isRequesting={isRequesting}
        isIOS={isIOS}
        onAllow={handleRequestPermissions}
        onDeny={() => setStep('E1')}
      />
      {errorMessage && (
        <GeolocationDeniedModal
          message={errorMessage}
          onRetry={() => {
            setErrorMessage(null);
            handleRequestPermissions();
          }}
          onFallback={() => setStep('E1')}
        />
      )}
    </OverlayRoot>
  );
}

export default S2_Permission;
