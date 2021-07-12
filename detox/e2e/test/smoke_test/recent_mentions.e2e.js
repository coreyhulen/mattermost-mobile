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
    Team,
    User,
} from '@support/server_api';
import {PostOptions} from '@support/ui/component';
import {
    ChannelScreen,
    RecentMentionsScreen,
} from '@support/ui/screen';

describe('Recent Mentions', () => {
    let testUser1;
    let testUser2;
    let testChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();
        testUser1 = user;

        const {channel} = await Channel.apiGetChannelByName(team.id, 'town-square');
        testChannel = channel;

        ({user: testUser2} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testUser2.id, team.id);
        await Channel.apiAddUserToChannel(testUser2.id, testChannel.id);

        // # Open channel screen
        await ChannelScreen.open(testUser1);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3222 should display recent mentions and no option to add a reaction', async () => {
        // # Post an at-mention message to user 1 by user 2
        const testMessage = `Mention @${testUser1.username}`;
        await User.apiLogin(testUser2);
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: testMessage,
        });

        // * Verify most recent post has the message
        const lastPost = await Post.apiGetLastPostInChannel(testChannel.id);
        const {postListPostItem} = await ChannelScreen.getPostListPostItem(lastPost.post.id, testMessage);
        await expect(postListPostItem).toBeVisible();

        // # Open recent mentions screen
        await ChannelScreen.openSettingsSidebar();
        await RecentMentionsScreen.open();

        // * Verify most recent search result post has the at-mention message
        const lastSearchResultPost = await Post.apiGetLastPostInChannel(testChannel.id);
        const {searchResultPostItem} = await RecentMentionsScreen.getSearchResultPostItem(lastSearchResultPost.post.id, testMessage);
        await expect(searchResultPostItem).toBeVisible();

        // * Verify recent mentions post item does not have option to add a reaction
        await searchResultPostItem.longPress();
        await PostOptions.toBeVisible();
        await expect(PostOptions.reactionPickerAction).not.toBeVisible();

        // # Close recent mentions screen
        await PostOptions.close();
        await RecentMentionsScreen.close();
    });
});
