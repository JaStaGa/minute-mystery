import type { ReactNode } from "react";
import styles from "./hp-theme.module.css";

export default function Layout({ children }: { children: ReactNode }) {
    return <div className={styles.hpRoot}>{children}</div>;
}