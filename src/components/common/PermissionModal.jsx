import styled from 'styled-components';
import { colors, typography } from '../../styles/theme';

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 20;
`;

const ModalLayer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 42px;
  z-index: 30;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

const Modal = styled.div`
  width: 100%;
  max-width: 320px;
  background: ${colors.white};
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
`;

const ModalHeader = styled.div`
  padding: 22px 20px 12px;
  text-align: center;
`;

const ModalTitle = styled.h2`
  font-family: ${typography.fontFamily};
  font-size: 19px;
  font-weight: 700;
  line-height: 1.5;
  color: ${colors.black};
  letter-spacing: -0.3px;
  white-space: pre-line;
  word-break: keep-all;
`;

const ModalBodyWrap = styled.div`
  padding: 0 16px 16px;
`;

const ModalBodyBox = styled.div`
  background: #E8F1FF;
  border: 1.5px solid rgba(40, 110, 240, 0.25);
  border-radius: 10px;
  padding: 16px 14px;
`;

const ModalBody = styled.p`
  font-family: ${typography.fontFamily};
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
  color: ${colors.gray};
  text-align: center;
  white-space: pre-line;
  word-break: keep-all;
`;

const ActionList = styled.div`
  border-top: 1px solid #E5E5EA;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 18px 16px;
  border: none;
  background: none;
  font-family: ${typography.fontFamily};
  font-size: ${typography.buttonSize};
  font-weight: 600;
  line-height: ${typography.lineHeight};
  color: ${({ $primary }) => ($primary ? colors.primary : colors.black)};
  cursor: pointer;
  border-top: ${({ $divider }) => ($divider ? '1px solid #E5E5EA' : 'none')};
  letter-spacing: -0.2px;

  &:active {
    background: #F2F2F7;
  }
`;

function PermissionModal({ onAllow, onDeny, isRequesting = false, isIOS = false }) {
  const requestingBody = isIOS
    ? `1. 동작 및 방향 → 허용
2. 이어서 위치 → 허용

두 팝업이 순서대로
나타납니다.`
    : `브라우저 팝업에서
위치·방향 센서 허용을
선택해 주세요.`;

  return (
    <>
      <Backdrop aria-hidden="true" />
      <ModalLayer role="dialog" aria-modal="true" aria-labelledby="permission-title">
        <Modal>
          <ModalHeader>
            <ModalTitle id="permission-title">
              {isRequesting
                ? '권한을 확인하고 있어요'
                : `현재 정확한 위치를\n공유하시겠습니까?`}
            </ModalTitle>
          </ModalHeader>
          <ModalBodyWrap>
            <ModalBodyBox>
              <ModalBody>
                {isRequesting
                  ? requestingBody
                  : `안전하고 정확한 승강장
길찾기 안내를 위해
위치 정보 및 기기 방향
센서 허용이 필요합니다.`}
              </ModalBody>
            </ModalBodyBox>
          </ModalBodyWrap>
          <ActionList>
            <ActionButton
              type="button"
              $primary
              onClick={onAllow}
              disabled={isRequesting}
              style={{ opacity: isRequesting ? 0.55 : 1, cursor: isRequesting ? 'wait' : 'pointer' }}
            >
              {isRequesting ? '확인 중…' : '위치 허용'}
            </ActionButton>
            <ActionButton type="button" $divider onClick={onDeny} disabled={isRequesting}>
              허용 안함
            </ActionButton>
          </ActionList>
        </Modal>
      </ModalLayer>
    </>
  );
}

export default PermissionModal;
