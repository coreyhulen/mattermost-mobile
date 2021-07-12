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
import {Alert} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('At Mention', () => {
    const {
        hasPostMessage,
        postInput,
        postMessage,
        sendButton,
    } = ChannelScreen;
    let testUser;
    let testOtherUser;
    let townSquareChannel;
    let testTeam;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();
        testTeam = team;
        testUser = user;

        ({user: testOtherUser} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser.id, testTeam.id);

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(testTeam.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T169 should post at-mentions as lowercase', async () => {
        // # Post lowercase at-mention
        const lowerCaseMessage = `@${testUser.username}`;
        await postMessage(lowerCaseMessage);

        // * Verify at-mention is posted as lowercase
        const {post: lowerCasePost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await hasPostMessage(lowerCasePost.id, lowerCaseMessage);

        // # Post uppercase at-mention
        const upperCaseMessage = `@${testOtherUser.username.toUpperCase()}`;
        await postMessage(upperCaseMessage);

        // * Verify at-mention is posted as lowercase
        const {post: upperCasePost} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await hasPostMessage(upperCasePost.id, upperCaseMessage.toLowerCase());
    });

    it('MM-T172 should display confirmation dialog when posting @all and @channel', async () => {
        const {
            cancelButton,
            confirmSendingNotificationsTitle,
        } = Alert;

        // # Create 20 more users
        [...Array(20).keys()].forEach(async (key) => {
            const {user} = await User.apiCreateUser({prefix: `a-${key}-`});
            await Team.apiAddUserToTeam(user.id, testTeam.id);
        });

        // # Post @all
        await postInput.typeText('@all');
        await sendButton.tap();

        // * Verify confirmation dialog is displayed
        await expect(confirmSendingNotificationsTitle).toBeVisible();
        await cancelButton.tap();

        // # Post @channel
        await postInput.clearText();
        await postInput.typeText('@channel');
        await sendButton.tap();

        // * Verify confirmation dialog is displayed
        await expect(confirmSendingNotificationsTitle).toBeVisible();
        await cancelButton.tap();
    });
});
