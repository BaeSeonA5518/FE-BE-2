import { create } from 'zustand';

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

const useFlowStore = create((set, get) => ({
  step: 'SMS',
  mapInstance: null,
  voiceGuide: true,

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

  destination: null,
  position: null,
  heading: 0,
  bearing: null,
  distanceM: null,
  destinationAngle: 0,
  isTracking: false,
  geoError: null,

  setStep: (nextStep) => set({ step: nextStep }),

  setReservation: (id, info, fromNode = null, toNode = null) =>
    set({
      reservationId: id,
      ticketInfo: { ...emptyTicket, ...info },
      fromNode,
      toNode,
    }),

  setRouteLoading: (routeLoading) => set({ routeLoading }),
  setRouteError: (routeError) => set({ routeError }),

  setRoute: (route) => {
    const steps = route?.steps ?? [];
    const first = steps[0] ?? null;

    set({
      routeId: route?.routeId ?? null,
      routeSteps: steps,
      totalDistanceM: route?.totalDistanceM ?? null,
      currentStepIndex: 0,
      currentInstruction: first?.instruction ?? '',
      destination: stepToDestination(first),
      routeError: null,
      distanceM: null,
      bearing: null,
      destinationAngle: 0,
    });
  },

  getCurrentStep: () => {
    const { routeSteps, currentStepIndex } = get();
    return routeSteps[currentStepIndex] ?? null;
  },

  advanceStep: () => {
    const { routeSteps, currentStepIndex } = get();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= routeSteps.length) return false;

    const next = routeSteps[nextIndex];
    set({
      currentStepIndex: nextIndex,
      currentInstruction: routeSteps[currentStepIndex]?.instruction ?? '',
      destination: stepToDestination(next),
      distanceM: null,
      bearing: null,
      destinationAngle: 0,
    });
    return true;
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

  resetFlow: () =>
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
      destination: null,
      position: null,
      heading: 0,
      bearing: null,
      distanceM: null,
      destinationAngle: 0,
      isTracking: false,
      geoError: null,
    }),
}));

export default useFlowStore;
