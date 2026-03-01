import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { buildApp } from "./app";
import { createDeps } from "./deps";

initializeApp();

export const api = onRequest(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 60 },
  buildApp(createDeps()),
);
