let currentAudio = null;
let currentPlayPromise = null;

/**
 * base64 MP3 문자열을 재생합니다.
 * 이전 재생 중인 오디오는 자동으로 중단됩니다.
 * @param {string | null | undefined} base64
 */
export function playBase64Audio(base64) {
  if (!base64) return;

  // 이전 오디오: play promise가 끝난 뒤 pause해야 AbortError 방지
  const prevAudio = currentAudio;
  const prevPromise = currentPlayPromise;
  currentAudio = null;
  currentPlayPromise = null;

  const stopPrev = () => {
    if (prevAudio) {
      prevAudio.pause();
      prevAudio.src = '';
    }
  };

  if (prevPromise) {
    prevPromise.then(stopPrev).catch(stopPrev);
  } else {
    stopPrev();
  }

  try {
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    const promise = audio.play().catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[TTS] 오디오 재생 실패:', err);
      }
    });
    currentAudio = audio;
    currentPlayPromise = promise;
  } catch (err) {
    console.warn('[TTS] 오디오 생성 실패:', err);
  }
}

/** 현재 재생 중인 오디오를 중단합니다. */
export function stopAudio() {
  const audio = currentAudio;
  const promise = currentPlayPromise;
  currentAudio = null;
  currentPlayPromise = null;

  const stop = () => {
    if (audio) {
      audio.pause();
      audio.src = '';
    }
  };

  if (promise) {
    promise.then(stop).catch(stop);
  } else {
    stop();
  }
}
