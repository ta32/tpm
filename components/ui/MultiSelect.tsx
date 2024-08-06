import React, { useState } from 'react';
import styles from './MultiSelect.module.scss';

interface SelectItem {
  value: string;
  label: string;
}

interface MultiSelectProps {
  className?: string;
  name: string;
  selectedValues?: string[];
  items: SelectItem[];
}

function getInitialSelectedItems(selectedValues: string[] | undefined, items: SelectItem[]): SelectItem[] {
  if (!selectedValues) {
    return [];
  }
  return items.filter((item) => selectedValues.includes(item.value));
}

export default function MultiSelect({ className, name, selectedValues, items }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SelectItem[]>(getInitialSelectedItems(selectedValues, items));

  const handleToggleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setOpen(!open);
  };

  const handleSelectItem = (value: string) => {
    const item = items.find((item) => item.value === value);
    if (!item) {
      return;
    }
    setSelected([...selected, item]);
    setOpen(false);
  };

  const handleRemoveItem = (value: string) => {
    const itemIndex = selected.findIndex((item) => item.value === value);
    if (itemIndex === -1) {
      return;
    }
    let selectedFiltered = selected.filter((item) => item.value !== value);
    setSelected([...selectedFiltered]);
  };

  let selectableItems = items.filter(
    (item) => selected.findIndex((selectedItem) => selectedItem.value === item.value) === -1
  );
  let selectedItemsValues = selected.map((item) => item.value);
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(selectedItemsValues)} />
      <div
        className={`${styles.container} ${className}`}
        onClick={(e) => handleToggleOpen(e)}
        style={{ cursor: 'pointer', height: 'auto' }}
      >
        {selected.length == 0 ? (
          <div className={styles.item}>Add Tag...</div>
        ) : (
          selected.map((item, index) => (
            <div
              className={styles.item}
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveItem(item.value);
              }}
            >
              {item.label}
              <div className={styles.icon}>x</div>
            </div>
          ))
        )}
      </div>
      {selectableItems.length > 0 && (
        <div className={styles.dropdown} style={{ display: open ? 'block' : 'none' }}>
          {selectableItems.map((item, index) => (
            <div
              key={item.value}
              className={styles.dropdown_item}
              onClick={(e) => handleSelectItem(item.value)}
              id={item.value}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
