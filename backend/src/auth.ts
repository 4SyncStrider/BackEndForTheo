import crypto from "node:crypto";
import { Router, type Response } from "express";
import { google } from "googleapis";

const GOOGLE_SCOPES = ["openid", "profile", "email"];

export interface SafeUser {
    id: string;
    name: string;
    email: string;
    picture?: string;
}

declare module "express-session" {
    interface SessionData {
        oauthState?: string;
        user?: SafeUser;
    }
}

function getOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseURL = process.env.BASE_URL;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || (
        baseURL ? `${baseURL.replace(/\/$/, "")}/api/auth/google/callback` : undefined
    );

    if (!clientId || !clientSecret || !callbackURL) {
        return null;
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        callbackURL
    );
}

function unavailable(response: Response) {
    response.status(503).json({
        error: "Google authentication is not configured on this server."
    });
}

export function createAuthRouter() {
    const router = Router();

    router.get("/google", (request, response) => {
        const oauthClient = getOAuthClient();

        if (!oauthClient) {
            unavailable(response);
            return;
        }

        const state = crypto.randomBytes(32).toString("hex");
        request.session.oauthState = state;

        response.redirect(oauthClient.generateAuthUrl({
            access_type: "online",
            include_granted_scopes: true,
            prompt: "select_account",
            scope: GOOGLE_SCOPES,
            state
        }));
    });

    router.get("/google/callback", async (request, response) => {
        const oauthClient = getOAuthClient();
        const { code, state, error } = request.query;

        if (error) {
            response.status(401).json({ error: "Google authentication was cancelled." });
            return;
        }

        if (!oauthClient || typeof code !== "string" || typeof state !== "string") {
            unavailable(response);
            return;
        }

        if (!request.session.oauthState || state !== request.session.oauthState) {
            response.status(400).json({ error: "Invalid authentication state." });
            return;
        }

        delete request.session.oauthState;

        try {
            const { tokens } = await oauthClient.getToken(code);
            if (!tokens.id_token) {
                response.status(401).json({ error: "Google did not return an ID token." });
                return;
            }

            const ticket = await oauthClient.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();

            if (!payload?.sub || !payload.email || !payload.email_verified) {
                response.status(401).json({ error: "Google account verification failed." });
                return;
            }

            request.session.user = {
                id: payload.sub,
                name: payload.name || payload.email,
                email: payload.email,
                ...(payload.picture ? { picture: payload.picture } : {})
            };

            response.redirect("/");
        } catch (authenticationError) {
            console.error("Google authentication failed:", authenticationError);
            response.status(502).json({ error: "Google authentication failed." });
        }
    });

    router.get("/me", (request, response) => {
        if (!request.session.user) {
            response.json({ authenticated: false });
            return;
        }

        response.json({
            authenticated: true,
            user: request.session.user
        });
    });

    router.post("/logout", (request, response, next) => {
        request.session.destroy((error) => {
            if (error) {
                next(error);
                return;
            }

            response.clearCookie("hidesearch.sid");
            response.status(204).end();
        });
    });

    return router;
}

export function isAuthenticationConfigured() {
    return Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        (process.env.GOOGLE_CALLBACK_URL || process.env.BASE_URL)
    );
}
