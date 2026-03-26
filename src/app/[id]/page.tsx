import type { WithId, Document } from "mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { getSavedImageIds } from "@/lib/actions";
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
	return db.collection("Image").find({ userId, deleted: false }).toArray();
}

export default async function UserDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [user, images] = await Promise.all([getUser(id), getImages(id)]);

	if (!user) notFound();

	const email = String(user.email ?? "");
	const savedIds = await getSavedImageIds(id);
	const savedSet = new Set(savedIds);

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

				<section className={styles.section}>
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
						<div className={styles.tableWrap}>
							<table className={styles.table}>
								<thead>
									<tr>
										<th className={styles.th}>#</th>
										<th className={styles.th}>Name</th>
										<th className={styles.th} />
									</tr>
								</thead>
								<tbody>
									{images.map((img, idx) => {
										const imgId = String(img._id);
										return (
											<ImageRow
												key={imgId}
												idx={idx + 1}
												email={email}
												userId={id}
												imageId={imgId}
												imageName={String(img.name ?? "")}
												saved={savedSet.has(imgId)}
											/>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
