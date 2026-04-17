import type { WithId, Document } from "mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { getSavedImageIds, getMigratedImageNames } from "@/lib/actions";
import ImageRow from "@/components/image-row";
import SaveAllButton from "@/components/save-all-button";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function getUser(id: string) {
	let objectId: ObjectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return null;
	}

	const client = await clientPromise;
	const db = client.db(process.env.MONGODB_DATABASE);
	return db.collection("User").findOne({ _id: objectId });
}

async function getImages(userId: string): Promise<WithId<Document>[]> {
	const client = await clientPromise;
	const db = client.db(process.env.MONGODB_DATABASE);
	return db.collection("Image").find({ userId, deleted: false }).sort({ name: 1 }).toArray();
}

async function ImageGrid({ id, email }: { id: string; email: string }) {
	const images = await getImages(id);
	let error: string | null = null;
	let savedIds: string[] = [];
	let migratedNames = new Set<string>();

	try {
		[savedIds, migratedNames] = await Promise.all([
			getSavedImageIds(id),
			getMigratedImageNames(),
		]);
	} catch (e) {
		error = e instanceof Error ? e.message : "저장 데이터 파일을 읽지 못했습니다.";
	}

	const savedSet = new Set(savedIds);

	return (
		<section className={styles.section}>
			{error && <div className={styles.error}>{error}</div>}

			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>
					Images
					<span className={styles.badge}>{images.length}</span>
				</h2>
				{images.length > 0 && (
					<SaveAllButton
						email={email}
						userId={id}
						images={images.map((img) => ({
							id: String(img._id),
							name: String(img.name ?? ""),
						}))}
					/>
				)}
			</div>

			{images.length === 0 && (
				<p className={styles.empty}>이미지가 없습니다.</p>
			)}

			{images.length > 0 && (
				<div className={styles.grid}>
					{images.map((img) => {
						const imgId = String(img._id);
						return (
							<ImageRow
								key={imgId}
								email={email}
								userId={id}
								imageId={imgId}
								imageName={String(img.name ?? "")}
								saved={savedSet.has(imgId)}
								migrated={migratedNames.has(String(img.name ?? ""))}
							/>
						);
					})}
				</div>
			)}
		</section>
	);
}

export default async function UserDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getUser(id);

	if (!user) notFound();

	const email = String(user.email ?? "");

	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<Link href="/" className={styles.back}>
					← 목록으로
				</Link>

				<header className={styles.header}>
					<h1 className={styles.title}>{email || "User Detail"}</h1>
					<p className={styles.subtitle}>ID: {id}</p>
				</header>

				<Suspense
					fallback={<p className={styles.empty}>이미지 불러오는 중...</p>}
				>
					<ImageGrid id={id} email={email} />
				</Suspense>
			</main>
		</div>
	);
}
