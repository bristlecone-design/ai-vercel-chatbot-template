import OpenAI from 'openai';
import { MessageListParams } from 'openai/resources/beta/threads/messages';

import { createOpenAI } from './openai-core';

export async function createAssistantThread(openai?: OpenAI) {
  openai = openai || createOpenAI();
  return await openai.beta.threads.create();
}

export async function getAssistantThread(threadId: string, openai?: OpenAI) {
  openai = openai || createOpenAI();
  return await openai.beta.threads.retrieve(threadId);
}

export async function getAssistantThreadMessages(
  threadId: string,
  order: 'asc' | 'desc' = 'asc',
  beforeId?: string,
  afterId?: string,
  openai?: OpenAI
) {
  openai = openai || createOpenAI();

  const queryOpts = {} as MessageListParams;
  if (order) {
    queryOpts['order'] = order;
  }
  if (beforeId) {
    queryOpts['before'] = beforeId;
  }
  if (afterId) {
    queryOpts['after'] = afterId;
  }

  return (await openai.beta.threads.messages.list(threadId, queryOpts)).data;
}

export async function deleteAssistantThread(threadId: string, openai?: OpenAI) {
  openai = openai || createOpenAI();
  return await openai.beta.threads.del(threadId);
}
