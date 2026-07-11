import React, { useState } from 'react';
import styled from 'styled-components';
import useFlowStore from '../store/useFlowStore';
import ScreenShell from './common/ScreenShell';
import FigmaPrimaryButton from './common/FigmaPrimaryButton';
import ktxLogo from '../assets/KTX .svg';
import { fetchRoute } from '../api/guide';
import { fetchPath } from '../api/tickets';
import { screenConfig, typography } from '../styles/theme';
import { abs, figma, figmaText } from '../styles/figmaLayout';

const ErrorToast = styled.div`
  position: absolute;
  bottom: 100px;
  left: 16px;
  right: 16px;
  background: #FEE2E2;
  border: 1px solid #FECACA;
  border-radius: 12px;
  padding: 12px 16px;
  font-family: ${typography.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: #B91C1C;
  text-align: center;
  z-index: 10;
  line-height: 1.5;
`;

function parsePlatformNumber(platform) {
  return platform.replace(/[^0-9]/g, '') || '5';
}

function parseCarDigits(carNumber) {
  const digits = carNumber.replace(/[^0-9]/g, '').split('');
  return digits.length ? digits : ['1', '2'];
}

function S4_Standby() {
  const {
    ticketInfo,
    reservationId,
    fromNode,
    toNode,
    routeSteps,
    position,
    setStep,
    setRoute,
    routeLoading,
    setRouteLoading,
    routeError,
    setRouteError,
  } = useFlowStore();
  const [localLoading, setLocalLoading] = useState(false);
  const config = screenConfig.S4;
  const s4 = figma.s4;
  const info = ticketInfo;
  const text = (spec) => figmaText(spec, typography.fontFamily);
  const platformNum = parsePlatformNumber(info.platform);
  const carDigits = parseCarDigits(info.carNumber);
  const loading = localLoading || routeLoading;
  const noRoute = !fromNode && !toNode && routeSteps.length === 0;

  const handleStartNavigation = () => {
    // guide에서 이미 경로를 받아온 경우 바로 이동
    if (routeSteps.length > 0) {
      setStep('S5');
      return;
    }

    setLocalLoading(true);
    setRouteLoading(true);
    setRouteError(null);

    // 새 백엔드: GET /api/paths?from=xxx&to=xxx
    // 구 백엔드 fallback: POST /api/v1/guide/routes
    const pathPromise = fromNode && toNode
      ? fetchPath({ from: fromNode, to: toNode })
      : (() => {
          const effectiveId = reservationId || ticketInfo?.ticketNumber || String(ticketInfo?.ticketId ?? '');
          if (!effectiveId) return Promise.reject(new Error('경로 정보가 없습니다.'));
          return fetchRoute({
            reservationId: effectiveId,
            ...(position ? { lat: position.lat, lng: position.lng } : {}),
          });
        })();

    pathPromise
      .then((route) => {
        setRoute(route);
        setStep('S5');
      })
      .catch((error) => {
        console.error('[route]', error);
        setStep('E1');
      })
      .finally(() => {
        setLocalLoading(false);
        setRouteLoading(false);
      });
  };

  return (
    <ScreenShell
      showHeader={config.showHeader}
      bottomButton={
        <FigmaPrimaryButton onClick={handleStartNavigation} disabled={loading || noRoute}>
          {loading ? '경로 불러오는 중…' : noRoute ? '승강장 경로 정보 없음' : '길찾기 시작'}
        </FigmaPrimaryButton>
      }
    >
      <p style={text(s4.platformLabel)}>타는 곳</p>

      <div
        style={{
          ...abs(s4.platformCircle),
          borderRadius: s4.platformCircle.radius,
          background: s4.platformCircle.background,
        }}
      />

      <p style={text(s4.platformNumber)}>{platformNum}</p>
      <p style={text(s4.platformSuffix)}>번</p>

      <p style={text(s4.carLabel)}>호차번호</p>

      <img
        src={ktxLogo}
        alt="KTX"
        draggable={false}
        style={{
          ...abs(s4.ktxLogo),
          objectFit: 'contain',
        }}
      />

      {routeError && (
        <ErrorToast role="alert">{routeError}</ErrorToast>
      )}

      {s4.carDigits.map((item, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              ...abs(item.circle),
              borderRadius: '50%',
              background: item.circle.background,
            }}
          />
          <p style={text(item.digit)}>{carDigits[i] ?? ''}</p>
        </React.Fragment>
      ))}
    </ScreenShell>
  );
}

export default S4_Standby;
