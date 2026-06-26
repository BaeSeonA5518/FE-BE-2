import React, { useMemo } from 'react';
import useFlowStore from '../store/useFlowStore';
import SpeakerIcon from './common/SpeakerIcon';
import GeolocationDeniedModal from './common/GeolocationDeniedModal';
import { defaultTicket } from '../data/defaultTicket';
import useNavigationTracking from '../hooks/useNavigationTracking';
import useFollowAngle from '../hooks/useFollowAngle';
import { formatGuideDistance, getCompassDotPosition, getGuideMessage } from '../utils/geo';
import { typography } from '../styles/theme';
import { abs, figma, figmaText } from '../styles/figmaLayout';

function S5_Navigation() {
  const ticketInfo = useFlowStore((s) => s.ticketInfo);
  const voiceGuide = useFlowStore((s) => s.voiceGuide);
  const toggleVoiceGuide = useFlowStore((s) => s.toggleVoiceGuide);
  const setStep = useFlowStore((s) => s.setStep);
  const distanceM = useFlowStore((s) => s.distanceM);
  const destinationAngle = useFlowStore((s) => s.destinationAngle);
  const geoError = useFlowStore((s) => s.geoError);
  const setGeoError = useFlowStore((s) => s.setGeoError);
  const isTracking = useFlowStore((s) => s.isTracking);

  const { stopTracking } = useNavigationTracking({ enabled: true });

  const s5 = figma.s5;
  const info = { ...defaultTicket, ...ticketInfo };
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
    () => getGuideMessage(distanceM, s5.guideText.text),
    [distanceM, s5.guideText.text]
  );

  const compass = s5.compass;
  const innerLocalCenter = s5.innerRing.width / 2;
  const arrowMaxLength = compass.innerRadius - compass.arrowMargin;
  const arrowScale = arrowMaxLength / s5.arrow.height;
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

  const unitLeft =
    distanceDisplay.value.length <= 2
      ? s5.distanceUnit.left
      : s5.distanceUnit.left + (s5.distanceValue.width - distanceDisplay.value.length * 14);

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
      <p style={leftText(s5.timeValue)}>{info.departureTime}</p>

      {/* 상단 승차 정보 카드 */}
      <div
        style={{
          ...abs(s5.ticketCard),
          borderRadius: s5.ticketCard.radius,
          background: s5.ticketCard.background,
        }}
      />
      <p style={text(s5.route)}>{`${info.departureStation}→${info.arrivalStation}`}</p>
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

      {/* 방향 화살표 — 목적지 점 방향으로 따라감 */}
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
            inset: 0,
            transform: `rotate(${arrowAngle}deg)`,
            transformOrigin: `${innerLocalCenter}px ${innerLocalCenter}px`,
            opacity: compassOpacity,
          }}
        >
          <svg
            style={{
              position: 'absolute',
              left: innerLocalCenter,
              top: innerLocalCenter,
              width: s5.arrow.width,
              height: s5.arrow.height,
              overflow: 'visible',
              transform: `translate(-50%, -100%) scale(${arrowScale})`,
              transformOrigin: '50% 100%',
            }}
            viewBox={`0 0 ${s5.arrow.width} ${s5.arrow.height}`}
          >
            <line
              x1="40"
              y1="220"
              x2="40"
              y2="50"
              stroke="#FFFFFF"
              strokeWidth={s5.arrow.strokeWidth}
              strokeLinecap="round"
            />
            <line
              x1="40"
              y1="50"
              x2="12"
              y2="100"
              stroke="#FFFFFF"
              strokeWidth={s5.arrow.strokeWidth}
              strokeLinecap="round"
            />
            <line
              x1="40"
              y1="50"
              x2="68"
              y2="100"
              stroke="#FFFFFF"
              strokeWidth={s5.arrow.strokeWidth}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 거리 · 안내 문구 */}
      <p
        style={{
          ...leftText(s5.distanceValue),
          width: 120,
          fontSize: distanceDisplay.fontSize,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {distanceDisplay.value}
      </p>
      <p
        style={{
          ...text(s5.distanceUnit),
          left: unitLeft,
        }}
      >
        {distanceDisplay.unit}
      </p>
      <p style={{ ...leftText(s5.guideText), whiteSpace: 'pre-line' }}>{guideMessage}</p>

      {/* 음성안내 */}
      <button
        type="button"
        onClick={toggleVoiceGuide}
        aria-pressed={voiceGuide}
        aria-label="음성안내 토글"
        style={{
          position: 'absolute',
          top: s5.voiceToggle.top,
          left: s5.voiceToggle.left,
          width: s5.voiceToggle.width,
          height: s5.voiceToggle.height,
          padding: 0,
          border: 'none',
          borderRadius: s5.voiceToggle.height / 2,
          backgroundColor: voiceGuide ? '#34C759' : '#FFFFFF66',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: voiceGuide ? s5.voiceToggle.width - s5.voiceToggle.height + 2 : 2,
            width: s5.voiceToggle.height - 4,
            height: s5.voiceToggle.height - 4,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </button>

      <span
        style={{
          position: 'absolute',
          top: s5.speaker.top,
          left: s5.speaker.left,
          width: s5.speaker.width,
          height: s5.speaker.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SpeakerIcon size={24} color="#FFFFFF" />
      </span>

      <p style={leftText(s5.voiceLabel)}>음성안내</p>

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
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: s5.closeIcon.top - s5.closeButton.top,
            left: s5.closeIcon.left - s5.closeButton.left,
            width: s5.closeIcon.width,
            height: s5.closeIcon.height,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: s5.closeIcon.width,
              height: 0,
              borderTop: s5.closeIcon.border,
              transform: 'translate(-50%, -50%) rotate(45deg)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: s5.closeIcon.width,
              height: 0,
              borderTop: s5.closeIcon.border,
              transform: 'translate(-50%, -50%) rotate(-45deg)',
            }}
          />
        </span>
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
