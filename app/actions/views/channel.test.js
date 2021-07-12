// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as ChannelActions from '@actions/views/channel';
import {ViewTypes} from '@constants';
import {ChannelTypes} from '@mm-redux/action_types';
import {General} from '@mm-redux/constants';
import postReducer from '@mm-redux/reducers/entities/posts';
import initialState from '@store/initial_state';
import testHelper from '@test/test_helper';

const {
    handleSelectChannel,
    handleSelectChannelByName,
    loadPostsIfNecessaryWithRetry,
} = ChannelActions;

const MOCK_CHANNEL_MARK_AS_READ = 'MOCK_CHANNEL_MARK_AS_READ';
const MOCK_CHANNEL_MARK_AS_VIEWED = 'MOCK_CHANNEL_MARK_AS_VIEWED';

jest.mock('@mm-redux/actions/channels', () => {
    const channelActions = jest.requireActual('../../mm-redux/actions/channels');
    return {
        ...channelActions,
        markChannelAsRead: jest.fn().mockReturnValue({type: 'MOCK_CHANNEL_MARK_AS_READ'}),
        markChannelAsViewed: jest.fn().mockReturnValue({type: 'MOCK_CHANNEL_MARK_AS_VIEWED'}),
    };
});

jest.mock('@mm-redux/actions/teams', () => {
    const teamActions = jest.requireActual('../../mm-redux/actions/teams');
    return {
        ...teamActions,
        getTeamByName: jest.fn((teamName) => {
            if (teamName) {
                return {
                    type: 'MOCK_RECEIVE_TEAM_TYPE',
                    data: {
                        id: 'current-team-id',
                        name: 'received-team-id',
                    },
                };
            }
            return {
                type: 'MOCK_ERROR',
                error: 'error',
            };
        }),
    };
});

jest.mock('@mm-redux/selectors/entities/teams', () => {
    const teamSelectors = jest.requireActual('../../mm-redux/selectors/entities/teams');
    return {
        ...teamSelectors,
        selectTeamByName: jest.fn(() => ({name: 'current-team-name'})),
    };
});

const mockStore = configureStore([thunk]);

