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
    Team,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Teams', () => {
    let testTeam1;
    let testTeam1Channel;
    let testTeam2;
    let testTeam2Channel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit({teamOptions: {prefix: 'team-a'}});
        testTeam1 = team;

        const {channel} = await Channel.apiGetChannelByName(testTeam1.id, 'town-square');
        testTeam1Channel = channel;

        ({team: testTeam2} = await Team.apiCreateTeam({prefix: 'team-b'}));
        await Team.apiAddUserToTeam(user.id, testTeam2.id);

        ({channel: testTeam2Channel} = await Channel.apiGetChannelByName(testTeam2.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3249 should be able to switch between teams', async () => {
        const {
            channelNavBarTitle,
            closeTeamSidebar,
            openTeamSidebar,
        } = ChannelScreen;
        const {getTeamByDisplayName} = MainSidebar;

        // * Verify user is on team 1 channel
        await expect(channelNavBarTitle).toHaveText(testTeam1Channel.display_name);

        // * Verify team 1 in team sidebar
        await openTeamSidebar();
        await verifyTeamSidebar(testTeam1);

        // # Tap on team 1
        await getTeamByDisplayName(testTeam1.display_name).tap();

        // * Verify user is on team 1 channel
        await ChannelScreen.toBeVisible();
        await expect(channelNavBarTitle).toHaveText(testTeam1Channel.display_name);

        // # Tap on team 2
        await openTeamSidebar();
        await getTeamByDisplayName(testTeam2.display_name).tap();

        // * Verify user is on team 2 channel
        await ChannelScreen.toBeVisible();
        await expect(channelNavBarTitle).toHaveText(testTeam2Channel.display_name);

        // * Verify team 2 in team sidebar
        await openTeamSidebar();
        await verifyTeamSidebar(testTeam2);

        // # Close team sidebar
        await closeTeamSidebar();
    });
});

async function verifyTeamSidebar(testTeam) {
    const {
        teamItem,
        teamItemCurrent,
        teamItemDisplayName,
        teamItemIcon,
    } = await MainSidebar.getTeam(testTeam.id, testTeam.display_name);

    // * Verify team is current
    await expect(teamItem).toBeVisible();
    await expect(teamItemCurrent).toBeVisible();
    await expect(teamItemDisplayName).toBeVisible();
    await expect(teamItemIcon).toBeVisible();
}
