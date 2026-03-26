import type { Metadata } from "next";
import type { WithId, Document } from "mongodb";
import { Suspense } from "react";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import { getSavedUserIds } from "@/lib/actions";
import SearchInput from "@/components/search-input";
import styles from "./page.module.css";

export const metadata: Metadata = {
	title: "Users | STG-DEV-Pathoaid",
	description: "User 컬렉션 목록",
};

export const dynamic = "force-dynamic";

async function getUsers(query?: string): Promise<WithId<Document>[]> {
	const client = await clientPromise;
	const db = client.db(process.env.MONGODB_DATABASE);
	const filter = query ? { email: { $regex: query, $options: "i" } } : {};
	return db.collection("User").find(filter).toArray();
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q } = await searchParams;

	let users: WithId<Document>[] = [];
	let error: string | null = null;

	try {
		users = await getUsers(q);
	} catch (e) {
		error = e instanceof Error ? e.message : "DB 연결에 실패했습니다.";
	}

	const savedUserIds = await getSavedUserIds();

	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<header className={styles.header}>
					<div className={styles.headerRow}>
						<h1 className={styles.title}>Users</h1>
						<Link href="/saved" className={styles.savedLink}>
							저장된 항목 →
						</Link>
					</div>
					<p className={styles.subtitle}>
						STG-DEV-Pathoaid · 총 {users.length}건
						{q && ` · "${q}" 검색 결과`}
					</p>
				</header>

				<Suspense>
					<SearchInput />
				</Suspense>

				{error && <div className={styles.error}>{error}</div>}

				{users.length === 0 && !error && (
					<p className={styles.empty}>
						{q ? `"${q}"에 해당하는 이메일이 없습니다.` : "데이터가 없습니다."}
					</p>
				)}

				{users.length > 0 && (
					<div className={styles.tableWrap}>
						<div className={styles.tableHeader}>
							<span className={styles.thIdx}>#</span>
							<span className={styles.thEmail}>Email</span>
							<span className={styles.thArrow} />
						</div>
						{users.map((user, idx) => {
							const uid = String(user._id);
							const isSaved = savedUserIds.has(uid);
							return (
								<Link
									key={uid}
									href={`/${uid}`}
									className={`${styles.row} ${isSaved ? styles.savedRow : ""}`}
								>
									<span className={styles.cellIdx}>{idx + 1}</span>
									<span className={styles.cellEmail}>
										{String(user.email ?? "-")}
									</span>
									<span className={styles.cellArrow}>→</span>
								</Link>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
}
