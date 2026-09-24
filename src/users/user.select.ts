import { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  avatarUrl: true,
  role: true,
  bio: true,
  skills: true,
  githubUrl: true,
  websiteUrl: true,
  openToProject: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const authUserSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;
