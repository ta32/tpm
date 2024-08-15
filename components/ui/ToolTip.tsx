import React from 'react';
import styles from './ToolTip.module.scss';

interface ToolTipProps {
  text: string;
  active?: boolean;
  mode?: 'manual';
  position: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode | React.ReactNode[];
}
export default function ToolTip({ text, position, children, mode, active }: ToolTipProps) {
  const tooltip_type = {
    top: styles.tooltip_top,
    bottom: styles.tooltip_bottom,
    left: styles.tooltip_left,
    right: styles.tooltip_right,
  };
  const activeClass = mode === 'manual' ? (active ? styles.active : styles.hidden) : '';
  const className = `${styles.tooltip} ${activeClass} ${tooltip_type[position]}`;
  return (
    <div className={className}>
      {children}
      <span className={styles.tooltip_text}>{text}</span>
    </div>
  );
}
