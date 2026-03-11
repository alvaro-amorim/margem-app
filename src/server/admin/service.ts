import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { PlatformRole, PlatformUserStatus, WorkspacePlan } from "@/generated/prisma/enums";
import { getPrisma, withPrismaRetry } from "@/lib/db";

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? null;
}

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value ?? 0;
}

function estimateWorkspaceUsageBytes(input: {
  ingredientCount: number;
  recipeCount: number;
  priceHistoryCount: number;
  pricingRunCount: number;
  snapshotBytes: number;
}) {
  return (
    input.snapshotBytes +
    input.ingredientCount * 480 +
    input.recipeCount * 640 +
    input.priceHistoryCount * 320 +
    input.pricingRunCount * 256
  );
}

export async function getAdminDashboardData() {
  return withPrismaRetry(async (prisma) => {
    const [users, blockedEmails, snapshotUsageRows, databaseSizeRows] = await Promise.all([
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          defaultWorkspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
              createdAt: true,
              _count: {
                select: {
                  ingredients: true,
                  priceHistory: true,
                  recipes: true,
                  pricingRuns: true,
                },
              },
            },
          },
          _count: {
            select: {
              memberships: true,
              ownedWorkspaces: true,
            },
          },
        },
      }),
      prisma.emailBlocklist.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.$queryRaw<Array<{ workspaceId: string; snapshotBytes: bigint }>>`
        SELECT
          "workspaceId",
          COALESCE(
            SUM(
              octet_length(CAST("inputSnapshot" AS text)) +
              octet_length(CAST("resultSnapshot" AS text))
            ),
            0
          )::bigint AS "snapshotBytes"
        FROM "PricingRun"
        GROUP BY "workspaceId"
      `,
      prisma.$queryRaw<Array<{ sizeBytes: bigint }>>`
        SELECT pg_database_size(current_database())::bigint AS "sizeBytes"
      `,
    ]);

    const snapshotBytesByWorkspace = new Map(
      snapshotUsageRows.map((row) => [row.workspaceId, toNumber(row.snapshotBytes)]),
    );

    const userItems = users.map((user) => {
      const workspace = user.defaultWorkspace;
      const snapshotBytes = workspace ? snapshotBytesByWorkspace.get(workspace.id) ?? 0 : 0;

      const estimatedUsageBytes = workspace
        ? estimateWorkspaceUsageBytes({
            ingredientCount: workspace._count.ingredients,
            recipeCount: workspace._count.recipes,
            priceHistoryCount: workspace._count.priceHistory,
            pricingRunCount: workspace._count.pricingRuns,
            snapshotBytes,
          })
        : 0;

      return {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        platformRole: user.platformRole,
        status: user.status,
        blockedReason: user.blockedReason,
        blockedAt: user.blockedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        membershipsCount: user._count.memberships,
        ownedWorkspacesCount: user._count.ownedWorkspaces,
        workspace: workspace
          ? {
              id: workspace.id,
              name: workspace.name,
              slug: workspace.slug,
              plan: workspace.plan,
              createdAt: workspace.createdAt,
              ingredientCount: workspace._count.ingredients,
              recipeCount: workspace._count.recipes,
              priceHistoryCount: workspace._count.priceHistory,
              pricingRunCount: workspace._count.pricingRuns,
              snapshotBytes,
              estimatedUsageBytes,
            }
          : null,
      };
    });

    const totalUsers = userItems.length;
    const blockedUsers = userItems.filter((user) => user.status === PlatformUserStatus.BLOCKED).length;
    const adminUsers = userItems.filter((user) => user.platformRole === PlatformRole.ADMIN).length;
    const totalWorkspaces = userItems.filter((user) => user.workspace).length;
    const premiumWorkspaces = userItems.filter(
      (user) => user.workspace?.plan === WorkspacePlan.PREMIUM,
    ).length;
    const estimatedWorkspaceUsageBytes = userItems.reduce(
      (total, user) => total + (user.workspace?.estimatedUsageBytes ?? 0),
      0,
    );

    return {
      overview: {
        totalUsers,
        blockedUsers,
        adminUsers,
        totalWorkspaces,
        premiumWorkspaces,
        blockedEmails: blockedEmails.length,
        databaseSizeBytes: toNumber(databaseSizeRows[0]?.sizeBytes),
        estimatedWorkspaceUsageBytes,
      },
      users: userItems,
      blockedEmails: blockedEmails.map((item) => ({
        id: item.id,
        email: item.email,
        reason: item.reason,
        createdAt: item.createdAt,
      })),
    };
  });
}

