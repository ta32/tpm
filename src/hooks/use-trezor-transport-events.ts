import { useContext, useEffect, useRef } from 'react';
import { useUserDispatch } from 'contexts/user.context';
import { TransportEventMessage } from '@trezor/connect-web';
import { DependenciesContext } from 'contexts/deps.context';

export function useTrezorTransportEvents() {
  const { trezor } = useContext(DependenciesContext);
  const isInitialized = useRef(false);
  const [userDispatch] = useUserDispatch();
  const userDispatchRef = useRef(userDispatch);

  useEffect(() => {
    userDispatchRef.current = userDispatch;
  }, [userDispatch]);

  useEffect(() => {
    if (!isInitialized.current) {
      const { setTrezorTransportEventHandler } = trezor();
      const transportEventCb = (event: TransportEventMessage) => {
        let userDispatch = userDispatchRef.current;
        switch (event.type) {
          case 'transport-error':
            userDispatch({ type: 'TREZOR_BRIDGE_UNAVAILABLE', errorMsg: event.payload.error });
            break;
          case 'transport-start':
            userDispatch({ type: 'TREZOR_BRIDGE_AVAILABLE', msg: event.payload.version });
            break;
          default:
            console.warn('Unknown transport event:', event);
        }
      };
      setTrezorTransportEventHandler(transportEventCb);
      isInitialized.current = true;
    }
  }, [trezor]);
  return isInitialized.current;
}
