import { apiRequest } from './client';
import { API_BASE } from './config';
import {
  normalizeTicketList,
  normalizeGuideResponse,
  normalizeGuideStepsResponse,
  normalizeGuideWalkResponse,
  normalizeWalkStep,
  normalizeGuideSimulateResponse,
  normalizeRoutePointsResponse,
  normalizePathResponse,
} from './normalize';

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** GET /api/users/{userId}/tickets — 목록 (정규화) */
export async function fetchUserTickets(userId) {
  const data = await apiRequest(`/api/users/${userId}/tickets`);
  return normalizeTicketList(data);
}

/** GET /api/users/{userId}/tickets/{ticketId} — 단건 (정규화) */
export async function fetchUserTicket(userId, ticketId) {
  const data = await apiRequest(`/api/users/${userId}/tickets/${ticketId}`);
  return normalizeTicketList([data])[0] ?? null;
}

/**
 * GET /api/users/{userId}/guide
 * @param {number|string} userId
 * @param {{ fromNode?: string }} [options]
 */
export async function fetchUserGuide(userId, { fromNode } = {}) {
  const data = await apiRequest(
    `/api/users/${userId}/guide${toQuery({ fromNode })}`,
  );
  return normalizeGuideResponse(data);
}

/**
 * GET /api/users/{userId}/guide/steps
 * 단계별 screenText · voiceText · audioBase64
 * @param {number|string} userId
 * @param {{ fromNode?: string }} [options]
 */
export async function fetchUserGuideSteps(userId, { fromNode } = {}) {
  const data = await apiRequest(
    `/api/users/${userId}/guide/steps${toQuery({ fromNode })}`,
  );
  return normalizeGuideStepsResponse(data);
}

/**
 * GET /api/users/{userId}/guide/walk
 * 전체 경로 자동 워킹(배치). 노드별 지터 좌표 + 해석 결과 + 음성
 * @param {number|string} userId
 * @param {{ fromNode?: string, jitterM?: number }} [options]
 */
export async function fetchGuideWalk(userId, { fromNode, jitterM = 0 } = {}) {
  const data = await apiRequest(
    `/api/users/${userId}/guide/walk${toQuery({ fromNode, jitterM })}`,
  );
  return normalizeGuideWalkResponse(data);
}

/**
 * GET /api/users/{userId}/guide/walk/stream (SSE)
 * EventSource 연결. 이벤트: step | done | info
 *
 * @param {number|string} userId
 * @param {{
 *   fromNode?: string,
 *   intervalMs?: number,
 *   jitterM?: number,
 *   onStep?: (step: object) => void,
 *   onDone?: (data: string) => void,
 *   onInfo?: (data: string) => void,
 *   onError?: (err: Event) => void,
 * }} [options]
 * @returns {EventSource}
 */
export function openGuideWalkStream(
  userId,
  {
    fromNode,
    intervalMs = 5000,
    jitterM = 0,
    onStep,
    onDone,
    onInfo,
    onError,
  } = {},
) {
  const path = `/api/users/${userId}/guide/walk/stream${toQuery({
    fromNode,
    intervalMs,
    jitterM,
  })}`;
  const url = `${API_BASE}${path}`;
  const es = new EventSource(url);

  es.addEventListener('step', (ev) => {
    try {
      const raw = JSON.parse(ev.data);
      onStep?.(normalizeWalkStep(raw));
    } catch (e) {
      console.error('[guide/walk/stream] step parse error', e);
    }
  });

  es.addEventListener('done', (ev) => {
    onDone?.(ev.data ?? '');
    es.close();
  });

  es.addEventListener('info', (ev) => {
    onInfo?.(ev.data ?? '');
    es.close();
  });

  es.onerror = (err) => {
    onError?.(err);
  };

  return es;
}

/**
 * GET /api/users/{userId}/guide/simulate
 * 걸음수·방위 기반 가상 이동. stepChanged 일 때만 audioBase64 생성
 * @param {number|string} userId
 * @param {{
 *   fromNode?: string,
 *   steps: number,
 *   heading: number,
 *   stepLength?: number,
 *   lastStepSeq?: number,
 * }} options
 */
export async function fetchGuideSimulate(
  userId,
  {
    fromNode,
    steps,
    heading,
    stepLength = 0.7,
    lastStepSeq = -1,
  } = {},
) {
  const data = await apiRequest(
    `/api/users/${userId}/guide/simulate${toQuery({
      fromNode,
      steps,
      heading,
      stepLength,
      lastStepSeq,
    })}`,
  );
  return normalizeGuideSimulateResponse(data);
}

/**
 * GET /api/users/{userId}/guide/route-points
 * 경로 노드 상대좌표 (시뮬레이션 재현용)
 * @param {number|string} userId
 * @param {{ fromNode?: string }} [options]
 */
export async function fetchGuideRoutePoints(userId, { fromNode } = {}) {
  const data = await apiRequest(
    `/api/users/${userId}/guide/route-points${toQuery({ fromNode })}`,
  );
  return normalizeRoutePointsResponse(data);
}

/**
 * POST /api/tts — { text } → { audioBase64 }
 * @param {string} text
 */
export async function fetchTts(text) {
  const data = await apiRequest('/api/tts', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return {
    audioBase64: String(data?.audioBase64 ?? data?.audio_base64 ?? ''),
  };
}

/**
 * GET /api/paths?from=&to= — PathResponse 정규화
 * @param {string} from
 * @param {string} to
 */
export async function fetchPath(from, to) {
  const q = new URLSearchParams({ from, to });
  const data = await apiRequest(`/api/paths?${q}`);
  return normalizePathResponse(data);
}
