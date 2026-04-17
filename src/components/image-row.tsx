"use client";

import { useState, useEffect, useTransition } from "react";
import { saveImage, unsaveImage } from "@/lib/actions";
import styles from "@/app/[id]/page.module.css";

export default function ImageRow({
	email,
	userId,
	imageId,
	imageName,
	saved: initialSaved,
	migrated,
}: {
	email: string;
	userId: string;
	imageId: string;
	imageName: string;
	saved: boolean;
	migrated: boolean;
}) {
	const [saved, setSaved] = useState(initialSaved);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setSaved(initialSaved);
	}, [initialSaved]);

	useEffect(() => {
		function handleAllSaved() {
			if (!migrated) setSaved(true);
		}
		window.addEventListener("all-saved", handleAllSaved);
		return () => window.removeEventListener("all-saved", handleAllSaved);
	}, [migrated]);

	function handleClick() {
		if (migrated || isPending) return;
		startTransition(async () => {
			if (saved) {
				await unsaveImage(userId, imageId);
				setSaved(false);
			} else {
				await saveImage(email, userId, imageId, imageName);
				setSaved(true);
			}
		});
	}

	const cellClass = [
		styles.cell,
		migrated ? styles.cellMigrated : saved ? styles.cellSaved : "",
		isPending ? styles.cellPending : "",
	].join(" ");

	return (
		<button
			type="button"
			className={cellClass}
			onClick={handleClick}
			disabled={migrated}
		>
			<span className={styles.cellName}>{imageName || "-"}</span>
		</button>
	);
}
