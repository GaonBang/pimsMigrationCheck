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

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "saved.json");

function createDataFileError(filePath: string, error: unknown) {
	if (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "EACCES"
	) {
		return new Error(
			`Cannot write ${filePath}. On Linux bind mounts, ensure ./data is writable by the container user (uid 1001) or run the container with a matching --user.`,
		);
	}

	if (error instanceof SyntaxError) {
		return new Error(`Invalid JSON in ${filePath}. Check the file contents.`);
	}

	if (error instanceof Error) {
		return new Error(`${filePath}: ${error.message}`);
	}

	return new Error(`Failed to access ${filePath}.`);
}

function isSavedEntry(value: unknown): value is SavedEntry {
	if (typeof value !== "object" || value === null) return false;

	const candidate = value as Partial<SavedEntry>;
	return (
		typeof candidate.email === "string" &&
		typeof candidate.id === "string" &&
		Array.isArray(candidate.images) &&
		candidate.images.every(
			(image) =>
				typeof image === "object" &&
				image !== null &&
				"id" in image &&
				"name" in image &&
				typeof image.id === "string" &&
				typeof image.name === "string",
		)
	);
}

async function readJsonFile<T>(
	filePath: string,
	validate: (value: unknown) => value is T,
	fallback: T,
): Promise<T> {
	try {
		const raw = await fs.readFile(filePath, "utf-8");
		const parsed: unknown = JSON.parse(raw);

		if (!validate(parsed)) {
			throw new Error(`Unexpected JSON shape in ${filePath}.`);
		}

		return parsed;
	} catch (error) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			return fallback;
		}

		throw createDataFileError(filePath, error);
	}
}

async function writeJsonFile(filePath: string, data: unknown) {
	const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

	try {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
		await fs.rename(tempPath, filePath);
	} catch (error) {
		throw createDataFileError(filePath, error);
	} finally {
		await fs.rm(tempPath, { force: true }).catch(() => undefined);
	}
}

async function readSaved(): Promise<SavedEntry[]> {
	return readJsonFile(
		FILE_PATH,
		(value): value is SavedEntry[] =>
			Array.isArray(value) && value.every(isSavedEntry),
		[],
	);
}

async function writeSaved(data: SavedEntry[]) {
	await writeJsonFile(FILE_PATH, data);
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

// ─── Migration ────────────────────────────────────────────────────────────

const MIGRATION_FILE_PATH = path.join(DATA_DIR, "migration.json");

async function readMigration(): Promise<string[]> {
	return readJsonFile(
		MIGRATION_FILE_PATH,
		(value): value is string[] =>
			Array.isArray(value) && value.every((entry) => typeof entry === "string"),
		[],
	);
}

export async function getMigratedImageNames(): Promise<Set<string>> {
	const data = await readMigration();
	return new Set(data);
}

// ─── Domains ───────────────────────────────────────────────────────────────

interface DomainEntry {
	domain: string;
	active: boolean;
}

function isDomainEntry(value: unknown): value is DomainEntry {
	if (typeof value !== "object" || value === null) return false;

	const candidate = value as Partial<DomainEntry>;
	return (
		typeof candidate.domain === "string" && typeof candidate.active === "boolean"
	);
}

const DOMAINS_FILE_PATH = path.join(DATA_DIR, "domains.json");
const DOMAINS_SAVED_FILE_PATH = path.join(DATA_DIR, "domainsSaved.json");

async function readDomains(): Promise<DomainEntry[]> {
	return readJsonFile(
		DOMAINS_FILE_PATH,
		(value): value is DomainEntry[] =>
			Array.isArray(value) && value.every(isDomainEntry),
		[],
	);
}

async function readSavedDomains(): Promise<string[]> {
	return readJsonFile(
		DOMAINS_SAVED_FILE_PATH,
		(value): value is string[] =>
			Array.isArray(value) && value.every((entry) => typeof entry === "string"),
		[],
	);
}

async function writeSavedDomains(data: string[]) {
	await writeJsonFile(DOMAINS_SAVED_FILE_PATH, data);
}

export async function getAllDomains(): Promise<DomainEntry[]> {
	return readDomains();
}

export async function getSavedDomains(): Promise<string[]> {
	return readSavedDomains();
}

export async function saveDomain(domain: string) {
	const data = await readSavedDomains();

	if (!data.includes(domain)) {
		data.push(domain);
		await writeSavedDomains(data);
	}

	return { success: true };
}

export async function unsaveDomain(domain: string) {
	const data = await readSavedDomains();
	const next = data.filter((savedDomain) => savedDomain !== domain);

	await writeSavedDomains(next);
	return { success: true };
}
