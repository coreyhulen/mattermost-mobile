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
    ChannelScreen,
    AddReactionScreen,
    ReactionListScreen,
} from '@support/ui/screen';

describe('Emojis and Reactions', () => {
    const {
        openPostOptionsFor,
        postMessage,
    } = ChannelScreen;
    let testUser;
    let townSquareChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();
        testUser = user;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T2347 should be able to access recent reactions from the long press menu', async () => {
        // # Post a message
        const testMessage = Date.now().toString();
        await postMessage(testMessage);

        // * Verify default reactions are displayed
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openPostOptionsFor(post.id, testMessage);
        await expect(PostOptions.getReactionButton('thumbsup')).toBeVisible();
        await expect(PostOptions.getReactionButton('smiley')).toBeVisible();
        await expect(PostOptions.getReactionButton('white_check_mark')).toBeVisible();
        await expect(PostOptions.getReactionButton('heart')).toBeVisible();
        await expect(PostOptions.getReactionButton('eyes')).toBeVisible();
        await expect(PostOptions.getReactionButton('raised_hands')).toBeVisible();

        // # Add a different reaction
        await AddReactionScreen.open();
        await AddReactionScreen.searchInput.typeText(':clown_face:');
        await element(by.text('🤡')).tap();

        // * Verify recent reactions are displayed
        await openPostOptionsFor(post.id, testMessage);
        await expect(PostOptions.getReactionButton('clown_face')).toBeVisible();
        await expect(PostOptions.getReactionButton('thumbsup')).toBeVisible();
        await expect(PostOptions.getReactionButton('smiley')).toBeVisible();
        await expect(PostOptions.getReactionButton('white_check_mark')).toBeVisible();
        await expect(PostOptions.getReactionButton('heart')).toBeVisible();
        await expect(PostOptions.getReactionButton('eyes')).toBeVisible();
        await expect(PostOptions.getReactionButton('raised_hands')).not.toBeVisible();

        // # Go back to channel
        await PostOptions.close();
    });

    it('MM-T150 should be able to long press on an emoji to view list of users who reacted', async () => {
        // # Post a message
        const testMessage = Date.now().toString();
        await postMessage(testMessage);

        // # Add a reaction
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openPostOptionsFor(post.id, testMessage);
        await AddReactionScreen.open();
        await AddReactionScreen.searchInput.typeText(':fire:');
        await element(by.text('🔥')).tap();

        // # Long press on the reaction
        await element(by.text('🔥').withAncestor(by.id(`channel.post_list.post.${post.id}`))).longPress();

        // * Verify user who reacted with the emoji
        await ReactionListScreen.toBeVisible();
        const {
            reactionRowEmoji,
            reactionRowProfilePicture,
            reactionRowUser,
        } = await ReactionListScreen.getReactionRow(testUser.id, 'fire');
        await expect(reactionRowProfilePicture).toBeVisible();
        await expect(reactionRowUser).toHaveText(`@${testUser.username}  ${testUser.username}`);
        await expect(reactionRowEmoji).toBeVisible();

        // # Go back to channel
        await ReactionListScreen.close();
    });

    it('MM-T3495 should include post message emojis in Recent Emojis section and Recently Used section', async () => {
        // # Post a message
        const testMessage = 'The quick brown fox :fox_face: jumps over the lazy dog :dog:';
        await postMessage(testMessage);

        // * Verify message is posted
        await expect(element(by.text('The quick brown fox 🦊 jumps over the lazy dog 🐶'))).toBeVisible();

        // # Open PostOptions
        await element(by.text('The quick brown fox 🦊 jumps over the lazy dog 🐶')).longPress();
        await PostOptions.toBeVisible();

        // * Verify emojis exist
        await expect(element(by.text('🦊'))).toExist();
        await expect(element(by.text('🐶'))).toExist();

        // # Open AddReaction screen
        await AddReactionScreen.open();

        // * Verify Emojis exist in recently used section
        await expect(element(by.text('🦊').withAncestor(by.id('RECENTLY USED')))).toExist();
        await expect(element(by.text('🐶').withAncestor(by.id('RECENTLY USED')))).toExist();

        // # Close AddReaction Screen
        await AddReactionScreen.close();
    });

    it('MM-T3316 should display empty search state for emoji picker', async () => {
        // # Post a message
        const testMessage = Date.now().toString();
        await postMessage(testMessage);

        // # Add a reaction
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const searchTerm = 'blahblahblahblah';
        await openPostOptionsFor(post.id, testMessage);
        await AddReactionScreen.open();
        await AddReactionScreen.searchInput.typeText(searchTerm);

        // * Verify empty search state for emoji picker
        await expect(element(by.text(`No results found for "${searchTerm}"`))).toBeVisible();
        await expect(element(by.text('Check the spelling or try another search.'))).toBeVisible();

        // # Go back to channel
        await AddReactionScreen.close();
    });
});
