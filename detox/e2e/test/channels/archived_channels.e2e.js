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
    System,
    Team,
    User,
} from '@support/server_api';
import {
    ChannelScreen,
    ChannelInfoScreen,
    MoreChannelsScreen,
} from '@support/ui/screen';

describe('Archived Channels', () => {
    const {
        closeMainSidebar,
        goToChannel,
        mainSidebarDrawerButtonBadgeUnreadCount,
        openMainSidebar,
        postMessage,
    } = ChannelScreen;
    let testUser;
    let testTeam;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();
        testUser = user;
        testTeam = team;

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    beforeEach(async () => {
        // # Disable experimental view archived channels
        await User.apiAdminLogin();
        await System.apiUpdateConfig({TeamSettings: {ExperimentalViewArchivedChannels: false}});
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T1689 should remove favorited archived channel from main sidebar channels list', async () => {
        const {channel: favoritedChannel} = await Channel.apiCreateChannel({type: 'P', prefix: 'favorited-channel', teamId: testTeam.id});
        await Channel.apiAddUserToChannel(testUser.id, favoritedChannel.id);

        // # Archive channel
        await goToChannel(favoritedChannel.display_name);
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.archiveChannel({publicChannel: false});

        // * Verify favorites section and favorited archived channel are not displayed
        await openMainSidebar();
        await expect(element(by.text('FAVORITE CHANNELS'))).not.toBeVisible();
        await expect(element(by.text(favoritedChannel.display_name))).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T1690 should remove unread channel from main sidebar channels list when archived by another user', async () => {
        const {user: otherUser} = await User.apiCreateUser();
        const {channel: unreadChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'unread-channel', teamId: testTeam.id});
        await Team.apiAddUserToTeam(otherUser.id, testTeam.id);
        await Channel.apiAddUserToChannel(testUser.id, unreadChannel.id);
        await Channel.apiAddUserToChannel(otherUser.id, unreadChannel.id);

        // # Archive unread channel using other user
        await ChannelScreen.logout();
        await ChannelScreen.open(otherUser);
        await goToChannel(unreadChannel.display_name);
        await postMessage(Date.now().toString());
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.archiveChannel();

        // * Verify unread archived channel is not displayed in channels list
        await ChannelScreen.logout();
        await ChannelScreen.open(testUser);
        await openMainSidebar();
        await expect(element(by.text(unreadChannel.display_name))).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T1691 should remove unread channel with mention from main sidebar channels list when archived by another user', async () => {
        const {user: otherUser} = await User.apiCreateUser();
        const {channel: unreadChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'unread-channel', teamId: testTeam.id});
        await Team.apiAddUserToTeam(otherUser.id, testTeam.id);
        await Channel.apiAddUserToChannel(testUser.id, unreadChannel.id);
        await Channel.apiAddUserToChannel(otherUser.id, unreadChannel.id);

        // # Archive unread channel with mention using other user
        await ChannelScreen.logout();
        await ChannelScreen.open(otherUser);
        await goToChannel(unreadChannel.display_name);
        await postMessage(`${Date.now().toString()} @${testUser.username}`);
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.archiveChannel();

        // * Verify unread badge is not displayed
        await expect(mainSidebarDrawerButtonBadgeUnreadCount).not.toExist();

        // * Verify unread archived channel with mention is not displayed in channels list
        await ChannelScreen.logout();
        await ChannelScreen.open(testUser);
        await openMainSidebar();
        await expect(element(by.text(unreadChannel.display_name))).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T1692 should remove read channel from main sidebar channels list when archived by another user', async () => {
        const {user: otherUser} = await User.apiCreateUser();
        const {channel: readChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'read-channel', teamId: testTeam.id});
        await Team.apiAddUserToTeam(otherUser.id, testTeam.id);
        await Channel.apiAddUserToChannel(testUser.id, readChannel.id);
        await Channel.apiAddUserToChannel(otherUser.id, readChannel.id);

        // # Post message to channel using other user
        await User.apiLogin(otherUser);
        await Post.apiCreatePost({
            channelId: readChannel.id,
            message: Date.now().toString(),
        });

        // # Read channel by user
        await goToChannel(readChannel.display_name);

        // # Archive read channel using other user
        await ChannelScreen.logout();
        await ChannelScreen.open(otherUser);
        await goToChannel(readChannel.display_name);
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.archiveChannel();

        // * Verify read archived channel is not displayed in channels list
        await ChannelScreen.logout();
        await ChannelScreen.open(testUser);
        await openMainSidebar();
        await expect(element(by.text(readChannel.display_name))).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T1712 should not display channel dropdown when disabled', async () => {
        // # Open more channels screen
        await openMainSidebar();
        await MoreChannelsScreen.open();

        // * Verify channel dropdown is not available
        await expect(MoreChannelsScreen.channelDropdown).not.toBeVisible();

        // # Return to channel
        await MoreChannelsScreen.close();
    });

    it('MM-T3618 should display archived channels list', async () => {
        const {
            getChannelByDisplayName,
            hasChannelDisplayNameAtIndex,
            searchInput,
            showArchivedChannels,
            showPublicChannels,
        } = MoreChannelsScreen;
        const {channel: archivedChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'archived-channel', teamId: testTeam.id});
        const {channel: nonArchivedChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'non-archived-channel', teamId: testTeam.id});
        await Channel.apiAddUserToChannel(testUser.id, archivedChannel.id);

        // # Enable experimental view archived channels
        await System.apiUpdateConfig({TeamSettings: {ExperimentalViewArchivedChannels: true}});

        // # Archive channel
        await goToChannel(archivedChannel.display_name);
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.archiveChannel();

        // # Open more channels screen
        await openMainSidebar();
        await MoreChannelsScreen.open();

        // * Verify only non archived channels are displayed in public channels list
        await showPublicChannels();
        await hasChannelDisplayNameAtIndex(0, nonArchivedChannel.display_name);
        await expect(getChannelByDisplayName(archivedChannel.display_name)).not.toBeVisible();
        await searchInput.typeText(nonArchivedChannel.display_name);
        await hasChannelDisplayNameAtIndex(0, nonArchivedChannel.display_name);
        await expect(getChannelByDisplayName(archivedChannel.display_name)).not.toBeVisible();

        // * Verify only archived channels are displayed in archived channels list
        await searchInput.clearText();
        await showArchivedChannels();
        await hasChannelDisplayNameAtIndex(0, archivedChannel.display_name);
        await expect(getChannelByDisplayName(nonArchivedChannel.display_name)).not.toBeVisible();
        await searchInput.typeText(archivedChannel.display_name);
        await hasChannelDisplayNameAtIndex(0, archivedChannel.display_name);
        await expect(getChannelByDisplayName(nonArchivedChannel.display_name)).not.toBeVisible();

        // # Close more channels screen
        await MoreChannelsScreen.close();
    });
});
