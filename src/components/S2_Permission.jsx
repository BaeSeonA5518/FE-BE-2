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

const SAFARI_LOCATION_RESET = `Safari에 '거부'가 저장되어 있으면
팝업 없이 계속 실패합니다.

① 주소창 왼쪽 aA → 웹사이트 설정
② 위치 → '허용' 또는 '묻기'
③ 페이지 새로고침 후 '위치 허용' 다시 누르기`;

const INAPP_HINT =
  '카카오톡 등 앱 안 브라우저에서는 위치 권한이 동작하지 않을 수 있습니다. Safari에서 직접 열어 주세요.';

function S2_Permission() {
  const { setStep, mapInstance } = useFlowStore();
  const isIOS = needsIOSOrientationPermission();
  const [orientationGranted, setOrientationGranted] = useState(!isIOS);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handlePermissionSuccess = () => {
    if (mapInstance) {
      mapInstance.panTo({ lat: 37.1282075, lng: 128.2052678 });
    }
    setIsRequesting(false);
    setOrientationGranted(!isIOS);
    setErrorMessage(null);
    setStep('S3');
  };

  const handleLocationRequest = () => {
    setIsRequesting(true);
    setErrorMessage(null);

    requestGeolocationPermission()
      .then(() => handlePermissionSuccess())
      .catch((error) => {
        console.error('위치 권한 실패', error);
        setIsRequesting(false);
        setErrorMessage(
          isIOS
            ? `방향 센서는 허용되었습니다.\n${error.message}\n\n아래 설정에서 위치를 '허용'으로 바꾼 뒤\n「위치 허용」을 다시 눌러 주세요.\n\n${SAFARI_LOCATION_RESET}\n\n${INAPP_HINT}`
            : `${error.message}\n\n${SAFARI_LOCATION_RESET}\n\n${INAPP_HINT}`
        );
      });
  };

  const handleOrientationRequest = () => {
    setIsRequesting(true);
    setErrorMessage(null);

    requestOrientationPermission()
      .then(() => {
        setOrientationGranted(true);
        // 방향 센서 허용 후 자동으로 위치 권한도 연달아 요청
        return requestGeolocationPermission();
      })
      .then(() => handlePermissionSuccess())
      .catch((error) => {
        console.error('권한 요청 실패', error);
        setIsRequesting(false);
        setErrorMessage(`${error.message}\n\n${INAPP_HINT}`);
      });
  };

  const handleAndroidPermissions = () => {
    setIsRequesting(true);
    setErrorMessage(null);

    const geoPromise = requestGeolocationPermission();
    const orientPromise = requestOrientationPermission();

    Promise.allSettled([geoPromise, orientPromise]).then(([geoResult, orientResult]) => {
      const geoError = geoResult.status === 'rejected' ? geoResult.reason : null;
      const orientError = orientResult.status === 'rejected' ? orientResult.reason : null;

      if (!geoError && !orientError) {
        handlePermissionSuccess();
        return;
      }

      setIsRequesting(false);
      const parts = [geoError?.message, orientError?.message].filter(Boolean);
      setErrorMessage(`${parts.join('\n')}\n\n${SAFARI_LOCATION_RESET}\n\n${INAPP_HINT}`);
    });
  };

  const handleAllow = () => {
    if (isRequesting) return;

    if (isIOS) {
      if (!orientationGranted) {
        handleOrientationRequest();
        return;
      }
      handleLocationRequest();
      return;
    }

    handleAndroidPermissions();
  };

  return (
    <OverlayRoot>
      <S1_Join dimmed />
      <PermissionModal
        isRequesting={isRequesting}
        onAllow={handleAllow}
        onDeny={() => setStep('E1')}
      />
      {errorMessage && (
        <GeolocationDeniedModal
          message={errorMessage}
          onRetry={() => {
            setErrorMessage(null);
            handleAllow();
          }}
          onFallback={() => setStep('E1')}
        />
      )}
    </OverlayRoot>
  );
}

export default S2_Permission;
