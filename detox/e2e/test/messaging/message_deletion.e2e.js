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
import {ChannelScreen} from '@support/ui/screen';

describe('Message Deletion', () => {
    const {
        channelScreen,
        deletePost,
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

    it('MM-T115 should be able to delete message and cancel', async () => {
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

    it('MM-T116 should remove message from channel when deleted', async () => {
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
});
