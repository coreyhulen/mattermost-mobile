// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Team,
    User,
} from '@support/server_api';
import {
    ChannelScreen,
    LoginScreen,
    SelectTeamScreen,
} from '@support/ui/screen';

describe('Select Team', () => {
    const {getTeamByDisplayName} = SelectTeamScreen;
    let testTeam;

    beforeAll(async () => {
        await Team.apiPatchTeams({allow_open_invite: false});
        const {user} = await User.apiCreateUser();
        const {team} = await Team.apiCreateTeam();
        testTeam = team;
        await Team.apiPatchTeam(testTeam.id, {allow_open_invite: true});

        // # Login
        await LoginScreen.open();
        await LoginScreen.login(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
        await Team.apiPatchTeams({allow_open_invite: true});
    });

    it('MM-T3274 user with no teams should be able to select a team', async () => {
        // * Verify select team screen is displayed
        await SelectTeamScreen.toBeVisible();

        // # Tap on team to join
        await waitFor(getTeamByDisplayName(testTeam.display_name)).toBeVisible().whileElement(by.id(SelectTeamScreen.testID.teamsList)).scroll(500, 'down');
        const team = await getTeamByDisplayName(testTeam.display_name);
        await team.tap();

        // * Verify redirect to default channel of joined team
        const {channel} = await Channel.apiGetChannelByName(testTeam.id, 'town-square');
        await ChannelScreen.toBeVisible();
        await expect(ChannelScreen.channelNavBarTitle).toHaveText(channel.display_name);
    });
});
