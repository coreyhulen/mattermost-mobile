// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import ldapUsers from '@support/fixtures/ldap_users.json';
import {Ldap, Setup, System, Team, User} from '@support/server_api';
import {ChannelScreen, LoginScreen} from '@support/ui/screen';

describe('Smoke Tests', () => {
    const testOne = ldapUsers['test-1'];

    beforeAll(async () => {
        // * Verify that the server has license with LDAP feature
        await System.apiRequireLicenseForFeature('LDAP');

        // # Enable LDAP
        await System.apiUpdateConfig({LdapSettings: {Enable: true}});

        // * Check that LDAP server can connect and is synchronized with Mattermost server
        await Ldap.apiRequireLDAPServer();

        // # Ensure user has team
        await ensureUserHasTeam(testOne);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3180 Log in - LDAP', async () => {
        // # Navigate to Login screen
        const loginScreen = await LoginScreen.open();

        const {usernameInput, passwordInput, signinButton} = LoginScreen;

        // # Type in username
        await usernameInput.replaceText(testOne.username);

        // # Tap anywhere to hide keyboard
        await loginScreen.tap({x: 5, y: 10});

        // # Type in password
        await passwordInput.replaceText(testOne.password);

        // # Tap anywhere to hide keyboard
        await loginScreen.tap({x: 5, y: 10});

        // # Tap "Sign in" button
        await signinButton.tap();

        // * Verify that the user has successfully logged in by checking it redirects into the Channel screen
        await ChannelScreen.toBeVisible();
    });
});

async function ensureUserHasTeam(ldapUser) {
    // # Login as LDAP user to sync with the server
    await User.apiLogin(ldapUser);

    // # Login as sysadmin and ensure LDAP user is member of at least one team
    await User.apiAdminLogin();
    const {user} = await User.apiGetUserByUsername(ldapUser.username);
    const {teams} = await Team.apiGetTeamsForUser(user.id);

    if (!teams?.length) {
        const {team} = await Setup.apiInit();
        await Team.apiAddUserToTeam(user.id, team.id);
    }
}
