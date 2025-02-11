import { useEffect, useRef } from 'react';
import { DEVICE, DeviceEventMessage, KnownDevice, UnknownDevice } from '@trezor/connect-web';
import { getDevice, setTrezorDeviceEventHandler } from '../lib/trezor';
import { useUserDispatch } from '../contexts/user.context';

export function useTrezorDeviceEvents() {
  const isInitialized = useRef(false);
  const [userDispatch] = useUserDispatch();
  const userDispatchRef = useRef(userDispatch);

  useEffect(() => {
    userDispatchRef.current = userDispatch;
  }, [userDispatch]);

  useEffect(() => {
    if (!isInitialized.current) {
      const updateDevice = (event: DeviceEventMessage) => {
        const userDispatch = userDispatchRef.current;
        if (event.type === DEVICE.CONNECT) {
          switch (event.payload.type) {
            case 'acquired':
              const device = getDevice(extractDeviceInfo(event.payload));
              userDispatch({ type: 'ADD_DEVICE', device: device});
              break;
            case 'unacquired':
              const unacquiredDevice = getDevice(extractDeviceInfo(event.payload));
              userDispatch({ type: 'ADD_DEVICE', device: unacquiredDevice });
              break;
            default:
              console.error('Unreadable device');
          }
        } else if (event.type === DEVICE.CONNECT_UNACQUIRED) {
          userDispatch({ type: 'ADD_DEVICE', device: null });
        }
        if (event.type === DEVICE.DISCONNECT) {
          userDispatch({ type: 'REMOVE_DEVICE' });
        }
      };
      setTrezorDeviceEventHandler(updateDevice);
      isInitialized.current = true;
    }
  }, []);
  return isInitialized.current;
}

function extractDeviceInfo(payload: KnownDevice | UnknownDevice): { label: string, model: string, deviceId: string } {
  return {
    label: payload.label,
    model: payload.features?.model || '',
    deviceId: payload.features?.device_id || '',
  };
}