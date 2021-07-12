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
    ThreadScreen,
} from '@support/ui/screen';

describe('Message Deletion', () => {
    const {
        channelScreen,
        deletePost,
        openReplyThreadFor,
        postMessage,
    } = ChannelScreen;
    let testChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        const {channel} = await Channel.apiGetChannelByName(team.id, 'town-square');
        testChannel = channel;

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3231 should be able to delete message and cancel', async () => {
        // # Post a message
        const message = Date.now().toString();
        await postMessage(message);

        // # Delete post and cancel
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await deletePost(post.id, message, {confirm: false});

        // * Verify post is not deleted
        await expect(channelScreen).toBeVisible();
        await expect(element(by.text(message))).toBeVisible();
    });

    it('MM-T3232 should remove message from channel when deleted', async () => {
        // # Post a message
        const message = Date.now().toString();
        await postMessage(message);

        // # Delete post
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await deletePost(post.id, message);

        // * Verify post is deleted
        await expect(channelScreen).toBeVisible();
        await expect(element(by.text(message))).not.toBeVisible();
    });

    it('MM-T3233 should be able to delete reply post from reply thread view', async () => {
        // # Post a message
        const parentMessage = Date.now().toString();
        await postMessage(parentMessage);

        // # Open reply thread for post
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openReplyThreadFor(post.id, parentMessage);

        // # Post a reply message
        const replyMessage = `reply ${parentMessage}`;
        await ThreadScreen.postMessage(replyMessage);

        // # Delete reply post from reply thread
        const {post: replyPost} = await Post.apiGetLastPostInChannel(testChannel.id);
        await ThreadScreen.deletePost(replyPost.id, replyMessage, {isParentPost: false});

        // * Verify reply post is deleted but parent post is still visible in reply thread
        await ThreadScreen.toBeVisible();
        await expect(element(by.text(replyMessage))).not.toBeVisible();
        await expect(element(by.text(parentMessage))).toBeVisible();

        // * Verify reply post is deleted but parent post is still visible in main thread
        await ThreadScreen.back();
        await expect(channelScreen).toBeVisible();
        await expect(element(by.text(replyMessage))).not.toBeVisible();
        await expect(element(by.text(parentMessage))).toBeVisible();
    });

    it('MM-T3234 should be able to delete parent post from reply thread view', async () => {
        // # Post a message
        const message = Date.now().toString();
        await postMessage(message);

        // # Open reply thread for post
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openReplyThreadFor(post.id, message);

        // # Delete parent post from reply thread
        await ThreadScreen.deletePost(post.id, message);

        // * Verify post is deleted
        await expect(channelScreen).toBeVisible();
        await expect(element(by.text(message))).not.toBeVisible();
    });
});
