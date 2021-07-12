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

describe('Message Reply', () => {
    let testChannel;
    let parentPost;
    let parentPostItem;
    let replyPost;
    let replyPostItem;

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

    it('MM-T3218 should be able to post a reply to a message', async () => {
        // # Post a message
        const parentMessage = Date.now().toString();
        await ChannelScreen.postMessage(parentMessage);

        // * Verify parent post is displayed in reply thread
        ({post: parentPost} = await Post.apiGetLastPostInChannel(testChannel.id));
        await ChannelScreen.openReplyThreadFor(parentPost.id, parentMessage);
        ({postListPostItem: parentPostItem} = await ThreadScreen.getPostListPostItem(parentPost.id, parentMessage));
        await expect(parentPostItem).toBeVisible();

        // # Post a reply
        const replyMessage = `reply to ${parentMessage}`;
        await ThreadScreen.postMessage(replyMessage);

        // * Verify reply post appears after parent post in reply thread
        ({post: replyPost} = await Post.apiGetLastPostInChannel(testChannel.id));
        ({postListPostItem: replyPostItem} = await ThreadScreen.getPostListPostItem(replyPost.id, replyMessage));
        await expect(replyPostItem).toBeVisible();
        await replyPostItem.tap();

        // * Verify reply post is displayed in main channel
        await ThreadScreen.back();
        await ChannelScreen.toBeVisible();
        await expect(element(by.text(replyMessage))).toBeVisible();
    });
});
