"use client";

import type { KeyboardEvent } from "react";
import { useState, useTransition } from "react";
import { saveDomain, unsaveDomain } from "@/lib/actions";
import styles from "@/app/domains/page.module.css";

export default function DomainRow({
	domain,
	active,
	saved,
}: {
	domain: string;
	active: boolean;
	saved: boolean;
}) {
	const [isSaved, setIsSaved] = useState(saved);
	const [isPending, startTransition] = useTransition();

	function handleToggle() {
		if (isPending) return;

		startTransition(async () => {
			if (isSaved) {
				await unsaveDomain(domain);
				setIsSaved(false);
				return;
			}

			await saveDomain(domain);
			setIsSaved(true);
		});
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		handleToggle();
	}

	return (
		<tr
			tabIndex={0}
			onClick={handleToggle}
			onKeyDown={handleKeyDown}
			className={`${styles.row} ${isSaved ? styles.rowSaved : ""} ${isPending ? styles.rowPending : ""}`}
		>
			<td className={styles.domainCell}>{domain}</td>
			<td className={styles.activeCell}>
				<span className={`${styles.status} ${active ? styles.statusOn : styles.statusOff}`}>
					{active ? "운영중" : "운영중지"}
				</span>
			</td>
		</tr>
	);
}
