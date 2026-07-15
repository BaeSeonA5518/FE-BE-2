import React from 'react';
import useFlowStore from '../store/useFlowStore';
import ScreenShell from './common/ScreenShell';
import FigmaPrimaryButton from './common/FigmaPrimaryButton';
import escalatorImg from '../assets/e2-escalator.png';
import { figma } from '../styles/figmaLayout';
import { screenConfig, typography } from '../styles/theme';

const BLUE = '#286EF0';

function E2_MoveGuide() {
  const { setStep } = useFlowStore();
  const config = screenConfig.E2;
  const { heading, photo, photoPlaceholder, guideText, buttonLabel } = figma.e2;

  return (
    <ScreenShell
      showHeader={config.showHeader}
      bottomButton={
        <FigmaPrimaryButton onClick={() => setStep('S3')}>
          {buttonLabel.text}
        </FigmaPrimaryButton>
      }
    >
      {/* 제목 */}
      <h1
        style={{
          position: 'absolute',
          top: heading.top,
          left: heading.left,
          width: heading.width,
          height: heading.height,
          margin: 0,
          fontFamily: typography.fontFamily,
          fontSize: heading.fontSize,
          fontWeight: heading.fontWeight,
          lineHeight: heading.lineHeight,
          color: heading.color,
          letterSpacing: 0,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: BLUE }}>3층</span>으로 이동해주세요!
      </h1>

      {/* 에스컬레이터 사진 영역 */}
      <div
        style={{
          position: 'absolute',
          top: photo.top,
          left: photo.left,
          width: photo.width,
          height: photo.height,
          borderRadius: photo.radius,
          background: photo.background,
          boxShadow: photo.boxShadow,
          overflow: 'hidden',
        }}
      >
        {escalatorImg ? (
          <img
            src={escalatorImg}
            alt="역 내 에스컬레이터 안내"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <p
            style={{
              margin: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: typography.fontFamily,
              fontSize: photoPlaceholder.fontSize,
              fontWeight: photoPlaceholder.fontWeight,
              lineHeight: photoPlaceholder.lineHeight,
              color: photoPlaceholder.color,
              textAlign: 'center',
              whiteSpace: 'pre-line',
            }}
          >
            {photoPlaceholder.text}
          </p>
        )}
      </div>

      {/* 안내 문구 */}
      <p
        style={{
          position: 'absolute',
          top: guideText.top,
          left: guideText.left,
          width: guideText.width,
          height: guideText.height,
          margin: 0,
          fontFamily: typography.fontFamily,
          fontSize: guideText.fontSize,
          fontWeight: guideText.fontWeight,
          lineHeight: guideText.lineHeight,
          letterSpacing: guideText.letterSpacing,
          color: guideText.color,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'pre-line',
        }}
      >
        {guideText.text}
      </p>
    </ScreenShell>
  );
}

export default E2_MoveGuide;
