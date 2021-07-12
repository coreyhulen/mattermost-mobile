// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import jestExpect from 'expect';

import {
    Channel,
    Post,
    Setup,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Mark As Read', () => {
    const {
        closeMainSidebar,
        goToChannel,
        openMainSidebar,
    } = ChannelScreen;
    const {hasChannelDisplayNameAtIndex} = MainSidebar;
    let testChannel;
    let testUser;

    beforeAll(async () => {
        const {channel, user} = await Setup.apiInit();
        testChannel = channel;
        testUser = user;

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T119 should mark message as read on mobile when message was read on webapp or api', async () => {
        // # Post a new message to channel by sysadmin
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: Date.now().toString(),
        });

        // * Verify channel has unread message
        await openMainSidebar();
        await expect(element(by.text('UNREADS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, testChannel.display_name);

        // # View channel on webapp or api
        await closeMainSidebar();
        await Channel.apiViewChannel(testUser.id, testChannel.id);

        // * Verify message is read
        await openMainSidebar();
        await expect(element(by.text('UNREADS'))).not.toBeVisible();
        await expect(element(by.text('PUBLIC CHANNELS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, testChannel.display_name);

        // # Go back to channel
        await closeMainSidebar();
    });

    it('MM-T120 should mark message as read on webapp or api when message was read on mobile', async () => {
        // # Post a new message to channel by sysadmin
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: Date.now().toString(),
        });

        // * Verify unread messages on webapp or api is 1
        const beforeVisit = await Channel.apiGetUnreadMessages(testUser.id, testChannel.id);
        jestExpect(beforeVisit.data.msg_count).toEqual(1);

        // # Visit channel on mobile
        await goToChannel(testChannel.display_name);

        // * Verify unread messages on webapp or api is 0
        const afterVisit = await Channel.apiGetUnreadMessages(testUser.id, testChannel.id);
        jestExpect(afterVisit.data.msg_count).toEqual(0);
    });
});
