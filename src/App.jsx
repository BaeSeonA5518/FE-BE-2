import React, { useEffect } from 'react';
import GlobalStyle from './styles/GlobalStyles';
import Layout from './components/common/Layout';
import MapContainer from './components/common/MapContainer';
import useFlowStore from './store/useFlowStore';
import { screenConfig } from './styles/theme';

import SMS_Entry from './components/SMS_Entry';
import S1_Join from './components/S1_Join';
import S2_Permission from './components/S2_Permission';
import S3_CheckFloor from './components/S3._CheckFloor';
import S4_Standby from './components/S4_Standby';
import S5_Navigation from './components/S5_Navigation';
import S5_1_Arrived from './components/S5_1_Arrived';
import E1_StaticGuide from './components/E1_StaticGuide';
import E2_MoveGuide from './components/E2_MoveGuide';

import { defaultTicket } from './data/defaultTicket';

function App() {
  const { step, setStep, setReservation } = useFlowStore();
  const currentScreen = screenConfig[step] || screenConfig.S1;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('reservationId');

    if (id) {
      setReservation(id, defaultTicket);
      setStep('S1');
    }
  }, [setReservation, setStep]);

  const renderStepComponent = () => {
    switch (step) {
      case 'SMS':
        return <SMS_Entry />;
      case 'S1':
        return <S1_Join />;
      case 'S2':
        return <S2_Permission />;
      case 'S3':
        return <S3_CheckFloor />;
      case 'S4':
        return <S4_Standby />;
      case 'S5':
        return <S5_Navigation />;
      case 'S5_1':
        return <S5_1_Arrived />;
      case 'E1':
        return <E1_StaticGuide />;
      case 'E2':
        return <E2_MoveGuide />;
      default:
        return <S1_Join />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <Layout style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
          <MapContainer />
        </div>

        <div
          style={{
            position: currentScreen.showMap ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
          }}
        >
          {renderStepComponent()}
        </div>
      </Layout>
    </>
  );
}

export default App;
