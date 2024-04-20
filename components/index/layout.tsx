import React from "react";
import styles from "./layout.module.scss";
import Image from "next/image";
import { getBackgroundImagePath } from '../../lib/Images'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className={styles.bg_wrap}>
        <Image
          alt=""
          priority
          src={getBackgroundImagePath("tmp_background.png")}
          quality={100}
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
          }}
        />
      </div>
      <div className={styles.container}>
        <main className={styles.main}>{children}</main>
        <footer className={styles.footer}>
          <a
            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by{" "}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              width={70}
              height={16}
              className={styles.logo}
            />
          </a>
        </footer>
      </div>
    </div>
  );
}
