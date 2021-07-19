// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Post} from './posts';
import {Team} from './teams';
import {UserProfile} from './users';
import {$ID, IDMappedObjects, RelationOneToMany, RelationOneToOne} from './utilities';

export type UserThread = {
    id: string;
    reply_count: number;
    last_reply_at: number;
    last_viewed_at: number;
    participants: Array<{id: $ID<UserProfile>} | UserProfile>;
    post: Post;
    unread_replies: number;
    unread_mentions: number;
    is_following?: boolean;
}

export type UserThreadList = {
    total: number;
    total_unread_threads: number;
    total_unread_mentions: number;
    threads: UserThread[];
}

export type ThreadsState = {
    threadsInTeam: RelationOneToMany<Team, UserThread>;
    threads: IDMappedObjects<UserThread>;
    counts: RelationOneToOne<Team, {
        total: number;
        total_unread_threads: number;
        total_unread_mentions: number;
    }>;
};
