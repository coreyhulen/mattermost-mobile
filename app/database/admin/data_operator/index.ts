// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Q} from '@nozbe/watermelondb';
import Model from '@nozbe/watermelondb/Model';

import {MM_TABLES} from '@constants/database';
import {
    compareAppRecord,
    compareChannelMembershipRecord,
    compareCustomEmojiRecord,
    compareDraftRecord,
    compareGlobalRecord,
    compareGroupMembershipRecord,
    comparePostRecord,
    comparePreferenceRecord,
    compareRoleRecord,
    compareServerRecord,
    compareSystemRecord,
    compareTeamMembershipRecord,
    compareTermsOfServiceRecord,
    compareUserRecord,
} from '@database/admin/data_operator/comparators';
import DatabaseManager from '@database/admin/database_manager';
import CustomEmoji from '@typings/database/custom_emoji';
import {
    BatchOperations,
    DiscardDuplicates,
    HandleBaseData,
    HandleEntityRecords,
    HandleFiles,
    HandleIsolatedEntityData,
    HandlePostMetadata,
    HandlePosts,
    HandleReactions,
    MatchExistingRecord,
    PostImage,
    RawChannelMembership,
    RawCustomEmoji,
    RawDraft,
    RawEmbed,
    RawFile,
    RawGroupMembership,
    RawPost,
    RawPostMetadata,
    RawPostsInThread,
    RawPreference,
    RawReaction,
    RawTeamMembership,
    RawUser,
    RawValue,
    RawWithNoId,
} from '@typings/database/database';
import {IsolatedEntities, OperationType} from '@typings/database/enums';
import File from '@typings/database/file';
import Post from '@typings/database/post';
import PostMetadata from '@typings/database/post_metadata';
import PostsInChannel from '@typings/database/posts_in_channel';
import PostsInThread from '@typings/database/posts_in_thread';
import Reaction from '@typings/database/reaction';

import DataOperatorException from './exceptions/data_operator_exception';
import DatabaseConnectionException from './exceptions/database_connection_exception';
import {
    operateAppRecord,
    operateChannelMembershipRecord,
    operateCustomEmojiRecord,
    operateDraftRecord,
    operateFileRecord,
    operateGlobalRecord,
    operateGroupMembershipRecord,
    operatePostInThreadRecord,
    operatePostMetadataRecord,
    operatePostRecord,
    operatePostsInChannelRecord,
    operatePreferenceRecord,
    operateReactionRecord,
    operateRoleRecord,
    operateServersRecord,
    operateSystemRecord,
    operateTeamMembershipRecord,
    operateTermsOfServiceRecord,
    operateUserRecord,
} from './operators';
import {createPostsChain, findMatchingRecords, hasSimilarUpdateAt, sanitizePosts, sanitizeReactions} from './utils';

const {
    CHANNEL_MEMBERSHIP,
    CUSTOM_EMOJI,
    DRAFT,
    FILE,
    GROUP_MEMBERSHIP,
    POST,
    POSTS_IN_CHANNEL,
    POSTS_IN_THREAD,
    POST_METADATA,
    PREFERENCE,
    REACTION,
    TEAM_MEMBERSHIP,
    USER,
} = MM_TABLES.SERVER;

