import React from "react";
import styles from "./filter_input.module.scss";

export default function FilterInput() {
  return (
    <span className={styles.filter}>
      <form>
        <input
          className={styles.filter}
          type="text"
          placeholder="Quick filter ..."
        />
      </form>
    </span>
  );
}
