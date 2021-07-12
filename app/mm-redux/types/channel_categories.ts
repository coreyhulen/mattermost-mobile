// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Team} from './teams';
import {$ID, IDMappedObjects, RelationOneToOne} from './utilities';

export type ChannelCategoryType = 'favorites' | 'public' | 'private' | 'direct_messages' | 'custom';

export type ChannelCategory = {
    id: string;
    team_id: $ID<Team>;
    type: ChannelCategoryType;
    display_name: string;

    // This will be added in phase 2 of Channel Sidebar Organization once the server provides the categories
    // channel_ids: $ID<Channel>;
};

export type ChannelCategoriesState = {
    byId: IDMappedObjects<ChannelCategory>;
    orderByTeam: RelationOneToOne<Team, $ID<ChannelCategory>[]>;
};
