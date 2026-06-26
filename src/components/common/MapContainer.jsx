import React, { useEffect } from 'react';
import useFlowStore from '../../store/useFlowStore';
import { colors } from '../../styles/theme';

function MapContainer() {
  const setMapInstance = useFlowStore((state) => state.setMapInstance);

  useEffect(() => {
    const marker = { lat: null, lng: null, rotation: 0 };

    const mockMapInstance = {
      marker,
      panTo: (coords) => {
        console.log(`[지도 이동] 위도: ${coords.lat}, 경도: ${coords.lng}`);
      },
      setZoom: (level) => console.log(`[지도 줌] 레벨 ${level}`),
      setMarkerPosition: (lat, lng) => {
        marker.lat = lat;
        marker.lng = lng;
        console.log(`[마커 이동] ${lat}, ${lng}`);
      },
      setMarkerRotation: (deg) => {
        marker.rotation = deg;
        console.log(`[마커 회전] ${deg}°`);
      },
    };

    setMapInstance(mockMapInstance);
    return () => setMapInstance(null);
  }, [setMapInstance]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: colors.mapPlaceholder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.primary,
        fontWeight: 600,
        fontSize: '16px',
      }}
    >
      🗺️ 지도 영역
    </div>
  );
}

export default MapContainer;
