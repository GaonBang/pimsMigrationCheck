"use client";

import { useState, useEffect, useTransition } from "react";
import { saveImage } from "@/lib/actions";
import styles from "@/app/[id]/page.module.css";

export default function ImageRow({
	idx,
	email,
	userId,
	imageId,
	imageName,
	saved: initialSaved,
}: {
	idx: number;
	email: string;
	userId: string;
	imageId: string;
	imageName: string;
	saved: boolean;
}) {
	const [saved, setSaved] = useState(initialSaved);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setSaved(initialSaved);
	}, [initialSaved]);

	useEffect(() => {
		function handleAllSaved() {
			setSaved(true);
		}
		window.addEventListener("all-saved", handleAllSaved);
		return () => window.removeEventListener("all-saved", handleAllSaved);
	}, []);

	function handleClick() {
		startTransition(async () => {
			await saveImage(email, userId, imageId, imageName);
			setSaved(true);
		});
	}

	return (
		<tr className={saved ? styles.savedRow : undefined}>
			<td className={styles.td}>{idx}</td>
			<td className={styles.td}>{imageName || "-"}</td>
			<td className={`${styles.td} ${styles.tdAction}`}>
				<button
					type="button"
					className={`${styles.saveBtn} ${saved ? styles.saved : ""}`}
					onClick={handleClick}
					disabled={isPending || saved}
				>
					{isPending ? "..." : saved ? "Saved" : "Save"}
				</button>
			</td>
		</tr>
	);
}
