"use client";

import type { ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import styles from "@/app/page.module.css";

export default function SearchInput({
	placeholder = "이메일 검색...",
}: {
	placeholder?: string;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const q = searchParams.get("q") ?? "";

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());
			if (value) {
				params.set("q", value);
			} else {
				params.delete("q");
			}
			const queryString = params.toString();
			router.replace(queryString ? `${pathname}?${queryString}` : pathname);
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
