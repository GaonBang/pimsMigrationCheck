import type { Metadata } from "next";
import Link from "next/link";
import { getAllDomains, getSavedDomains } from "@/lib/actions";
import DomainRow from "@/components/domain-row";
import styles from "./page.module.css";

export const metadata: Metadata = {
	title: "도메인 운영 여부 | STG-DEV-Pathoaid",
};

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
	const [domains, savedDomains] = await Promise.all([
		getAllDomains(),
		getSavedDomains(),
	]);
	const savedSet = new Set(savedDomains);

	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<Link href="/" className={styles.back}>
					← 목록으로
				</Link>

				<header className={styles.header}>
					<h1 className={styles.title}>도메인 운영 여부</h1>
				</header>

				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th className={styles.headCell}>도메인 주소</th>
								<th className={styles.headCell}>운영 상태</th>
							</tr>
						</thead>
						<tbody>
							{domains.map((domainEntry) => (
								<DomainRow
									key={domainEntry.domain}
									domain={domainEntry.domain}
									active={domainEntry.active}
									saved={savedSet.has(domainEntry.domain)}
								/>
							))}
						</tbody>
					</table>
				</div>
			</main>
		</div>
	);
}
