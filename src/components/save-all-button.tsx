"use client";

import { useState } from "react";
import { saveAllImages } from "@/lib/actions";
import styles from "@/app/[id]/page.module.css";

export default function SaveAllButton({
	email,
	userId,
	images,
}: {
	email: string;
	userId: string;
	images: { id: string; name: string }[];
}) {
	const [isPending, setIsPending] = useState(false);

	async function handleClick() {
		setIsPending(true);
		await saveAllImages(email, userId, images);
		window.dispatchEvent(new CustomEvent("all-saved"));
		setIsPending(false);
	}

	return (
		<button
			type="button"
			className={styles.saveAllBtn}
			onClick={handleClick}
			disabled={isPending}
		>
			{isPending ? "저장 중..." : "All Save"}
		</button>
	);
}
