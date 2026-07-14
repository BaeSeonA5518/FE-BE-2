import { create } from 'zustand';
import { playBase64Audio } from '../utils/audio';
import { getArrowRotation, getBearing } from '../utils/geo';
import { clearSession, loadSession, saveSession } from '../utils/session';

const emptyTicket = {
  trainName: '',
  travelDate: '',
  departureStation: '',
  arrivalStation: '',
  departureTime: '',
  arrivalTime: '',
  platform: '',
  carNumber: '',
  seatNumber: '',
  seatClass: '',
  ticketNumber: '',
};

function stepToDestination(step) {
  if (!step) return null;
  return {
    lat: step.lat,
    lng: step.lng,
    label: step.name ?? '',
  };
}

const _saved = loadSession();

const useFlowStore = create((set, get) => ({
  step: _saved?.step ?? 'SMS',
  mapInstance: null,
  voiceGuide: _saved?.voiceGuide ?? true,

  reservationId: _saved?.reservationId ?? null,
  ticketInfo: _saved?.ticketInfo ?? { ...emptyTicket },
  fromNode: _saved?.fromNode ?? null,
  toNode: _saved?.toNode ?? null,

  routeId: _saved?.routeId ?? null,
  routeSteps: _saved?.routeSteps ?? [],
  totalDistanceM: _saved?.totalDistanceM ?? null,
  currentStepIndex: _saved?.currentStepIndex ?? 0,
  currentInstruction: _saved?.currentInstruction ?? '',
  routeLoading: false,
  routeError: null,
  audioMap: _saved?.audioMap ?? {},
  screenTextMap: _saved?.screenTextMap ?? {},

  destination: (() => {
    if (!_saved?.routeSteps?.length) return null;
    return stepToDestination(_saved.routeSteps[_saved.currentStepIndex ?? 0]);
  })(),
  position: null,
  heading: 0,
  bearing: null,
  distanceM: null,
  destinationAngle: 0,
  isTracking: false,
  geoError: null,
  overshoot: false,

  setStep: (nextStep) => {
    set({ step: nextStep });
    saveSession({ ...get(), step: nextStep });
  },

  setReservation: (id, info, fromNode = null, toNode = null) =>
    set({
      reservationId: id,
      ticketInfo: { ...emptyTicket, ...info },
      fromNode,
      toNode,
    }),

  setRouteLoading: (routeLoading) => set({ routeLoading }),
  setRouteError: (routeError) => set({ routeError }),

  setAudioMap: (audioMap) => set({ audioMap }),

  setScreenTextMap: (screenTextMap) => set({ screenTextMap }),

  setRoute: (route) => {
    const steps = route?.steps ?? [];
    const first = steps[0] ?? null;
    const { screenTextMap } = get();

    const firstInstruction =
      (first?.nodeId && screenTextMap[first.nodeId]) ?? first?.instruction ?? '';

    set({
      routeId: route?.routeId ?? null,
      routeSteps: steps,
      totalDistanceM: route?.totalDistanceM ?? null,
      currentStepIndex: 0,
      currentInstruction: firstInstruction,
      destination: stepToDestination(first),
      routeError: null,
      distanceM: null,
      bearing: null,
      destinationAngle: 0,
    });
    saveSession(get());
  },

  getCurrentStep: () => {
    const { routeSteps, currentStepIndex } = get();
    return routeSteps[currentStepIndex] ?? null;
  },

  advanceStep: () => {
    const { routeSteps, currentStepIndex, audioMap, screenTextMap, voiceGuide } = get();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= routeSteps.length) return false;

    const next = routeSteps[nextIndex];
    const currentNode = routeSteps[currentStepIndex];
    // 현재 노드(방금 도착)의 screenText → 다음 노드로 가는 길 안내
    const instruction =
      (currentNode?.nodeId && screenTextMap[currentNode.nodeId]) ?? currentNode?.instruction ?? '';

    set({
      currentStepIndex: nextIndex,
      currentInstruction: instruction,
      destination: stepToDestination(next),
      distanceM: null,
      bearing: null,
      destinationAngle: 0,
    });

    if (voiceGuide) {
      const audio = audioMap[currentNode?.nodeId];
      console.log('[TTS] advanceStep nodeId:', currentNode?.nodeId, '| audio 있음:', !!audio, '| audioMap keys:', Object.keys(audioMap));
      if (audio) playBase64Audio(audio);
    }

    saveSession(get());
    return true;
  },

  playCurrentStepAudio: () => {
    const { routeSteps, currentStepIndex, audioMap, voiceGuide } = get();
    if (!voiceGuide) return;
    const nodeId = routeSteps[currentStepIndex]?.nodeId;
    const audio = audioMap[nodeId];
    console.log('[TTS] playCurrentStepAudio nodeId:', nodeId, '| audio 있음:', !!audio, '| audioMap keys:', Object.keys(audioMap));
    if (audio) playBase64Audio(audio);
  },

  /**
   * guide/walk/stream step → S5 UI 상태 반영
   * @param {{
   *   nodeId?: string,
   *   remainingAlongRouteM?: number,
   *   arrived?: boolean,
   *   guide?: { screenText?: string, audioBase64?: string } | null,
   * }} walkStep
   */
  applyWalkStep: (walkStep) => {
    if (!walkStep) return;
    const { routeSteps, voiceGuide, currentInstruction } = get();
    const nodeId = walkStep.nodeId ? String(walkStep.nodeId) : '';
    const matchedIndex = nodeId
      ? routeSteps.findIndex((s) => s.nodeId === nodeId)
      : -1;
    const matched = matchedIndex >= 0 ? routeSteps[matchedIndex] : null;
    const instruction =
      walkStep.guide?.screenText ||
      (nodeId && get().screenTextMap[nodeId]) ||
      matched?.instruction ||
      currentInstruction;

    set({
      currentInstruction: instruction,
      distanceM:
        walkStep.remainingAlongRouteM != null
          ? Number(walkStep.remainingAlongRouteM)
          : get().distanceM,
      ...(matchedIndex >= 0
        ? {
            currentStepIndex: matchedIndex,
            destination: stepToDestination(matched),
          }
        : {}),
      isTracking: true,
      overshoot: false,
    });

    if (voiceGuide && walkStep.guide?.audioBase64) {
      const audio = walkStep.guide.audioBase64;
      console.log(
        '[TTS] applyWalkStep nodeId:',
        nodeId,
        '| audio length:',
        audio.length,
      );
      playBase64Audio(audio);
    }
  },

  /**
   * guide/simulate 응답 → S5 UI 상태 반영
   * audio는 stepChanged 일 때만 포함되므로 그때만 재생
   */
  applySimulateResult: (res) => {
    if (!res) return;
    const guide = res.currentStep
      ? {
          screenText: res.currentStep.screenText,
          audioBase64: res.stepChanged ? res.currentStep.audioBase64 : '',
        }
      : null;
    get().applyWalkStep({
      nodeId: res.currentStep?.nodeId ?? res.nearestNodeId,
      remainingAlongRouteM: res.remainingAlongRouteM,
      arrived: res.arrived,
      guide,
    });

    const heading =
      res.headingDeg != null ? Number(res.headingDeg) : get().heading;
    const pos =
      res.curLat != null && res.curLng != null
        ? { lat: res.curLat, lng: res.curLng }
        : get().position;
    const dest = get().destination;
    let destinationAngle = get().destinationAngle;
    if (pos?.lat != null && dest?.lat != null) {
      const bearing = getBearing(pos.lat, pos.lng, dest.lat, dest.lng);
      destinationAngle = getArrowRotation(bearing, heading);
      set({
        heading,
        position: pos,
        bearing,
        destinationAngle,
      });
    } else {
      set({ heading, ...(pos ? { position: pos } : {}) });
    }
  },

  toggleVoiceGuide: () => set((state) => ({ voiceGuide: !state.voiceGuide })),

  setMapInstance: (map) => set({ mapInstance: map }),

  setNavigation: (payload) => set((state) => ({ ...state, ...payload })),

  setGeoError: (geoError) => set({ geoError }),

  moveToLocation: (lat, lng) => {
    const map = get().mapInstance;
    if (map) {
      map.panTo?.({ lat, lng });
    }
  },

  resetFlow: () => {
    clearSession();
    set({
      step: 'SMS',
      reservationId: null,
      ticketInfo: { ...emptyTicket },
      fromNode: null,
      toNode: null,
      routeId: null,
      routeSteps: [],
      totalDistanceM: null,
      currentStepIndex: 0,
      currentInstruction: '',
      routeLoading: false,
      routeError: null,
      audioMap: {},
      screenTextMap: {},
      destination: null,
      position: null,
      heading: 0,
      bearing: null,
      distanceM: null,
      destinationAngle: 0,
      isTracking: false,
      geoError: null,
      overshoot: false,
    });
  },
}));

export default useFlowStore;
