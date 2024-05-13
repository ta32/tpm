import React from "react";
import Styles from "./progress_modal.module.scss";
import DoneIcon from '../../svg/ui/done_icon'
import Colors from "../../styles/colors.module.scss";

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
      className={`${Styles.progress_modal} ${
        active ? Styles.active : Styles.hidden
      }`}
    >
      {progress && active && (
        <div className={Styles.label}>
          <span className={Styles.spinner} />
          {progressLabel}
        </div>
      )}
      {!progress && active && (
        <div className={Styles.label}>
          <DoneIcon className={Styles.icon} width={24} fill={Colors.white} />
          {completedLabel}
        </div>
      )}
    </div>
  );
}
