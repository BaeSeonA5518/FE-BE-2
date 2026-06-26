/**
 * 보호자 알림 — 길찾기 완료 API
 * @param {string} reservationId
 */
export async function completeGuide(reservationId) {
  const response = await fetch('/api/v1/guide/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reservationId }),
  });

  if (!response.ok) {
    throw new Error(`guide/complete failed: ${response.status}`);
  }

  return response.json();
}
