import React, { useMemo, useEffect } from 'react';
import closeIconSvg from '../assets/close.svg';
import useFlowStore from '../store/useFlowStore';
import GeolocationDeniedModal from './common/GeolocationDeniedModal';
import useNavigationTracking from '../hooks/useNavigationTracking';
import useGuideSimulate from '../hooks/useGuideSimulate';
import useFollowAngle from '../hooks/useFollowAngle';
import useDepartureUrgent from '../hooks/useDepartureUrgent';
import useDepartureExpired from '../hooks/useDepartureExpired';
import { DEPARTURE_URGENT_COLOR } from '../utils/time';
import S5NavigationArrow from './common/S5NavigationArrow';
import { formatGuideDistance, getCompassDotPosition, getNavigationInstruction } from '../utils/geo';
import { typography } from '../styles/theme';
import { abs, figma, figmaText } from '../styles/figmaLayout';

const FF = typography.fontFamily;
const GREEN = '#3FAD62';
/** DEV: GPS 대신 guide/simulate으로 S5 구동 */
const USE_SIMULATE = import.meta.env.DEV;

function CheckIcon({ size = 184 }) {
  const r = size / 2;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size * 0.65} height={size * 0.6} viewBox="0 0 120 110" fill="none">
        <path d="M12 46L38 72L87 18" stroke={GREEN} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function DepartureExpiredOverlay({ info, s5, text, leftText, onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: GREEN, overflow: 'hidden',
    }}>
      {/* 상단 출발 시간 카드 */}
      <div style={{ ...abs(s5.timeCard), borderRadius: s5.timeCard.radius, background: s5.timeCard.background }} />
      <p style={leftText(s5.timeLabel)}>기차 출발 시간</p>
      <p style={leftText(s5.timeValue)}>{info.departureTime}</p>

      {/* 상단 승차 정보 카드 */}
      <div style={{ ...abs(s5.ticketCard), borderRadius: s5.ticketCard.radius, background: s5.ticketCard.background }} />
      <p style={{ ...text(s5.route), whiteSpace: 'nowrap', fontSize: 16 }}>{`${info.departureStation}→${info.arrivalStation}`}</p>
      <p style={text(s5.trainName)}>{info.trainName}</p>
      <p style={text(s5.platformLabel)}>타는곳</p>
      <p style={text(s5.carLabel)}>호차번호</p>
      <p style={text(s5.seatLabel)}>좌석번호</p>
      <p style={{ ...text(s5.platformValue), whiteSpace: 'nowrap' }}>{info.platform}</p>
      <p style={{ ...text(s5.carValue), whiteSpace: 'nowrap' }}>{info.carNumber}</p>
      <p style={{ ...text(s5.seatValue), whiteSpace: 'nowrap' }}>{info.seatNumber}</p>
      {s5.dividers.map((line, i) => (
        <div key={i} style={{ position: 'absolute', top: line.top, left: line.left, width: 0, height: line.height, borderLeft: line.border }} />
      ))}

      {/* 리플 링 */}
      {[
        { width: 362, height: 362, top: 208, left: 20 },
        { width: 283, height: 283, top: 247, left: 59 },
      ].map((ring, i) => (
        <div key={i} style={{
          position: 'absolute', top: ring.top, left: ring.left,
          width: ring.width, height: ring.height,
          borderRadius: '50%', background: '#FFFFFF26',
        }} />
      ))}

      {/* 체크 원 */}
      <div style={{ position: 'absolute', top: 294, left: 109 }}>
        <CheckIcon size={184} />
      </div>

      {/* 제목 */}
      <p style={{
        position: 'absolute', top: 590, left: 40, width: 177, height: 67,
        fontFamily: FF, fontSize: 48, fontWeight: 800, color: '#FFFFFF',
        lineHeight: '140%', letterSpacing: 0, margin: 0,
        display: 'flex', alignItems: 'center',
      }}>
        열차 출발
      </p>

      {/* 설명 */}
      <p style={{
        position: 'absolute', top: 667, left: 40, width: 280, height: 90,
        fontFamily: FF, fontSize: 32, fontWeight: 600, color: '#FFFFFF',
        lineHeight: '140%', letterSpacing: 0, margin: 0, whiteSpace: 'pre-line',
      }}>
        {'출발 시간이 지났어요.\n안내를 종료할게요.'}
      </p>

      {/* 닫기 */}
      <button
        type="button"
        aria-label="안내 종료"
        onClick={onClose}
        style={{
          position: 'absolute', top: 765, left: 301,
          width: 70, height: 70, borderRadius: '50%',
          background: '#FFFFFF40', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img src={closeIconSvg} alt="닫기" style={{ width: 28, height: 28 }} />
      </button>
    </div>
  );
}

function S5_Navigation() {
  const ticketInfo = useFlowStore((s) => s.ticketInfo);
  const currentInstruction = useFlowStore((s) => s.currentInstruction);
  const routeSteps = useFlowStore((s) => s.routeSteps);
  const setStep = useFlowStore((s) => s.setStep);
  const resetFlow = useFlowStore((s) => s.resetFlow);
  const distanceM = useFlowStore((s) => s.distanceM);
  const destinationAngle = useFlowStore((s) => s.destinationAngle);
  const geoError = useFlowStore((s) => s.geoError);
  const setGeoError = useFlowStore((s) => s.setGeoError);
  const isTracking = useFlowStore((s) => s.isTracking);
  const overshoot = useFlowStore((s) => s.overshoot);

  const playCurrentStepAudio = useFlowStore((s) => s.playCurrentStepAudio);

  const hasRoute = routeSteps.length > 0;
  const { stopTracking } = useNavigationTracking({
    enabled: !USE_SIMULATE && hasRoute,
  });
  const { stopSimulate } = useGuideSimulate({
    enabled: USE_SIMULATE && hasRoute,
  });

  useEffect(() => {
    // DEV simulate는 stepChanged 시 TTS 재생하므로 진입 시 중복 스킵
    if (USE_SIMULATE) return;
    playCurrentStepAudio();
  // 내비게이션 화면 진입 시 1회만 첫 스텝 음성 재생
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s5 = figma.s5;
  const info = ticketInfo;
  const departureUrgent = useDepartureUrgent(info.departureTime);
  const departureExpired = useDepartureExpired(info.departureTime);
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

  const guideMessage = useMemo(() => {
    if (overshoot) return '지나쳤어요.\n뒤로 돌아가세요.';
    return getNavigationInstruction(distanceM, currentInstruction);
  }, [currentInstruction, distanceM, overshoot]);

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
    if (USE_SIMULATE) stopSimulate();
    else stopTracking();
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

      {/* 거리 · 안내 문구 — 세로 스택으로 겹침 방지 */}
      <div
        style={{
          position: 'absolute',
          top: 590,
          left: 40,
          width: 250,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
            flexShrink: 0,
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
        <p
          style={{
            margin: 0,
            maxWidth: '100%',
            fontFamily: typography.fontFamily,
            fontSize: overshoot ? 32 : 28,
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: 0,
            color: '#FFFFFF',
            textAlign: 'left',
            whiteSpace: 'pre-line',
            wordBreak: 'keep-all',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {guideMessage}
        </p>
      </div>

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

      {departureExpired && (
        <DepartureExpiredOverlay
          info={info}
          s5={s5}
          text={text}
          leftText={leftText}
          onClose={() => { stopTracking(); resetFlow(); }}
        />
      )}
    </div>
  );
}

export default S5_Navigation;