describe('Actions.Views.Channel', () => {
    let store;

    const MOCK_SELECT_CHANNEL_TYPE = 'MOCK_SELECT_CHANNEL_TYPE';
    const MOCK_RECEIVE_CHANNEL_TYPE = 'MOCK_RECEIVE_CHANNEL_TYPE';
    const MOCK_RECEIVED_POSTS = 'RECEIVED_POSTS';
    const MOCK_RECEIVED_POSTS_IN_CHANNEL = 'RECEIVED_POSTS_IN_CHANNEL';
    const MOCK_RECEIVED_POSTS_SINCE = 'MOCK_RECEIVED_POSTS_SINCE';

    const actions = require('@mm-redux/actions/channels');

    actions.getChannelByName = jest.fn((teamId, channelName) => {
        if (teamId && channelName) {
            return {
                type: MOCK_RECEIVE_CHANNEL_TYPE,
                data: 'received-channel-id',
            };
        }

        return {
            type: 'MOCK_ERROR',
            error: 'error',
        };
    });
    actions.selectChannel = jest.fn().mockReturnValue({
        type: MOCK_SELECT_CHANNEL_TYPE,
        data: 'selected-channel-id',
    });
    actions.joinChannel = jest.fn((userId, teamId, channelId) => ({
        type: 'MOCK_JOIN_CHANNEL',
        data: {channel: {id: channelId}},
    }));
    const postActions = require('./post');
    postActions.getPostsSince = jest.fn(() => {
        return {
            type: MOCK_RECEIVED_POSTS_SINCE,
            data: {
                order: [],
                posts: {},
            },
        };
    });

    postActions.getPosts = jest.fn((channelId) => {
        const order = [];
        const posts = {};

        for (let i = 0; i < 60; i++) {
            const p = testHelper.fakePost(channelId);
            order.push(p.id);
            posts[p.id] = p;
        }

        return {
            type: MOCK_RECEIVED_POSTS,
            data: {
                order,
                posts,
            },
        };
    });

    const postUtils = require('@mm-redux/utils/post_utils');
    postUtils.getLastCreateAt = jest.fn((array) => {
        return array[0].create_at;
    });

    let nextPostState = {};
    const currentUserId = 'current-user-id';
    const currentChannelId = 'channel-id';
    const currentChannelName = 'channel-name';
    const currentTeamId = 'current-team-id';
    const currentTeamName = 'current-team-name';
    const storeObj = {
        ...initialState,
        entities: {
            ...initialState.entities,
            users: {
                currentUserId,
            },
            channels: {
                currentChannelId,
                manuallyUnread: {},
                channels: {
                    'channel-id': {id: 'channel-id', display_name: 'Test Channel'},
                    'channel-id-2': {id: 'channel-id-2', display_name: 'Test Channel'},
                },
                myMembers: {
                    'channel-id': {channel_id: 'channel-id', user_id: currentUserId, mention_count: 0, msg_count: 0},
                    'channel-id-2': {channel_id: 'channel-id-2', user_id: currentUserId, mention_count: 0, msg_count: 0},
                },
            },
            teams: {
                currentTeamId,
                teams: {
                    [currentTeamId]: {
                        id: currentTeamId,
                        name: currentTeamName,
                    },
                },
                myMembers: {
                    [currentTeamId]: {},
                },
            },
        },
    };

    const channelSelectors = require('@mm-redux/selectors/entities/channels');
    channelSelectors.getChannel = jest.fn((state, channelId) => ({data: channelId}));
    channelSelectors.getCurrentChannelId = jest.fn(() => currentChannelId);
    channelSelectors.getMyChannelMember = jest.fn(() => ({data: {member: {}}}));

    const appChannelSelectors = require('app/selectors/channel');
    const getChannelReachableOriginal = appChannelSelectors.getChannelReachable;
    appChannelSelectors.getChannelReachable = jest.fn(() => true);

    test('handleSelectChannelByName success', async () => {
        store = mockStore(storeObj);

        await store.dispatch(handleSelectChannelByName(currentChannelName, currentTeamName));

        const storeActions = store.getActions();
        const receivedChannel = storeActions.some((action) => action.type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(receivedChannel).toBe(true);

        const selectedChannel = storeActions.some(({type}) => type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(selectedChannel).toBe(true);
    });

    test('handleSelectChannelByName failure from null currentTeamName', async () => {
        const failStoreObj = {...storeObj};
        failStoreObj.entities.teams.currentTeamId = 'not-in-current-teams';
        store = mockStore(failStoreObj);

        await store.dispatch(handleSelectChannelByName(currentChannelName, null));

        const storeActions = store.getActions();
        const receivedChannel = storeActions.some((action) => action.type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(receivedChannel).toBe(false);

        const storeBatchActions = storeActions.some(({type}) => type === 'BATCHING_REDUCER.BATCH');
        expect(storeBatchActions).toBe(false);
    });

    test('handleSelectChannelByName failure from no permission to channel', async () => {
        store = mockStore({...storeObj});
        actions.getChannelByName = jest.fn(() => {
            return {
                type: 'MOCK_ERROR',
                error: {
                    message: "Can't get to channel.",
                },
            };
        });

        await store.dispatch(handleSelectChannelByName(currentChannelName, currentTeamName));

        const storeActions = store.getActions();
        const receivedChannel = storeActions.some((action) => action.type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(receivedChannel).toBe(false);
    });

    test('handleSelectChannelByName failure from unreachable channel', async () => {
        appChannelSelectors.getChannelReachable = jest.fn(() => false);

        store = mockStore(storeObj);

        await store.dispatch(handleSelectChannelByName(currentChannelName, currentTeamName));

        const storeActions = store.getActions();
        const receivedChannel = storeActions.some((action) => action.type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(receivedChannel).toBe(false);
    });

    test('handleSelectChannelByName select channel that user is not a member of', async () => {
        actions.getChannelByName = jest.fn(() => {
            return {
                type: MOCK_RECEIVE_CHANNEL_TYPE,
                data: {id: 'channel-id-3', name: 'channel-id-3', display_name: 'Test Channel', type: General.OPEN_CHANNEL},
            };
        });

        store = mockStore(storeObj);

        await store.dispatch(handleSelectChannelByName('channel-id-3', currentTeamName));

        const storeActions = store.getActions();
        const receivedChannel = storeActions.some((action) => action.type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(receivedChannel).toBe(true);

        expect(actions.joinChannel).toBeCalled();

        const joinedChannel = storeActions.some((action) => action.type === 'MOCK_JOIN_CHANNEL' && action.data.channel.id === 'channel-id-3');
        expect(joinedChannel).toBe(true);
    });

    test('handleSelectChannelByName select archived channel with ExperimentalViewArchivedChannels enabled', async () => {
        const archivedChannelStoreObj = {...storeObj};
        archivedChannelStoreObj.entities.general.config.ExperimentalViewArchivedChannels = 'true';
        store = mockStore(archivedChannelStoreObj);

        appChannelSelectors.getChannelReachable = getChannelReachableOriginal;
        actions.getChannelByName = jest.fn(() => {
            return {
                type: MOCK_RECEIVE_CHANNEL_TYPE,
                data: {id: 'channel-id-3', name: 'channel-id-3', display_name: 'Test Channel', type: General.OPEN_CHANNEL, delete_at: 100},
            };
        });
        channelSelectors.getChannelByName = jest.fn(() => {
            return {
                data: {id: 'channel-id-3', name: 'channel-id-3', display_name: 'Test Channel', type: General.OPEN_CHANNEL, delete_at: 100},
            };
        });
        const errorHandler = jest.fn();

        await store.dispatch(handleSelectChannelByName('channel-id-3', currentTeamName, errorHandler));

        const storeActions = store.getActions();
        const receivedChannel = storeActions.some((action) => action.type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(receivedChannel).toBe(true);
        expect(errorHandler).not.toBeCalled();
    });

    test('handleSelectChannelByName select archived channel with ExperimentalViewArchivedChannels disabled', async () => {
        const noArchivedChannelStoreObj = {...storeObj};
        noArchivedChannelStoreObj.entities.general.config.ExperimentalViewArchivedChannels = 'false';
        store = mockStore(noArchivedChannelStoreObj);

        appChannelSelectors.getChannelReachable = getChannelReachableOriginal;
        actions.getChannelByName = jest.fn(() => {
            return {
                type: MOCK_RECEIVE_CHANNEL_TYPE,
                data: {id: 'channel-id-3', name: 'channel-id-3', display_name: 'Test Channel', type: General.OPEN_CHANNEL, delete_at: 100},
            };
        });
        channelSelectors.getChannelByName = jest.fn(() => {
            return {
                data: {id: 'channel-id-3', name: 'channel-id-3', display_name: 'Test Channel', type: General.OPEN_CHANNEL, delete_at: 100},
            };
        });
        const errorHandler = jest.fn();

        await store.dispatch(handleSelectChannelByName('channel-id-3', currentTeamName, errorHandler));

        const storeActions = store.getActions();
        const receivedChannel = storeActions.some((action) => action.type === MOCK_RECEIVE_CHANNEL_TYPE);
        expect(receivedChannel).toBe(true);
        expect(errorHandler).toBeCalled();
    });

    test('loadPostsIfNecessaryWithRetry for the first time', async () => {
        store = mockStore(storeObj);

        await store.dispatch(loadPostsIfNecessaryWithRetry(currentChannelId));
        expect(postActions.getPosts).toBeCalled();

        const storeActions = store.getActions();
        const storeBatchActions = storeActions.filter(({type}) => type === 'BATCH_LOAD_POSTS_IN_CHANNEL');
        const receivedPosts = storeActions.find(({type}) => type === MOCK_RECEIVED_POSTS);
        const receivedPostsAtAction = storeBatchActions[0].payload.some((action) => action.type === ViewTypes.RECEIVED_POSTS_FOR_CHANNEL_AT_TIME);

        nextPostState = postReducer(store.getState().entities.posts, receivedPosts);
        nextPostState = postReducer(nextPostState, {
            type: MOCK_RECEIVED_POSTS_IN_CHANNEL,
            channelId: currentChannelId,
            data: receivedPosts.data,
            recent: true,
        });

        expect(receivedPostsAtAction).toBe(true);
    });

    test('loadPostsIfNecessaryWithRetry get posts since', async () => {
        store = mockStore({
            ...storeObj,
            entities: {
                ...storeObj.entities,
                posts: nextPostState,
            },
            views: {
                ...storeObj.views,
                channel: {
                    ...storeObj.views.channel,
                    lastGetPosts: {
                        [currentChannelId]: Date.now(),
                    },
                },
            },
        });

        await store.dispatch(loadPostsIfNecessaryWithRetry(currentChannelId));
        const storeActions = store.getActions();
        const receivedPostsSince = storeActions.find(({type}) => type === MOCK_RECEIVED_POSTS_SINCE);

        expect(postUtils.getLastCreateAt).toBeCalled();
        expect(postActions.getPostsSince).toHaveBeenCalledWith(currentChannelId, Object.values(store.getState().entities.posts.posts)[0].create_at);
        expect(receivedPostsSince).not.toBe(null);
    });

    test('loadPostsIfNecessaryWithRetry get posts since the websocket reconnected', async () => {
        const time = Date.now();
        store = mockStore({
            ...storeObj,
            entities: {
                ...storeObj.entities,
                posts: nextPostState,
            },
            views: {
                ...storeObj.views,
                channel: {
                    ...storeObj.views.channel,
                    lastGetPosts: {
                        [currentChannelId]: time,
                    },
                },
            },
            websocket: {
                lastConnectAt: time + (1 * 60 * 1000),
            },
        });

        await store.dispatch(loadPostsIfNecessaryWithRetry(currentChannelId));
        const storeActions = store.getActions();
        const receivedPostsSince = storeActions.find(({type}) => type === MOCK_RECEIVED_POSTS_SINCE);

        expect(postUtils.getLastCreateAt).not.toBeCalled();
        expect(postActions.getPostsSince).toHaveBeenCalledWith(currentChannelId, store.getState().views.channel.lastGetPosts[currentChannelId]);
        expect(receivedPostsSince).not.toBe(null);
    });

    const handleSelectChannelCases = [
        [currentChannelId],
        [`${currentChannelId}-2`],
        [`not-${currentChannelId}`],
        [`not-${currentChannelId}-2`],
    ];
    test.each(handleSelectChannelCases)('handleSelectChannel dispatches selectChannelWithMember', async (channelId) => {
        const testObj = {...storeObj};
        testObj.entities.teams.currentTeamId = currentTeamId;
        store = mockStore(testObj);

        await store.dispatch(handleSelectChannel(channelId));
        const storeActions = store.getActions();
        const storeBatchActions = storeActions.find(({type}) => type === 'BATCH_SWITCH_CHANNEL');
        const selectChannelWithMember = storeBatchActions?.payload.find(({type}) => type === ChannelTypes.SELECT_CHANNEL);
        const viewedAction = storeActions.find(({type}) => type === MOCK_CHANNEL_MARK_AS_VIEWED);
        const readAction = storeActions.find(({type}) => type === MOCK_CHANNEL_MARK_AS_READ);

        const expectedSelectChannelWithMember = {
            type: ChannelTypes.SELECT_CHANNEL,
            data: channelId,
            extra: {
                channel: {
                    id: channelId,
                    display_name: 'Test Channel',
                },
                member: {
                    channel_id: channelId,
                    user_id: currentUserId,
                    mention_count: 0,
                    msg_count: 0,
                },
                teamId: currentTeamId,
            },
        };
        if (channelId.includes('not')) {
            expect(selectChannelWithMember).toBe(undefined);
        } else {
            expect(selectChannelWithMember).toStrictEqual(expectedSelectChannelWithMember);
        }
        expect(viewedAction).not.toBe(null);
        expect(readAction).not.toBe(null);
    });
});
