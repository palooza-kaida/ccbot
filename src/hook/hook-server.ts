import express, { type Express } from "express";
import type { Server } from "node:http";
import { HookHandler } from "./hook-handler.js";

export class HookServer {
  private app: Express;
  private server: Server | null = null;
  private port: number;
  private secret: string;
  private handler: HookHandler;

  constructor(port: number, secret: string, handler: HookHandler) {
    this.port = port;
    this.secret = secret;
    this.handler = handler;
    this.app = this.createApp();
  }

  start(): void {
    this.server = this.app.listen(this.port, "127.0.0.1", () => {
      console.log(`ccbot: hook server listening on localhost:${this.port}`);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => resolve());
    });
  }

  private createApp(): Express {
    const app = express();
    app.use(express.json({ limit: "10mb" }));

    app.post("/hook/stop", (req, res) => {
      if (req.headers["x-ccbot-secret"] !== this.secret) {
        res.status(403).send("forbidden");
        return;
      }

      setImmediate(() => this.handler.handleStopEvent(req.body));
      res.status(200).send("ok");
    });

    app.get("/health", (_req, res) => {
      res.status(200).send("healthy");
    });

    return app;
  }
}
