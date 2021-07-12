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
    Team,
    User,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Mention Badges', () => {
    let testChannel1;
    let testChannel2;
    let testTeam1;
    let testTeam2;
    let testUser1;
    let testUser2;

    beforeAll(async () => {
        ({user: testUser1} = await User.apiCreateUser());
        ({team: testTeam1} = await Team.apiCreateTeam({prefix: 'team-a'}));
        ({channel: testChannel1} = await Channel.apiGetChannelByName(testTeam1.id, 'town-square'));

        ({user: testUser2} = await User.apiCreateUser());
        ({team: testTeam2} = await Team.apiCreateTeam({prefix: 'team-b'}));
        ({channel: testChannel2} = await Channel.apiGetChannelByName(testTeam2.id, 'town-square'));

        await Team.apiAddUserToTeam(testUser1.id, testTeam1.id);
        await Team.apiAddUserToTeam(testUser1.id, testTeam2.id);
        await Team.apiAddUserToTeam(testUser2.id, testTeam1.id);
        await Team.apiAddUserToTeam(testUser2.id, testTeam2.id);

        // # Open channel screen
        await ChannelScreen.open(testUser1);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3255 should display mention badges after an at-mention', async () => {
        const {
            channelNavBarTitle,
            mainSidebarDrawerButtonBadgeUnreadCount,
            closeMainSidebar,
            openTeamSidebar,
        } = ChannelScreen;
        const {
            closeTeamSidebar,
            switchTeamsButtonBadgeUnreadCount,
        } = MainSidebar;

        // * Verify team 1 main sidebar drawer button badge does not exist
        await expect(mainSidebarDrawerButtonBadgeUnreadCount).not.toExist();

        // # Post an at-mention message to user 1 by user 2
        const testMessage = `Mention @${testUser1.username}`;
        await User.apiLogin(testUser2);
        await Post.apiCreatePost({
            channelId: testChannel2.id,
            message: testMessage,
        });

        // * Verify team 1 main sidebar drawer button badge count is 1
        await expect(channelNavBarTitle).toHaveText(testChannel1.display_name);
        await expect(mainSidebarDrawerButtonBadgeUnreadCount).toHaveText('1');

        // * Verify team 2 item badge count is 1
        await openTeamSidebar();
        const {teamItemBadgeUnreadCount: team2ItemBadgeUnreadCount} = await MainSidebar.getTeam(testTeam2.id);
        await expect(team2ItemBadgeUnreadCount).toHaveText('1');

        // * Verify team 1 item badge count does not exist
        const {teamItemBadgeUnreadCount: team1ItemBadgeUnreadCount} = await MainSidebar.getTeam(testTeam1.id);
        await expect(team1ItemBadgeUnreadCount).not.toExist();

        // * Verify switch teams sidebar button badge count is 1
        await closeTeamSidebar();
        await expect(switchTeamsButtonBadgeUnreadCount).toHaveText('1');

        // # Close main sidebar
        await closeMainSidebar();
    });
});
