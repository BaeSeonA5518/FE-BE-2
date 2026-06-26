import { create } from 'zustand';
import { defaultTicket } from '../data/defaultTicket';
import { DEFAULT_DESTINATION } from '../data/destination';

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

const useFlowStore = create((set, get) => ({
  step: 'SMS',
  mapInstance: null,
  voiceGuide: true,

  reservationId: null,
  ticketInfo: { ...emptyTicket },

  destination: { ...DEFAULT_DESTINATION },
  position: null,
  heading: 0,
  bearing: null,
  distanceM: null,
  destinationAngle: 0,
  isTracking: false,
  geoError: null,

  setStep: (nextStep) => set({ step: nextStep }),

  setReservation: (id, info) =>
    set({
      reservationId: id,
      ticketInfo: { ...get().ticketInfo, ...defaultTicket, ...info },
    }),

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
