import styles from "./page.module.css";

export default function Loading() {
	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<p className={styles.back}>← 목록으로</p>
				<header className={styles.header}>
					<h1 className={styles.title}>불러오는 중...</h1>
				</header>
			</main>
		</div>
	);
}
