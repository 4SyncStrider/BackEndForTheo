import "dotenv/config";
import path from "node:path";
import express from "express";
import session from "express-session";
import { createAuthRouter, isAuthenticationConfigured } from "./auth";

const app = express();
const port = Number(process.env.PORT || 3000);
const projectRoot = path.resolve(__dirname, "../..");
const frontendDirectory = path.join(projectRoot, "frontend");
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set before starting HideSearch.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
}

if (isProduction) {
    app.set("trust proxy", 1);
}

app.use(express.json({ limit: "100kb" }));
app.use(session({
    name: "hidesearch.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: isProduction
    }
}));

app.get("/api/health", (_request, response) => {
    response.json({
        status: "ok",
        authenticationConfigured: isAuthenticationConfigured()
    });
});

app.use("/api/auth", createAuthRouter());
app.use("/frontend", express.static(frontendDirectory));
app.get("/", (_request, response) => {
    response.sendFile(path.join(projectRoot, "index.html"));
});

app.use((_request, response) => {
    response.status(404).json({ error: "Not found" });
});

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled server error:", error);
    response.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`HideSearch backend listening at http://localhost:${port}`);
});
