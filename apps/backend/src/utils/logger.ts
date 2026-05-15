import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testLogDir: string | null = null;
const isTest = process.env.NODE_ENV === "test";

if (isTest) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const timestamp = `${y}${m}${d}_${hh}${mm}${ss}`;

    testLogDir = path.resolve(__dirname, "../../tests/results", timestamp);
    fs.mkdirSync(testLogDir, { recursive: true });
}

export const logger = {
    error: (message: string, error?: any) => {
        if (isTest && testLogDir) {
            const logPath = path.join(testLogDir, "error.log");
            const timestamp = new Date().toISOString();
            const errDetail =
                error instanceof Error
                    ? error.stack
                    : JSON.stringify(error, null, 2);
            const logEntry = `[${timestamp}] ERROR: ${message}\n${errDetail}\n\n`;
            fs.appendFileSync(logPath, logEntry);

            // Console: Only show status >= 500 in console during tests to identify server bugs.
            // Operational errors (4xx) from negative tests are suppressed to keep output clean.
            const status = error?.statusCode || error?.status || 500;
            if (status >= 500) {
                console.log(`[Error] ${status} ${message}`.trim());
            }
        } else {
            console.error(`[Error]: ${message}`, error);
        }
    },

    info: (message: string) => {
        if (isTest && testLogDir) {
            const logPath = path.join(testLogDir, "info.log");
            const timestamp = new Date().toISOString();
            fs.appendFileSync(logPath, `[${timestamp}] INFO: ${message}\n`);
            // Optionally suppress info logs in console during tests
        } else {
            console.log(message);
        }
    },

    warn: (message: string) => {
        if (isTest && testLogDir) {
            const logPath = path.join(testLogDir, "info.log");
            const timestamp = new Date().toISOString();
            fs.appendFileSync(logPath, `[${timestamp}] WARN: ${message}\n`);
        } else {
            console.warn(message);
        }
    },
};