class DataOperator {
  /**
   * handleIsolatedEntity: Handler responsible for the Create/Update operations on the isolated entities as described
   * by the IsolatedEntities enum
   * @param {HandleIsolatedEntityData} entityData
   * @param {IsolatedEntities} entityData.tableName
   * @param {RawValue[]} entityData.values
   * @returns {Promise<void>}
   */
  handleIsolatedEntity = async ({tableName, values}: HandleIsolatedEntityData) => {
      let recordOperator;
      let comparator;
      let oneOfField;

      switch (tableName) {
          case IsolatedEntities.APP: {
              comparator = compareAppRecord;
              oneOfField = 'version_number';
              recordOperator = operateAppRecord;
              break;
          }
          case IsolatedEntities.GLOBAL: {
              comparator = compareGlobalRecord;
              oneOfField = 'name';
              recordOperator = operateGlobalRecord;
              break;
          }
          case IsolatedEntities.SERVERS: {
              comparator = compareServerRecord;
              oneOfField = 'db_path';
              recordOperator = operateServersRecord;
              break;
          }
          case IsolatedEntities.ROLE: {
              comparator = compareRoleRecord;
              oneOfField = 'name';
              recordOperator = operateRoleRecord;
              break;
          }
          case IsolatedEntities.SYSTEM: {
              comparator = compareSystemRecord;
              oneOfField = 'name';
              recordOperator = operateSystemRecord;
              break;
          }
          case IsolatedEntities.TERMS_OF_SERVICE: {
              comparator = compareTermsOfServiceRecord;
              oneOfField = 'accepted_at';
              recordOperator = operateTermsOfServiceRecord;
              break;
          }
          default: {
              throw new DataOperatorException(`handleIsolatedEntity was called with an invalid table name ${tableName}`);
          }
      }

      if (recordOperator && oneOfField && comparator) {
          await this.handleEntityRecords({
              comparator,
              oneOfField,
              operator: recordOperator,
              rawValues: values,
              tableName,
          });
      }
  };

  /**
   * handleDraft: Handler responsible for the Create/Update operations occurring the Draft entity from the 'Server' schema
   * @param {RawDraft[]} drafts
   * @returns {Promise<any[]>}
   */
  handleDraft = async (drafts: RawDraft[]) => {
      if (!drafts.length) {
          return;
      }

      await this.handleEntityRecords({
          comparator: compareDraftRecord,
          oneOfField: 'channel_id',
          operator: operateDraftRecord,
          rawValues: drafts,
          tableName: DRAFT,
      });
  };

  /**
   * handleReactions: Handler responsible for the Create/Update operations occurring on the Reaction entity from the 'Server' schema
   * @param {HandleReactions} handleReactions
   * @param {RawReaction[]} handleReactions.reactions
   * @param {boolean} handleReactions.prepareRowsOnly
   * @returns {Promise<any[] | (Reaction | CustomEmoji)[]>}
   */
  handleReactions = async ({reactions, prepareRowsOnly}: HandleReactions) => {
      if (!reactions.length) {
          return [];
      }

      const database = await this.getDatabase(REACTION);

      const {
          createEmojis,
          createReactions,
          deleteReactions,
      } = await sanitizeReactions({
          database,
          post_id: reactions[0].post_id,
          rawReactions: reactions,
      });

      // Prepares record for model Reactions
      const postReactions = ((await this.prepareBase({
          createRaws: createReactions,
          database,
          recordOperator: operateReactionRecord,
          tableName: REACTION,
      })) as unknown) as Reaction[];

      // Prepares records for model CustomEmoji
      const reactionEmojis = ((await this.prepareBase({
          database,
          recordOperator: operateCustomEmojiRecord,
          tableName: CUSTOM_EMOJI,
          createRaws: createEmojis.map((emoji) => {
              return {record: undefined, raw: emoji};
          }) as MatchExistingRecord[],
      })) as unknown) as CustomEmoji[];

      const batchRecords = [...postReactions, ...deleteReactions, ...reactionEmojis];

      if (prepareRowsOnly) {
          return batchRecords;
      }

      if (batchRecords?.length) {
          await this.batchOperations({
              database,
              models: batchRecords,
          });
      }

      return [];
  };

