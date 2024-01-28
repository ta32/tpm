import { useEffect } from "react";
import styles from "./home.module.scss";
import Router, { useRouter } from "next/router";
import Image from "next/image";
export default function OAuthReceiver() {
  const router = useRouter();
  useEffect(() => {
    router.push("/").catch((err) => console.log(err));
  }, [router]);
  return (
    <div className={styles.container}>
      <div className={styles.bgWrap}>
        <Image
          alt=""
          src="/images/content-bg.png"
          quality={100}
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
          }}
        />
      </div>
      <h1>Dropbox sign-in successful</h1>
    </div>
  );
}
