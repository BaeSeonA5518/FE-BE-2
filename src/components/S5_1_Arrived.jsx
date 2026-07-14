import React, { useEffect, useMemo } from 'react';
import closeIconSvg from '../assets/close.svg';
import useFlowStore from '../store/useFlowStore';
import useDepartureUrgent from '../hooks/useDepartureUrgent';
import { vibrateOnArrival } from '../utils/haptics';
import { DEPARTURE_URGENT_COLOR } from '../utils/time';
import { typography } from '../styles/theme';
import { abs, figma, figmaText } from '../styles/figmaLayout';

function ArrivalCheckIcon({ width, height, color, strokeWidth }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" aria-hidden>
      <path
        d="M22 52L40 70L78 28"
        stroke={color}
        strokeWidth={strokeWidth ?? 14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function S5_1_Arrived() {
  const ticketInfo = useFlowStore((s) => s.ticketInfo);
  const resetFlow = useFlowStore((s) => s.resetFlow);

  const s5 = figma.s5;
  const s51 = figma.s5_1;
  const info = ticketInfo;
  const departureUrgent = useDepartureUrgent(info.departureTime);
  const text = (spec) => figmaText(spec, typography.fontFamily);
  const leftText = (spec) => ({
    ...text(spec),
    textAlign: 'left',
    justifyContent: 'flex-start',
  });

  const arrivalMessage = useMemo(() => {
    const car = info.carNumber?.trim();
    return car ? `여기서 ${car}를 기다리세요.` : '여기서 열차를 기다리세요.';
  }, [info.carNumber]);

  useEffect(() => {
    vibrateOnArrival();
  }, []);

  const handleClose = () => {
    resetFlow();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: s51.background,
        overflow: 'hidden',
      }}
    >
      {/* 상단 출발 시간 카드 */}
      <div
        style={{
          ...abs(s5.timeCard),
          borderRadius: s5.timeCard.radius,
          background: s5.timeCard.background,
        }}
      />
      <p style={leftText(s5.timeLabel)}>기차 출발 시간</p>
      <p
        style={{
          ...leftText(s5.timeValue),
          color: departureUrgent ? DEPARTURE_URGENT_COLOR : s5.timeValue.color,
        }}
      >
        {info.departureTime}
      </p>

      {/* 상단 승차 정보 카드 */}
      <div
        style={{
          ...abs(s5.ticketCard),
          borderRadius: s5.ticketCard.radius,
          background: s5.ticketCard.background,
        }}
      />
      <p style={{ ...text(s5.route), whiteSpace: 'nowrap' }}>{`${info.departureStation}→${info.arrivalStation}`}</p>
      <p style={text(s5.trainName)}>{info.trainName}</p>
      <p style={text(s5.platformLabel)}>타는곳</p>
      <p style={text(s5.carLabel)}>호차번호</p>
      <p style={text(s5.seatLabel)}>좌석번호</p>
      <p style={{ ...text(s5.platformValue), whiteSpace: 'nowrap' }}>{info.platform}</p>
      <p style={{ ...text(s5.carValue), whiteSpace: 'nowrap' }}>{info.carNumber}</p>
      <p style={{ ...text(s5.seatValue), whiteSpace: 'nowrap' }}>{info.seatNumber}</p>

      {s5.dividers.map((line, i) => (
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

      {/* 도착 리플 링 */}
      {s51.rippleRings.map((ring, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            ...abs(ring),
            borderRadius: ring.radius,
            background: ring.background,
            opacity: 1,
          }}
        />
      ))}

      {/* 흰색 원 */}
      <div
        aria-hidden
        style={{
          ...abs(s51.checkCircle),
          borderRadius: s51.checkCircle.radius,
          background: s51.checkCircle.background,
        }}
      />

      {/* 체크 아이콘 */}
      <div
        aria-hidden
        style={{
          ...abs(s51.checkIcon),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ArrivalCheckIcon
          width={s51.checkIcon.width}
          height={s51.checkIcon.height}
          color={s51.checkIcon.color}
          strokeWidth={s51.checkIcon.strokeWidth}
        />
      </div>

      <p style={leftText(s51.arrivalTitle)}>도착</p>
      <p style={{ ...leftText(s51.arrivalMessage), whiteSpace: 'pre-line' }}>{arrivalMessage}</p>

      {/* 닫기 */}
      <button
        type="button"
        aria-label="안내 종료"
        onClick={handleClose}
        style={{
          ...abs(s51.closeButton),
          borderRadius: s51.closeButton.radius,
          background: s51.closeButton.background,
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={closeIconSvg}
          alt="닫기"
          style={{
            width: s51.closeIcon.width,
            height: s51.closeIcon.height,
          }}
        />
      </button>
    </div>
  );
}

export default S5_1_Arrived;
