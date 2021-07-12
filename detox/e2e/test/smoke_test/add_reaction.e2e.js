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
import {
    AddReactionScreen,
    ChannelScreen,
} from '@support/ui/screen';

describe('Add Reaction', () => {
    let testChannel;
    let testOtherUser;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        ({channel: testChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        ({user: testOtherUser} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3223 should be able to add a reaction to a post using long press and +:', async () => {
        const {
            openPostOptionsFor,
            postMessage,
        } = ChannelScreen;
        const {searchInput} = AddReactionScreen;

        // # Post a message
        const message = Date.now().toString();
        await postMessage(message);

        // # Add a reaction to the post using long press
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openPostOptionsFor(post.id, message);
        await AddReactionScreen.open();
        await searchInput.typeText(':fox_face:');
        await element(by.text('🦊')).tap();

        // # Add a reaction to the post using +:
        await postMessage('+:dog:');

        // * Verify emojis are added to post
        await expect(element(by.text('🦊').withAncestor(by.id(`channel.post_list.post.${post.id}`)))).toExist();
        await expect(element(by.text('🐶').withAncestor(by.id(`channel.post_list.post.${post.id}`)))).toExist();

        // * Verify emoji exists in recently used section
        await openPostOptionsFor(post.id, message);
        await AddReactionScreen.open();
        await expect(element(by.text('🦊').withAncestor(by.id('RECENTLY USED')))).toExist();
        await expect(element(by.text('🐶').withAncestor(by.id('RECENTLY USED')))).toExist();

        // # Close add reaction screen
        await AddReactionScreen.close();
    });

    it('MM-T3224 should be able to remove own reaction and add to another user reaction', async () => {
        // # Tap on own reaction to remove
        await element(by.text('🦊')).tap();

        // * Verify own reaction is removed
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await expect(element(by.text('🦊').withAncestor(by.id(`channel.post_list.post.${post.id}`)))).not.toExist();

        // # Login as new user
        await ChannelScreen.logout();
        await ChannelScreen.open(testOtherUser);

        // # Add the same existing reaction
        await expect(element(by.id('reaction.emoji.dog.count'))).toHaveText('1');
        await element(by.text('🐶')).tap();

        // * Verify count incremented
        await expect(element(by.id('reaction.emoji.dog.count'))).toHaveText('2');
    });
});
