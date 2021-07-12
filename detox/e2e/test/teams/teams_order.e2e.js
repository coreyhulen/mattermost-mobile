// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Preference,
    Setup,
    Team,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Teams Order', () => {
    let testUser;
    let testTeam1;
    let testTeam2;
    let testTeam3;
    let testTeam4;
    let testTeam5;
    let testTeam6;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit({teamOptions: {prefix: 'team-a'}});
        testUser = user;
        testTeam1 = team;

        ({team: testTeam2} = await Team.apiCreateTeam({prefix: 'team-b'}));
        await Team.apiAddUserToTeam(user.id, testTeam2.id);

        ({team: testTeam3} = await Team.apiCreateTeam({prefix: 'team-c'}));
        await Team.apiAddUserToTeam(user.id, testTeam3.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3646 should follow teams order preference', async () => {
        const {
            closeTeamSidebar,
            openTeamSidebar,
        } = ChannelScreen;
        const {hasTeamDisplayNameAtIndex} = MainSidebar;

        // * Verify initial teams order
        await openTeamSidebar();
        await hasTeamDisplayNameAtIndex(0, testTeam1.display_name);
        await hasTeamDisplayNameAtIndex(1, testTeam2.display_name);
        await hasTeamDisplayNameAtIndex(2, testTeam3.display_name);

        // # Re-arrange teams order via API
        await Preference.apiSaveTeamsOrderPreference(testUser.id, [testTeam3.id, testTeam1.id, testTeam2.id]);
        await closeTeamSidebar();

        // * Verify updated teams order
        await openTeamSidebar();
        await hasTeamDisplayNameAtIndex(0, testTeam3.display_name);
        await hasTeamDisplayNameAtIndex(1, testTeam1.display_name);
        await hasTeamDisplayNameAtIndex(2, testTeam2.display_name);

        // # Add 3 more teams in descending order via API
        ({team: testTeam4} = await Team.apiCreateTeam({prefix: 'team-f'}));
        await Team.apiAddUserToTeam(testUser.id, testTeam4.id);
        ({team: testTeam5} = await Team.apiCreateTeam({prefix: 'team-e'}));
        await Team.apiAddUserToTeam(testUser.id, testTeam5.id);
        ({team: testTeam6} = await Team.apiCreateTeam({prefix: 'team-d'}));
        await Team.apiAddUserToTeam(testUser.id, testTeam6.id);
        await device.reloadReactNative();

        // * Verify additional teams order is ascending
        await openTeamSidebar();
        await hasTeamDisplayNameAtIndex(3, testTeam6.display_name);
        await hasTeamDisplayNameAtIndex(4, testTeam5.display_name);
        await hasTeamDisplayNameAtIndex(5, testTeam4.display_name);

        // # Close team sidebar
        await closeTeamSidebar();
    });
});
