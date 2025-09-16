// lib/ai/entitlements.ts - SIMPLIFIED VERSION
import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ['gpt-4o-mini-chat'],
  },
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['gpt-4o-mini-chat'],
  },
};