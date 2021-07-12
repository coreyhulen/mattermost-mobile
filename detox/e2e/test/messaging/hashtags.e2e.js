// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Post,
    Setup,
} from '@support/server_api';
import {
    ChannelScreen,
    SearchScreen,
    ThreadScreen,
} from '@support/ui/screen';

describe('Hashtags', () => {
    const {postMessage} = ChannelScreen;
    const {
        getSearchResultPostItem,
        searchInput,
    } = SearchScreen;
    let townSquareChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T356 should be able to post hashtags on main channel', async () => {
        // # Post hashtags
        const valid1 = '#TEST';
        const valid2 = '#QA-testing';
        const valid3 = '#hello-world';
        const invalid1 = '#ab';
        const invalid2 = '#123';
        await postMessage(valid1);
        await postMessage(valid2);
        await postMessage(valid3);
        await postMessage(invalid1);
        await postMessage(invalid2);

        // * Verify valid ones open search result screen
        await element(by.text(valid1)).tap();
        await SearchScreen.toBeVisible();
        await searchInput.clearText();
        await SearchScreen.cancel();
        await element(by.text(valid2)).tap();
        await SearchScreen.toBeVisible();
        await searchInput.clearText();
        await SearchScreen.cancel();
        await element(by.text(valid3)).tap();
        await SearchScreen.toBeVisible();
        await searchInput.clearText();
        await SearchScreen.cancel();

        // * Verify invalid ones open thread screen
        await element(by.text(invalid1)).tap();
        await ThreadScreen.toBeVisible();
        await ThreadScreen.back();
        await element(by.text(invalid2)).tap();
        await ThreadScreen.toBeVisible();
        await ThreadScreen.back();

        // # Search for valid one and tap on hashtag from results
        await SearchScreen.open();
        await searchInput.typeText(valid1);
        await searchInput.tapReturnKey();
        await element(by.text(valid1).withAncestor(by.id(SearchScreen.testID.searchResultsList))).atIndex(1).tap();
        await SearchScreen.toBeVisible();

        // # Search for invalid one and tap on hashtag from results
        await searchInput.clearText();
        await searchInput.typeText(invalid1);
        await searchInput.tapReturnKey();
        await element(by.text(invalid1).withAncestor(by.id(SearchScreen.testID.searchResultsList))).atIndex(1).tap();
        await ThreadScreen.toBeVisible();

        // # Go back to channel
        await ThreadScreen.back();
        await searchInput.clearText();
        await SearchScreen.cancel();
    });

    it('MM-T357 should be able to tap on hashtag from search result reply thread', async () => {
        // # Post hashtags
        const hashtag = '#hashtag';
        await postMessage(hashtag);

        // * Verify tapping on hashtag shows result containing post of hashtag
        await element(by.text(hashtag)).tap();
        await SearchScreen.toBeVisible();
        await expect(element(by.text(hashtag)).atIndex(1)).toExist();

        // # Open reply thread from search result and tap on hashtag
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {searchResultPostItem} = await getSearchResultPostItem(post.id, hashtag);
        await searchResultPostItem.tap();
        await ThreadScreen.toBeVisible();
        await element(by.text(hashtag)).atIndex(1).tap();

        // * Verify tapping on hashtag from reply thread shows result containing post of hashtag
        await SearchScreen.toBeVisible();
        await expect(element(by.text(hashtag)).atIndex(1)).toExist();

        // # Go back to channel
        await searchInput.clearText();
        await SearchScreen.cancel();
    });
});
