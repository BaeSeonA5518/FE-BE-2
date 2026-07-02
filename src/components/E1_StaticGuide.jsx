import React from 'react';
import useFlowStore from '../store/useFlowStore';
import ScreenShell from './common/ScreenShell';
import FigmaPrimaryButton from './common/FigmaPrimaryButton';
import { screenConfig, typography } from '../styles/theme';
import { abs, figma, figmaText } from '../styles/figmaLayout';

function E1_StaticGuide() {
  const { ticketInfo, setStep } = useFlowStore();
  const config = screenConfig.E1;
  const e1 = figma.e1;
  const info = ticketInfo;
  const text = (spec) => figmaText(spec, typography.fontFamily);

  return (
    <ScreenShell
      showHeader={config.showHeader}
      bottomButton={
        <FigmaPrimaryButton onClick={() => setStep('S4')}>안내 시작</FigmaPrimaryButton>
      }
    >
      {/* 일정 카드 배경 */}
      <div
        style={{
          ...abs(e1.scheduleCard),
          borderRadius: e1.scheduleCard.radius,
          background: e1.scheduleCard.background,
        }}
      />

      {/* 역·시간 영역 */}
      <div
        style={{
          ...abs(e1.routePanel),
          borderRadius: e1.routePanel.radius,
          background: e1.routePanel.background,
        }}
      />

      <p style={text(e1.travelDate)}>{info.travelDate}</p>
      <p style={text(e1.departureStation)}>{info.departureStation}</p>
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          top: e1.routeLine.top - 6,
          left: e1.routeLine.left,
          width: e1.routeLine.width,
          height: 12,
          overflow: 'visible',
        }}
        viewBox={`0 0 ${e1.routeLine.width} 12`}
      >
        <line
          x1="0"
          y1="6"
          x2="32"
          y2="6"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon points="32,0 50,6 32,12" fill="#000000" />
      </svg>
      <p style={text(e1.arrivalStation)}>{info.arrivalStation}</p>
      <p style={text(e1.departureTime)}>{info.departureTime}</p>
      <p style={text(e1.arrivalTime)}>{info.arrivalTime}</p>

      <p style={text(e1.trainName)}>{info.trainName}</p>

      {/* 승차 정보 카드 */}
      <div
        style={{
          ...abs(e1.ticketCard),
          borderRadius: e1.ticketCard.radius,
          background: e1.ticketCard.background,
        }}
      />

      <p style={text(e1.platformLabel)}>타는곳</p>
      <p style={text(e1.carLabel)}>호차번호</p>
      <p style={text(e1.seatLabel)}>좌석번호</p>

      <p style={text(e1.platformValue)}>{info.platform}</p>
      <p style={text(e1.carValue)}>{info.carNumber}</p>
      <p style={text(e1.seatValue)}>{info.seatNumber}</p>

      {e1.dividers.map((line, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: line.top,
            left: line.left,
            width: 0,
            height: line.height,
            borderLeft: line.border,
          }}
        />
      ))}

      <p style={{ ...text(e1.seatClass), textAlign: 'left', justifyContent: 'flex-start' }}>
        {info.seatClass}
      </p>

      <p style={{ ...text(e1.ticketNumberLabel), textAlign: 'left', justifyContent: 'flex-start' }}>
        승차권번호
      </p>
      <p style={{ ...text(e1.ticketNumberValue), textAlign: 'right', justifyContent: 'flex-end' }}>
        {info.ticketNumber}
      </p>
    </ScreenShell>
  );
}

export default E1_StaticGuide;
