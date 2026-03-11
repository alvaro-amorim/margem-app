"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { WorkspacePlan } from "@/generated/prisma/enums";
import { requirePlatformAdminContext } from "@/lib/auth";
import {
  addBlockedEmail,
  blockPlatformUser,
  deletePlatformUser,
  removeBlockedEmail,
  unblockPlatformUser,
  updateWorkspacePlan,
} from "@/server/admin/service";

function redirectToAdmin(params: {
  notice?: string;
  error?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.notice) {
    searchParams.set("notice", params.notice);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  const query = searchParams.toString();
  redirect(query ? `/admin?${query}` : "/admin");
}

function revalidateAdminPages() {
  revalidatePath("/admin");
}

export async function updateWorkspacePlanAction(formData: FormData) {
  await requirePlatformAdminContext();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const plan = String(formData.get("plan") ?? "");

  if (!workspaceId || !Object.values(WorkspacePlan).includes(plan as WorkspacePlan)) {
    redirectToAdmin({ error: "plan-invalid" });
  }

  await updateWorkspacePlan(workspaceId, plan as WorkspacePlan);
  revalidateAdminPages();
  redirectToAdmin({ notice: "plan-updated" });
}

export async function blockUserAction(formData: FormData) {
  const { user } = await requirePlatformAdminContext();

  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId) {
    redirectToAdmin({ error: "user-invalid" });
  }

  if (userId === user.id) {
    redirectToAdmin({ error: "self-block" });
  }

  await blockPlatformUser(userId, reason || undefined);
  revalidateAdminPages();
  redirectToAdmin({ notice: "user-blocked" });
}

export async function unblockUserAction(formData: FormData) {
  await requirePlatformAdminContext();

  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    redirectToAdmin({ error: "user-invalid" });
  }

  await unblockPlatformUser(userId);
  revalidateAdminPages();
  redirectToAdmin({ notice: "user-unblocked" });
}

export async function deleteUserAction(formData: FormData) {
  const { user } = await requirePlatformAdminContext();

  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    redirectToAdmin({ error: "user-invalid" });
  }

  if (userId === user.id) {
    redirectToAdmin({ error: "self-delete" });
  }

  await deletePlatformUser(userId);
  revalidateAdminPages();
  redirectToAdmin({ notice: "user-deleted" });
}

export async function blockEmailAction(formData: FormData) {
  const { user } = await requirePlatformAdminContext();

  const email = String(formData.get("email") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!email) {
    redirectToAdmin({ error: "email-invalid" });
  }

  if (user.email && email.toLowerCase() === user.email.toLowerCase()) {
    redirectToAdmin({ error: "self-email-block" });
  }

  await addBlockedEmail(email, reason || undefined);
  revalidateAdminPages();
  redirectToAdmin({ notice: "email-blocked" });
}

export async function unblockEmailAction(formData: FormData) {
  await requirePlatformAdminContext();

  const blockedEmailId = String(formData.get("blockedEmailId") ?? "");

  if (!blockedEmailId) {
    redirectToAdmin({ error: "email-invalid" });
  }

  await removeBlockedEmail(blockedEmailId);
  revalidateAdminPages();
  redirectToAdmin({ notice: "email-unblocked" });
}
