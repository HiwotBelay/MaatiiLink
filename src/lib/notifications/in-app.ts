import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createInAppNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      metadata: input.metadata,
    },
  });
}

export async function createNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return [];
  return prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      metadata: input.metadata,
    })),
  });
}

export async function listNotificationsForUser(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
