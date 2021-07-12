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
    MoreDirectMessagesScreen,
} from '@support/ui/screen';
import {getRandomId} from '@support/utils';

describe('Channels', () => {
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
        filteredChannelsList,
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

    beforeAll(async () => {
        const {user, channel, team} = await Setup.apiInit({channelOptions: {prefix: `channel-${searchTerm}`}});
        unreadChannel = channel;
        testMessage = `Mention @${user.username}`;
        await Post.apiCreatePost({
            channelId: unreadChannel.id,
            message: testMessage,
        });

        ({channel: favoriteChannel} = await Channel.apiCreateChannel({type: 'O', prefix: `4-favorite-${searchTerm}`, teamId: team.id}));
        await Channel.apiAddUserToChannel(user.id, favoriteChannel.id);
        await Preference.apiSaveFavoriteChannelPreference(user.id, favoriteChannel.id);

        ({channel: publicChannel} = await Channel.apiCreateChannel({type: 'O', prefix: `3-public-${searchTerm}`, teamId: team.id}));
        await Channel.apiAddUserToChannel(user.id, publicChannel.id);

        ({channel: privateChannel} = await Channel.apiCreateChannel({type: 'P', prefix: `2-private-${searchTerm}`, teamId: team.id}));
        await Channel.apiAddUserToChannel(user.id, privateChannel.id);

        ({channel: nonJoinedChannel} = await Channel.apiCreateChannel({type: 'O', prefix: `1-non-joined-${searchTerm}`, teamId: team.id}));

        ({user: dmOtherUser} = await User.apiCreateUser({prefix: `user-${searchTerm}-1`}));
        await Team.apiAddUserToTeam(dmOtherUser.id, team.id);
        ({channel: directMessageChannel} = await Channel.apiCreateDirectChannel([user.id, dmOtherUser.id]));
        await Post.apiCreatePost({
            channelId: directMessageChannel.id,
            message: testMessage,
        });

        ({user: nonDmOtherUser} = await User.apiCreateUser({prefix: `user-${searchTerm}-2`}));
        await Team.apiAddUserToTeam(nonDmOtherUser.id, team.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3184 should display unfiltered channels list', async () => {
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

    it('MM-T3186 should display filtered channels list and be able to change channels', async () => {
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
});
