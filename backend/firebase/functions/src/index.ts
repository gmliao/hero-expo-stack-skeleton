import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { buildApp } from "./core/app";
import { createDeps } from "./core/deps";

initializeApp();

export const api = onRequest(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 60 },
  buildApp(createDeps()),
);
