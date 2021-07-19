// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {GeneralState} from './general';
import {UsersState} from './users';
import {TeamsState} from './teams';
import {ChannelsState} from './channels';
import {PostsState} from './posts';
import {SearchState} from './search';
import {IntegrationsState} from './integrations';
import {FilesState} from './files';
import {EmojisState} from './emojis';
import {Typing} from './typing';
import {GroupsState} from './groups';
import {ChannelsRequestsStatuses, GeneralRequestsStatuses, PostsRequestsStatuses, TeamsRequestsStatuses, UsersRequestsStatuses, FilesRequestsStatuses, RolesRequestsStatuses} from './requests';
import {Role} from './roles';
import {PreferenceType} from './preferences';
import {Bot} from './bots';
import {ChannelCategoriesState} from './channel_categories';
import {RemoteCluster} from './remote_cluster';
import {Dictionary} from './utilities';
import {ThreadsState} from './threads';
import {AppsState} from './apps';

export type GlobalState = {
    entities: {
        general: GeneralState;
        users: UsersState;
        teams: TeamsState;
        channels: ChannelsState;
        posts: PostsState;
        threads: ThreadsState;
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
