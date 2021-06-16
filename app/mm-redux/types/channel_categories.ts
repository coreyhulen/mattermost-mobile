// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Channel} from './channels';
import {Team} from './teams';
import {UserProfile} from './users';
import {$ID, IDMappedObjects, RelationOneToOne} from './utilities';

export type ChannelCategoryType = 'favorites' | 'channels' | 'direct_messages' | 'custom' | 'public' | 'private';

// eslint-disable-next-line no-shadow
export enum CategorySorting {
    Alphabetical = 'alpha',
    Default = '', // behaves the same as manual
    Recency = 'recent',
    Manual = 'manual',
}

export type ChannelCategory = {
    id: string;
    user_id: $ID<UserProfile>;
    team_id: $ID<Team>;
    type: ChannelCategoryType;
    display_name: string;
    sorting: CategorySorting;
    channel_ids: Array<$ID<Channel>>;
    muted: boolean;
    collapsed: boolean;
};

export type OrderedChannelCategories = {
    categories: ChannelCategory[];
    order: string[];
};

export type ChannelCategoriesState = {
    byId: IDMappedObjects<ChannelCategory>;
    orderByTeam: RelationOneToOne<Team, Array<$ID<ChannelCategory>>>;
};
