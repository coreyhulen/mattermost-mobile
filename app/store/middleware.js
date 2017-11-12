// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import DeviceInfo from 'react-native-device-info';

import {ViewTypes} from 'app/constants';
import initialState from 'app/initial_state';
import Config from 'assets/config';

export function messageRetention() {
    return (next) => (action) => {
        if (action.type === 'persist/REHYDRATE') {
            const {app} = action.payload;
            const {entities, views} = action.payload;

            if (!entities || !views) {
                return next(action);
            }

            // When a new version of the app has been detected
            if (!app || !app.version || app.version !== DeviceInfo.getVersion() || app.build !== DeviceInfo.getBuildNumber()) {
                return next(resetStateForNewVersion(action));
            }

            // Keep only the last 60 messages for the last 5 viewed channels in each team
            // and apply data retention on those posts if applies

            return next(cleanupState(action));
        } else if (action.type === ViewTypes.DATA_CLEANUP) {
            const nextAction = cleanupState(action, true);
            return next(nextAction);
        }

        return next(action);
    };
}

function resetStateForNewVersion(action) {
    const {payload} = action;
    const lastChannelForTeam = getLastChannelForTeam(payload);

    let general = initialState.entities.general;
    if (payload.entities.general) {
        general = payload.entities.general;
    }

    let teams = initialState.entities.teams;
    if (payload.entities.teams) {
        teams = {
            currentTeamId: payload.entities.teams.currentTeamId,
            teams: payload.entities.teams.teams,
            myMembers: payload.entities.teams.myMembers
        };
    }

    let users = initialState.entities.users;
    if (payload.entities.users) {
        const currentUserId = payload.entities.users.currentUserId;
        if (currentUserId) {
            users = {
                currentUserId,
                profiles: {
                    [currentUserId]: payload.entities.users.profiles[currentUserId]
                }
            };
        }
    }

    let preferences = initialState.entities.preferences;
    if (payload.entities.preferences) {
        preferences = payload.entities.preferences;
    }

    let search = initialState.entities.search;
    if (payload.entities.search && payload.entities.search.recent) {
        search = {
            recent: payload.entities.search.recent
        };
    }

    let channelDrafts = initialState.views.channel.drafts;
    if (payload.views.channel && payload.views.channel.drafts) {
        channelDrafts = payload.views.channel.drafts;
    }

    let i18n = initialState.views.i18n;
    if (payload.views.i18n) {
        i18n = payload.views.i18n;
    }

    let fetchCache = initialState.views.fetchCache;
    if (payload.views.fetchCache) {
        fetchCache = payload.views.fetchCache;
    }

    let lastTeamId = initialState.views.team.lastTeamId;
    if (payload.views.team && payload.views.team.lastTeamId) {
        lastTeamId = payload.views.team.lastTeamId;
    }

    let threadDrafts = initialState.views.thread.drafts;
    if (payload.views.thread && payload.views.thread.drafts) {
        threadDrafts = payload.views.thread.drafts;
    }

    let selectServer = initialState.views.selectServer;
    if (payload.views.selectServer) {
        selectServer = payload.views.selectServer;
    }

    const nextState = {
        app: {
            build: DeviceInfo.getBuildNumber(),
            version: DeviceInfo.getVersion()
        },
        entities: {
            general,
            teams,
            users,
            preferences,
            search
        },
        views: {
            channel: {
                drafts: channelDrafts
            },
            i18n,
            fetchCache,
            team: {
                lastTeamId,
                lastChannelForTeam
            },
            thread: {
                drafts: threadDrafts
            },
            selectServer
        }
    };

    return {
        type: action.type,
        payload: nextState,
        error: action.error
    };
}

function getLastChannelForTeam(payload) {
    const lastChannelForTeam = {...payload.views.team.lastChannelForTeam};
    const convertLastChannelForTeam = Object.values(lastChannelForTeam).some((value) => !Array.isArray(value));

    if (convertLastChannelForTeam) {
        Object.keys(lastChannelForTeam).forEach((id) => {
            lastChannelForTeam[id] = [lastChannelForTeam[id]];
        });
    }

    return lastChannelForTeam;
}

