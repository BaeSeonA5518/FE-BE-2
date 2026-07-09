let currentAudio = null;

/**
 * base64 MP3 문자열을 재생합니다.
 * 이전 재생 중인 오디오는 자동으로 중단됩니다.
 * @param {string | null | undefined} base64
 */
export function playBase64Audio(base64) {
  if (!base64) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  try {
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audio.play().catch((err) => {
      console.warn('[TTS] 오디오 재생 실패:', err);
    });
    currentAudio = audio;
  } catch (err) {
    console.warn('[TTS] 오디오 생성 실패:', err);
  }
}

/** 현재 재생 중인 오디오를 중단합니다. */
export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
