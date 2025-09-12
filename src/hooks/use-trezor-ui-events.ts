import { useUser, useUserDispatch } from 'contexts/user.context';
import { UI, UiEventMessage } from '@trezor/connect-web';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { setTrezorUiEventHandler } from 'lib/trezor';
import { useEffect, useRef } from 'react';

export function useTrezorUiEvents() {
  const isInitialized = useRef(false);
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
  const userRef = useRef(user);
  const userDispatchRef = useRef(userDispatch);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    userDispatchRef.current = userDispatch;
  }, [userDispatch]);

  useEffect(() => {
    if (!isInitialized.current) {
      const uiEventCb = (event: UiEventMessage) => {
        const user = userRef.current;
        const userDispatch = userDispatchRef.current;
        switch (event.type) {
          case UI.REQUEST_PIN:
            userDispatch({ type: 'SHOW_PIN_DIALOG' });
            break;
          case UI.REQUEST_BUTTON:
            userDispatch({ type: 'ASK_FOR_CONFIRMATION' });
            break;
          case UI.CLOSE_UI_WINDOW:
            if (user.status === UserStatus.TREZOR_REQ_CONFIRMATION) {
              userDispatch({ type: 'CONFIRMATION_ENTERED' });
            }
            break;
          default:
            break;
        }
      };
      setTrezorUiEventHandler(uiEventCb);
      isInitialized.current = true;
    }
  }, []);
  return isInitialized.current;
}