  /**
   * handleFiles: Handler responsible for the Create/Update operations occurring on the File entity from the 'Server' schema
   * @param {HandleFiles} handleFiles
   * @param {RawFile[]} handleFiles.files
   * @param {boolean} handleFiles.prepareRowsOnly
   * @returns {Promise<File[] | any[]>}
   */
  handleFiles = async ({files, prepareRowsOnly}: HandleFiles) => {
      if (!files.length) {
          return [];
      }

      const database = await this.getDatabase(FILE);

      const postFiles = ((await this.prepareBase({
          database,
          recordOperator: operateFileRecord,
          tableName: FILE,
          createRaws: files.map((file) => {
              return {record: undefined, raw: file};
          }),
      })) as unknown) as File[];

      if (prepareRowsOnly) {
          return postFiles;
      }

      if (postFiles?.length) {
          await this.batchOperations({database, models: [...postFiles]});
      }

      return [];
  };

  /**
   * handlePostMetadata: Handler responsible for the Create/Update operations occurring on the PostMetadata entity from the 'Server' schema
   * @param {HandlePostMetadata} handlePostMetadata
   * @param {{embed: RawEmbed[], postId: string}[] | undefined} handlePostMetadata.embeds
   * @param {{images: Dictionary<PostImage>, postId: string}[] | undefined} handlePostMetadata.images
   * @param {boolean} handlePostMetadata.prepareRowsOnly
   * @returns {Promise<any[] | PostMetadata[]>}
   */
  handlePostMetadata = async ({embeds, images, prepareRowsOnly}: HandlePostMetadata) => {
      const metadata: RawPostMetadata[] = [];

      if (images?.length) {
          images.forEach((image) => {
              const imageEntry = Object.entries(image.images);
              metadata.push({
                  data: {...imageEntry?.[0]?.[1], url: imageEntry?.[0]?.[0]},
                  type: 'images',
                  postId: image.postId,
              });
          });
      }

      if (embeds?.length) {
          embeds.forEach((postEmbed) => {
              postEmbed.embed.forEach((embed: RawEmbed) => {
                  metadata.push({
                      data: {...embed.data},
                      type: embed.type,
                      postId: postEmbed.postId,
                  });
              });
          });
      }

      if (!metadata.length) {
          return [];
      }

      const database = await this.getDatabase(POST_METADATA);

      const postMetas = ((await this.prepareBase({
          database,
          recordOperator: operatePostMetadataRecord,
          tableName: POST_METADATA,
          createRaws: metadata.map((meta) => {
              return {record: undefined, raw: meta};
          }),
      })) as unknown) as PostMetadata[];

      if (prepareRowsOnly) {
          return postMetas;
      }

      if (postMetas?.length) {
          await this.batchOperations({database, models: [...postMetas]});
      }

      return [];
  };

  /**
   * handlePostsInThread: Handler responsible for the Create/Update operations occurring on the PostsInThread entity from the 'Server' schema
   * @param {RawPostsInThread[]} postsInThreads
   * @returns {Promise<any[]>}
   */
  handlePostsInThread = async (postsInThreads: RawPostsInThread[]) => {
      if (!postsInThreads.length) {
          return [];
      }

      const postIds = postsInThreads.map((postThread) => postThread.post_id);
      const rawPostsInThreads: RawPostsInThread[] = [];

      const database = await this.getDatabase(POSTS_IN_THREAD);
      const threads = (await database.collections.
          get(POST).
          query(Q.where('root_id', Q.oneOf(postIds))).
          fetch()) as Post[];

      postsInThreads.forEach((rootPost) => {
          const childPosts = [];
          let maxCreateAt = 0;
          for (let i = 0; i < threads.length; i++) {
              const thread = threads[i];
              if (thread?.rootId === rootPost.post_id) {
                  // Creates a sub-array of threads relating to rootPost.post_id
                  childPosts.push(thread);
              }

              // Retrieves max createAt date of all posts whose root_id is rootPost.post_id
              maxCreateAt = thread.createAt > maxCreateAt ? thread.createAt : maxCreateAt;
          }

          // Collects all 'raw' postInThreads objects that will be sent to the operatePostsInThread function
          rawPostsInThreads.push({...rootPost, latest: maxCreateAt});
      });

      const postInThreadRecords = ((await this.prepareBase({
          database,
          recordOperator: operatePostInThreadRecord,
          tableName: POSTS_IN_THREAD,
          createRaws: rawPostsInThreads.map((postInThread) => {
              return {raw: postInThread, record: undefined};
          }),
      })) as unknown) as PostsInThread[];

      if (postInThreadRecords?.length) {
          await this.batchOperations({database, models: postInThreadRecords});
      }

      return [];
  };

