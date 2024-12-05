'use server';

import { kv } from '@vercel/kv';

import { getErrorMessage } from '@/lib/errors';
import { nanoid } from '@/lib/id';
import { getUserSession } from '@/lib/session';

import { getAndMapUserGeo } from './geo';

import type {
  FeedbackSentimentType,
  FeedbackType,
  GenericFeedbackRecord,
} from '@/types/feedback';

export type ShareFeedbackProps = {
  id?: string | number; // Optional id for the feedback
  value: string;
  prompt?: string;
  sentiment?: FeedbackSentimentType;
  role?: string;
  meta?: GenericFeedbackRecord;
  type?: FeedbackType;
  userId?: string;
  bypassAuth?: boolean;
};

export type ShareFeedbackResponse = {
  success: boolean;
  message: string;
  feedback?: GenericFeedbackRecord;
  error?: boolean;
};

/**
 * Feedback is good for the soul... and your product.
 */
export async function shareFeedback(
  props: ShareFeedbackProps,
): Promise<ShareFeedbackResponse> {
  let id = props.id;
  let userId = props.userId;
  const {
    value,
    prompt = '',
    role = 'user',
    type = 'ai-response',
    sentiment = 'neutral',
    meta = {},
    bypassAuth,
  } = props;

  let feedback: GenericFeedbackRecord;

  try {
    let user;
    const session = await getUserSession();
    user = session?.user;
    if (!userId && !bypassAuth) {
      userId = user?.id;

      if (!userId) {
        return {
          error: true,
          success: false,
          message: 'Unauthorized Pal',
        };
      }
    }

    const geoMeta = (await getAndMapUserGeo()) as GenericFeedbackRecord;
    const feedbackMeta = {
      ...meta,
      ...geoMeta,
    } as GenericFeedbackRecord;
    if (user?.name) {
      feedbackMeta['userName'] = user.name;
    }

    id = id ?? nanoid();
    const createdAt = Date.now();

    feedback = {
      id,
      type,
      role,
      prompt,
      value,
      userId,
      sentiment,
      meta: {
        ...feedbackMeta,
      },
    } as GenericFeedbackRecord;

    await kv.hmset(`feedback:${userId}:${id}`, feedback);
    await kv.zadd(`user:feedback:${userId}`, {
      score: createdAt,
      member: `feedback:${userId}:${id}`,
    });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Doh! Error sharing feedback', errMsg);
    return {
      error: true,
      success: false,
      message: errMsg,
    };
  }

  return {
    success: true,
    message: 'Feedback Sent!',
    feedback,
  };
}
