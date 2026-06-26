import useFlowStore from '../../store/useFlowStore';
import SpeakerIcon from './SpeakerIcon';
import korailLogo from '../../assets/korail-logo.png';
import { abs, figma } from '../../styles/figmaLayout';
import { typography } from '../../styles/theme';

function FigmaHeader() {
  const { voiceGuide, toggleVoiceGuide } = useFlowStore();
  const { logo, serviceName, speaker, voiceLabel, toggle } = figma;

  return (
    <>
      <img
        src={korailLogo}
        alt="KORAIL"
        style={{
          ...abs(logo),
          objectFit: 'contain',
        }}
      />

      <span
        style={{
          position: 'absolute',
          top: serviceName.top,
          left: serviceName.left,
          width: serviceName.width,
          height: serviceName.height,
          fontFamily: typography.fontFamily,
          fontSize: serviceName.fontSize,
          fontWeight: serviceName.fontWeight,
          lineHeight: serviceName.lineHeight,
          color: serviceName.color,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        승강장 안내 서비스
      </span>

      <div
        style={{
          position: 'absolute',
          top: speaker.top,
          left: speaker.left,
          width: toggle.left + toggle.width - speaker.left,
          height: 28,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: speaker.width,
            height: speaker.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SpeakerIcon size={24} color="#000000" />
        </span>

        <span
          style={{
            position: 'absolute',
            top: voiceLabel.top - speaker.top,
            left: voiceLabel.left - speaker.left,
            width: voiceLabel.width,
            height: voiceLabel.height,
            fontFamily: typography.fontFamily,
            fontSize: voiceLabel.fontSize,
            fontWeight: voiceLabel.fontWeight,
            lineHeight: voiceLabel.lineHeight,
            color: voiceLabel.color,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          음성안내
        </span>

        <button
          type="button"
          onClick={toggleVoiceGuide}
          aria-pressed={voiceGuide}
          aria-label="음성안내 토글"
          style={{
            position: 'absolute',
            top: toggle.top - speaker.top,
            left: toggle.left - speaker.left,
            width: toggle.width,
            height: toggle.height,
            padding: 0,
            border: 'none',
            borderRadius: toggle.height / 2,
            backgroundColor: voiceGuide ? '#34C759' : '#D1D5DB',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: voiceGuide ? toggle.width - toggle.height + 2 : 2,
              width: toggle.height - 4,
              height: toggle.height - 4,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          />
        </button>
      </div>
    </>
  );
}

export default FigmaHeader;
