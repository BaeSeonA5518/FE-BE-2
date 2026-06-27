import { useState } from 'react';
import styled from 'styled-components';
import useFlowStore from '../store/useFlowStore';
import S1_Join from './S1_Join';
import PermissionModal from './common/PermissionModal';
import GeolocationDeniedModal from './common/GeolocationDeniedModal';
import { requestGeolocationPermission } from '../hooks/useGeolocation';
import { requestOrientationPermission } from '../hooks/useDeviceOrientation';

const OverlayRoot = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const PERMISSION_DENIED_HINT = `정확한 승강장 안내를 위해 위치·방향 센서 접근이 필요합니다.

iPhone: 설정 → Safari → 위치 → 허용
또는 주소창 왼쪽 aA → 웹사이트 설정 → 위치 허용

Android: 주소창 자물쇠 → 권한 → 위치 허용

카카오톡 등 앱 안 브라우저에서는 권한이 동작하지 않을 수 있습니다. Safari·Chrome에서 직접 열어 주세요.`;

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

    // iOS: 사용자 탭 직후 동시에 호출해야 방향 센서 권한이 유효함
    const geoPromise = requestGeolocationPermission();
    const orientPromise = requestOrientationPermission();

    Promise.all([geoPromise, orientPromise])
      .then(() => handlePermissionSuccess())
      .catch((error) => {
        console.error('권한 요청 실패', error);
        setIsRequesting(false);
        setErrorMessage(error?.message || '위치 정보를 가져오지 못했습니다.');
      });
  };

  return (
    <OverlayRoot>
      <S1_Join dimmed />
      <PermissionModal
        isRequesting={isRequesting}
        onAllow={handleRequestPermissions}
        onDeny={() => setStep('E1')}
      />
      {errorMessage && (
        <GeolocationDeniedModal
          message={`${errorMessage}\n\n${PERMISSION_DENIED_HINT}`}
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
