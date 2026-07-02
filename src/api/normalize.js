/**
 * @typedef {Object} TicketInfo
 * @property {string} trainName
 * @property {string} travelDate
 * @property {string} departureStation
 * @property {string} arrivalStation
 * @property {string} departureTime
 * @property {string} arrivalTime
 * @property {string} platform
 * @property {string} carNumber
 * @property {string} seatNumber
 * @property {string} seatClass
 * @property {string} ticketNumber
 */

/**
 * @typedef {Object} RouteStep
 * @property {number} order
 * @property {string} nodeId
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {number} [layer]
 * @property {string} instruction
 */

/**
 * @typedef {Object} GuideSession
 * @property {string} reservationId
 * @property {TicketInfo} ticket
 */

/**
 * @typedef {Object} GuideRoute
 * @property {string} routeId
 * @property {string} [startNodeId]
 * @property {string} [endNodeId]
 * @property {number} [totalDistanceM]
 * @property {RouteStep[]} steps
 */

/**
 * @param {Record<string, unknown>} raw
 * @returns {TicketInfo}
 */
export function normalizeTicket(raw = {}) {
  return {
    trainName: String(raw.trainName ?? raw.train_name ?? ''),
    travelDate: String(raw.travelDate ?? raw.travel_date ?? ''),
    departureStation: String(raw.departureStation ?? raw.departure_station ?? ''),
    arrivalStation: String(raw.arrivalStation ?? raw.arrival_station ?? ''),
    departureTime: String(raw.departureTime ?? raw.departure_time ?? ''),
    arrivalTime: String(raw.arrivalTime ?? raw.arrival_time ?? ''),
    platform: String(raw.platform ?? ''),
    carNumber: String(raw.carNumber ?? raw.car_number ?? ''),
    seatNumber: String(raw.seatNumber ?? raw.seat_number ?? ''),
    seatClass: String(raw.seatClass ?? raw.seat_class ?? ''),
    ticketNumber: String(raw.ticketNumber ?? raw.ticket_number ?? ''),
  };
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {RouteStep}
 */
export function normalizeRouteStep(raw) {
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error(`유효하지 않은 step 좌표: nodeId=${raw.nodeId ?? raw.node_id}`);
  }

  return {
    order: Number(raw.order ?? 0),
    nodeId: String(raw.nodeId ?? raw.node_id ?? ''),
    name: String(raw.name ?? ''),
    lat,
    lng,
    layer: raw.layer != null ? Number(raw.layer) : undefined,
    instruction: String(raw.instruction ?? ''),
  };
}

/**
 * @param {Record<string, unknown>} data
 * @returns {GuideSession}
 */
export function normalizeSession(data) {
  const reservationId = data.reservationId ?? data.reservation_id;
  if (!reservationId) {
    throw new Error('세션 응답에 reservationId가 없습니다.');
  }

  const ticketRaw = data.ticket ?? data;
  return {
    reservationId: String(reservationId),
    ticket: normalizeTicket(ticketRaw),
  };
}

/**
 * @param {Record<string, unknown>} data
 * @returns {GuideRoute}
 */
export function normalizeRoute(data) {
  const stepsRaw = data.steps ?? data.routeSteps ?? data.route_steps;
  if (!Array.isArray(stepsRaw) || stepsRaw.length === 0) {
    throw new Error('경로 응답에 steps가 없습니다.');
  }

  const steps = stepsRaw.map(normalizeRouteStep).sort((a, b) => a.order - b.order);
  const routeId = data.routeId ?? data.route_id;
  if (!routeId) {
    throw new Error('경로 응답에 routeId가 없습니다.');
  }

  return {
    routeId: String(routeId),
    startNodeId: data.startNodeId ?? data.start_node_id,
    endNodeId: data.endNodeId ?? data.end_node_id,
    totalDistanceM:
      data.totalDistanceM != null
        ? Number(data.totalDistanceM)
        : data.total_distance_m != null
          ? Number(data.total_distance_m)
          : undefined,
    steps,
  };
}
