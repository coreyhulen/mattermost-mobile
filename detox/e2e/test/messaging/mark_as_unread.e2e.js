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
    MainSidebar,
    PostOptions,
} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Mark as Unread', () => {
    const {
        closeMainSidebar,
        getNewMessagesDivider,
        goToChannel,
        mainSidebarDrawerButtonBadgeUnreadIndicator,
        openMainSidebar,
        openTeamSidebar,
        openPostOptionsFor,
        postMessage,
    } = ChannelScreen;
    const {
        getTeamByDisplayName,
        hasChannelDisplayNameAtIndex,
        switchTeamsButtonBadgeUnreadIndicator,
    } = MainSidebar;
    let testChannel;
    let townSquareChannel;
    let testTeam1;
    let testTeam2;
    let testUser;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit({teamOptions: {prefix: 'team-a'}});
        testChannel = channel;
        testTeam1 = team;
        testUser = user;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(testTeam1.id, 'town-square'));

        ({team: testTeam2} = await Team.apiCreateTeam({prefix: 'team-b'}));
        await Team.apiAddUserToTeam(testUser.id, testTeam2.id);

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T245 should be able to mark a post as unread', async () => {
        // # Switch channels
        await goToChannel(testChannel.display_name);
        await goToChannel(townSquareChannel.display_name);

        // # Post a message
        const message = Date.now().toString();
        await postMessage(message);

        // # Mark post as unread
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openPostOptionsFor(post.id, message);
        await PostOptions.markUnreadAction.tap();

        // * Verify new messages divider is visible
        await expect(getNewMessagesDivider()).toBeVisible();

        // * Verify drawer button badge unread indicator
        await expect(mainSidebarDrawerButtonBadgeUnreadIndicator).toExist();

        // * Verify team item badge unread indicator
        await openTeamSidebar();
        const {teamItemBadgeUnreadIndicator} = await MainSidebar.getTeam(testTeam1.id);
        await expect(teamItemBadgeUnreadIndicator).toExist();

        // # Switch teams
        await getTeamByDisplayName(testTeam2.display_name).tap();

        // * Verify switch teams button badge unread indicator
        await openMainSidebar();
        await expect(switchTeamsButtonBadgeUnreadIndicator).toExist();

        // # Go back to channel
        await closeMainSidebar();
    });

    it('MM-T258 should maintain unread state on app reopen', async () => {
        // # Go to team 1 test channel
        await openTeamSidebar();
        await getTeamByDisplayName(testTeam1.display_name).tap();
        await goToChannel(testChannel.display_name);

        // # Post a message
        const message = Date.now().toString();
        await postMessage(message);

        // # Mark post as unread and switch channels
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openPostOptionsFor(post.id, message);
        await PostOptions.markUnreadAction.tap();
        await goToChannel(townSquareChannel.display_name);

        // * Verify channel has unread message
        await openMainSidebar();
        await expect(element(by.text('UNREADS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, testChannel.display_name);

        // # Send app to home and relaunch
        await closeMainSidebar();
        await device.sendToHome();
        await device.launchApp({newInstance: false});

        // * Verify unread state is maintained
        await openMainSidebar();
        await expect(element(by.text('UNREADS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, testChannel.display_name);

        // # Go back to channel
        await closeMainSidebar();
    });

    it('MM-T245 should be able to mark a DM post as unread', async () => {
        const {user: dmOtherUser} = await User.apiCreateUser();
        await Team.apiAddUserToTeam(dmOtherUser.id, testTeam1.id);
        const {channel: directMessageChannel} = await Channel.apiCreateDirectChannel([testUser.id, dmOtherUser.id]);

        // # Post DM from other user
        const message = Date.now().toString();
        await User.apiLogin(dmOtherUser);
        const {post} = await Post.apiCreatePost({
            channelId: directMessageChannel.id,
            message,
        });

        // # Switch channels
        await goToChannel(testChannel.display_name);
        await goToChannel(dmOtherUser.username);

        // # Mark DM post as unread
        await openPostOptionsFor(post.id, message);
        await PostOptions.markUnreadAction.tap();

        // * Verify new messages divider is visible
        await expect(getNewMessagesDivider()).toBeVisible();

        // * Verify channel has unread message
        await openMainSidebar();
        await expect(element(by.text('UNREADS'))).toBeVisible();
        await hasChannelDisplayNameAtIndex(0, dmOtherUser.username);

        // # Go back to channel
        await closeMainSidebar();
    });
});
