"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import styles from "@/app/page.module.css";

export default function SearchInput({
	placeholder = "이메일 검색...",
}: {
	placeholder?: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const q = searchParams.get("q") ?? "";

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		startTransition(() => {
			const params = new URLSearchParams();
			if (value) {
				params.set("q", value);
			}
			router.replace(`?${params.toString()}`);
		});
	}

	return (
		<div className={styles.searchWrap}>
			<input
				type="text"
				className={styles.searchInput}
				placeholder={placeholder}
				defaultValue={q}
				onChange={handleChange}
				autoComplete="off"
				spellCheck={false}
			/>
			{isPending && <span className={styles.spinner} />}
		</div>
	);
}
