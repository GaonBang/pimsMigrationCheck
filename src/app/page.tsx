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
	return db.collection("User").find(filter).sort({ email: 1 }).toArray();
}

async function UserGrid({ q }: { q?: string }) {
	let users: WithId<Document>[] = [];
	let error: string | null = null;
	let savedUserIds = new Set<string>();

	try {
		users = await getUsers(q);
	} catch (e) {
		error = e instanceof Error ? e.message : "DB 연결에 실패했습니다.";
	}

	try {
		savedUserIds = await getSavedUserIds();
	} catch (e) {
		error = e instanceof Error ? e.message : "저장 데이터 파일을 읽지 못했습니다.";
	}

	return (
		<>
			<p className={styles.subtitle}>
				STG-DEV-Pathoaid · 총 {users.length}건
				{q && ` · "${q}" 검색 결과`}
			</p>

			{error && <div className={styles.error}>{error}</div>}

			{users.length === 0 && !error && (
				<p className={styles.empty}>
					{q ? `"${q}"에 해당하는 이메일이 없습니다.` : "데이터가 없습니다."}
				</p>
			)}

			{users.length > 0 && (
				<div className={styles.grid}>
					{users.map((user) => {
						const uid = String(user._id);
						const isSaved = savedUserIds.has(uid);
						return (
							<Link
								key={uid}
								href={`/${uid}`}
								className={`${styles.card} ${isSaved ? styles.cardSaved : ""}`}
							>
								<span className={styles.cardEmail}>
									{String(user.email ?? "-")}
								</span>
							</Link>
						);
					})}
				</div>
			)}
		</>
	);
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q } = await searchParams;

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
				</header>

				<Suspense>
					<SearchInput />
				</Suspense>

				<Suspense
					fallback={<p className={styles.empty}>불러오는 중...</p>}
				>
					<UserGrid q={q} />
				</Suspense>
			</main>
		</div>
	);
}