  /**
   * handlePostsInChannel: Handler responsible for the Create/Update operations occurring on the PostsInChannel entity from the 'Server' schema
   * @param {RawPost[]} posts
   * @returns {Promise<any[]>}
   */
  handlePostsInChannel = async (posts: RawPost[]) => {
      // At this point, the parameter 'posts' is already a chain of posts.  Now, we have to figure out how to plug it
      // into existing chains in the PostsInChannel table

      if (!posts.length) {
          return [];
      }

      // Sort a clone of 'posts' array by create_at
      const sortedPosts = [...posts].sort((a, b) => {
          return a.create_at - b.create_at;
      });

      // The first element (beginning of chain)
      const tipOfChain: RawPost = sortedPosts[0];

      // Channel Id for this chain of posts
      const channelId = tipOfChain.channel_id;

      // Find smallest 'create_at' value in chain
      const earliest = tipOfChain.create_at;

      // Find highest 'create_at' value in chain; -1 means we are dealing with one item in the posts array
      const latest = sortedPosts[sortedPosts.length - 1].create_at;

      const database = await this.getDatabase(POSTS_IN_CHANNEL);

      // Find the records in the PostsInChannel table that have a matching channel_id
      const chunks = (await database.collections.
          get(POSTS_IN_CHANNEL).
          query(Q.where('channel_id', channelId)).
          fetch()) as PostsInChannel[];

      const createPostsInChannelRecord = async () => {
          const createPostsInChannel = {channel_id: channelId, earliest, latest};
          await this.handleBase({
              createRaws: [{record: undefined, raw: createPostsInChannel}],
              tableName: POSTS_IN_CHANNEL,
              recordOperator: operatePostsInChannelRecord,
          });
      };

      // chunk length 0; then it's a new chunk to be added to the PostsInChannel table
      if (chunks.length === 0) {
          await createPostsInChannelRecord();
          return [];
      }

      // Sort chunks (in-place) by earliest field
      chunks.sort((a, b) => {
          return a.earliest - b.earliest;
      });

      let found = false;
      let targetChunk: PostsInChannel;
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      // find if we should plug the chain before
          const chunk = chunks[chunkIndex];
          if (earliest < chunk.earliest) {
              found = true;
              targetChunk = chunk;
          }

          if (found) {
              break;
          }
      }

      if (found) {
      // We have a potential chunk to plug nearby
          const potentialPosts = (await database.collections.
              get(POST).
              query(Q.where('create_at', earliest)).
              fetch()) as Post[];

          if (potentialPosts?.length > 0) {
              const targetPost = potentialPosts[0];

              // now we decide if we need to operate on the targetChunk or just create a new chunk
              const isChainable = tipOfChain.prev_post_id === targetPost.previousPostId;

              if (isChainable) {
                  // Update this chunk's data in PostsInChannel table.  earliest comes from tipOfChain while latest comes from chunk
                  await database.action(async () => {
                      await targetChunk.update((postInChannel) => {
                          postInChannel.earliest = earliest;
                      });
                  });
              } else {
                  await createPostsInChannelRecord();
                  return [];
              }
          }
      } else {
          await createPostsInChannelRecord();
          return [];
      }

