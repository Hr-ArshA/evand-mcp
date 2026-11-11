#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async (signal: string): Promise<void> => {
    try {
      await server.close();
    } finally {
      process.exit(signal === "SIGINT" ? 130 : 143);
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  console.error("[evand-mcp] Failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
