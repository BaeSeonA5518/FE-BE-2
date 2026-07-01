# freepass_korail (Frontend)

코레일 역 내부 경로 안내 **프론트엔드**. SMS 링크·승차권 정보로 서비스에 진입하고, GPS·기기 방향 센서를 이용해 승강장까지의 방향·거리를 실시간 안내하는 것을 목표로 한다.

**라이브 데모:** [https://korail-fe.vercel.app/](https://korail-fe.vercel.app/)

---

## 기술 스택

- **React 19**, **Vite 8**
- **Zustand** — 화면 흐름·내비게이션 상태
- **styled-components** — 컴포넌트 스타일
- **Tailwind CSS 4** — 유틸리티 (Vite 플러그인)
- **Geolocation API** + **DeviceOrientation API** — 위치·나침반 추적

---

## 현재 진행 상황

### ✅ 완료

- SMS 진입 화면 (`SMS_Entry`) — 승차권 문자 UI + 서비스 시작
- 화면 흐름 (Zustand `step`) — SMS → S1 → S2 → S3 → S4 → S5 → S5_1
- 승차권 mock 데이터 (`defaultTicket.js`) + URL `?reservationId=` 진입
- 위치·방향 권한 요청 (`S2_Permission`) — iOS 2단계(방향 → 위치), Safari/인앱 브라우저 안내
- GPS `watchPosition` + `deviceorientation` 추적 (`useGeolocation`, `useDeviceOrientation`)
- Haversine 거리·방위각·나침반 화살표 (`utils/geo.js`, `useNavigationTracking`)
- S5 길찾기 UI — 나침반 링·목적지 점·화살표 애니메이션 (`useFollowAngle`, `S5NavigationArrow`)
- 도착 판정 (3m 이내) → S5_1 + 진동 + `POST /api/v1/guide/complete` 호출
- Figma 좌표 기반 레이아웃 (`figmaLayout.js`, `Layout.jsx` 스케일링)
- Vercel 배포 (`__BUILD_ID__` 빌드 식별)

### 🚧 다음 단계

- 백엔드 경로 API 연동 
- 목적지 mock → 승차권·역 그래프 기반 동적 목적지
- 지도 SDK 연동 (`MapContainer` 현재 mock)
- S5_1 도착 화면 polish
- GPS `course` fallback, `deviceorientationabsolute`, geo 단위 테스트

---

## 프로젝트 구조

```
src/
├─ App.jsx                         # step 라우팅, URL reservationId 처리
├─ store/
│  └─ useFlowStore.js              # step, ticketInfo, GPS/나침반 상태
├─ components/
│  ├─ SMS_Entry.jsx                # SMS 문자 진입
│  ├─ S1_Join.jsx                  # 서비스 진입·승차권 확인
│  ├─ S2_Permission.jsx            # 위치·방향 권한
│  ├─ S3._CheckFloor.jsx           # 층 확인
│  ├─ S4_Standby.jsx               # 타는 곳 확정
│  ├─ S5_Navigation.jsx            # 실시간 길찾기 (나침반 UI)
│  ├─ S5_1_Arrived.jsx             # 도착
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
│  ├─ useNavigationTracking.js     # GPS+방향 → store, 도착 판정
│  └─ useFollowAngle.js            # 화살표 부드러운 회전
├─ utils/
│  └─ geo.js                       # Haversine, bearing, normalizeAngle
├─ data/
│  ├─ defaultTicket.js             # mock 승차권
│  └─ destination.js               # mock 목적지 (제천역 5번 승강장)
├─ api/
│  └─ guide.js                     # guide/complete API
└─ styles/
   ├─ theme.js                     # 색상·타이포·screenConfig
   └─ figmaLayout.js               # Figma 절대 좌표
```

---

## 상태 흐름

```
SMS (문자 링크)
  └─ setReservation + setStep('S1')
S1 (승차권 확인) → S2 (권한) → S3 (층) → S4 (대기) → S5 (길찾기)
                                                      │
                              useNavigationTracking ◀─┘
                              GPS watchPosition + deviceorientation
                                      │
                    distanceM, bearing, destinationAngle → Zustand
                                      │
              S5 UI: 나침반 점(목적지 방향) + 화살표(부드러운 추적)
                                      │
                    distanceM ≤ 3m → S5_1 (도착) + completeGuide API
```

### 내비게이션 계산 (현재)

| 항목 | 방식 |
|------|------|
| 목적지 | `destination.js` 고정 좌표 (mock) |
| 거리 | Haversine (GPS ↔ 목적지) |
| 방위각 `bearing` | GPS → 목적지 직선 방향 |
| 화면 각도 `destinationAngle` | `bearing - heading` (기기가 향한 방향 기준) |
| 안내 문구 | 거리 구간별 고정 문자열 (`getGuideMessage`) |

> **참고:** 현재 S5는 **턴-by-턴 경로 안내가 아님**. 백엔드 그래프 경로 API 연동 후 step별 `bearingDeg`·`instruction`을 사용하도록 확장 예정.

### 화면 step (`useFlowStore.step`)

| step | 화면 |
|------|------|
| `SMS` | 문자 진입 |
| `S1` | 서비스 진입 |
| `S2` | 위치·방향 권한 |
| `S3` | 2층 확인 |
| `S4` | 타는 곳 확정 |
| `S5` | 실시간 길찾기 |
| `S5_1` | 도착 |
| `E1` / `E2` | 정적·이동 안내 |

---

## 실행 방법

### 1. 설치

```bash
npm install
```

### 2. 개발 서버

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

- **HTTPS 권장:** iOS Safari에서 `deviceorientation` 권한은 HTTPS(또는 localhost)에서만 동작.
- **인앱 브라우저:** 카카오톡 등에서는 Geolocation이 차단될 수 있음 → Safari에서 직접 열기.

### 3. 빌드·미리보기

```bash
npm run build
npm run preview
```

### 4. URL 파라미터 (승차권 진입 테스트)

```
http://localhost:5173/?reservationId=mock-reservation-001
```

`reservationId`가 있으면 S1부터 시작 (SMS 건너뜀).

### 5. 배포

Vercel에 연결되어 있으며, 커밋 SHA가 `__BUILD_ID__`로 빌드에 포함된다.

---
