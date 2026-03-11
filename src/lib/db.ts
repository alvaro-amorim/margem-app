import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function normalizeConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();

    if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
      // Preserve the current secure semantics explicitly and avoid the pg warning in dev.
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }

    return connectionString;
  } catch {
    return connectionString;
  }
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  const adapter = new PrismaPg({
    connectionString: normalizeConnectionString(connectionString),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export async function resetPrismaClient() {
  if (!globalForPrisma.prisma) {
    return;
  }

  await globalForPrisma.prisma.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export function isRetryableConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    message.includes("connection terminated unexpectedly") ||
    message.includes("terminating connection") ||
    message.includes("server closed the connection unexpectedly") ||
    message.includes("connection closed") ||
    message.includes("can't reach database server")
  );
}

export function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const prisma = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

export async function withPrismaRetry<T>(operation: (prisma: PrismaClient) => Promise<T>) {
  try {
    return await operation(getPrisma());
  } catch (error) {
    if (!isRetryableConnectionError(error)) {
      throw error;
    }

    await resetPrismaClient();

    return operation(getPrisma());
  }
}
