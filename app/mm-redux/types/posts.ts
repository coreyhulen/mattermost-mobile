// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CustomEmoji} from './emojis';
import {FileInfo} from './files';
import {Reaction} from './reactions';
import {UserProfile} from './users';
import {
    $ID,
    RelationOneToOne,
    RelationOneToMany,
    IDMappedObjects,
    Dictionary,
} from './utilities';

export type PostType = 'system_add_remove' |
                       'system_add_to_channel' |
                       'system_add_to_team' |
                       'system_channel_deleted' |
                       'system_channel_restored' |
                       'system_displayname_change' |
                       'system_convert_channel' |
                       'system_ephemeral' |
                       'system_header_change' |
                       'system_join_channel' |
                       'system_join_leave' |
                       'system_leave_channel' |
                       'system_purpose_change' |
                       'system_remove_from_channel';

export type PostEmbedType = 'image' | 'message_attachment' | 'opengraph';

export type PostEmbed = {
    type: PostEmbedType;
    url: string;
    data: Record<string, any>;
};

export type PostImage = {
    height: number;
    width: number;
    format?: string;
    frame_count?: number;
};

export type PostMetadata = {
    embeds: Array<PostEmbed>;
    emojis: Array<CustomEmoji>;
    files: Array<FileInfo>;
    images: Dictionary<PostImage>;
    reactions: Array<Reaction>;
};

export type Post = {
    id: string;
    create_at: number;
    update_at: number;
    edit_at: number;
    delete_at: number;
    is_pinned: boolean;
    is_following: boolean;
    user_id: string;
    channel_id: string;
    root_id: string;
    parent_id: string;
    original_id: string;
    message: string;
    type: PostType;
    props: Record<string, any>;
    hashtags: string;
    pending_post_id: string;
    reply_count: number;
    file_ids?: any[];
    metadata: PostMetadata;
    failed?: boolean;
    user_activity_posts?: Array<Post>;
    state?: 'DELETED';
    ownPost?: boolean;
    last_reply_at?: number;
    participants: Array<UserProfile | {id: $ID<UserProfile>}>;
};

export type PostWithFormatData = Post & {
    isFirstReply: boolean;
    isLastReply: boolean;
    previousPostIsComment: boolean;
    commentedOnPost?: Post;
    consecutivePostByUser: boolean;
    replyCount: number;
    isCommentMention: boolean;
    highlight: boolean;
};

export type PostOrderBlock = {
    order: Array<string>;
    recent?: boolean;
    oldest?: boolean;
};

export type MessageHistory = {
    messages: Array<string>;
    index: {
        post: number;
        comment: number;
    };
};

export type PostsState = {
    posts: IDMappedObjects<Post>;
    postsInChannel: Dictionary<Array<PostOrderBlock>>;
    postsInThread: RelationOneToMany<Post, Post>;
    reactions: RelationOneToOne<Post, Dictionary<Reaction>>;
    openGraph: RelationOneToOne<Post, any>;
    pendingPostIds: Array<string>;
    selectedPostId: string;
    currentFocusedPostId: string;
    messagesHistory: MessageHistory;
    expandedURLs: Dictionary<string>;
};

export type PostProps = {
    disable_group_highlight?: boolean;
    mentionHighlightDisabled: boolean;
}

export type PostResponse = PostOrderBlock & {
    posts: IDMappedObjects<Post>;
};
