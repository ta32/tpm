import { useUser, useUserDispatch } from 'contexts/user.context';
import TrezorConnect, { UI, UI_EVENT, UiEventMessage } from '@trezor/connect-web';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { setTrezorUiEventHandler } from 'lib/trezor';
import { useEffect, useRef } from 'react';

export function useTrezorUiEvents() {
  const isInitialized = useRef(false);
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
  const userDispatchRef = useRef(userDispatch);
  const userRef = useRef(user);

  useEffect(() => {
    userDispatchRef.current = userDispatch;
  }, [userDispatch]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!isInitialized.current) {
      const uiEventCb = (event: UiEventMessage) => {
        const user = userRef.current;
        const userDispatch = userDispatchRef.current;
        if (event.type === UI.REQUEST_PIN) {
          userDispatch({ type: 'SHOW_PIN_DIALOG' });
        } else if (event.type === UI.REQUEST_BUTTON) {
          userDispatch({ type: 'ASK_FOR_CONFIRMATION' });
        } else if (user.status === UserStatus.TREZOR_REQ_CONFIRMATION && event.type === UI.CLOSE_UI_WINDOW) {
          userDispatch({ type: 'CONFIRMATION_ENTERED' });
        } else {
          console.warn('Unknown UI event', event);
        }
      };
      setTrezorUiEventHandler(uiEventCb);
      isInitialized.current = true;
    }
  }, []);
  return isInitialized.current;
}