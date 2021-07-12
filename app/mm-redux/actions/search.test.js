// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import nock from 'nock';

import {Client4} from '@client/rest';
import * as Actions from '@mm-redux/actions/search';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

describe('Actions.Search', () => {
    let store;
    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('Perform Search', async () => {
        const {dispatch, getState} = store;

        let post1 = {
            ...TestHelper.fakePost(TestHelper.basicChannel.id),
            message: 'try searching for this using the first and last word',
        };

        let post2 = {
            ...TestHelper.fakePost(TestHelper.basicChannel.id),
            message: 'return this message in second attempt',
        };

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, {...post1, id: TestHelper.generateId()});
        post1 = await Client4.createPost(post1);

        nock(Client4.getBaseRoute()).
            post('/posts').
            reply(201, {...post2, id: TestHelper.generateId()});
        post2 = await Client4.createPost(post2);

        // Test for a couple of words
        const search1 = 'try word';

        nock(Client4.getTeamsRoute()).
            post(`/${TestHelper.basicTeam.id}/posts/search`).
            reply(200, {order: [post1.id], posts: {[post1.id]: post1}});
        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}/members/me`).
            reply(201, {user_id: TestHelper.basicUser.id, channel_id: TestHelper.basicChannel.id});

        await Actions.searchPosts(TestHelper.basicTeam.id, search1)(dispatch, getState);

        const state = getState();
        const {recent, results} = state.entities.search;
        const {posts} = state.entities.posts;
        const current = state.entities.search.current[TestHelper.basicTeam.id];
        assert.ok(recent[TestHelper.basicTeam.id]);
        const searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        assert.ok(searchIsPresent !== -1);
        assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 1);
        assert.equal(results.length, 1);
        assert.ok(posts[results[0]]);
        assert.ok(current.isEnd);

        // DISABLED
        // Test for posts from a user in a channel
        //const search2 = `from: ${TestHelper.basicUser.username} in: ${TestHelper.basicChannel.name}`;

        //nock(Client4.getTeamsRoute(), `/${TestHelper.basicTeam.id}/posts/search`).
        //post(`/${TestHelper.basicTeam.id}/posts/search`).
        //reply(200, {order: [post1.id, post2.id, TestHelper.basicPost.id], posts: {[post1.id]: post1, [TestHelper.basicPost.id]: TestHelper.basicPost, [post2.id]: post2}});
        //nock(Client4.getChannelsRoute()).
        //get(`/${TestHelper.basicChannel.id}/members/me`).
        //reply(201, {user_id: TestHelper.basicUser.id, channel_id: TestHelper.basicChannel.id});
        //
        //await Actions.searchPosts(
        //TestHelper.basicTeam.id,
        //search2
        //)(dispatch, getState);
        //
        //state = getState();
        //recent = state.entities.search.recent;
        //results = state.entities.search.results;
        //searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        //assert.ok(searchIsPresent !== -1);
        //assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 2);
        //assert.equal(results.length, 3);

        // Clear posts from the search store
        //await Actions.clearSearch()(dispatch, getState);
        //state = getState();
        //recent = state.entities.search.recent;
        //results = state.entities.search.results;
        //searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        //assert.ok(searchIsPresent !== -1);
        //assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 2);
        //assert.equal(results.length, 0);

        // Clear a recent term
        //await Actions.removeSearchTerms(TestHelper.basicTeam.id, search2)(dispatch, getState);
        //state = getState();
        //recent = state.entities.search.recent;
        //results = state.entities.search.results;
        //searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        //assert.ok(searchIsPresent !== -1);
        //searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search2);
        //assert.ok(searchIsPresent === -1);
        //assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 1);
        //assert.equal(results.length, 0);
    });
});
