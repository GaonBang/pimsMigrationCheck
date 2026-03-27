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
}: {
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
		if (isPending) return;
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

	return (
		<button
			type="button"
			className={`${styles.cell} ${saved ? styles.cellSaved : ""} ${isPending ? styles.cellPending : ""}`}
			onClick={handleClick}
		>
			<span className={styles.cellName}>{imageName || "-"}</span>
		</button>
	);
}
