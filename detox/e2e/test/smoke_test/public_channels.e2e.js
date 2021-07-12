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
    System,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {
    ChannelInfoScreen,
    ChannelScreen,
    MoreChannelsScreen,
} from '@support/ui/screen';

describe('Public Channels', () => {
    const testPublicChannePrefix = '1-public-channel';
    const {
        channelNavBarTitle,
        closeMainSidebar,
        openMainSidebar,
    } = ChannelScreen;
    const {
        archiveChannel,
        leaveChannel,
    } = ChannelInfoScreen;
    const {
        hasChannelDisplayNameAtIndex,
        showArchivedChannels,
    } = MoreChannelsScreen;
    const {
        getChannelByDisplayName,
        getFilteredChannelByDisplayName,
        searchInput,
    } = MainSidebar;
    let testPublicChannel;
    let townSquareChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));
        ({channel: testPublicChannel} = await Channel.apiCreateChannel({type: 'O', prefix: testPublicChannePrefix, teamId: team.id}));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3200 should be able to join existing public channel', async () => {
        // # Join public channel
        await openMainSidebar();
        await searchInput.typeText(testPublicChannePrefix);
        await searchInput.tapBackspaceKey();
        await getFilteredChannelByDisplayName(testPublicChannel.display_name).tap();

        // * Verify user is added to the channel
        await expect(element(by.text('You and @sysadmin joined the channel.'))).toBeVisible();
    });

    it('MM-T3202 should be able to leave public channel', async () => {
        // # Attempt to leave public channel twice, tap No first, then tap Yes second
        await expect(channelNavBarTitle).toHaveText(testPublicChannel.display_name);
        await ChannelInfoScreen.open();
        await leaveChannel({confirm: false});
        await leaveChannel({confirm: true});

        // * Verify redirected to town square and does not appear in channel list
        await expect(channelNavBarTitle).toHaveText(townSquareChannel.display_name);
        await openMainSidebar();
        await expect(getChannelByDisplayName(testPublicChannel.display_name)).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T3208 should be able to archive public channel', async () => {
        // # Join public channel
        await openMainSidebar();
        await searchInput.typeText(testPublicChannePrefix);
        await searchInput.tapBackspaceKey();
        await getFilteredChannelByDisplayName(testPublicChannel.display_name).tap();

        // # Attempt to archive public channel, tap No first, then tap Yes second
        await expect(channelNavBarTitle).toHaveText(testPublicChannel.display_name);
        await ChannelInfoScreen.open();
        await archiveChannel({confirm: false});
        await archiveChannel({confirm: true});

        // * Verify redirected to town square and does not appear in channel list
        await expect(channelNavBarTitle).toHaveText(townSquareChannel.display_name);
        await openMainSidebar();
        await expect(getChannelByDisplayName(testPublicChannel.display_name)).not.toBeVisible();

        // # Enable experimental view archived channels
        await System.apiUpdateConfig({TeamSettings: {ExperimentalViewArchivedChannels: true}});

        // * Verify public channel is archived
        await MoreChannelsScreen.open();
        await showArchivedChannels();
        await hasChannelDisplayNameAtIndex(0, testPublicChannel.display_name);

        // # Close more channels screen
        await MoreChannelsScreen.close();
    });
});
