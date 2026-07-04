import React, { useMemo } from 'react';
import closeIconSvg from '../assets/close.svg';
import useFlowStore from '../store/useFlowStore';
import GeolocationDeniedModal from './common/GeolocationDeniedModal';
import useNavigationTracking from '../hooks/useNavigationTracking';
import useFollowAngle from '../hooks/useFollowAngle';
import useDepartureUrgent from '../hooks/useDepartureUrgent';
import { DEPARTURE_URGENT_COLOR } from '../utils/time';
import S5NavigationArrow from './common/S5NavigationArrow';
import { formatGuideDistance, getCompassDotPosition, getNavigationInstruction } from '../utils/geo';
import { typography } from '../styles/theme';
import { abs, figma, figmaText } from '../styles/figmaLayout';

function S5_Navigation() {
  const ticketInfo = useFlowStore((s) => s.ticketInfo);
  const currentInstruction = useFlowStore((s) => s.currentInstruction);
  const routeSteps = useFlowStore((s) => s.routeSteps);
  const setStep = useFlowStore((s) => s.setStep);
  const distanceM = useFlowStore((s) => s.distanceM);
  const destinationAngle = useFlowStore((s) => s.destinationAngle);
  const geoError = useFlowStore((s) => s.geoError);
  const setGeoError = useFlowStore((s) => s.setGeoError);
  const isTracking = useFlowStore((s) => s.isTracking);

  const { stopTracking } = useNavigationTracking({ enabled: routeSteps.length > 0 });

  const s5 = figma.s5;
  const info = ticketInfo;
  const departureUrgent = useDepartureUrgent(info.departureTime);
  const text = (spec) => figmaText(spec, typography.fontFamily);
  const leftText = (spec) => ({
    ...text(spec),
    textAlign: 'left',
    justifyContent: 'flex-start',
  });

  const distanceDisplay = useMemo(
    () => formatGuideDistance(distanceM),
    [distanceM]
  );

  const guideMessage = useMemo(
    () => getNavigationInstruction(distanceM, currentInstruction),
    [currentInstruction, distanceM]
  );

  const compass = s5.compass;
  const arrow = s5.arrow;
  const innerLocalCenter = s5.innerRing.width / 2;
  const arrowMaxLength = compass.innerRadius - compass.arrowMargin;
  const arrowScale = arrowMaxLength / arrow.halfExtent;
  const arrowAngle = useFollowAngle(destinationAngle);

  const dotPosition = useMemo(
    () =>
      getCompassDotPosition(
        compass.centerX,
        compass.centerY,
        compass.dotOrbitRadius,
        destinationAngle,
        compass.dotSize,
        compass.dotSize
      ),
    [compass, destinationAngle]
  );

  const compassOpacity = isTracking && distanceM == null ? 0.45 : 1;

  const handleClose = () => {
    stopTracking();
    setGeoError(null);
    setStep('S4');
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: s5.background,
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
      <p style={{ ...text(s5.route), whiteSpace: 'nowrap', fontSize: 16 }}>{`${info.departureStation}→${info.arrivalStation}`}</p>
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

      {/* 나침반 링 */}
      <div
        style={{
          ...abs(s5.outerRing),
          borderRadius: s5.outerRing.radius,
          background: s5.outerRing.background,
        }}
      />
      <div
        style={{
          ...abs(s5.innerRing),
          borderRadius: s5.innerRing.radius,
          background: s5.innerRing.background,
        }}
      />

      {/* 목적지 점 — 링 궤도에 먼저 표시 */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: dotPosition.left,
          top: dotPosition.top,
          width: compass.dotSize,
          height: compass.dotSize,
          borderRadius: s5.headingDot.radius,
          background: s5.headingDot.background,
          transition: 'left 0.18s ease-out, top 0.18s ease-out',
          opacity: compassOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* 방향 화살표 — 원 중앙 고정, 제자리 회전 */}
      <div
        aria-hidden
        style={{
          ...abs(s5.innerRing),
          borderRadius: '50%',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: innerLocalCenter,
            top: innerLocalCenter,
            width: 0,
            height: 0,
            transform: `rotate(${arrowAngle}deg)`,
            opacity: compassOpacity,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(-50%, -50%) scale(${arrowScale})`,
              transformOrigin: 'center center',
            }}
          >
            <S5NavigationArrow
              width={arrow.width}
              height={arrow.height}
              strokeWidth={arrow.strokeWidth}
              color={arrow.color}
            />
          </div>
        </div>
      </div>

      {/* 거리 · 안내 문구 */}
      <div
        style={{
          position: 'absolute',
          top: s5.distanceValue.top,
          left: s5.distanceValue.left,
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: distanceDisplay.fontSize,
            fontWeight: s5.distanceValue.fontWeight,
            color: s5.distanceValue.color,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {distanceDisplay.value}
        </span>
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: s5.distanceUnit.fontSize,
            fontWeight: s5.distanceUnit.fontWeight,
            color: s5.distanceUnit.color,
            lineHeight: 1,
          }}
        >
          {distanceDisplay.unit}
        </span>
      </div>
      <p style={{ ...leftText(s5.guideText), whiteSpace: 'pre-line' }}>{guideMessage}</p>

      {/* 닫기 */}
      <button
        type="button"
        aria-label="길찾기 종료"
        onClick={handleClose}
        style={{
          ...abs(s5.closeButton),
          borderRadius: s5.closeButton.radius,
          background: s5.closeButton.background,
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
            width: s5.closeIcon.width,
            height: s5.closeIcon.height,
          }}
        />
      </button>

      {geoError && (
        <GeolocationDeniedModal
          message={geoError}
          onRetry={() => {
            setGeoError(null);
            window.location.reload();
          }}
          onFallback={() => {
            stopTracking();
            setGeoError(null);
            setStep('E1');
          }}
        />
      )}
    </div>
  );
}

export default S5_Navigation;
