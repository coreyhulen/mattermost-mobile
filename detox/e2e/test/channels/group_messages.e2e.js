// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Setup,
    Team,
    User,
} from '@support/server_api';
import {
    ChannelScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';

describe('Group Messages', () => {
    const {openMainSidebar} = ChannelScreen;
    const {
        closeMoreDirectMessagesButton,
        getSelectedUser,
        getUserAtIndex,
        searchInput,
        startButton,
    } = MoreDirectMessagesScreen;
    const testOtherUsers = new Map();

    beforeAll(async () => {
        const {user, team} = await Setup.apiInit();

        [...Array(8).keys()].forEach(async (key) => {
            const {user: testOtherUser} = await User.apiCreateUser({prefix: `user-${key}-`});
            await Team.apiAddUserToTeam(testOtherUser.id, team.id);
            testOtherUsers.set(`user-${key}`, testOtherUser);
        });

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T462 should be able to add and remove users while creating new GM', async () => {
        const testOtherUser1 = testOtherUsers.get('user-0');
        const testOtherUser2 = testOtherUsers.get('user-1');
        const testOtherUser3 = testOtherUsers.get('user-2');
        const testOtherUser4 = testOtherUsers.get('user-3');

        // # Add 4 users
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testOtherUser1.username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUser2.username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUser3.username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUser4.username);
        await getUserAtIndex(0).tap();

        // * Verify 4 users are added
        const {selectedUserRemoveButton: selectedUserRemoveButton1} = getSelectedUser(testOtherUser1.id);
        await expect(selectedUserRemoveButton1).toBeVisible();
        const {selectedUserRemoveButton: selectedUserRemoveButton2} = getSelectedUser(testOtherUser2.id);
        await expect(selectedUserRemoveButton2).toBeVisible();
        const {selectedUserRemoveButton: selectedUserRemoveButton3} = getSelectedUser(testOtherUser3.id);
        await expect(selectedUserRemoveButton3).toBeVisible();
        const {selectedUserRemoveButton: selectedUserRemoveButton4} = getSelectedUser(testOtherUser4.id);
        await expect(selectedUserRemoveButton4).toBeVisible();

        // # Remove 2 users
        await selectedUserRemoveButton1.tap();
        await selectedUserRemoveButton3.tap();

        // * Verify 2 users are removed
        await expect(selectedUserRemoveButton1).not.toBeVisible();
        await expect(selectedUserRemoveButton3).not.toBeVisible();
        await expect(selectedUserRemoveButton2).toBeVisible();
        await expect(selectedUserRemoveButton4).toBeVisible();

        // # Go back to channel
        await closeMoreDirectMessagesButton.tap();
    });

    it('MM-T464 should not be able to add users more than max', async () => {
        // # Add 7 users
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testOtherUsers.get('user-0').username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUsers.get('user-1').username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUsers.get('user-2').username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUsers.get('user-3').username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUsers.get('user-4').username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUsers.get('user-5').username);
        await getUserAtIndex(0).tap();
        await searchInput.clearText();
        await searchInput.typeText(testOtherUsers.get('user-6').username);
        await getUserAtIndex(0).tap();

        // * Verify message that you cannot more users
        await expect(element(by.text('You cannot add more users'))).toBeVisible();

        // # Attempt to add one more user
        await searchInput.clearText();
        await searchInput.typeText(testOtherUsers.get('user-7').username);
        await getUserAtIndex(0).tap();

        // * Verify last user is not added
        const {selectedUser: lastUser} = getSelectedUser(testOtherUsers.get('user-7').id);
        await expect(lastUser).not.toBeVisible();

        // # Start a GM
        await startButton.tap();

        // * Verify on GM screen
        await ChannelScreen.toBeVisible();
        const expectedUsernames = Array.from(testOtherUsers, ([, v]) => (v.username)).sort();
        expectedUsernames.pop();
        expectedUsernames.forEach(async (username) => {
            await expect(element(by.text(username))).toBeVisible();
        });
    });
});
