import styled from 'styled-components';
import useFlowStore from '../store/useFlowStore';
import { defaultTicket } from '../data/defaultTicket';
import { colors, typography } from '../styles/theme';

const PhoneFrame = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  background-color: ${colors.white};
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${colors.black};
  font-family: ${typography.fontFamily};
`;

function CellularSignalIcon() {
  const bars = [3, 5, 7, 9, 11];

  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden>
      {bars.map((height, index) => (
        <rect
          key={index}
          x={index * 4.5}
          y={14 - height}
          width="3"
          height={height}
          rx="0.75"
          fill={colors.black}
        />
      ))}
    </svg>
  );
}

const NavBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 12px;
  border-bottom: 1px solid ${colors.border};
  position: relative;
`;

const BackArrow = styled.span`
  position: absolute;
  left: 16px;
  font-size: 22px;
  color: ${colors.primary};
`;

const SenderInfo = styled.div`
  text-align: center;
`;

const SenderAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #D1D5DB;
  margin: 0 auto 4px;
`;

const SenderName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.gray};
  font-family: ${typography.fontFamily};
`;

const MessageArea = styled.div`
  flex: 1;
  padding: 16px;
  background-color: ${colors.white};
`;

const MessageBubble = styled.div`
  max-width: 88%;
  background-color: #E9E9EB;
  border-radius: 18px;
  padding: 12px 16px;
  font-family: ${typography.fontFamily};
  font-size: 15px;
  line-height: 1.55;
  color: ${colors.black};
  text-align: left;
`;

const MessageLabel = styled.p`
  font-size: 12px;
  color: ${colors.gray};
  margin-bottom: 6px;
`;

const MessageTitle = styled.strong`
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
`;

const MessageRoute = styled.p`
  margin: 4px 0;
`;

const MessageLink = styled.button`
  display: inline;
  background: none;
  border: none;
  padding: 0;
  margin-top: 10px;
  font-family: ${typography.fontFamily};
  font-size: 15px;
  font-weight: 500;
  color: ${colors.primary};
  text-decoration: underline;
  cursor: pointer;
  text-align: left;
`;


function SMS_Entry() {
  const { setStep, setReservation } = useFlowStore();

  const handleStartService = () => {
    setReservation('mock-reservation-001', defaultTicket);
    setStep('S1');
  };

  return (
    <PhoneFrame>
      <StatusBar>
        <span>7:10</span>
        <CellularSignalIcon />
      </StatusBar>

      <NavBar>
        <BackArrow>‹</BackArrow>
        <SenderInfo>
          <SenderAvatar />
          <SenderName>코레일 한국철도 ›</SenderName>
        </SenderInfo>
      </NavBar>

      <MessageArea>
        <MessageBubble>
          <MessageLabel>[Web발신]</MessageLabel>
          <MessageTitle>코레일 동행안내</MessageTitle>
          <MessageRoute>(서울역▶ 제천역)</MessageRoute>
          <MessageRoute>[KTX 1063]</MessageRoute>
          <MessageRoute>출발시간: 7시 25분</MessageRoute>
          <p style={{ marginTop: 8 }}>
            안녕하세요.
            <br />
            예매하신 열차 출발 15분 전입니다.
            <br />
            현재 위치를 확인하여 탑승 승강장까지 안내해 드립니다.
          </p>
          <p style={{ marginTop: 8 }}>▶ 승강장 안내 서비스 시작하기</p>
          <MessageLink type="button" onClick={handleStartService}>
            https://info.korail.com/info/index.do
          </MessageLink>
        </MessageBubble>
      </MessageArea>
    </PhoneFrame>
  );
}

export default SMS_Entry;
