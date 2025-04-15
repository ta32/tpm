import React, { ChangeEvent, FormEvent, useState } from 'react';
import styles from './FilterInput.module.scss';
import CloseIcon from '../../../svg/ui/CloseIcon';
import colors from '../../../../styles/colors.module.scss';

interface FilterInputProps {
  placeholder: string;
  onChangeCallback: (value: string) => void;
}

export default function FilterInput({ placeholder, onChangeCallback }: FilterInputProps) {
  const [filter, setFilter] = useState('');

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    onChangeCallback(formData.get('filter') as string);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    onChangeCallback(e.target.value);
  };

  const onClearFilter = () => {
    setFilter('');
    onChangeCallback('');
  };

  const closeButtonSize = parseInt(styles.input_height) / 2;

  return (
    <span className={styles.filter}>
      <form onSubmit={onSubmit}>
        <div className={styles.filter_wrapper}>
          <input
            data-cy="filter-input"
            name="filter"
            className={styles.filter}
            type="text"
            placeholder={placeholder}
            value={filter}
            onChange={onChange}
          />
          {filter && (
            <div className={styles.clear_button} onClick={onClearFilter}>
              <CloseIcon fill={colors.grey_content_bg} style={{ marginRight: '10px' }} width={closeButtonSize} />
            </div>
          )}
        </div>
      </form>
    </span>
  );
}
