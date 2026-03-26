import { MongoClient } from "mongodb";

const username = encodeURIComponent(process.env.MONGODB_USERNAME ?? "");
const password = encodeURIComponent(process.env.MONGODB_PASSWORD ?? "");
const host = process.env.MONGODB_HOST ?? "localhost";
const port = process.env.MONGODB_PORT ?? "47017";

const uri = `mongodb://${username}:${password}@${host}:${port}/?retryWrites=false&tls=true&tlsAllowInvalidHostnames=true&tlsAllowInvalidCertificates=true&authMechanism=SCRAM-SHA-1&directConnection=true`;

const options = {
	serverSelectionTimeoutMS: 10000,
};

let clientPromise: Promise<MongoClient>;

declare global {
	var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
	if (!global._mongoClientPromise) {
		const client = new MongoClient(uri, options);
		global._mongoClientPromise = client.connect();
	}
	clientPromise = global._mongoClientPromise;
} else {
	const client = new MongoClient(uri, options);
	clientPromise = client.connect();
}

export default clientPromise;
