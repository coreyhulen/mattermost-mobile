// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Config from '@assets/config.json';

const state = {
    app: {
        version: '',
        build: '',
    },
    entities: {
        general: {
            appState: false,
            credentials: {},
            config: {},
            dataRetention: {
                policies: {},
                lastCleanUpAt: null,
            },
            deviceToken: '',
            license: {},
            serverVersion: '',
        },
        users: {
            currentUserId: '',
            mySessions: [],
            profiles: {},
            profilesInTeam: {},
            profilesInChannel: {},
            profilesNotInChannel: {},
            statuses: {},
        },
        teams: {
            currentTeamId: '',
            teams: {},
            myMembers: {},
            membersInTeam: {},
            stats: {},
        },
        channels: {
            currentChannelId: '',
            channels: {},
            myMembers: {},
            stats: {},
        },
        posts: {
            posts: {},
            postsInChannel: {},
            postsInThread: {},
            selectedPostId: '',
            currentFocusedPostId: '',
        },
        threads: {
            threads: {},
            threadsInTeam: {},
            counts: {},
        },
        preferences: {
            myPreferences: {},
        },
        search: {
            recent: [],
        },
        typing: {},
    },
    errors: [],
    requests: {
        channels: {
            getChannels: {
                status: 'not_started',
                error: null,
            },
            createChannel: {
                status: 'not_started',
                error: null,
            },
            updateChannel: {
                status: 'not_started',
                error: null,
            },
            myChannels: {
                status: 'not_started',
                error: null,
            },
        },
        general: {
            websocket: {
                status: 'not_started',
                error: null,
            },
        },
        posts: {
            createPost: {
                status: 'not_started',
                error: null,
            },
            editPost: {
                status: 'not_started',
                error: null,
            },
            getPostThread: {
                status: 'not_started',
                error: null,
            },
        },
        teams: {
            getMyTeams: {
                status: 'not_started',
                error: null,
            },
            getTeams: {
                status: 'not_started',
                error: null,
            },
            joinTeam: {
                status: 'not_started',
                error: null,
            },
        },
        users: {
            login: {
                status: 'not_started',
                error: null,
            },
            autocompleteUsers: {
                status: 'not_started',
                error: null,
            },
            updateMe: {
                status: 'not_started',
                error: null,
            },
        },
    },
    device: {
        connection: true,
    },
    views: {
        channel: {
            drafts: {},
        },
        i18n: {
            locale: '',
        },
        root: {
            deepLinkURL: '',
            hydrationComplete: false,
        },
        selectServer: {
            serverUrl: Config.DefaultServerUrl,
        },
        team: {
            lastTeamId: '',
        },
        threads: {
            viewingGlobalThreads: false,
            viewingGlobalThreadsUnreads: false,
        },
        thread: {
            drafts: {},
        },
    },
    websocket: {
        connected: false,
        lastConnectAt: 0,
        lastDisconnectAt: 0,
    },
};

export default state;
