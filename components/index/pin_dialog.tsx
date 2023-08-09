import React, { useCallback } from "react";
import styles from "./pin_dialog.module.scss";

function highlightKeyPress(id: string) {
  let highlightTimeMs = parseInt(styles.keyHighlightTimeMs.replace("ms", ""));
  let element = document.getElementById(id);
  element?.classList.add(styles.active);
  setTimeout(() => {
    element?.classList.remove(styles.active);
  }, highlightTimeMs);
}

function hideText(text: string) {
  let hiddenText = text.replace(/./g, "•");
  let maxPinDisplayLength = parseInt(styles.maxPinDisplayLength);
  if (hiddenText.length > maxPinDisplayLength) {
    hiddenText = hiddenText.slice(0, 9);
  }
  return hiddenText;
}

interface PinDialogState {
  pin: string;
  pinDialogText: string;
}

interface PinDialogProps {
  submitCallback: (pin: string) => void;
}

export default function PinDialog({ submitCallback }: PinDialogProps) {
  let [pinDialogState, setPinDialogState] = React.useState<PinDialogState>({
    pin: "",
    pinDialogText: "Please enter your PIN",
  });

  const pinAdd = useCallback(
    (id: string) => {
      highlightKeyPress(id);
      let pin = pinDialogState.pin;
      pin = pin + id;
      setPinDialogState({ ...pinDialogState, pin: pin });
    },
    [pinDialogState]
  );

  const pinBackspace = useCallback(() => {
    highlightKeyPress(styles.backspace);
    let pin = pinDialogState.pin;
    pin = pin.slice(0, -1);
    setPinDialogState({ ...pinDialogState, pin: pin });
  }, [pinDialogState]);

  const pinEnter = useCallback(() => {
    highlightKeyPress(styles.enter);
    submitCallback(pinDialogState.pin);
  }, [pinDialogState, submitCallback]);

  const pinKeyDownHandler = useCallback(
    (event: KeyboardEvent) => {
      let keyCode = event.code;
      // if digit
      if (
        (keyCode >= "Digit0" && keyCode <= "Digit9") ||
        (keyCode >= "Numpad0" && keyCode <= "Numpad9")
      ) {
        pinAdd(event.key);
      }
      if (keyCode === "Enter") {
        pinEnter();
      }
      if (keyCode === "Backspace") {
        pinBackspace();
      }
    },
    [pinAdd, pinEnter, pinBackspace]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", pinKeyDownHandler);
    return () => {
      window.removeEventListener("keydown", pinKeyDownHandler);
    };
  }, [pinDialogState, pinKeyDownHandler]);

  return (
    <div className={styles.pin_dialog}>
      <div className={styles.pin_table_header}>
        {pinDialogState.pinDialogText}
      </div>
      <div className={styles.pin_table_subheader}>
        {"Look at the device for number positions."}
      </div>
      <div className={styles.pin_password}>
        <span className={styles.password_text}>
          {hideText(pinDialogState.pin)}
        </span>
        <span className={styles.blinking_cursor} />
      </div>
      <div className={styles.pin_table}>
        <div>
          <button type="button" id="7" onClick={() => pinAdd("7")}>
            &#8226;
          </button>
          <button type="button" id="8" onClick={() => pinAdd("8")}>
            &#8226;
          </button>
          <button type="button" id="9" onClick={() => pinAdd("9")}>
            &#8226;
          </button>
        </div>
        <div>
          <button type="button" id="4" onClick={() => pinAdd("4")}>
            &#8226;
          </button>
          <button type="button" id="5" onClick={() => pinAdd("5")}>
            &#8226;
          </button>
          <button type="button" id="6" onClick={() => pinAdd("6")}>
            &#8226;
          </button>
        </div>
        <div>
          <button type="button" id="1" onClick={() => pinAdd("1")}>
            &#8226;
          </button>
          <button type="button" id="2" onClick={() => pinAdd("2")}>
            &#8226;
          </button>
          <button type="button" id="3" onClick={() => pinAdd("3")}>
            &#8226;
          </button>
        </div>
      </div>
      <div className={styles.pin_footer}>
        <button type="button" id={styles.enter} onClick={pinEnter}>
          ENTER
        </button>
        <button type="button" id={styles.backspace} onClick={pinBackspace}>
          &#9003;
        </button>
      </div>
    </div>
  );
}
