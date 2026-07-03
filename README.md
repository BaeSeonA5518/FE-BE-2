# freepass_korail (Frontend)

코레일 역 내부 경로 안내 **프론트엔드**. SMS 링크 또는 사용자 ID로 서비스에 진입하고, **백엔드가 내려준 경로(route)** 를 따라 GPS·기기 방향 센서로 실시간 안내하는 것을 목표로 한다.

**라이브 데모:** [https://fe-be-three.vercel.app/](https://fe-be-three.vercel.app/)

---

## 기술 스택

- **React 19**, **Vite 8**
- **Zustand** — 화면 흐름·경로·내비게이션 상태
- **styled-components** — 컴포넌트 스타일
- **Tailwind CSS 4** — 유틸리티 (Vite 플러그인)
- **Figma 절대 좌표 레이아웃** — `figmaLayout.js` 기반 픽셀 퍼펙트 UI
- **Geolocation API** + **DeviceOrientation API** — 위치·나침반 추적
- **Vibration API** — 도착 시 햅틱 피드백 (Android 등)

---

## 백엔드 API

베이스 URL: `http://43.201.30.167:8080`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/users/{userId}/guide` | 오늘 승차권 + 승강장까지 최적 경로 반환 |
| GET | `/api/users/{userId}/tickets` | 유저 승차권 목록 (출발 시각 내림차순) |
| GET | `/api/tickets` | 전체 승차권 조회 (`?userId=` 필터 가능) |
| GET | `/api/tickets/{ticketId}` | 승차권 단건 조회 |
| GET | `/api/paths?from=&to=` | 두 노드 간 최적 경로 (Dijkstra) |

### GuideResponse 주요 필드

```json
{
  "hasTicketToday": true,
  "message": "...",
  "ticket": { "ticketId": 1, "depStation": "제천", ... },
  "fromNode": "n01",
  "platformNode": "n18",
  "routeFound": true,
  "route": [{ "nodeId": "n01", "name": "3층 입구", "lat": 37.12, "lng": 128.20 }],
  "totalDistanceM": 74.9
}
```

---

## 역할 분담 (프론트 ↔ 백엔드)

| 담당 | 역할 |
|------|------|
| **백엔드** | 승차권 조회, 역 그래프 경로 탐색, **노드 순서 + 좌표** 반환 |
| **프론트** | GPS·나침반 추적, **현재 step 좌표**까지 bearing/거리 계산, 나침반 UI |

`bearingDeg`는 백엔드에서 주지 않아도 됨 — 프론트가 `GPS → route[current].lat/lng`로 계산한다.

---

## 현재 진행 상황

### ✅ 완료

- SMS 진입 화면 (`SMS_Entry`) — userId 입력 또는 URL `?token=` 기반 진입
- 화면 흐름 (Zustand `step`) — SMS → S1 → S2 → S3 → S4 → S5 → S5_1
- 새 백엔드 API 연동 — `tickets.js` (`fetchUserGuide`, `fetchUserTickets`, `fetchPath` 등)
- GuideResponse 정규화 — `fromNode`, `platformNode`, `routeFound`, `hasTicketToday` 처리
- S4 **길찾기 시작** → `GET /api/paths` (fromNode→platformNode) → `routeSteps` 저장 후 S5
- 경로 조회 실패 시 → E1 정적 안내 화면으로 폴백
- step 기반 내비 (`useNavigationTracking`) — 중간 waypoint(10m) / 최종 도착(3m) 판정
- S5 길찾기 UI — 나침반 링·목적지 점·화살표 (`useFollowAngle`, `S5NavigationArrow`)
- S5 안내 문구 — 경로 노드 `name` 사용
- S5_1 도착 UI — Figma 리플 링·체크 아이콘, `여기서 {호차}를 기다리세요.` 안내
- 출발 5분 전 출발시각 **빨간색** 강조 (`useDepartureUrgent`) — S5·S5_1 공통
- 도착 시 햅틱 진동 (`haptics.js`, S5_1 진입 시)
- 위치·방향 권한 (`S2_Permission`) — iOS 2단계, Safari/인앱 브라우저 안내
- GPS `watchPosition` + `deviceorientation` 추적
- Vite `/api` 프록시 → `loadEnv` 기반 `.env` 설정
- 역명 텍스트 줄바꿈 오류 수정 (E1, S5 화면)

### 🚧 다음 단계

- 출입구 선택 / GPS 기준 시작 노드 전달 (`fromNode` 파라미터 활용)
- 지도 SDK 연동 (`MapContainer` 현재 mock)
- GPS `course` fallback, `deviceorientationabsolute`, geo 단위 테스트
- `POST /api/v1/guide/complete` 완료 알림 연동

---

## 프로젝트 구조

```
src/
├─ App.jsx                         # step 라우팅, URL token → fetchSession
├─ store/
│  └─ useFlowStore.js              # step, ticketInfo, routeSteps, fromNode/toNode, GPS/나침반
├─ api/
│  ├─ config.js                    # API_BASE (VITE_API_BASE_URL)
│  ├─ client.js                    # fetch 래퍼, ApiError
│  ├─ normalize.js                 # 백엔드 응답 → 내부 모델 정규화
│  ├─ guide.js                     # fetchSession, fetchRoute (구 API)
│  └─ tickets.js                   # fetchUserGuide, fetchUserTickets, fetchPath 등 (새 API)
├─ components/
│  ├─ SMS_Entry.jsx                # SMS 진입 또는 userId 입력 → fetchUserGuide
│  ├─ S1_Join.jsx                  # 서비스 진입
│  ├─ S2_Permission.jsx            # 위치·방향 권한
│  ├─ S3._CheckFloor.jsx           # 층 확인
│  ├─ S4_Standby.jsx               # fetchPath → S5 (실패 시 E1 폴백)
│  ├─ S5_Navigation.jsx            # 실시간 길찾기 (나침반 UI)
│  ├─ S5_1_Arrived.jsx             # 도착 (체크·햅틱·출발 임박 색상)
│  ├─ E1_StaticGuide.jsx           # 정적 안내
│  ├─ E2_MoveGuide.jsx             # 2층 이동 안내
│  └─ common/
│     ├─ Layout.jsx                # 402×874 모바일 프레임 + 스케일
│     ├─ MapContainer.jsx          # 지도 mock (추후 SDK 교체)
│     ├─ S5NavigationArrow.jsx     # S5 나침반 화살표
│     ├─ PermissionModal.jsx
│     └─ GeolocationDeniedModal.jsx
├─ hooks/
│  ├─ useGeolocation.js            # watchPosition, 권한 요청
│  ├─ useDeviceOrientation.js      # heading, iOS requestPermission
│  ├─ useNavigationTracking.js     # step별 GPS 추적, 도착·step 전환
│  ├─ useFollowAngle.js            # 화살표 부드러운 회전
│  └─ useDepartureUrgent.js        # 출발 5분 전 여부 (실시간 갱신)
├─ utils/
│  ├─ geo.js                       # Haversine, bearing, normalizeAngle
│  ├─ time.js                      # 출발시각 파싱·임박 판정
│  └─ haptics.js                   # 도착 진동 (navigator.vibrate)
└─ styles/
   ├─ theme.js                     # 색상·타이포·screenConfig
   └─ figmaLayout.js               # Figma 절대 좌표 (s4, s5, s5_1 등)
```

---

## 상태 흐름

```
[진입 방법 1] SMS 화면에서 userId 입력
  └─ fetchUserGuide(userId) → ticketInfo + fromNode + platformNode + route

[진입 방법 2] URL ?token=<token>
  └─ fetchSession(token) → ticketInfo, reservationId

S1 → S2 (권한) → S3 (층) → S4 (타는 곳 확정)
  └─ fetchPath({ from: fromNode, to: platformNode }) → routeSteps[]
       실패 시 → E1 정적 안내

S5 길찾기
  └─ useNavigationTracking
       GPS + deviceorientation
       target = routeSteps[currentStepIndex]  (lat, lng)
       bearing/거리 = GPS → target (프론트 계산)
       instruction = steps[i].name            (백엔드 노드명)
       │
       ├─ 중간 step: distance ≤ 10m → advanceStep()
       └─ 마지막 step: distance ≤ 3m → S5_1

S5_1 도착
  └─ vibrateOnArrival() (햅틱)
  └─ 닫기(X) → resetFlow() → SMS
```

### 내비게이션 계산

| 항목 | 담당 |
|------|------|
| 경로·노드 순서 | 백엔드 `GET /api/paths` 또는 `GET /api/users/{id}/guide` |
| 현재 목표 좌표 | `routeSteps[currentStepIndex]` |
| 거리 `distanceM` | 프론트 Haversine (GPS ↔ 현재 step) |
| 방위각 `bearing` | 프론트 `getBearing(GPS, step)` |
| 화면 각도 `destinationAngle` | `bearing - heading` |
| step 전환 | 프론트 (반경 도달 시 `advanceStep`) |
| 출발시각 색상 | 프론트 `useDepartureUrgent` (5분 이하 → `#E53935`) |

### 화면 step (`useFlowStore.step`)

| step | 화면 |
|------|------|
| `SMS` | 문자 진입 / userId 입력 |
| `S1` | 서비스 진입 |
| `S2` | 위치·방향 권한 |
| `S3` | 2층 확인 |
| `S4` | 타는 곳 확정 → 경로 로딩 |
| `S5` | 실시간 길찾기 |
| `S5_1` | 도착 (햅틱·체크 UI) |
| `E1` / `E2` | 정적·이동 안내 |

---

## 실행 방법

### 1. 설치

```bash
npm install
```

### 2. 환경변수

`.env` 파일을 생성하고 백엔드 주소를 설정한다.

```bash
# Vite dev 서버 프록시 대상 (실제 백엔드)
VITE_API_PROXY_TARGET=http://43.201.30.167:8080
```

### 3. 개발 서버

```bash
npm run dev
```

브라우저에서 `http://localhost:5173/` 접속 후 SMS 화면에서 userId를 입력해 시작한다.

```
# URL token 방식 (기존)
http://localhost:5173/?token=<백엔드_세션_토큰>

# userId 방식 (신규)
http://localhost:5173/   → SMS 화면에서 userId 입력
```

- **HTTPS 권장:** iOS Safari `deviceorientation`은 HTTPS(또는 localhost)에서만 동작.
- **인앱 브라우저:** 카카오톡 등 Geolocation 차단 가능 → Safari에서 직접 열기.
- **햅틱:** `navigator.vibrate`는 Android Chrome 등에서 동작. iOS Safari는 미지원.

### 4. 빌드·미리보기

```bash
npm run build
npm run preview
```

### 5. 배포

Vercel에 연결되어 있으며, 커밋 SHA가 `__BUILD_ID__`로 빌드에 포함된다.  
프로덕션 API URL이 프론트와 다른 도메인이면 Vercel 환경변수에 `VITE_API_PROXY_TARGET` 설정 또는 리버스 프록시로 `/api` 연결.

---
