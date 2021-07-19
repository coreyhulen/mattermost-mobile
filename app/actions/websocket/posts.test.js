// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-import-assign */

import assert from 'assert';
import nock from 'nock';
import {Server, WebSocket as MockWebSocket} from 'mock-socket';

import * as ChannelActions from '@mm-redux/actions/channels';
import * as PostActions from '@mm-redux/actions/posts';
import {Client4} from '@client/rest';
import {General, Posts} from '@mm-redux/constants';
import * as PostSelectors from '@mm-redux/selectors/entities/posts';
import EventEmitter from '@mm-redux/utils/event_emitter';

import * as Actions from '@actions/websocket';
import {WebsocketEvents} from '@constants';

import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

global.WebSocket = MockWebSocket;

describe('Websocket Post Events', () => {
    let store;
    let mockServer;
    beforeAll(async () => {
        store = await configureStore();
        await TestHelper.initBasic(Client4);

        const connUrl = (Client4.getUrl() + '/api/v4/websocket').replace(/^http:/, 'ws:');
        mockServer = new Server(connUrl);
        return store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));
    });

    afterAll(async () => {
        Actions.close()();
        mockServer.stop();
        await TestHelper.tearDown();
    });

    it('Websocket Handle New Post if post does not exist', async () => {
        PostSelectors.getPost = jest.fn();
        const channelId = TestHelper.basicChannel.id;
        const message = JSON.stringify({event: WebsocketEvents.POSTED, data: {channel_display_name: TestHelper.basicChannel.display_name, channel_name: TestHelper.basicChannel.name, channel_type: 'O', post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w", "create_at": 1508245311774, "update_at": 1508245311774, "edit_at": 0, "delete_at": 0, "is_pinned": false, "user_id": "${TestHelper.basicUser.id}", "channel_id": "${channelId}", "root_id": "", "original_id": "", "message": "Unit Test", "type": "", "props": {}, "hashtags": "", "pending_post_id": "t36kso9nwtdhbm8dbkd6g4eeby: 1508245311749"}`, sender_name: TestHelper.basicUser.username, team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 2});

        nock(Client4.getBaseRoute()).
            post('/users/ids').
            reply(200, [TestHelper.basicUser.id]);

        nock(Client4.getBaseRoute()).
            post('/users/status/ids').
            reply(200, [{user_id: TestHelper.basicUser.id, status: 'online', manual: false, last_activity_at: 1507662212199}]);

        // Mock that post already exists and check it is not added
        PostSelectors.getPost.mockReturnValueOnce(true);
        mockServer.emit('message', message);
        let entities = store.getState().entities;
        let posts = entities.posts.posts;
        assert.deepEqual(posts, {});

        // Mock that post does not exist and check it is added
        PostSelectors.getPost.mockReturnValueOnce(false);
        mockServer.emit('message', message);
        await TestHelper.wait(100);
        entities = store.getState().entities;
        posts = entities.posts.posts;
        const postId = Object.keys(posts)[0];
        assert.ok(posts[postId].message.indexOf('Unit Test') > -1);
        entities = store.getState().entities;
    });

    it('Websocket Handle New Post emits INCREASE_POST_VISIBILITY_BY_ONE for current channel when post does not exist', async () => {
        PostSelectors.getPost = jest.fn();
        const emit = jest.spyOn(EventEmitter, 'emit');
        const currentChannelId = TestHelper.generateId();
        const otherChannelId = TestHelper.generateId();
        const messageFor = (channelId) => ({event: WebsocketEvents.POSTED, data: {channel_display_name: TestHelper.basicChannel.display_name, channel_name: TestHelper.basicChannel.name, channel_type: 'O', post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w", "create_at": 1508245311774, "update_at": 1508245311774, "edit_at": 0, "delete_at": 0, "is_pinned": false, "user_id": "${TestHelper.basicUser.id}", "channel_id": "${channelId}", "root_id": "", "original_id": "", "message": "Unit Test", "type": "", "props": {}, "hashtags": "", "pending_post_id": "t36kso9nwtdhbm8dbkd6g4eeby: 1508245311749"}`, sender_name: TestHelper.basicUser.username, team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 2});

        await store.dispatch(ChannelActions.selectChannel(currentChannelId));
        await TestHelper.wait(100);

        // Post does not exist and is not for current channel
        PostSelectors.getPost.mockReturnValueOnce(false);
        mockServer.emit('message', JSON.stringify(messageFor(otherChannelId)));
        expect(emit).not.toHaveBeenCalled();

        // Post exists and is not for current channel
        PostSelectors.getPost.mockReturnValueOnce(true);
        mockServer.emit('message', JSON.stringify(messageFor(otherChannelId)));
        expect(emit).not.toHaveBeenCalled();

        // Post exists and is for current channel
        PostSelectors.getPost.mockReturnValueOnce(true);
        mockServer.emit('message', JSON.stringify(messageFor(currentChannelId)));
        expect(emit).not.toHaveBeenCalled();

        // Post does not exist and is for current channel
        PostSelectors.getPost.mockReturnValueOnce(false);
        mockServer.emit('message', JSON.stringify(messageFor(currentChannelId)));
        expect(emit).toHaveBeenCalledWith(WebsocketEvents.INCREASE_POST_VISIBILITY_BY_ONE);
    });

    it('Websocket Handle New Post if status is manually set do not set to online', async () => {
        const userId = TestHelper.generateId();

        store = await configureStore({
            entities: {
                users: {
                    statuses: {
                        [userId]: General.DND,
                    },
                    isManualStatus: {
                        [userId]: true,
                    },
                },
            },
        });
        await store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));

        const channelId = TestHelper.basicChannel.id;
        const message = JSON.stringify({
            event: WebsocketEvents.POSTED,
            data: {
                channel_display_name: TestHelper.basicChannel.display_name,
                channel_name: TestHelper.basicChannel.name,
                channel_type: 'O',
                post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w", "create_at": 1508245311774, "update_at": 1508245311774, "edit_at": 0, "delete_at": 0, "is_pinned": false, "user_id": "${userId}", "channel_id": "${channelId}", "root_id": "", "original_id": "", "message": "Unit Test", "type": "", "props": {}, "hashtags": "", "pending_post_id": "t36kso9nwtdhbm8dbkd6g4eeby: 1508245311749"}`,
                sender_name: TestHelper.basicUser.username,
                team_id: TestHelper.basicTeam.id,
            },
            broadcast: {
                omit_users: null,
                user_id: userId,
                channel_id: channelId,
                team_id: '',
            },
            seq: 2,
        });

        mockServer.emit('message', message);
        const entities = store.getState().entities;
        const statuses = entities.users.statuses;
        assert.equal(statuses[userId], General.DND);
    });

    it('Websocket Handle Post Edited', async () => {
        const post = {id: '71k8gz5ompbpfkrzaxzodffj8w'};
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POST_EDITED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1585236976007,"edit_at": 1585236976007,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${TestHelper.basicChannel.id}","root_id": "","original_id": "","message": "Unit Test (edited)","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 2}));

        await TestHelper.wait(300);

        const {posts} = store.getState().entities.posts;
        assert.ok(posts);
        assert.ok(posts[post.id]);
        assert.ok(posts[post.id].message.indexOf('(edited)') > -1);
    });

    it('Websocket Handle Post Deleted', async () => {
        const post = TestHelper.fakePost();
        post.channel_id = TestHelper.basicChannel.id;

        post.id = '71k8gz5ompbpfkrzaxzodffj8w';
        store.dispatch(PostActions.receivedPost(post));
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POST_DELETED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1508247709215,"edit_at": 1508247709215,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${post.channel_id}","root_id": "","original_id": "","message": "Unit Test","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 7}));

        const entities = store.getState().entities;
        const {posts} = entities.posts;
        assert.strictEqual(posts[post.id].state, Posts.POST_DELETED);
    });

    it('Websocket handle Post Unread', async () => {
        const teamId = TestHelper.generateId();
        const channelId = TestHelper.generateId();
        const userId = TestHelper.generateId();

        store = await configureStore({
            entities: {
                channels: {
                    channels: {
                        [channelId]: {id: channelId},
                    },
                    myMembers: {
                        [channelId]: {msg_count: 10, mention_count: 0, last_viewed_at: 0},
                    },
                },
                teams: {
                    myMembers: {
                        [teamId]: {msg_count: 10, mention_count: 0},
                    },
                },
            },
        });
        await store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));

        mockServer.emit('message', JSON.stringify({
            event: WebsocketEvents.POST_UNREAD,
            data: {
                last_viewed_at: 25,
                msg_count: 3,
                mention_count: 2,
                delta_msg: 7,
            },
            broadcast: {omit_users: null, user_id: userId, channel_id: channelId, team_id: teamId},
            seq: 7,
        }));

        const state = store.getState();
        assert.equal(state.entities.channels.manuallyUnread[channelId], true);
        assert.equal(state.entities.channels.myMembers[channelId].msg_count, 3);
        assert.equal(state.entities.channels.myMembers[channelId].mention_count, 2);
        assert.equal(state.entities.channels.myMembers[channelId].last_viewed_at, 25);
        assert.equal(state.entities.teams.myMembers[teamId].msg_count, 3);
        assert.equal(state.entities.teams.myMembers[teamId].mention_count, 2);
    });

    it('Websocket handle Post Unread When marked on the same client', async () => {
        const teamId = TestHelper.generateId();
        const channelId = TestHelper.generateId();
        const userId = TestHelper.generateId();

        store = await configureStore({
            entities: {
                channels: {
                    channels: {
                        [channelId]: {id: channelId},
                    },
                    myMembers: {
                        [channelId]: {msg_count: 5, mention_count: 4, last_viewed_at: 14},
                    },
                    manuallyUnread: {
                        [channelId]: true,
                    },
                },
                teams: {
                    myMembers: {
                        [teamId]: {msg_count: 5, mention_count: 4},
                    },
                },
            },
        });
        await store.dispatch(Actions.init({websocketUrl: Client4.getUrl().replace(/^http:/, 'ws:')}));

        mockServer.emit('message', JSON.stringify({
            event: WebsocketEvents.POST_UNREAD,
            data: {
                last_viewed_at: 25,
                msg_count: 5,
                mention_count: 4,
                delta_msg: 1,
            },
            broadcast: {omit_users: null, user_id: userId, channel_id: channelId, team_id: teamId},
            seq: 17,
        }));

        const state = store.getState();
        assert.equal(state.entities.channels.manuallyUnread[channelId], true);
        assert.equal(state.entities.channels.myMembers[channelId].msg_count, 5);
        assert.equal(state.entities.channels.myMembers[channelId].mention_count, 4);
        assert.equal(state.entities.channels.myMembers[channelId].last_viewed_at, 14);
        assert.equal(state.entities.teams.myMembers[teamId].msg_count, 5);
        assert.equal(state.entities.teams.myMembers[teamId].mention_count, 4);
    });
});
