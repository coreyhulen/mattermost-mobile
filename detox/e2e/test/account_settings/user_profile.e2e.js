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
} from '@support/server_api';
import {
    ChannelScreen,
    EditProfileScreen,
    UserProfileScreen,
} from '@support/ui/screen';

describe('User Profile', () => {
    let testUser;
    let townSquareChannel;

    beforeAll(async () => {
        // # Enable experimental timezone
        System.apiUpdateConfig({DisplaySettings: {ExperimentalTimezone: true}});

        const {team, user} = await Setup.apiInit();
        testUser = user;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T2350 should be able to view profile', async () => {
        const {
            firstNameValue,
            getProfilePicture,
            lastNameValue,
            localTimeValue,
            nicknameValue,
            positionValue,
            sendMessageAction,
            userProfileDisplayName,
            userProfileScrollView,
            userProfileUsername,
        } = UserProfileScreen;

        // # Open user profile screen
        await ChannelScreen.openSettingsSidebar();
        await UserProfileScreen.open();

        // * Verify user profile details
        await expect(getProfilePicture(testUser.id)).toBeVisible();
        await expect(userProfileDisplayName).toHaveText(testUser.username);
        await expect(userProfileUsername).toHaveText(`@${testUser.username}`);
        await expect(firstNameValue).toHaveText(testUser.first_name);
        await expect(lastNameValue).toHaveText(testUser.last_name);
        await expect(nicknameValue).toHaveText(testUser.nickname);
        await expect(positionValue).toHaveText(testUser.position);
        await userProfileScrollView.scrollTo('bottom');
        await expect(localTimeValue).toBeVisible();
        await expect(sendMessageAction).toBeVisible();

        // # Go back to channel
        await UserProfileScreen.close();
    });

    it('MM-T3151_1 should be able to view first name and last name when ShowFullName is enabled', async () => {
        const {
            firstNameValue,
            lastNameValue,
        } = UserProfileScreen;

        // # Enable show full name
        System.apiUpdateConfig({PrivacySettings: {ShowFullName: true}});

        // # Open user profile screen
        await ChannelScreen.openSettingsSidebar();
        await UserProfileScreen.open();

        await expect(firstNameValue).toBeVisible();
        await expect(lastNameValue).toBeVisible();

        // # Go back to channel
        await UserProfileScreen.close();
    });

    it('MM-T3151_2 should not be able to view first name and last name when ShowFullName is disabled', async () => {
        const {
            firstNameValue,
            lastNameValue,
        } = UserProfileScreen;

        // # Enable show full name
        System.apiUpdateConfig({PrivacySettings: {ShowFullName: false}});

        // # Open user profile screen
        await ChannelScreen.openSettingsSidebar();
        await UserProfileScreen.open();

        await expect(firstNameValue).not.toBeVisible();
        await expect(lastNameValue).not.toBeVisible();

        // # Go back to channel
        await UserProfileScreen.close();
    });

    it('MM-T287 should be able to edit profile from own profile pop-over', async () => {
        const {
            saveButton,
            usernameInput,
        } = EditProfileScreen;
        const {
            postMessage,
            getPostListPostItem,
        } = ChannelScreen;

        // # Post message
        const message = Date.now().toString();
        await postMessage(message);

        // # Open edit profile screen from channel
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItemProfilePicture} = await getPostListPostItem(post.id, message, {userId: testUser.id});
        await postListPostItemProfilePicture.tap();
        await UserProfileScreen.toBeVisible();
        await EditProfileScreen.open();

        // # Update username
        const updatedUsername = `${testUser.username}-123`;
        await usernameInput.clearText();
        await usernameInput.typeText(updatedUsername);
        await saveButton.tap();

        // * Verify username is updated
        await UserProfileScreen.toBeVisible();
        await expect(UserProfileScreen.userProfileUsername).toHaveText(`@${updatedUsername}`);

        // # Go back to channel
        await UserProfileScreen.close();
    });

    it('MM-T290 should display error on invalid username', async () => {
        const {
            editProfileError,
            saveButton,
            usernameInput,
        } = EditProfileScreen;

        // # Open edit profile screen
        await ChannelScreen.openSettingsSidebar();
        await UserProfileScreen.open();
        await EditProfileScreen.open();

        // # Attempt to save with invalid username
        const invalidUsername = `${testUser.username}+new`;
        await usernameInput.clearText();
        await usernameInput.typeText(invalidUsername);
        await saveButton.tap();

        // * Verify invalid username error is displayed
        await expect(editProfileError).toHaveText('Username must begin with a letter, and contain between 3 to 22 lowercase characters made up of numbers, letters, and the symbols ".", "-", and "_".');

        // # Go back to channel
        await EditProfileScreen.back();
        await UserProfileScreen.close();
    });

    it('MM-T3472 should be able add nickname to profile', async () => {
        const {
            editProfileScrollView,
            nicknameInput,
            saveButton,
        } = EditProfileScreen;

        // # Open edit profile screen
        await ChannelScreen.openSettingsSidebar();
        await UserProfileScreen.open();
        await EditProfileScreen.open();

        // # Add nickname
        const nickname = Date.now().toString();
        await editProfileScrollView.scrollTo('bottom');
        await nicknameInput.clearText();
        await nicknameInput.typeText(nickname);
        await saveButton.tap();

        // * Verify nickname is added
        await UserProfileScreen.toBeVisible();
        await expect(UserProfileScreen.nicknameValue).toHaveText(nickname);

        // # Go back to channel
        await UserProfileScreen.close();
    });
});
