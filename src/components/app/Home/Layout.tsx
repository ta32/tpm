import React from 'react';
import styles from './Layout.module.scss';
import Image from 'next/image';
import { IMAGE_FILE } from 'lib/images';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className={styles.bg_wrap}>
        <Image
          alt=""
          priority
          src={IMAGE_FILE.BACKGROUND.path()}
          quality={100}
          fill
          sizes="100vw"
          style={{
            objectFit: 'cover',
          }}
        />
      </div>
      <div className={styles.container}>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
