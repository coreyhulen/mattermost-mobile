// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import moment from 'moment-timezone';

import {
    Channel,
    Post,
    Setup,
} from '@support/server_api';
import {
    MainSidebar,
    PostOptions,
    TeamsList,
} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';
import {
    getAdminAccount,
    isAndroid,
} from '@support/utils';

describe('Messaging', () => {
    const {
        getPostListPostItem,
        goToChannel,
        openTeamSidebar,
        postInput,
        postMessage,
        sendButton,
        sendButtonDisabled,
    } = ChannelScreen;
    let testChannel;
    let townSquareChannel;
    let testTeam;
    let testUser;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel = channel;
        testTeam = team;
        testUser = user;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(testTeam.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T108 should be able to post a long message', async () => {
        // # Post a long message
        const longMessage = 'The quick brown fox jumps over the lazy dog.'.repeat(10);
        await postMessage(longMessage, {quickReplace: true});

        // * Verify message is posted
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItem} = await getPostListPostItem(post.id, longMessage);
        await expect(postListPostItem).toExist();
    });

    it('MM-T151 should only have delete post option for system message as sysadmin', async () => {
        const {getTeamByDisplayName} = MainSidebar;
        const {
            copyAction,
            deleteAction,
            editAction,
            markUnreadAction,
            permalinkAction,
            pinAction,
            reactionPickerAction,
            replyAction,
            saveAction,
        } = PostOptions;

        // # Log in as sysadmin
        await ChannelScreen.logout();
        await ChannelScreen.open(getAdminAccount());

        // # Go to channel with system message
        await openTeamSidebar();
        await waitFor(getTeamByDisplayName(testTeam.display_name)).toBeVisible().whileElement(by.id(TeamsList.testID.teamsList)).scroll(500, 'down');
        await getTeamByDisplayName(testTeam.display_name).tap();
        await goToChannel(testChannel.display_name);

        // * Verify only delete post option is present
        const systemMessage = `@${testUser.username} added to the channel by you.`;
        await element(by.text(systemMessage)).longPress();
        await expect(deleteAction).toBeVisible();
        await expect(reactionPickerAction).not.toExist();
        await expect(replyAction).not.toExist();
        await expect(permalinkAction).not.toExist();
        await expect(copyAction).not.toExist();
        await expect(editAction).not.toExist();
        await expect(saveAction).not.toExist();
        await expect(pinAction).not.toExist();
        await expect(markUnreadAction).not.toExist();

        // # Log in as test user
        await PostOptions.close();
        await ChannelScreen.logout();
        await ChannelScreen.open(testUser);
    });

    it('MM-T3486 should post a message when send button is tapped', async () => {
        // * Verify post input is visible and send button is disabled
        await expect(postInput).toBeVisible();
        await expect(sendButtonDisabled).toBeVisible();

        // # Tap on post input
        await postInput.tap();

        // # Type message on post input
        const message = Date.now().toString();
        await postInput.typeText(message);

        // * Verify send button is enabled
        await expect(sendButton).toBeVisible();

        // # Tap send button
        await sendButton.tap();

        // * Verify message is posted
        await expect(element(by.text(message))).toBeVisible();
    });

    it('MM-T891 should be able to scroll up in channel with long history', async () => {
        // # Post messages
        await goToChannel(testChannel.display_name);
        const size = 50;
        const firstMessageDate = moment().subtract(size + 1, 'days').toDate();
        const firstMessage = `${firstMessageDate} first`;
        const firstPost = await Post.apiCreatePost({
            channelId: testChannel.id,
            message: firstMessage,
            createAt: firstMessageDate.getTime(),
        });
        [...Array(size).keys()].forEach(async (key) => {
            const messageDate = moment().subtract(key + 1, 'days').toDate();
            const message = `${messageDate}-${key}.`.repeat(10);
            await Post.apiCreatePost({
                channelId: testChannel.id,
                message,
                createAt: messageDate.getTime(),
            });
        });
        const lastMessageDate = moment().toDate();
        const lastMessage = `${lastMessageDate} last`;
        const lastPost = await Post.apiCreatePost({
            channelId: testChannel.id,
            message: lastMessage,
            createAt: lastMessageDate.getTime(),
        });

        // # Switch channels
        await goToChannel(townSquareChannel.display_name);
        await goToChannel(testChannel.display_name);

        // Detox is having trouble scrolling
        if (isAndroid()) {
            return;
        }

        // * Verify last message is posted
        const {postListPostItem: lastPostItem} = await getPostListPostItem(lastPost.post.id, lastMessage);
        await waitFor(lastPostItem).toBeVisible().whileElement(by.id(ChannelScreen.testID.channelPostList)).scroll(1000, 'down');

        // * Verify user can scroll up multiple times until first matching post is seen
        const {postListPostItem: firstPostItem} = await getPostListPostItem(firstPost.post.id, firstMessage);
        await waitFor(firstPostItem).toBeVisible().whileElement(by.id(ChannelScreen.testID.channelPostList)).scroll(2000, 'up');
    });
});
