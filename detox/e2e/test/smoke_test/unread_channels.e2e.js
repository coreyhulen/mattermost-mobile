// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Setup,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Unread channels', () => {
    const {
        goToChannel,
        closeMainSidebar,
        openMainSidebar,
    } = ChannelScreen;
    const {
        channelsList,
        channelsListUnreadIndicator,
        hasChannelDisplayNameAtIndex,
    } = MainSidebar;
    let testUser;
    let testTeam;
    let newChannel;
    let aChannel;
    let zChannel;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testUser = user;
        testTeam = team;
        newChannel = channel;

        ({channel: aChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'a-channel', teamId: testTeam.id}));
        await Channel.apiAddUserToChannel(testUser.id, aChannel.id);

        ({channel: zChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'z-channel', teamId: testTeam.id}));
        await Channel.apiAddUserToChannel(testUser.id, zChannel.id);

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3187 Unread channels sort at top', async () => {
        // # Open main sidebar (with at least one unread channel)
        await openMainSidebar();

        // * Verify unread channel(s) display at top of channel list (with mentions first, if any), in alphabetical order, with title "Unreads"
        await expect(element(by.text('UNREADS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, aChannel.display_name);
        await hasChannelDisplayNameAtIndex(1, newChannel.display_name);
        await hasChannelDisplayNameAtIndex(2, zChannel.display_name);
        await closeMainSidebar();

        // # Tap an unread channel to view it
        await goToChannel(aChannel.display_name);
        await goToChannel(newChannel.display_name);
        await goToChannel(zChannel.display_name);

        // * Channel you just read is no longer listed in Unreads
        await openMainSidebar();
        await expect(element(by.text('UNREADS'))).not.toBeVisible();
        await expect(element(by.text('PUBLIC CHANNELS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, aChannel.display_name);
        await hasChannelDisplayNameAtIndex(1, newChannel.display_name);
        await hasChannelDisplayNameAtIndex(2, 'Off-Topic');
        await hasChannelDisplayNameAtIndex(3, 'Town Square');
        await hasChannelDisplayNameAtIndex(4, zChannel.display_name);

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T3188 should display more unreads indicator when unreads are off-screen in channels list', async () => {
        // # Create 10 unread channels
        [...Array(10).keys()].forEach(async (key) => {
            const {channel} = await Channel.apiCreateChannel({type: 'O', prefix: `unread-channel-${key}`, teamId: testTeam.id});
            await Channel.apiAddUserToChannel(testUser.id, channel.id);
        });

        // # Open main sidebar (with at least one unread channel)
        await openMainSidebar();

        // # Scroll to bottom
        await channelsList.scroll(500, 'down');

        // * Verify more unreads indicator is displayed
        await expect(channelsListUnreadIndicator).toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });
});
