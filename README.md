# freepass_korail (Frontend)

코레일 역 내부 경로 안내 **프론트엔드**. SMS 링크·승차권 정보로 서비스에 진입하고, **백엔드가 내려준 경로(steps)** 를 따라 GPS·기기 방향 센서로 실시간 안내하는 것을 목표로 한다.

**라이브 데모:** [https://korail-fe.vercel.app/](https://korail-fe.vercel.app/)

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

## 역할 분담 (프론트 ↔ 백엔드)

| 담당 | 역할 |
|------|------|
| **백엔드** | 승차권 조회, 역 그래프 경로 탐색, **노드 순서 + 좌표 + instruction** 반환 |
| **프론트** | GPS·나침반 추적, **현재 step 좌표**까지 bearing/거리 계산, 나침반 UI |

`bearingDeg`는 백엔드에서 주지 않아도 됨 — 프론트가 `GPS → steps[current].lat/lng`로 계산한다.

---

## 현재 진행 상황

### ✅ 완료

- SMS 진입 화면 (`SMS_Entry`) — URL `?token=` 기반 `fetchSession`
- 화면 흐름 (Zustand `step`) — SMS → S1 → S2 → S3 → S4 → S5 → S5_1
- API 레이어 — `client` / `normalize` / `guide` (mock 없음, 백엔드 응답 정규화)
- S4 **길찾기 시작** → `fetchRoute` → `routeSteps` 저장 후 S5
- step 기반 내비 (`useNavigationTracking`) — 중간 waypoint(10m) / 최종 도착(3m) 판정
- S5 길찾기 UI — 나침반 링·목적지 점·화살표 (`useFollowAngle`, `S5NavigationArrow`)
- S5 안내 문구 — API `steps[].instruction` 사용
- S5_1 도착 UI — Figma 리플 링·체크 아이콘, `여기서 {호차}를 기다리세요.` 안내
- 출발 5분 전 출발시각 **빨간색** 강조 (`useDepartureUrgent`) — S5·S5_1 공통
- 도착 시 햅틱 진동 (`haptics.js`, S5_1 진입 시) + `POST /api/v1/guide/complete`
- 위치·방향 권한 (`S2_Permission`) — iOS 2단계, Safari/인앱 브라우저 안내
- GPS `watchPosition` + `deviceorientation` 추적
- Vite `/api` 프록시 → `localhost:8080`
- Vercel 배포 (`__BUILD_ID__` 빌드 식별)

### 🚧 다음 단계

- 백엔드 API 실연동 테스트
- 출입구 선택 / GPS 기준 시작 노드 전달
- 지도 SDK 연동 (`MapContainer` 현재 mock)
- GPS `course` fallback, `deviceorientationabsolute`, geo 단위 테스트

---

## 프로젝트 구조

```
src/
├─ App.jsx                         # step 라우팅, URL token → fetchSession
├─ store/
│  └─ useFlowStore.js              # step, ticketInfo, routeSteps, GPS/나침반
├─ api/
│  ├─ config.js                    # API_BASE (VITE_API_BASE_URL)
│  ├─ client.js                    # fetch 래퍼, ApiError
│  ├─ normalize.js                 # 백엔드 응답 → 내부 모델 정규화
│  └─ guide.js                     # fetchSession, fetchRoute, completeGuide
├─ components/
│  ├─ SMS_Entry.jsx                # SMS 진입 → fetchSession(token)
│  ├─ S1_Join.jsx                  # 서비스 진입
│  ├─ S2_Permission.jsx            # 위치·방향 권한
│  ├─ S3._CheckFloor.jsx           # 층 확인
│  ├─ S4_Standby.jsx               # fetchRoute → S5
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
   └─ figmaLayout.js               # Figma 절대 좌표 (s5, s5_1 등)
```

---

## API 응답 처리

백엔드 응답은 `normalize.js`에서 내부 모델로 변환한다.

- **camelCase / snake_case** 모두 수용 (`reservationId` / `reservation_id` 등)
- **session** — `reservationId` + `ticket` 필수
- **route** — `routeId` + `steps[]` 필수, 각 step에 `lat`/`lng`/`instruction` 검증
- 변환 실패 시 `Error` throw → 화면에서 에러 메시지 표시

---

## 상태 흐름

```
SMS / URL ?token=
  └─ fetchSession(token) → ticketInfo, reservationId
S1 → S2 (권한) → S3 (층) → S4 (대기)
  └─ fetchRoute({ reservationId, lat?, lng? }) → routeSteps[]
S5 길찾기
  └─ useNavigationTracking
       GPS + deviceorientation
       target = routeSteps[currentStepIndex]  (lat, lng)
       bearing/거리 = GPS → target (프론트 계산)
       instruction = steps[i].instruction     (백엔드 제공)
       │
       ├─ 중간 step: distance ≤ 10m → advanceStep()
       └─ 마지막 step: distance ≤ 3m → S5_1 + completeGuide
S5_1 도착
  └─ vibrateOnArrival() (햅틱)
  └─ 닫기(X) → resetFlow() → SMS
```

### 내비게이션 계산

| 항목 | 담당 |
|------|------|
| 경로·노드 순서·안내 문구 | 백엔드 API `steps[]` |
| 현재 목표 좌표 | `routeSteps[currentStepIndex]` |
| 거리 `distanceM` | 프론트 Haversine (GPS ↔ 현재 step) |
| 방위각 `bearing` | 프론트 `getBearing(GPS, step)` |
| 화면 각도 `destinationAngle` | `bearing - heading` |
| step 전환 | 프론트 (반경 도달 시 `advanceStep`) |
| 출발시각 색상 | 프론트 `useDepartureUrgent` (5분 이하 → `#E53935`) |

### 화면 step (`useFlowStore.step`)

| step | 화면 |
|------|------|
| `SMS` | 문자 진입 |
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

`.env.example` 참고.

```bash
# 선택 — 비우면 dev에서 Vite 프록시가 /api → localhost:8080 전달
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:8080
```

### 3. 개발 서버

```bash
npm run dev
```

백엔드(`./gradlew bootRun`)를 `localhost:8080`에서 함께 실행한다.

```
http://localhost:5173/?token=<백엔드_세션_토큰>
```

- **HTTPS 권장:** iOS Safari `deviceorientation`은 HTTPS(또는 localhost)에서만 동작.
- **인앱 브라우저:** 카카오톡 등 Geolocation 차단 가능 → Safari에서 직접 열기.
- **햅틱:** `navigator.vibrate`는 Android Chrome 등에서 동작. iOS Safari는 미지원.

### 4. URL 파라미터 (진입)

```
http://localhost:5173/?token=<token>
http://localhost:5173/?reservationId=<token>
```

`token`이 있으면 `fetchSession` 후 S1부터 시작 (SMS 건너뜀).  
SMS 화면에서「동행안내 시작하기」도 동일한 URL `token`이 필요하다.

### 5. 빌드·미리보기

```bash
npm run build
npm run preview
```

### 6. 배포

Vercel에 연결되어 있으며, 커밋 SHA가 `__BUILD_ID__`로 빌드에 포함된다.  
프로덕션 API URL이 프론트와 다른 도메인이면 Vercel 환경변수에 `VITE_API_BASE_URL` 설정 또는 리버스 프록시로 `/api` 연결.

---