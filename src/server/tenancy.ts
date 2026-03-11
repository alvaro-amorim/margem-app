import "server-only";

import type { User } from "@clerk/nextjs/server";

import { WorkspaceMemberRole } from "@/generated/prisma/enums";
import { getPrisma, withPrismaRetry } from "@/lib/db";
import { env } from "@/lib/env";

type SyncClerkUserInput = {
  clerkUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

type WorkspaceClient = Pick<ReturnType<typeof getPrisma>, "workspace">;

export class BlockedAccessError extends Error {
  reason?: string | null;

  constructor(message = "Acesso bloqueado.", reason?: string | null) {
    super(message);
    this.name = "BlockedAccessError";
    this.reason = reason ?? null;
  }
}

export function isBlockedAccessError(error: unknown): error is BlockedAccessError {
  return error instanceof BlockedAccessError;
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? null;
}

function shouldGrantPlatformAdmin(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return env.adminEmails.includes(normalizedEmail);
}

function slugifyWorkspaceName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildPersonalWorkspaceName(input: SyncClerkUserInput) {
  if (input.firstName) {
    return `Espaco de ${input.firstName}`;
  }

  if (input.email) {
    const localPart = input.email.split("@")[0] ?? "usuario";
    return `Espaco de ${localPart}`;
  }

  return "Meu espaco";
}

async function generateUniqueWorkspaceSlug(baseName: string, prismaClient: WorkspaceClient) {
  const baseSlug = slugifyWorkspaceName(baseName) || "meu-espaco";

  for (let index = 0; index < 20; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const existing = await prismaClient.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

function mapClerkUser(clerkUser: User): SyncClerkUserInput {
  return {
    clerkUserId: clerkUser.id,
    email: normalizeEmail(clerkUser.primaryEmailAddress?.emailAddress),
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  };
}

function hasProfileChanges(
  existingUser: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  },
  input: SyncClerkUserInput,
) {
  return (
    (existingUser.email ?? null) !== (input.email ?? null) ||
    (existingUser.firstName ?? null) !== (input.firstName ?? null) ||
    (existingUser.lastName ?? null) !== (input.lastName ?? null) ||
    (existingUser.imageUrl ?? null) !== (input.imageUrl ?? null)
  );
}

async function findUserByClerkId(clerkUserId: string) {
  return withPrismaRetry((prisma) =>
    prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        defaultWorkspace: true,
      },
    }),
  );
}

async function findBlockedEmail(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  return withPrismaRetry((prisma) =>
    prisma.emailBlocklist.findUnique({
      where: {
        email: normalizedEmail,
      },
    }),
  );
}

function ensureUserAccess(user: {
  status: "ACTIVE" | "BLOCKED";
  blockedReason?: string | null;
}) {
  if (user.status === "BLOCKED") {
    throw new BlockedAccessError("Conta bloqueada.", user.blockedReason);
  }
}

export async function getPersistedAuthenticatedContext(clerkUserId: string) {
  const user = await findUserByClerkId(clerkUserId);

  if (!user?.defaultWorkspaceId || !user.defaultWorkspace) {
    return null;
  }

  const elevatedUser =
    shouldGrantPlatformAdmin(user.email) && user.platformRole !== "ADMIN"
      ? await withPrismaRetry((prisma) =>
          prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              platformRole: "ADMIN",
            },
            include: {
              defaultWorkspace: true,
            },
          }),
        )
      : user;

  ensureUserAccess(elevatedUser);

  return {
    user: elevatedUser,
    workspace: elevatedUser.defaultWorkspace,
  };
}

export async function syncAuthenticatedUser(input: SyncClerkUserInput) {
  const existingUser = await findUserByClerkId(input.clerkUserId);
  const blockedEmail = await findBlockedEmail(input.email);

  if (existingUser) {
    ensureUserAccess(existingUser);
  }

  if (blockedEmail) {
    if (existingUser && existingUser.status !== "BLOCKED") {
      await withPrismaRetry((prisma) =>
        prisma.user.update({
          where: { id: existingUser.id },
          data: {
            status: "BLOCKED",
            blockedReason: blockedEmail.reason ?? "Email bloqueado pela administracao.",
            blockedAt: new Date(),
          },
        }),
      );
    }

    throw new BlockedAccessError("Email bloqueado.", blockedEmail.reason);
  }

  const platformRole = shouldGrantPlatformAdmin(input.email) ? "ADMIN" : undefined;

  if (
    existingUser?.defaultWorkspaceId &&
    existingUser.defaultWorkspace &&
    !hasProfileChanges(existingUser, input) &&
    (!platformRole || existingUser.platformRole === platformRole)
  ) {
    return {
      user: existingUser,
      workspace: existingUser.defaultWorkspace,
    };
  }

  return withPrismaRetry(async (prisma) => {
    if (existingUser?.defaultWorkspaceId && existingUser.defaultWorkspace) {
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: input.email ?? null,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          imageUrl: input.imageUrl ?? null,
          ...(platformRole ? { platformRole } : {}),
        },
        include: {
          defaultWorkspace: true,
        },
      });

      return {
        user: updatedUser,
        workspace: updatedUser.defaultWorkspace!,
      };
    }

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          clerkUserId: input.clerkUserId,
          email: normalizeEmail(input.email) ?? null,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          imageUrl: input.imageUrl ?? null,
          ...(platformRole ? { platformRole } : {}),
        },
      }));

    if (existingUser && hasProfileChanges(existingUser, input)) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: normalizeEmail(input.email) ?? null,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          imageUrl: input.imageUrl ?? null,
          ...(platformRole ? { platformRole } : {}),
        },
      });
    }

    const workspaceName = buildPersonalWorkspaceName(input);
    const workspaceSlug = await generateUniqueWorkspaceSlug(workspaceName, prisma);

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: workspaceSlug,
        ownerId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: WorkspaceMemberRole.OWNER,
          },
        },
        pricingSettings: {
          create: {},
        },
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { defaultWorkspaceId: workspace.id },
    });

    return {
      user: updatedUser,
      workspace,
    };
  });
}

export async function syncClerkUserFromSession(clerkUser: User) {
  return syncAuthenticatedUser(mapClerkUser(clerkUser));
}
