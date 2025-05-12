import React from 'react';
import styles from './ToolTip.module.scss';

interface ToolTipProps {
  text: string;
  active?: boolean;
  mode?: 'manual';
  width?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  dataCy?: string;
  children: React.ReactNode | React.ReactNode[];
}
export default function ToolTip({ text, position, children, mode, active, width, dataCy }: ToolTipProps) {
  const tooltip_type = {
    top: styles.tooltip_top,
    bottom: styles.tooltip_bottom,
    left: styles.tooltip_left,
    right: styles.tooltip_right,
  };
  const widthStyle = width ? width : '110px';
  const activeClass = mode === 'manual' ? (active ? styles.active : styles.hidden) : '';
  const className = `${styles.tooltip} ${activeClass} ${tooltip_type[position]}`;
  return (
    <div>
      <div className={className} data-cy={dataCy}>
        {children}
        <span style={{ width: widthStyle }} className={styles.tooltip_text}>
          {text}
        </span>
      </div>
    </div>
  );
}