function cleanupState(action, keepCurrent = false) {
    const {payload: resetPayload} = resetStateForNewVersion(action);
    const {payload} = action;
    const {currentChannelId} = payload.entities.channels;

    const {lastChannelForTeam} = resetPayload.views.team;
    const nextEntitites = {
        posts: {
            posts: {},
            postsInChannel: {},
            reactions: {},
            openGraph: payload.entities.posts.openGraph,
            selectedPostId: payload.entities.posts.selectedPostId,
            currentFocusedPostId: payload.entities.posts.currentFocusedPostId
        },
        files: {
            files: {},
            fileIdsByPostId: {}
        }
    };

    const retentionPeriod = Config.EnableMessageRetention ? Config.MessageRetentionPeriod + 1 : 0;
    const postIdsToKeep = Object.values(lastChannelForTeam).reduce((array, channelIds) => {
        const ids = channelIds.reduce((result, id) => {
            // we need to check that the channel id is not already included
            // the reason it can be included is cause at least one of the last channels viewed
            // in a team can be a DM or GM and the id can be duplicate
            if (!nextEntitites.posts.postsInChannel[id] && payload.entities.posts.postsInChannel[id]) {
                let postIds;
                if (keepCurrent && currentChannelId === id) {
                    postIds = payload.entities.posts.postsInChannel[id];
                } else {
                    postIds = payload.entities.posts.postsInChannel[id].slice(0, 60);
                }
                nextEntitites.posts.postsInChannel[id] = postIds;
                return result.concat(postIds);
            }

            return result;
        }, []);
        return array.concat(ids);
    }, []);

    postIdsToKeep.forEach((postId) => {
        const post = payload.entities.posts.posts[postId];

        if (post) {
            const skip = keepCurrent && currentChannelId === post.channel_id;

            if (!skip && retentionPeriod && (Date.now() - post.create_at) / (1000 * 3600 * 24) > retentionPeriod) {
                const postsInChannel = nextEntitites.posts.postsInChannel[post.channel_id] || [];
                const index = postsInChannel.indexOf(postId);
                if (index !== -1) {
                    postsInChannel.splice(index, 1);
                }
                return;
            }

            nextEntitites.posts.posts[postId] = post;

            const reaction = payload.entities.posts.reactions[postId];
            if (reaction) {
                nextEntitites.posts.reactions[postId] = reaction;
            }

            const fileIds = payload.entities.files.fileIdsByPostId[postId];
            if (fileIds) {
                nextEntitites.files.fileIdsByPostId[postId] = fileIds;
                fileIds.forEach((fileId) => {
                    nextEntitites.files.files[fileId] = payload.entities.files.files[fileId];
                });
            }
        } else {
            // If the post is not in the store we need to remove it from the postsInChannel
            const channelIds = Object.keys(nextEntitites.posts.postsInChannel);
            for (let i = 0; i < channelIds.length; i++) {
                const channelId = channelIds[i];
                const posts = nextEntitites.posts.postsInChannel[channelId];
                const index = posts.indexOf(postId);
                if (index !== -1) {
                    posts.splice(index, 1);
                    break;
                }
            }
        }
    });

    const nextState = {
        app: resetPayload.app,
        entities: {
            ...nextEntitites,
            channels: payload.entities.channels,
            emojis: payload.entities.emojis,
            general: resetPayload.entities.general,
            preferences: resetPayload.entities.preferences,
            search: resetPayload.entities.search,
            teams: resetPayload.entities.teams,
            users: payload.entities.users
        },
        views: {
            ...resetPayload.views,
            channel: {
                ...resetPayload.views.channel,
                ...payload.views.channel
            }
        }
    };

    nextState.errors = payload.errors;

    return {
        type: 'persist/REHYDRATE',
        payload: nextState,
        error: action.error
    };
}
