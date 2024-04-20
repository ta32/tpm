import React from "react";
import styles from "./progress_modal.module.scss";
import Image from "next/image";
import { getUiIconPath, UI_DONE } from "lib/Images";

interface ProgressModalProps {
  progress: boolean;
  active: boolean;
  progressText?: string;
  completedText?: string;
}
export default function ProgressModal({
  active,
  progress,
  progressText,
  completedText,
}: ProgressModalProps) {
  const progressLabel = progressText || "Uploading";
  const completedLabel = completedText || "Saved";
  return (
    <div
      className={`${styles.progress_modal} ${
        active ? styles.active : styles.hidden
      }`}
    >
      {progress && active && (
        <div className={styles.label}>
          <span className={styles.spinner} />
          {progressLabel}
        </div>
      )}
      {!progress && active && (
        <div className={styles.label}>
          <Image
            className={`${styles.icon} ${styles.ui_icon_white}`}
            src={getUiIconPath(UI_DONE)}
            alt={"done"}
            height={24}
            width={24}
          />
          {completedLabel}
        </div>
      )}
    </div>
  );
}
