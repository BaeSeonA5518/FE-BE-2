import styled from 'styled-components';
import useFlowStore from '../store/useFlowStore';
import S1_Join from './S1_Join';
import PermissionModal from './common/PermissionModal';
import { requestGeolocationPermission } from '../hooks/useGeolocation';
import { requestOrientationPermission } from '../hooks/useDeviceOrientation';

const OverlayRoot = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

function S2_Permission() {
  const { setStep, mapInstance } = useFlowStore();

  const handlePermissionSuccess = () => {
    if (mapInstance) {
      mapInstance.panTo({ lat: 37.1282075, lng: 128.2052678 });
    }
    setStep('S3');
  };

  const handleRequestPermissions = async () => {
    try {
      await requestGeolocationPermission();
      await requestOrientationPermission();
      handlePermissionSuccess();
    } catch (error) {
      console.error('권한 요청 실패', error);
      setStep('E1');
    }
  };

  return (
    <OverlayRoot>
      <S1_Join dimmed />
      <PermissionModal
        onAllow={handleRequestPermissions}
        onDeny={() => setStep('E1')}
      />
    </OverlayRoot>
  );
}

export default S2_Permission;
