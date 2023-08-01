import React, { useState } from 'react'
import styles from './entry_input.module.scss';
import MultiSelect from 'components/ui/multi_select';


interface EntryInputProps {
  label: string;
  name: string;
  placeholder: string;
  defaultValue: string| null;
  type: 'text' | 'password' | 'secret' | 'tags';
}
export default function EntryInput({label, name, placeholder, defaultValue, type}: EntryInputProps) {
  const [showSecret, setShowSecret] = useState(false);

  const handleToggleShowPassword = () => {
    setShowSecret(!showSecret);
  }

  const passwordInputType = showSecret ? 'text' : 'password';
  const selectedValues = defaultValue ? defaultValue.split(' ') : undefined;

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <label className={styles.label}>{label}</label>
        {type === 'tags' &&
          <MultiSelect name={name} className={styles.input} selectedValues={selectedValues} items={[
            {label: 'Bitcoin', value: 'bitcoin'},
            {label: 'Ethereum', value: 'ethereum'},
            {label: 'Cardano', value: 'cardano'},
            {label: 'Polkadot', value: 'polkadot'},
            {label: 'Chainlink', value: 'chainlink'},
            {label: 'Litecoin', value: 'litecoin'},
            {label: 'Stellar', value: 'stellar'},
            {label: 'Uniswap', value: 'uniswap'},
            {label: 'Monero', value: 'monero'},
            {label: 'Dogecoin', value: 'dogecoin'},
            {label: 'EOS', value: 'eos'},
            {label: 'NEM', value: 'nem'},
            {label: 'Aave', value: 'aave'},
            {label: 'Cosmos', value: 'cosmos'},
            {label: 'VeChain', value: 'vechain'},
            {label: 'Tron', value: 'tron'},
            {label: 'Tezos', value: 'tezos'},
            {label: 'Synthetix', value: 'synthetix'},
            {label: 'Theta', value: 'theta'},
            {label: 'Elrond', value: 'elrond'},
            {label: 'Dash', value: 'dash'},
            {label: 'Compound', value: 'compound'},
            {label: 'NEO', value: 'neo'},
            {label: 'IOTA', value: 'iota'}
          ]}/>
        }
        { type != 'tags' &&
          <input name={name} className={styles.input} type={type == 'text' ? 'text': passwordInputType} placeholder={placeholder} defaultValue={defaultValue != null ? defaultValue : ''} />
        }
      </div>
      {type === 'password' &&
        <div className={styles.container_row_no_wrap}>
          <button type={"button"} className={styles.control_btn} onClick={handleToggleShowPassword}>+</button>
          <button type={"button"} className={styles.control_btn}>#</button>
        </div>
      }
      {type === 'secret' &&
        <button type={"button"} className={styles.control_btn} onClick={handleToggleShowPassword}>#</button>
      }
    </div>

  )
}
