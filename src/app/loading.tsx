import styles from "./page.module.css";

export default function Loading() {
	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<header className={styles.header}>
					<h1 className={styles.title}>Users</h1>
					<p className={styles.subtitle}>불러오는 중...</p>
				</header>
			</main>
		</div>
	);
}