export async function updateWorkspacePlan(workspaceId: string, plan: WorkspacePlan) {
  return withPrismaRetry((prisma) =>
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan },
      select: { id: true },
    }),
  );
}

export async function blockPlatformUser(userId: string, reason?: string | null) {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      clerkUserId: true,
    },
  });

  if (!existingUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const client = await clerkClient();
  await client.users.banUser(existingUser.clerkUserId);

  await withPrismaRetry((safePrisma) =>
    safePrisma.user.update({
      where: { id: userId },
      data: {
        status: PlatformUserStatus.BLOCKED,
        blockedReason: reason?.trim() || "Conta bloqueada pela administracao.",
        blockedAt: new Date(),
      },
    }),
  );

  return existingUser;
}

export async function unblockPlatformUser(userId: string) {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkUserId: true,
    },
  });

  if (!existingUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const client = await clerkClient();
  await client.users.unbanUser(existingUser.clerkUserId);

  await withPrismaRetry((safePrisma) =>
    safePrisma.user.update({
      where: { id: userId },
      data: {
        status: PlatformUserStatus.ACTIVE,
        blockedReason: null,
        blockedAt: null,
      },
    }),
  );
}

export async function deletePlatformUser(userId: string) {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkUserId: true,
    },
  });

  if (!existingUser) {
    throw new Error("Usuario nao encontrado.");
  }

  const client = await clerkClient();
  await client.users.deleteUser(existingUser.clerkUserId);

  await withPrismaRetry((safePrisma) =>
    safePrisma.user.delete({
      where: {
        id: userId,
      },
    }),
  );
}

export async function addBlockedEmail(email: string, reason?: string | null) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Informe um email valido.");
  }

  const client = await clerkClient();
  const currentBlocklist = await client.blocklistIdentifiers.getBlocklistIdentifierList({
    limit: 500,
  });
  const existingIdentifier = currentBlocklist.data.find(
    (item) => item.identifier.toLowerCase() === normalizedEmail,
  );

  if (!existingIdentifier) {
    await client.blocklistIdentifiers.createBlocklistIdentifier({
      identifier: normalizedEmail,
    });
  }

  await withPrismaRetry(async (prisma) => {
    await prisma.emailBlocklist.upsert({
      where: {
        email: normalizedEmail,
      },
      update: {
        reason: reason?.trim() || null,
      },
      create: {
        email: normalizedEmail,
        reason: reason?.trim() || null,
      },
    });

    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      await blockPlatformUser(
        existingUser.id,
        reason?.trim() || "Email bloqueado pela administracao.",
      );
    }
  });
}

export async function removeBlockedEmail(blockedEmailId: string) {
  const removedEntry = await withPrismaRetry((prisma) =>
    prisma.emailBlocklist.delete({
      where: {
        id: blockedEmailId,
      },
    }),
  );

  const client = await clerkClient();
  const currentBlocklist = await client.blocklistIdentifiers.getBlocklistIdentifierList({
    limit: 500,
  });
  const existingIdentifier = currentBlocklist.data.find(
    (item) => item.identifier.toLowerCase() === removedEntry.email.toLowerCase(),
  );

  if (existingIdentifier) {
    await client.blocklistIdentifiers.deleteBlocklistIdentifier(existingIdentifier.id);
  }

  return removedEntry;
}
