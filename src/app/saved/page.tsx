import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAllDomains, getAllSaved, getSavedDomains } from "@/lib/actions";
import SearchInput from "@/components/search-input";
import styles from "./page.module.css";

interface SavedImage {
	id: string;
	name: string;
}

interface SavedEntry {
	email: string;
	id: string;
	images: SavedImage[];
}

interface DomainEntry {
	domain: string;
	active: boolean;
}

export const metadata: Metadata = {
	title: "저장된 항목 | STG-DEV-Pathoaid",
};

export const dynamic = "force-dynamic";

export default async function SavedPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; tab?: string }>;
}) {
	const { q, tab } = await searchParams;
	const currentTab = tab === "domain" ? "domain" : "image";
	let error: string | null = null;
	let allSaved: SavedEntry[] = [];
	let allDomains: DomainEntry[] = [];
	let savedDomains: string[] = [];

	try {
		[allSaved, allDomains, savedDomains] = await Promise.all([
			getAllSaved(),
			getAllDomains(),
			getSavedDomains(),
		]);
	} catch (e) {
		error =
			e instanceof Error ? e.message : "저장 데이터 파일을 읽지 못했습니다.";
	}

	const filteredImages = q
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

	const totalImages = filteredImages.reduce(
		(sum, e) => sum + (e?.images.length ?? 0),
		0,
	);
	const savedDomainsWithMeta = savedDomains
		.map((domain) => ({
			domain,
			active: allDomains.find((entry) => entry.domain === domain)?.active ?? false,
		}))
		.filter((entry) =>
			q ? entry.domain.toLowerCase().includes(q.toLowerCase()) : true,
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
						{currentTab === "image"
							? `${filteredImages.length}명 · 이미지 ${totalImages}건`
							: `도메인 ${savedDomainsWithMeta.length}개`}
						{q && ` · "${q}" 검색 결과`}
					</p>
				</header>

				{error && <div className={styles.error}>{error}</div>}

				<nav className={styles.tabs} aria-label="저장된 항목 탭">
					<Link
						href={`/saved${q ? `?tab=image&q=${encodeURIComponent(q)}` : "?tab=image"}`}
						className={`${styles.tab} ${currentTab === "image" ? styles.tabActive : ""}`}
					>
						image
					</Link>
					<Link
						href={`/saved${q ? `?tab=domain&q=${encodeURIComponent(q)}` : "?tab=domain"}`}
						className={`${styles.tab} ${currentTab === "domain" ? styles.tabActive : ""}`}
					>
						도메인
					</Link>
				</nav>

				<Suspense>
					<SearchInput
						placeholder={
							currentTab === "image"
								? "이메일 또는 이미지 이름 검색..."
								: "도메인 검색..."
						}
					/>
				</Suspense>

				{currentTab === "image" && (
					<>
						{filteredImages.length === 0 && (
							<p className={styles.empty}>
								{q
									? `"${q}"에 해당하는 항목이 없습니다.`
									: "저장된 이미지 항목이 없습니다."}
							</p>
						)}

						{filteredImages.map(
							(entry) =>
								entry && (
									<section key={entry.id} className={styles.section}>
										<Link href={`/${entry.id}`} className={styles.userHeader}>
											<span className={styles.email}>{entry.email}</span>
											<span className={styles.badge}>
												{entry.images.length}
											</span>
											<span className={styles.arrow}>→</span>
										</Link>

										<div className={styles.imageList}>
											{entry.images.map((img, idx) => (
												<div key={img.id} className={styles.imageItem}>
													<span className={styles.imageIndex}>
														{idx + 1}
													</span>
													<span className={styles.imageName}>
														{img.name || "-"}
													</span>
												</div>
											))}
										</div>
									</section>
								),
						)}
					</>
				)}

				{currentTab === "domain" && (
					<>
						{savedDomainsWithMeta.length === 0 && (
							<p className={styles.empty}>
								{q
									? `"${q}"에 해당하는 도메인이 없습니다.`
									: "저장된 도메인이 없습니다."}
							</p>
						)}

						<div className={styles.domainList}>
							{savedDomainsWithMeta.map((entry, idx) => (
								<div key={entry.domain} className={styles.domainItem}>
									<span className={styles.domainIndex}>{idx + 1}</span>
									<span className={styles.domainName}>{entry.domain}</span>
									<span
										className={`${styles.status} ${entry.active ? styles.statusOn : styles.statusOff}`}
									>
										{entry.active ? "운영중" : "운영중지"}
									</span>
								</div>
							))}
						</div>
					</>
				)}
			</main>
		</div>
	);
}
