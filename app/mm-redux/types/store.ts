// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {AppsState} from './apps';
import {Bot} from './bots';
import {ChannelCategoriesState} from './channel_categories';
import {ChannelsState} from './channels';
import {EmojisState} from './emojis';
import {FilesState} from './files';
import {GeneralState} from './general';
import {GroupsState} from './groups';
import {IntegrationsState} from './integrations';
import {PostsState} from './posts';
import {PreferenceType} from './preferences';
import {RemoteCluster} from './remote_cluster';
import {ChannelsRequestsStatuses, GeneralRequestsStatuses, PostsRequestsStatuses, TeamsRequestsStatuses, UsersRequestsStatuses, FilesRequestsStatuses, RolesRequestsStatuses} from './requests';
import {Role} from './roles';
import {SearchState} from './search';
import {TeamsState} from './teams';
import {Typing} from './typing';
import {UsersState} from './users';
import {Dictionary} from './utilities';

export type GlobalState = {
    entities: {
        general: GeneralState;
        users: UsersState;
        teams: TeamsState;
        channels: ChannelsState;
        posts: PostsState;
        bots: {
            accounts: Dictionary<Bot>;
        };
        preferences: {
            myPreferences: {
                [x: string]: PreferenceType;
            };
        };
        search: SearchState;
        integrations: IntegrationsState;
        files: FilesState;
        emojis: EmojisState;
        typing: Typing;
        roles: {
            roles: {
                [x: string]: Role;
            };
            pending: Set<string>;
        };
        gifs: any;
        groups: GroupsState;
        channelCategories: ChannelCategoriesState;
        remoteCluster: {
            info: {
                [x: string]: RemoteCluster;
            };
        };
        apps: AppsState;
    };
    errors: Array<any>;
    requests: {
        channels: ChannelsRequestsStatuses;
        general: GeneralRequestsStatuses;
        posts: PostsRequestsStatuses;
        teams: TeamsRequestsStatuses;
        users: UsersRequestsStatuses;
        files: FilesRequestsStatuses;
        roles: RolesRequestsStatuses;
    };
    views: any;
    websocket: {
        connected: boolean;
        lastConnectAt: number;
        lastDisconnectAt: number;
    };
};