      return [];
  };

  /**
   * handlePosts: Handler responsible for the Create/Update operations occurring on the Post entity from the 'Server' schema
   * @param {HandlePosts} handlePosts
   * @param {string[]} orders
   * @param {RawPost[]} values
   * @param {string | undefined} previousPostId
   * @returns {Promise<void>}
   */
  handlePosts = async ({orders, values, previousPostId}: HandlePosts) => {
      const tableName = POST;

      // We rely on the order array; if it is empty, we stop processing
      if (!orders.length) {
          throw new DataOperatorException(
              'An empty "order" array has been passed to the HandlePosts method',
          );
      }

      let batch: Model[] = [];
      let files: RawFile[] = [];
      const postsInThread = [];
      let reactions: RawReaction[] = [];
      let emojis: RawCustomEmoji[] = [];
      const images: { images: Dictionary<PostImage>; postId: string }[] = [];
      const embeds: { embed: RawEmbed[]; postId: string }[] = [];

      // By sanitizing the values, we are separating 'posts' that needs updating ( i.e. un-ordered posts ) from those that need to be created in our database
      const {orderedPosts, unOrderedPosts} = sanitizePosts({
          posts: values,
          orders,
      });

      // We create the 'chain of posts' by linking each posts' previousId to the post before it in the order array
      const linkedRawPosts: MatchExistingRecord[] = createPostsChain({
          orders,
          previousPostId: previousPostId || '',
          rawPosts: orderedPosts,
      });

      const database = await this.getDatabase(tableName);

      // FIXME : should you not verify if post id is already present in DB ?

      // Prepares records for batch processing onto the 'Post' entity for the server schema
      const posts = ((await this.prepareBase({
          database,
          tableName,
          createRaws: linkedRawPosts,
          recordOperator: operatePostRecord,
      })) as unknown) as Post[];

      // Appends the processed records into the final batch array
      batch = batch.concat(posts);

      // Starts extracting information from each post to build up for related entities' data
      for (let i = 0; i < orderedPosts.length; i++) {
          const post = orderedPosts[i] as RawPost;

          // PostInThread handler: checks for id === root_id , if so, then call PostsInThread operator
          if (post.id === post.root_id) {
              postsInThread.push({
                  earliest: post.create_at,
                  post_id: post.id,
              });
          }

          const hasMetadata = post?.metadata && Object.keys(post?.metadata).length > 0;
          if (hasMetadata) {
              const metadata = post.metadata;

              // Extracts reaction from post's metadata
              reactions = reactions.concat(metadata?.reactions ?? []);

              // Extracts emojis from post's metadata
              emojis = emojis.concat(metadata?.emojis ?? []);

              // Extracts files from post's metadata
              files = files.concat(metadata?.files ?? []);

              // Extracts images and embeds from post's metadata
              if (metadata?.images) {
                  images.push({images: metadata.images, postId: post.id});
              }

              if (metadata?.embeds) {
                  embeds.push({embed: metadata.embeds, postId: post.id});
              }
          }
      }

      // calls handler for Reactions
      const postReactions = (await this.handleReactions({
          reactions,
          prepareRowsOnly: true,
      })) as Reaction[];
      batch = batch.concat(postReactions);

      // calls handler for Files
      const postFiles = (await this.handleFiles({
          files,
          prepareRowsOnly: true,
      })) as File[];
      batch = batch.concat(postFiles);

      // calls handler for postMetadata ( embeds and images )
      const postMetadata = (await this.handlePostMetadata({
          images,
          embeds,
          prepareRowsOnly: true,
      })) as PostMetadata[];
      batch = batch.concat(postMetadata);

      if (batch.length) {
          await this.batchOperations({database, models: batch});
      }

      // LAST: calls handler for CustomEmojis, PostsInThread, PostsInChannel
      await this.handleCustomEmojis(emojis);
      await this.handlePostsInThread(postsInThread);
      await this.handlePostsInChannel(orderedPosts);

      // Truly update those posts that have a different update_at value
      await this.handleEntityRecords({
          comparator: comparePostRecord,
          oneOfField: 'id',
          operator: operatePostRecord,
          rawValues: unOrderedPosts,
          tableName: POST,
      });
  };

  /**
   * handleUsers: Handler responsible for the Create/Update operations occurring on the User entity from the 'Server' schema
   * @param {RawUser[]} users
   * @returns {Promise<void>}
   */
  handleUsers = async (users: RawUser[]) => {
      await this.handleEntityRecords({
          comparator: compareUserRecord,
          oneOfField: 'id',
          operator: operateUserRecord,
          rawValues: users,
          tableName: USER,
      });
  };

  /**
   * handlePreferences: Handler responsible for the Create/Update operations occurring on the PREFERENCE entity from the 'Server' schema
   * @param {RawPreference[]} preferences
   * @returns {Promise<null|void>}
   */
  handlePreferences = async (preferences: RawPreference[]) => {
      await this.handleEntityRecords({
          comparator: comparePreferenceRecord,
          oneOfField: 'user_id',
          operator: operatePreferenceRecord,
          rawValues: preferences,
          tableName: PREFERENCE,
      });
  };

  /**
   * handleTeamMemberships: Handler responsible for the Create/Update operations occurring on the TEAM_MEMBERSHIP entity from the 'Server' schema
   * @param {RawTeamMembership[]} teamMemberships
   * @returns {Promise<null|void>}
   */
  handleTeamMemberships = async (teamMemberships: RawTeamMembership[]) => {
      await this.handleEntityRecords({
          comparator: compareTeamMembershipRecord,
          oneOfField: 'user_id',
          operator: operateTeamMembershipRecord,
          rawValues: teamMemberships,
          tableName: TEAM_MEMBERSHIP,
      });
  };

  /**
   * handleCustomEmojis: Handler responsible for the Create/Update operations occurring on the CUSTOM_EMOJI entity from the 'Server' schema
   * @param {RawCustomEmoji[]} customEmojis
   * @returns {Promise<null|void>}
   */
  handleCustomEmojis = async (customEmojis: RawCustomEmoji[]) => {
      await this.handleEntityRecords({
          comparator: compareCustomEmojiRecord,
          oneOfField: 'name',
          operator: operateCustomEmojiRecord,
          rawValues: customEmojis,
          tableName: CUSTOM_EMOJI,
      });
  };

  /**
   * handleGroupMembership: Handler responsible for the Create/Update operations occurring on the GROUP_MEMBERSHIP entity from the 'Server' schema
   * @param {RawGroupMembership[]} groupMemberships
   * @returns {Promise<void>}
   */
  handleGroupMembership = async (groupMemberships: RawGroupMembership[]) => {
      await this.handleEntityRecords({
          comparator: compareGroupMembershipRecord,
          oneOfField: 'user_id',
          operator: operateGroupMembershipRecord,
          rawValues: groupMemberships,
          tableName: GROUP_MEMBERSHIP,
      });
  };

  /**
   * handleChannelMembership: Handler responsible for the Create/Update operations occurring on the CHANNEL_MEMBERSHIP entity from the 'Server' schema
   * @param {RawChannelMembership[]} channelMemberships
   * @returns {Promise<null|void>}
   */
  handleChannelMembership = async (channelMemberships: RawChannelMembership[]) => {
      await this.handleEntityRecords({
          comparator: compareChannelMembershipRecord,
          oneOfField: 'user_id',
          operator: operateChannelMembershipRecord,
          rawValues: channelMemberships,
          tableName: CHANNEL_MEMBERSHIP,
      });
  };

  /**
   * handleEntityRecords : Utility that processes some entities' data against values already present in the database so as to avoid duplicity.
   * @param {HandleEntityRecords} handleEntityRecords
   * @param {(existing: Model, newElement: RawValue) => boolean} handleEntityRecords.comparator
   * @param {string} handleEntityRecords.oneOfField
   * @param {(DataFactory) => Promise<Model | null>} handleEntityRecords.operator
   * @param {RawWithNoId[]} handleEntityRecords.rawValues
   * @param {string} handleEntityRecords.tableName
   * @returns {Promise<null | void>}
   */
  private handleEntityRecords = async ({comparator, oneOfField, operator, rawValues, tableName}: HandleEntityRecords) => {
      if (!rawValues.length) {
          return null;
      }

      const {createRaws, updateRaws} = await this.getCreateUpdateRecords({
          rawValues,
          tableName,
          comparator,
          oneOfField,
      });

      const records = await this.handleBase({
          recordOperator: operator,
          tableName,
          createRaws,
          updateRaws,
      });

      return records;
  };

  // TODO : Add jest to getCreateUpdateRecords
  /**
   * getCreateUpdateRecords: This method weeds out duplicates entries.  It may happen that we do multiple inserts for
   * the same value.  Hence, prior to that we query the database and pick only those values that are  'new' from the 'Raw' array.
   * @param {DiscardDuplicates} prepareRecords
   * @param {RawWithNoId[]} prepareRecords.rawValues
   * @param {string} prepareRecords.tableName
   * @param {string} prepareRecords.oneOfField
   * @param {(existing: Model, newElement: RawValue) => boolean} prepareRecords.comparator
   */
  private getCreateUpdateRecords = async ({rawValues, tableName, comparator, oneOfField}: DiscardDuplicates) => {
      const getOneOfs = (raws: RawValue[]) => {
          return raws.reduce((oneOfs, current: RawWithNoId) => {
              const key = oneOfField as keyof typeof current;
              const value: string = current[key] as string;
              if (value) {
                  oneOfs.push(value);
              }
              return oneOfs;
          }, [] as string[]);
      };

      const columnValues: string[] = getOneOfs(rawValues);

      const database = await this.getDatabase(tableName);

      // NOTE: There is no 'id' field in the response, hence, we need to  weed out any duplicates before sending the values to the operator
      const existingRecords = (await findMatchingRecords({
          database,
          tableName,
          condition: Q.where(oneOfField, Q.oneOf(columnValues)),
      })) as Model[];

      const createRaws: MatchExistingRecord[] = [];
      const updateRaws: MatchExistingRecord[] = [];

      if (existingRecords.length > 0) {
          rawValues.map((newElement) => {
              const findIndex = existingRecords.findIndex((existing) => {
                  return comparator(existing, newElement);
              });

              if (findIndex !== -1) {
                  const existingRecord = existingRecords[findIndex];

                  // We found a record in the database that matches this element; hence, we'll proceed for an UPDATE operation
                  const isUpdateAtSimilar = hasSimilarUpdateAt({tableName, existingRecord, newValue: newElement});
                  if (!isUpdateAtSimilar) {
                      return updateRaws.push({record: existingRecord, raw: newElement});
                  }
              }

              // This RawValue is not present in the database; hence, we need to create it
              return createRaws.push({record: undefined, raw: newElement});
          });
          return {createRaws, updateRaws};
      }

      return {
          createRaws: rawValues.map((raw) => {
              return {record: undefined, raw};
          }),
          updateRaws,
      };
  };

  /**
   * batchOperations: Accepts an instance of Database (either Default or Server) and an array of
   * prepareCreate/prepareUpdate 'models' and executes the actions on the database.
   * @param {BatchOperations} operation
   * @param {Database} operation.database
   * @param {Array} operation.models
   * @returns {Promise<void>}
   */
  private batchOperations = async ({database, models}: BatchOperations) => {
      try {
          if (models.length > 0) {
              await database.action(async () => {
                  await database.batch(...models);
              });
          } else {
              throw new DataOperatorException(
                  'batchOperations does not process empty model array',
              );
          }
      } catch (e) {
          throw new DataOperatorException('batchOperations error ', e);
      }
  };

  /**
   * prepareBase: Utility method that actually calls the operators for the handlers
   * @param {Database} database
   * @param {string} tableName
   * @param {RawValue[]} createRaws
   * @param {RawValue[]} updateRaws
   * @param {(recordOperator: { value: RawValue, database: Database, tableName: string, action: OperationType}) => void} recordOperator
   * @returns {Promise<unknown[] | any[]>}
   */
  private prepareBase = async ({database, tableName, createRaws, updateRaws, recordOperator}: HandleBaseData) => {
      if (!database) {
          throw new DataOperatorException(
              'prepareBase accepts only rawPosts of type RawValue[] or valid database connection',
          );
      }
      let prepareCreate: Model[] = [];
      let prepareUpdate: Model[] = [];

      // create operation
      if (createRaws?.length) {
          const recordPromises = await createRaws.map(async (createRecord: MatchExistingRecord) => {
              const record = await recordOperator({database, tableName, value: createRecord, action: OperationType.CREATE});
              return record;
          });

          const results = await Promise.all(recordPromises) as unknown as Model[];
          prepareCreate = prepareCreate.concat(results);
      }

      // update operation
      if (updateRaws?.length) {
          const recordPromises = await updateRaws.map(async (updateRecord: MatchExistingRecord) => {
              const record = await recordOperator({
                  database,
                  tableName,
                  value: updateRecord,
                  action: OperationType.UPDATE,
              });
              return record;
          });

          const results = await Promise.all(recordPromises) as unknown as Model[];
          prepareUpdate = prepareUpdate.concat(results);
      }

      return [...prepareCreate, ...prepareUpdate];
  };

  /**
   * handleBase: Handles the Create/Update operations on an entity.
   * @param {HandleBaseData} handleBase
   * @param {string} handleBase.tableName
   * @param {RecordValue[]} handleBase.createRaws
   * @param {RecordValue[]} handleBase.updateRaws
   * @param {(DataFactory) => void} handleBase.recordOperator
   * @returns {Promise<void>}
   */
  private handleBase = async ({
      createRaws,
      recordOperator,
      tableName,
      updateRaws,
  }: HandleBaseData) => {
      const database = await this.getDatabase(tableName);

      const models = ((await this.prepareBase({
          database,
          tableName,
          createRaws,
          updateRaws,
          recordOperator,
      })) as unknown) as Model[];

      if (models?.length > 0) {
          await this.batchOperations({
              database,
              models,
          });
      }
  };

  /**
   * getDatabase: Based on the table's name, it will return a database instance either from the 'DEFAULT' database or
   * the 'SERVER' database
   * @param {string} tableName
   * @returns {Promise<void>}
   */
  private getDatabase = async (tableName: string) => {
      const isDefaultConnection = Object.values(MM_TABLES.DEFAULT).some(
          (tbName) => {
              return tableName === tbName;
          },
      );

      const promise = isDefaultConnection ? this.getDefaultDatabase : this.getServerDatabase;
      const connection = await promise();

      return connection;
  };

  /**
   * getDefaultDatabase: Returns the default database
   * @returns {Promise<DatabaseInstance>}
   */
  private getDefaultDatabase = async () => {
      const connection = await DatabaseManager.getDefaultDatabase();
      if (connection === undefined) {
          throw new DatabaseConnectionException(
              'An error occurred while retrieving the default database',
              '',
          );
      }
      return connection;
  };

  /**
   * getServerDatabase: Returns the current active server database (multi-server support)
   * @returns {Promise<DatabaseInstance>}
   */
  private getServerDatabase = async () => {
      // NOTE: here we are getting the active server directly as in a multi-server support system, the current
      // active server connection will already be set on application init
      const connection = await DatabaseManager.getActiveServerDatabase();
      if (connection === undefined) {
          throw new DatabaseConnectionException(
              'An error occurred while retrieving the server database',
              '',
          );
      }
      return connection;
  };
}

export default new DataOperator();