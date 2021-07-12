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
    User,
} from '@support/server_api';
import {
    ChannelScreen,
    PermalinkScreen,
} from '@support/ui/screen';
import {
    timeouts,
    wait,
} from '@support/utils';

describe('Permalink', () => {
    let testUser;
    let testChannel;
    let townSquareChannel;

    beforeAll(async () => {
        const {user, team, channel} = await Setup.apiInit();
        testUser = user;
        testChannel = channel;
        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    const expectPermalinkTargetMessage = async (permalinkTargetPost, permalinkTargetChannel) => {
        // # Post a message in the test channel referencing the given permalink.
        const permalinkLabel = `permalink-${Date.now().toString()}`;
        const permalinkMessage = `[${permalinkLabel}](/_redirect/pl/${permalinkTargetPost.id})`;
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: permalinkMessage,
        });

        // # Go to test channel
        await ChannelScreen.goToChannel(testChannel.display_name);

        // # Tap the channel permalink
        await element(by.text(permalinkLabel)).tap({x: 5, y: 10});
        await wait(timeouts.ONE_SEC);

        // * Verify permalink post list has the expected target message
        await PermalinkScreen.toBeVisible();
        const {postListPostItem: permalinkPostItem} = await PermalinkScreen.getPostListPostItem(permalinkTargetPost.id, permalinkTargetPost.message);
        await expect(permalinkPostItem).toBeVisible();

        // # Dismiss the permalink screen by jumping to recent messages
        await PermalinkScreen.jumpToRecentMessages();

        // * Verify user is on channel where message is posted
        await expect(ChannelScreen.channelNavBarTitle).toHaveText(permalinkTargetChannel.display_name);
        const {postListPostItem: channelPostItem} = await ChannelScreen.getPostListPostItem(permalinkTargetPost.id, permalinkTargetPost.message);
        await expect(channelPostItem).toBeVisible();
    };

    it('MM-T3805_1 should support _redirect to public channel post', async () => {
        // # Post a test message in a public channel
        const permalinkTargetMessage = 'post in Town Square';
        const permalinkTargetPost = await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: permalinkTargetMessage,
        });

        await expectPermalinkTargetMessage(permalinkTargetPost.post, townSquareChannel);
    });

    it('MM-T3805_2 should support _redirect to DM post', async () => {
        // # Post a test message in a DM
        const {user: dmOtherUser} = await User.apiCreateUser({prefix: 'testchannel-1'});
        const {channel: directMessageChannel} = await Channel.apiCreateDirectChannel([testUser.id, dmOtherUser.id]);
        const permalinkTargetMessage = 'post in DM';
        const permalinkTargetPost = await Post.apiCreatePost({
            channelId: directMessageChannel.id,
            message: permalinkTargetMessage,
        });

        await expectPermalinkTargetMessage(permalinkTargetPost.post, directMessageChannel);
    });
});
