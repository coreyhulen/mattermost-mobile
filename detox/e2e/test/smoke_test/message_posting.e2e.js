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
import {ChannelScreen} from '@support/ui/screen';
import {isAndroid} from '@support/utils';

describe('Message Posting', () => {
    const longMessage = 'The quick brown fox jumps over the lazy dog.'.repeat(30);
    const {
        getPostListPostItem,
        goToChannel,
        postMessage,
    } = ChannelScreen;
    let testChannel;
    let townSquareChannel;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel = channel;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3217 should be able to post a long message', async () => {
        // # Post a long message
        await postMessage(longMessage, {quickReplace: true});

        // * Verify message is posted
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {
            postListPostItem,
            postListPostItemShowMoreButton,
        } = await getPostListPostItem(post.id, longMessage);
        await expect(postListPostItem).toExist();
        await expect(postListPostItemShowMoreButton).toExist();
    });

    it('MM-T3229 should be able to open long post via show more', async () => {
        // # Open long post via show more
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {
            postListPostItem,
            postListPostItemShowLessButton,
            postListPostItemShowMoreButton,
        } = await getPostListPostItem(post.id, longMessage);
        await postListPostItemShowMoreButton.tap();

        // * Verify long post is displayed
        await expect(postListPostItem).toExist();

        // # Close long post
        await postListPostItemShowLessButton.tap();

        // * Verify show more button is displayed again
        await expect(postListPostItemShowMoreButton).toExist();
    });

    it('MM-T3269 should be able to post a markdown image', async () => {
        // # Post a markdown image
        const message = '![alt text that displays if loading fails](https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png)';
        await postMessage(message, {quickReplace: true});

        // * Verify message is posted
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItemImage} = await getPostListPostItem(post.id);
        await expect(postListPostItemImage).toBeVisible();
    });

    it('MM-T3225 should be able to post a jumbo emoji', async () => {
        // # Post a jumbo emoji
        const message = ':fox_face:';
        await postMessage(message);

        // * Verify message is posted
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItem} = await getPostListPostItem(post.id, '🦊');
        await expect(postListPostItem).toBeVisible();
    });

    it('MM-T3189 should be able to scroll up in channel with long history', async () => {
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
