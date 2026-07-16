// apps/api/src/index.ts
import express from "express";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(3001, () => console.log("api running on :3001"));