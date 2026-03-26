"use server";

import fs from "node:fs/promises";
import path from "node:path";

interface SavedImage {
	id: string;
	name: string;
}

interface SavedEntry {
	email: string;
	id: string;
	images: SavedImage[];
}

const FILE_PATH = path.join(process.cwd(), "data", "saved.json");

async function readSaved(): Promise<SavedEntry[]> {
	try {
		const raw = await fs.readFile(FILE_PATH, "utf-8");
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

async function writeSaved(data: SavedEntry[]) {
	await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function saveImage(
	email: string,
	userId: string,
	imageId: string,
	imageName: string,
) {
	const data = await readSaved();
	const entry = data.find((e) => e.id === userId);

	if (entry) {
		if (!entry.images.some((img) => img.id === imageId)) {
			entry.images.push({ id: imageId, name: imageName });
		}
	} else {
		data.push({
			email,
			id: userId,
			images: [{ id: imageId, name: imageName }],
		});
	}

	await writeSaved(data);
	return { success: true };
}

export async function unsaveImage(userId: string, imageId: string) {
	const data = await readSaved();
	const entry = data.find((e) => e.id === userId);

	if (entry) {
		entry.images = entry.images.filter((img) => img.id !== imageId);
		if (entry.images.length === 0) {
			const idx = data.indexOf(entry);
			data.splice(idx, 1);
		}
	}

	await writeSaved(data);
	return { success: true };
}

export async function saveAllImages(
	email: string,
	userId: string,
	images: SavedImage[],
) {
	const data = await readSaved();
	const entry = data.find((e) => e.id === userId);

	if (entry) {
		for (const img of images) {
			if (!entry.images.some((existing) => existing.id === img.id)) {
				entry.images.push(img);
			}
		}
	} else {
		data.push({ email, id: userId, images: [...images] });
	}

	await writeSaved(data);
	return { success: true };
}

export async function getSavedImageIds(userId: string): Promise<string[]> {
	const data = await readSaved();
	return data.find((e) => e.id === userId)?.images.map((img) => img.id) ?? [];
}

export async function getAllSaved(): Promise<SavedEntry[]> {
	return readSaved();
}

export async function getSavedUserIds(): Promise<Set<string>> {
	const data = await readSaved();
	return new Set(data.map((e) => e.id));
}
