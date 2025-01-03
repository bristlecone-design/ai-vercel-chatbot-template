'use server';

import {
  type Bookmark,
  type ExperienceLikes,
  bookmarks,
  experienceLikes,
} from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/errors';

import { db } from '@/lib/db/connect';
import { toggleMediaRemoveStatus } from '@/lib/db/queries/media/get-core-media';
import { and, eq } from 'drizzle-orm';
import {
  detachPromptFromExperience,
  detachPromptStoryFromExperience,
  updateExperience,
} from './experiences-updates';
import { deletePromptCollaboratorByExpAndPromptId } from './prompts';

/**
 * Toggle an experience's 'removed' status
 *
 * @note This function is used to remove/unremove an experience
 * @note This function wraps the updateExperience function
 * @note This function also toggles the media's 'removed' status
 */
export async function toggleExperienceRemovedStatus(
  id: string,
  removed: boolean,
  toggleMedia = true,
  detachPrompts = true,
) {
  try {
    // console.log(`**** toggleExperienceRemovedStatus on server for ID:`, {
    //   id,
    //   removed,
    //   toggleMedia,
    //   detachPrompts,
    // });
    const { data: updatedExperience } = await updateExperience(id, {
      removed,
      // Prompt: detachPrompts ? { disconnect: true } : undefined,
    });
    // console.log(
    //   `**** updatedExperience after removal request in toggleExperienceRemovedStatus for ID:`,
    //   { id, updatedExperience }
    // );

    // Handle media toggling
    let mediaToggled = false;
    if (toggleMedia && updatedExperience && updatedExperience.Media) {
      const media = updatedExperience.Media;

      if (media.length) {
        const toggledMediaRes = await Promise.all(
          media.map(async (media) => {
            // Don't toggle featured media
            if (!media.featured) {
              return await toggleMediaRemoveStatus(media.id, removed);
            }
            return false;
          }),
        );

        mediaToggled = toggledMediaRes.some((res) => res);
      }
    }

    // Handle prompt collaborator maintenance
    const { Prompt } = updatedExperience;
    if (detachPrompts && updatedExperience && Prompt && removed) {
      const promptId = Prompt.id;
      const expId = updatedExperience.id;
      // console.log(`**** Detaching prompt from experience:`, {
      //   expId,
      //   promptId,
      // });
      const removedPCRecord = await deletePromptCollaboratorByExpAndPromptId(
        expId,
        promptId,
      );
      // console.log(
      //   `**** removed prompt collaboration record for experience ${expId} and promtp ${promptId}`,
      //   removedPCRecord
      // );

      if (removedPCRecord.count > 0) {
        // console.log(`**** Detached prompt from experience:`, {
        //   expId,
        //   promptId,
        // });
        await detachPromptFromExperience(expId);
        await detachPromptStoryFromExperience(expId);
      }
    }

    return {
      record: updatedExperience,
      toggled: removed === updatedExperience.removed,
      mediaToggled: mediaToggled === removed,
      msg: `Experience removed status toggled: ${removed}`,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error toggling experience removed status:', error);
    return {
      error: true,
      record: null,
      toggled: false,
      mediaToggled: false,
      msg: `Failed to toggle experience removed status: ${errMsg}`,
    };
  }
}

/**
 * Update an experience's bookmark status for a user based on status of the bookmark in the DB. Same implementation as togglesUsersExperienceLikeStatus
 *
 * @note This function is used to bookmark/unbookmark an experience
 * @note This function connects/disconnects the user to/from the experience
 */
export async function togglesUsersExperienceBookmarkStatus(
  isBookmarked: boolean,
  userId: string,
  expId: string,
): Promise<{
  bookmarked: boolean;
  error?: boolean;
  msg?: string;
  record: Bookmark | null;
}> {
  try {
    // First query for existing bookmark record
    const [bookmarkRecord] = await db
      .select()
      .from(bookmarks)
      .where(
        and(eq(bookmarks.experienceId, expId), eq(bookmarks.userId, userId)),
      );

    // If requesting to bookmark...
    if (isBookmarked) {
      // And the record exists, it's already bookmarked
      if (bookmarkRecord) {
        return {
          bookmarked: true,
          record: bookmarkRecord,
        };
      }
      // Otherwise, create a new bookmark record
      const [newRecord] = await db
        .insert(bookmarks)
        .values({
          experienceId: expId,
          userId,
          createdAt: new Date(),
        })
        .returning();

      return {
        bookmarked: true,
        record: newRecord,
      };
    }

    // If requesting to unbookmark...
    if (!bookmarkRecord) {
      // And the record doesn't exist, it's already unbookmarked
      return {
        bookmarked: false,
        record: null,
      };
    }

    // Otherwise, delete the bookmark record
    const [deletedRecord] = await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, bookmarkRecord.id))
      .returning();

    return {
      bookmarked: false,
      record: deletedRecord,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error updating experience bookmark status:', error);
    return {
      error: true,
      bookmarked: false,
      record: null,
      msg: `Failed to toggle experience bookmark status: ${errMsg}`,
    };
  }
}

/**
 * Update an experience's like status for a user based on status of the like in the DB
 *
 * @note This function is used to like/unlike an experience
 * @note This function connects/disconnects the user to/from the experience
 */
export async function togglesUsersExperienceLikeStatus(
  isLiked: boolean,
  userId: string,
  expId: string,
): Promise<{
  liked: boolean;
  error?: boolean;
  msg?: string;
  record: ExperienceLikes | null;
}> {
  try {
    // console.log(`**** updateExperienceLikeStatus on server based on`, {
    //   isLiked,
    //   expId,
    //   userId,
    // });
    // First query for existing like record
    const [likeRecord] = await db
      .select()
      .from(experienceLikes)
      .where(
        and(
          eq(experienceLikes.experienceId, expId),
          eq(experienceLikes.userId, userId),
        ),
      );

    // If requesting to like...
    if (isLiked) {
      // And the record exists, it's already liked
      if (likeRecord) {
        return {
          liked: true,
          record: likeRecord,
        };
      }
      // Otherwise, create a new like record
      const [newRecord] = await db
        .insert(experienceLikes)
        .values({
          experienceId: expId,
          userId,
          createdAt: new Date(),
        })
        .returning();

      return {
        liked: true,
        record: newRecord,
      };
    }

    // If requesting to unlike...
    if (!likeRecord) {
      // And the record doesn't exist, it's already unliked
      return {
        liked: false,
        record: null,
      };
    }

    // Otherwise, delete the like record
    const [deletedRecord] = await db
      .delete(experienceLikes)
      .where(eq(experienceLikes.id, likeRecord.id))
      .returning();

    return {
      liked: false,
      record: deletedRecord,
    };
  } catch (error) {
    const errMsg = getErrorMessage(error);
    console.error('Error updating experience like status:', error);
    return {
      error: true,
      liked: false,
      record: null,
      msg: `Failed to toggle experience like status: ${errMsg}`,
    };
  }
}
