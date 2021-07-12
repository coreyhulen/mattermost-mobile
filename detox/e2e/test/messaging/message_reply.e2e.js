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
import {PostOptions} from '@support/ui/component';
import {
    AddReactionScreen,
    ChannelScreen,
    ThreadScreen,
} from '@support/ui/screen';

describe('Message Reply', () => {
    const {
        getPostListPostItem,
        openPostOptionsFor,
        openReplyThreadFor,
        postMessage,
    } = ChannelScreen;
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

    it('MM-T117 should be able to delete reply in reply thread', async () => {
        // # Post message in main channel
        const parentMessage = Date.now().toString();
        await postMessage(parentMessage);

        // # Post reply message
        const replyMessage = Date.now().toString();
        const {post: parentPost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(parentPost.id, parentMessage);
        await ThreadScreen.postMessage(replyMessage);

        // # Delete reply message
        const {post: replyPost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await ThreadScreen.deletePost(replyPost.id, replyMessage, {isParentPost: false});

        // * Verify reply message is deleted and parent post still exists
        await ThreadScreen.toBeVisible();
        await expect(element(by.text(replyMessage))).not.toExist();
        await expect(element(by.text(parentMessage))).toExist();

        // # Go back to channel
        await ThreadScreen.back();
    });

    it('MM-T118 should have reply option available in long press menu', async () => {
        const {replyAction} = PostOptions;

        // # Post message as current user
        const currentUserMessage = Date.now().toString();
        await postMessage(currentUserMessage);

        // * Verify long press menu contains reply option
        const {post: currentUserPost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openPostOptionsFor(currentUserPost.id, currentUserMessage);
        await expect(replyAction).toBeVisible();

        // # Post a new message to channel by sysadmin
        await PostOptions.close();
        const sysadminMessage = Date.now().toString();
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: sysadminMessage,
        });

        // * Verify long press menu contains reply option
        const {post: sysadminPost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openPostOptionsFor(sysadminPost.id, sysadminMessage);
        await expect(replyAction).toBeVisible();

        // # Go back to channel
        await PostOptions.close();
    });

    it('MM-T148 should be able to add a reaction to a post in reply thread using long press and +:', async () => {
        // # Post a message
        const message = Date.now().toString();
        await postMessage(message);

        // # Add a reaction to the post in reply thread using long press
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(post.id, message);
        await ThreadScreen.openPostOptionsFor(post.id, message);
        await AddReactionScreen.open();
        await AddReactionScreen.searchInput.typeText(':fox_face:');
        await element(by.text('🦊')).tap();

        // # Add a reaction to the post in reply thread using +:
        await ThreadScreen.postMessage('+:dog:');

        // * Verify emojis are added to post
        await expect(element(by.text('🦊').withAncestor(by.id(`thread.post_list.post.${post.id}`)))).toExist();
        await expect(element(by.text('🐶').withAncestor(by.id(`thread.post_list.post.${post.id}`)))).toExist();

        // # Go back to channel
        await ThreadScreen.back();
    });

    it('MM-T2133 should have send button disabled in reply thread if no text in post input', async () => {
        // # Post message in main channel
        const message = Date.now().toString();
        await postMessage(message);

        // * Verify send button disabled in reply thread if no text in post input
        const {post: parentPost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(parentPost.id, message);
        await ThreadScreen.postInput.clearText();
        await expect(ThreadScreen.sendButtonDisabled).toBeVisible();

        // # Go back to channel
        await ThreadScreen.back();
    });

    it('MM-T2134 should display reply count in parent post from main channel', async () => {
        // # Post message in main channel
        const parentMessage = Date.now().toString();
        await postMessage(parentMessage);

        // # Post 2 reply messages
        const {post: parentPost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(parentPost.id, parentMessage);
        await ThreadScreen.postMessage('reply 1');
        await ThreadScreen.postMessage('reply 2');

        // * Verify reply count in parent post from main channel
        await ThreadScreen.back();
        const {postListPostItemHeaderReplyCount} = await getPostListPostItem(parentPost.id, parentMessage);
        await expect(postListPostItemHeaderReplyCount).toHaveText('2');
    });

    it('MM-T2135 should be able to reply thread using post header reply arrow', async () => {
        // # Post message in main channel
        const parentMessage = Date.now().toString();
        await postMessage(parentMessage);

        // # Post a reply message
        const {post: parentPost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(parentPost.id, parentMessage);
        await ThreadScreen.postMessage('reply 1');

        // # Open reply thread using post header reply arrow
        await ThreadScreen.back();
        const {postListPostItemHeaderReply} = await getPostListPostItem(parentPost.id, parentMessage);
        await postListPostItemHeaderReply.tap();

        // * Verify user is able to post another reply
        const secondReply = 'reply 2';
        await ThreadScreen.postMessage(secondReply);
        await expect(element(by.text(secondReply))).toBeVisible();

        // # Go back to channel
        await ThreadScreen.back();
    });
});
