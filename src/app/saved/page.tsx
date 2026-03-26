import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAllSaved } from "@/lib/actions";
import SearchInput from "@/components/search-input";
import styles from "./page.module.css";

export const metadata: Metadata = {
	title: "저장된 항목 | STG-DEV-Pathoaid",
};

export const dynamic = "force-dynamic";

export default async function SavedPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q } = await searchParams;
	const allSaved = await getAllSaved();

	const filtered = q
		? allSaved
				.map((entry) => {
					const query = q.toLowerCase();
					const emailMatch = entry.email.toLowerCase().includes(query);
					const matchedImages = entry.images.filter((img) =>
						img.name.toLowerCase().includes(query),
					);

					if (emailMatch) return entry;
					if (matchedImages.length > 0)
						return { ...entry, images: matchedImages };
					return null;
				})
				.filter(Boolean)
		: allSaved;

	const totalImages = filtered.reduce(
		(sum, e) => sum + (e?.images.length ?? 0),
		0,
	);

	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<Link href="/" className={styles.back}>
					← 목록으로
				</Link>

				<header className={styles.header}>
					<h1 className={styles.title}>저장된 항목</h1>
					<p className={styles.subtitle}>
						{filtered.length}명 · 이미지 {totalImages}건
						{q && ` · "${q}" 검색 결과`}
					</p>
				</header>

				<Suspense>
					<SearchInput placeholder="이메일 또는 이미지 이름 검색..." />
				</Suspense>

				{filtered.length === 0 && (
					<p className={styles.empty}>
						{q
							? `"${q}"에 해당하는 항목이 없습니다.`
							: "저장된 항목이 없습니다."}
					</p>
				)}

				{filtered.map(
					(entry) =>
						entry && (
							<section key={entry.id} className={styles.section}>
								<Link href={`/${entry.id}`} className={styles.userHeader}>
									<span className={styles.email}>{entry.email}</span>
									<span className={styles.badge}>{entry.images.length}</span>
									<span className={styles.arrow}>→</span>
								</Link>

								<div className={styles.imageList}>
									{entry.images.map((img, idx) => (
										<div key={img.id} className={styles.imageItem}>
											<span className={styles.imageIndex}>{idx + 1}</span>
											<span className={styles.imageName}>
												{img.name || "-"}
											</span>
										</div>
									))}
								</div>
							</section>
						),
				)}
			</main>
		</div>
	);
}
