/**
 * E5 — 안내 종료된 열차 (이미 완료된 안내 재진입 시)
 */
import React from 'react';
import useFlowStore from '../store/useFlowStore';
import FigmaHeader from './common/FigmaHeader';
import { typography } from '../styles/theme';

const FF = typography.fontFamily;
const BLUE = '#286EF0';

function CheckIcon({ size = 184 }) {
  const icon = size * 0.55;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={icon} height={icon} viewBox="0 0 100 100" fill="none" aria-hidden>
        <path
          d="M22 52L40 70L78 28"
          stroke={BLUE}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function E5_GuideDone() {
  const resetFlow = useFlowStore((s) => s.resetFlow);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#FFFFFF', overflow: 'hidden' }}>
      <FigmaHeader />

      {/* ── 리플 링 (파란 동심원) ── */}
      <div style={{
        position: 'absolute', top: 208, left: 20,
        width: 362, height: 362, borderRadius: '50%',
        background: '#286EF01A',
      }} />
      <div style={{
        position: 'absolute', top: 247, left: 59,
        width: 283, height: 283, borderRadius: '50%',
        background: '#286EF033',
      }} />

      {/* ── 체크 원 ── */}
      <div style={{ position: 'absolute', top: 294, left: 109 }}>
        <CheckIcon size={184} />
      </div>

      {/* ── 파란 채움 원 (체크 뒤 배경) ── */}
      <div style={{
        position: 'absolute', top: 294, left: 109,
        width: 184, height: 184, borderRadius: '50%',
        background: BLUE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={101} height={101} viewBox="0 0 100 100" fill="none" aria-hidden>
          <path
            d="M22 52L40 70L78 28"
            stroke="#FFFFFF"
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── 안내가 종료된 열차예요. 새로 확인해 주세요. ── */}
      <p style={{
        position: 'absolute', top: 594, left: 47, width: 307, height: 90,
        fontFamily: FF, fontSize: 32, fontWeight: 700,
        lineHeight: '140%', letterSpacing: 0,
        color: '#000000', textAlign: 'center', margin: 0,
        whiteSpace: 'pre-line',
      }}>
        {'안내가 종료된 열차예요.\n새로 확인해 주세요.'}
      </p>

      {/* ── 이용해 주셔서 감사합니다. ── */}
      <p style={{
        position: 'absolute', top: 688, left: 81, width: 240, height: 34,
        fontFamily: FF, fontSize: 24, fontWeight: 600,
        lineHeight: '140%', letterSpacing: '-0.02em',
        color: '#818181', textAlign: 'center', margin: 0,
      }}>
        이용해 주셔서 감사합니다.
      </p>

      {/* ── 닫기 버튼 ── */}
      <button
        type="button"
        onClick={resetFlow}
        style={{
          position: 'absolute', top: 760, left: 20,
          width: 362, height: 80, borderRadius: 100,
          background: '#595959', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{
          fontFamily: FF, fontSize: 24, fontWeight: 700,
          color: '#FFFFFF', letterSpacing: 1, lineHeight: '150%',
        }}>
          닫기
        </span>
      </button>
    </div>
  );
}

export default E5_GuideDone;
