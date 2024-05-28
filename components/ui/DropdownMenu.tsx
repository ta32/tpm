import React, { ReactElement, useEffect, useRef, useState } from 'react';
import styles from './DropdownMenu.module.scss';

interface DropdownMenuProps {
  button: ReactElement;
  children: React.ReactElement[];
  xOffset: number;
  yOffset: number;
  initSelectedKey: number;
  onClickCallback: (index: number) => void;
}

export default function DropdownMenu({
  button,
  children,
  xOffset,
  yOffset,
  initSelectedKey = 0,
  onClickCallback,
}: DropdownMenuProps) {
  const [show, setShow] = useState(false);
  const [selectedKey, setSelectedKey] = useState(initSelectedKey);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (index: number) => {
    setSelectedKey(index);
    onClickCallback(index);
  };

  const handleMenuOpen = () => {
    setShow(!show);
  };

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const display = show ? 'block' : 'none';
  const pos = { left: xOffset + 'px', top: yOffset + 'px' };
  return (
    <div ref={dropdownRef}>
      <div style={{ position: 'relative' }}>
        <div onClick={handleMenuOpen}>{button}</div>
        <ul className={styles.dropdown_menu} style={{ display: display, ...pos }}>
          {React.Children.map(children, (child, index) => {
            const isActive = selectedKey === index ? `${styles.active}` : ``;
            return (
              <li className={isActive} key={index}>
                <div
                  key={index}
                  onClick={() => {
                    handleMenuClick(index);
                  }}
                >
                  {child}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
