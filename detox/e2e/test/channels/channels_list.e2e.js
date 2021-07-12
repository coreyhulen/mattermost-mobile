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
    Preference,
    Setup,
    Team,
    User,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {
    ChannelScreen,
    MoreChannelsScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';
import {getRandomId} from '@support/utils';

describe('Channels List', () => {
    const searchTerm = getRandomId();
    const {
        channelNavBarTitle,
        closeMainSidebar,
        goToChannel,
        openMainSidebar,
    } = ChannelScreen;
    const {
        getUserAtIndex,
        startButton,
    } = MoreDirectMessagesScreen;
    const {
        channelsList,
        channelsListUnreadIndicator,
        filteredChannelsList,
        getChannelDisplayNameAtIndex,
        getFilteredChannelByDisplayName,
        hasChannelDisplayNameAtIndex,
        hasFilteredChannelDisplayNameAtIndex,
        searchInput,
    } = MainSidebar;
    let testMessage;
    let unreadChannel;
    let favoriteChannel;
    let publicChannel;
    let privateChannel;
    let nonJoinedChannel;
    let directMessageChannel;
    let dmOtherUser;
    let nonDmOtherUser;
    let testTeam;
    let testUser;

    beforeAll(async () => {
        const {user, channel, team} = await Setup.apiInit({channelOptions: {prefix: `channel-${searchTerm}`}});
        testUser = user;
        unreadChannel = channel;
        testTeam = team;

        testMessage = `Mention @${user.username}`;
        await Post.apiCreatePost({
            channelId: unreadChannel.id,
            message: testMessage,
        });

        ({channel: favoriteChannel} = await Channel.apiCreateChannel({type: 'O', prefix: `4-favorite-${searchTerm}`, teamId: testTeam.id}));
        await Channel.apiAddUserToChannel(user.id, favoriteChannel.id);
        await Preference.apiSaveFavoriteChannelPreference(user.id, favoriteChannel.id);

        ({channel: publicChannel} = await Channel.apiCreateChannel({type: 'O', prefix: `3-public-${searchTerm}`, teamId: testTeam.id}));
        await Channel.apiAddUserToChannel(user.id, publicChannel.id);

        ({channel: privateChannel} = await Channel.apiCreateChannel({type: 'P', prefix: `2-private-${searchTerm}`, teamId: testTeam.id}));
        await Channel.apiAddUserToChannel(user.id, privateChannel.id);

        ({channel: nonJoinedChannel} = await Channel.apiCreateChannel({type: 'O', prefix: `1-non-joined-${searchTerm}`, teamId: testTeam.id}));

        ({user: dmOtherUser} = await User.apiCreateUser({prefix: `user-${searchTerm}-1`}));
        await Team.apiAddUserToTeam(dmOtherUser.id, testTeam.id);
        ({channel: directMessageChannel} = await Channel.apiCreateDirectChannel([user.id, dmOtherUser.id]));
        await Post.apiCreatePost({
            channelId: directMessageChannel.id,
            message: testMessage,
        });

        ({user: nonDmOtherUser} = await User.apiCreateUser({prefix: `user-${searchTerm}-2`}));
        await Team.apiAddUserToTeam(nonDmOtherUser.id, testTeam.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T844 should display unfiltered channels list', async () => {
        // # Open main sidebar
        await openMainSidebar();

        // * Verify order when all channels are unread
        await hasChannelDisplayNameAtIndex(0, privateChannel.display_name);
        await hasChannelDisplayNameAtIndex(1, publicChannel.display_name);
        await hasChannelDisplayNameAtIndex(2, favoriteChannel.display_name);
        await hasChannelDisplayNameAtIndex(3, unreadChannel.display_name);
        await hasChannelDisplayNameAtIndex(4, dmOtherUser.username);
        await hasChannelDisplayNameAtIndex(5, 'Off-Topic');
        await hasChannelDisplayNameAtIndex(6, 'Town Square');
        await expect(element(by.id(nonJoinedChannel.display_name))).not.toBeVisible();
        await expect(element(by.id(nonDmOtherUser.username))).not.toBeVisible();
        await closeMainSidebar();

        // # Visit private, public, and favorite channels
        await goToChannel(privateChannel.display_name);
        await goToChannel(publicChannel.display_name);
        await goToChannel(favoriteChannel.display_name);

        // # Open DM with the other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await MoreDirectMessagesScreen.searchInput.typeText(dmOtherUser.username);
        await getUserAtIndex(0).tap();
        await startButton.tap();

        // * Verify order when all channels are read except for unread channel
        await openMainSidebar();
        await hasChannelDisplayNameAtIndex(0, unreadChannel.display_name);
        await hasChannelDisplayNameAtIndex(1, favoriteChannel.display_name);
        await hasChannelDisplayNameAtIndex(2, publicChannel.display_name);
        await hasChannelDisplayNameAtIndex(3, 'Off-Topic');
        await hasChannelDisplayNameAtIndex(4, 'Town Square');
        await hasChannelDisplayNameAtIndex(5, privateChannel.display_name);
        await hasChannelDisplayNameAtIndex(6, dmOtherUser.username);
        await expect(element(by.id(nonJoinedChannel.display_name))).not.toBeVisible();
        await expect(element(by.id(nonDmOtherUser.username))).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });

    xit('MM-T847 should display filtered channels list and be able to change channels', async () => { // disable for now; need to fix username display
        // # Visit private, public, and favorite channels
        await goToChannel(privateChannel.display_name);
        await goToChannel(publicChannel.display_name);
        await goToChannel(favoriteChannel.display_name);

        // # Open DM with the other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await MoreDirectMessagesScreen.searchInput.typeText(dmOtherUser.username);
        await getUserAtIndex(0).tap();
        await startButton.tap();

        // # Open main sidebar
        await openMainSidebar();

        // # Enter search term
        await searchInput.typeText(searchTerm);
        await searchInput.tapBackspaceKey();

        // * Verify order when channels list is filtered
        await hasFilteredChannelDisplayNameAtIndex(0, unreadChannel.display_name);
        await hasFilteredChannelDisplayNameAtIndex(1, dmOtherUser.username);
        await hasFilteredChannelDisplayNameAtIndex(2, privateChannel.display_name);
        await hasFilteredChannelDisplayNameAtIndex(3, publicChannel.display_name);
        await hasFilteredChannelDisplayNameAtIndex(4, favoriteChannel.display_name);
        await hasFilteredChannelDisplayNameAtIndex(5, nonDmOtherUser.username);
        await filteredChannelsList.scrollTo('bottom');
        await hasFilteredChannelDisplayNameAtIndex(6, nonJoinedChannel.display_name);
        await expect(element(by.text('Off-Topic'))).not.toBeVisible();
        await expect(element(by.text('Town Square'))).not.toBeVisible();

        // # Tap a channel from filtered list
        await getFilteredChannelByDisplayName(unreadChannel.display_name).tap();

        // * Verify filtered channel opens
        await expect(channelNavBarTitle).toHaveText(unreadChannel.display_name);

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T848 should display deactivated user in filtered channels list', async () => {
        const {user: deactivatedUser} = await User.apiCreateUser({prefix: 'deactivated'});
        await Team.apiAddUserToTeam(deactivatedUser.id, testTeam.id);
        await User.apiDeactivateUser(deactivatedUser.id);

        // # Open main sidebar
        await openMainSidebar();

        // # Enter search term
        await searchInput.typeText(deactivatedUser.username);
        await searchInput.tapBackspaceKey();

        // * Verify deactivated user is displayed
        await hasFilteredChannelDisplayNameAtIndex(0, deactivatedUser.username);

        // # Tap on deactivated user
        await getFilteredChannelByDisplayName(deactivatedUser.username).tap();

        // * Verify deactivated user dm opens
        await expect(channelNavBarTitle).toHaveText(deactivatedUser.username);
        await expect(element(by.text('You are viewing an archived channel. New messages cannot be posted.'))).toBeVisible();
    });

    it('MM-T864 should be able to search for public channel to join', async () => {
        // # Open main sidebar
        await openMainSidebar();

        // * Verify public channel is searchable
        await MoreChannelsScreen.open();
        await MoreChannelsScreen.searchInput.typeText('a');
        await expect(MoreChannelsScreen.cancelButton).toBeVisible();
        await MoreChannelsScreen.searchInput.clearText();
        await MoreChannelsScreen.searchInput.typeText(nonJoinedChannel.display_name);
        await MoreChannelsScreen.hasChannelDisplayNameAtIndex(0, nonJoinedChannel.display_name);

        // # Join public channel
        await MoreChannelsScreen.getChannelByDisplayName(nonJoinedChannel.display_name).tap();

        // * Verify redirected to public channel
        await expect(channelNavBarTitle).toHaveText(nonJoinedChannel.display_name);
    });

    it('MM-T889 should display more unreads indicator when unreads are off-screen in channels list', async () => {
        // # Create 10 unread channels
        [...Array(10).keys()].forEach(async (key) => {
            const {channel} = await Channel.apiCreateChannel({type: 'O', prefix: `a-unread-channel-${key}`, teamId: testTeam.id});
            await Channel.apiAddUserToChannel(testUser.id, channel.id);
        });

        // # Open main sidebar (with at least one unread channel)
        await openMainSidebar();

        // # Scroll to bottom
        await channelsList.scroll(500, 'down');

        // * Verify more unreads indicator is displayed
        await expect(channelsListUnreadIndicator).toBeVisible();

        // # Tap on unread channels indicator
        await channelsListUnreadIndicator.tap();

        // * Verify tapping on top unread channel redirects to channels screen
        await getChannelDisplayNameAtIndex(0).tap();
        await ChannelScreen.toBeVisible();
    });

    xit('MM-T2507 should be able to jump to direct message channel by username, first name, last name, nickname', async () => { // related issue https://mattermost.atlassian.net/browse/MM-30342
        const {user: userOnTeam} = await User.apiCreateUser();
        await Team.apiAddUserToTeam(userOnTeam.id, testTeam.id);

        // # Open main sidebar
        await openMainSidebar();

        // # Enter username search term
        await searchInput.typeText(userOnTeam.username);
        await searchInput.tapBackspaceKey();

        // * Verify user on team is displayed
        await hasFilteredChannelDisplayNameAtIndex(0, userOnTeam.username);

        // # Enter first name search term
        await searchInput.clearText();
        await searchInput.typeText(userOnTeam.first_name);
        await searchInput.tapBackspaceKey();

        // * Verify user on team is displayed
        await hasFilteredChannelDisplayNameAtIndex(0, userOnTeam.username);

        // # Enter last name search term
        await searchInput.clearText();
        await searchInput.typeText(userOnTeam.last_name);
        await searchInput.tapBackspaceKey();

        // * Verify user on team is displayed
        await hasFilteredChannelDisplayNameAtIndex(0, userOnTeam.username);

        // # Enter nickname search term
        await searchInput.clearText();
        await searchInput.typeText(userOnTeam.nickname);
        await searchInput.tapBackspaceKey();

        // * Verify user on team is displayed
        await hasFilteredChannelDisplayNameAtIndex(0, userOnTeam.username);

        // # Go back to channel
        await closeMainSidebar();
    });

    it('MM-T2511 should not be able to jump to private channel to join and channel outside of team', async () => {
        const {channel: nonJoinedPrivateChannel} = await Channel.apiCreateChannel({type: 'P', prefix: 'non-joined-private', teamId: testTeam.id});
        const {team: outsideTeam} = await Team.apiCreateTeam();
        const {channel: outsideTeamPublicChannel} = await Channel.apiCreateChannel({type: 'O', prefix: 'outside-team-public', teamId: outsideTeam.id});

        // # Open main sidebar
        await openMainSidebar();

        // # Enter joined private channel search term
        await searchInput.typeText(privateChannel.display_name);
        await searchInput.tapBackspaceKey();

        // * Verify joined private channel is displayed
        await expect(element(by.text(privateChannel.display_name))).toBeVisible();

        // # Enter non-joined private channel search term
        await searchInput.clearText();
        await searchInput.typeText(nonJoinedPrivateChannel.display_name);
        await searchInput.tapBackspaceKey();

        // * Verify non-joined private channel is not displayed
        await expect(element(by.text(nonJoinedPrivateChannel.display_name))).not.toBeVisible();

        // # Enter outside team public channel search term
        await searchInput.clearText();
        await searchInput.typeText(outsideTeamPublicChannel.display_name);
        await searchInput.tapBackspaceKey();

        // * Verify outside team public channel is not displayed
        await expect(element(by.text(outsideTeamPublicChannel.display_name))).not.toBeVisible();

        // # Go back to channel
        await closeMainSidebar();
    });
});
