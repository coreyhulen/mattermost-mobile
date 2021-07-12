// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import jestExpect from 'expect';

import {
    Channel,
    Post,
    Setup,
    Status,
    System,
    Team,
    User,
} from '@support/server_api';
import {
    ChannelScreen,
    GeneralSettingsScreen,
    NotificationSettingsEmailScreen,
    NotificationSettingsScreen,
} from '@support/ui/screen';
import {
    capitalize,
    getRecentEmail,
    isAndroid,
    splitEmailBodyText,
} from '@support/utils';

describe('Email Notifications', () => {
    let testUser;
    let testOtherUser1;
    let testOtherUser2;
    let testTeam;
    let testChannel;
    let testConfig;

    beforeAll(async () => {
        await System.apiRequireSMTPServer();

        const {team, user} = await Setup.apiInit();
        testUser = user;
        testTeam = team;

        await Status.apiUpdateUserStatus(testUser.id, 'offline');

        const {channel} = await Channel.apiGetChannelByName(team.id, 'town-square');
        testChannel = channel;

        ({user: testOtherUser1} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser1.id, testTeam.id);

        ({user: testOtherUser2} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser2.id, testTeam.id);

        ({config: testConfig} = await System.apiUpdateConfig({EmailSettings: {SendEmailNotifications: true}}));

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3256_1 should be able to change email notification setting to immediately', async () => {
        // # Set global notifications to immediately
        await setEmailNotificationsTo('immediately');

        // * Verify email notifications is set to immediately
        await openEmailNotificationsSettings();
        await verifyEmailNotificationsIsSetTo('immediately');
        await navigateBackToChannel();

        // # Post an at-mention message to mentioned user by other user
        const testMessage = `Mention @${testUser.username} by ${testOtherUser1.username}`;
        await User.apiLogin(testOtherUser1);
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: testMessage,
        });

        // * Verify mentioned user receives email notification
        const response = await getRecentEmail(testUser.username);
        verifyEmailNotification(
            response,
            testConfig.TeamSettings.SiteName,
            testTeam.display_name,
            testChannel.display_name,
            testUser,
            testOtherUser1,
            testMessage,
            testConfig.EmailSettings.FeedbackEmail,
            testConfig.SupportSettings.SupportEmail);
    });

    it('MM-T3256_2 should be able to change email notification setting to never', async () => {
        // # Set global notifications to never
        await setEmailNotificationsTo('never');

        // * Verify email notifications is set to never
        await openEmailNotificationsSettings();
        await verifyEmailNotificationsIsSetTo('never');
        await navigateBackToChannel();

        // # Post an at-mention message to mentioned user by other user
        const testMessage = `Mention @${testUser.username} by ${testOtherUser2.username}`;
        await User.apiLogin(testOtherUser2);
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: testMessage,
        });

        // * Verify mentioned user does not receive email notification
        const {data} = await getRecentEmail(testUser.username);
        const bodyText = splitEmailBodyText(data.body.text);
        jestExpect(bodyText[7]).not.toEqual(testMessage);
    });
});

async function openEmailNotificationsSettings() {
    // # Open notifications settings email screen
    await ChannelScreen.openSettingsSidebar();
    await GeneralSettingsScreen.open();
    await NotificationSettingsScreen.open();
    await NotificationSettingsEmailScreen.open();
}

async function navigateBackToChannel() {
    // # Navigate back to channel screen
    await NotificationSettingsEmailScreen.toBeVisible();
    await NotificationSettingsEmailScreen.back();
    await NotificationSettingsScreen.back();
    await GeneralSettingsScreen.close();
}

async function setEmailNotificationsTo(sendKey) {
    const {
        getSendActionFor,
        sendAction,
        sendModal,
        sendModalSaveButton,
    } = NotificationSettingsEmailScreen;

    // # Open email notifications settings
    await openEmailNotificationsSettings();

    // # Tap on Send email notifications option if Android
    if (isAndroid()) {
        await sendAction.tap();
        await expect(sendModal).toBeVisible();
    }

    // # Tap on send activity option
    await getSendActionFor(sendKey).tap();

    // # Tap on Save button if Android
    if (isAndroid()) {
        await sendModalSaveButton.tap();
    }

    // # Navigate back to channel
    await navigateBackToChannel();
}

async function verifyEmailNotificationsIsSetTo(sendKey) {
    const {
        immediatelyActionSelected,
        neverActionSelected,
        sendActionDescription,
    } = NotificationSettingsEmailScreen;

    if (isAndroid()) {
        await expect(sendActionDescription).toHaveText(capitalize(sendKey));
    } else {
        switch (sendKey) {
        case 'immediately':
            await expect(immediatelyActionSelected).toBeVisible();
            await expect(neverActionSelected).not.toBeVisible();
            break;
        case 'never':
            await expect(neverActionSelected).toBeVisible();
            await expect(immediatelyActionSelected).not.toBeVisible();
            break;
        default:
            throw new Error('Not a valid send option: ' + sendKey);
        }
    }
}

function verifyEmailNotification(response, siteName, teamDisplayName, channelDisplayName, mentionedUser, byUser, message, feedbackEmail, supportEmail) {
    const isoDate = new Date().toISOString().substring(0, 10);
    const {data, status} = response;

    // * Should return success status
    jestExpect(status).toEqual(200);

    // * Verify that email is addressed to mentionedUser
    jestExpect(data.to.length).toEqual(1);
    jestExpect(data.to[0]).toContain(mentionedUser.email);

    // * Verify that email is from default feedback email
    jestExpect(data.from).toContain(feedbackEmail);

    // * Verify that date is current
    jestExpect(data.date).toContain(isoDate);

    // * Verify that the email subject is correct
    jestExpect(data.subject).toContain(`[${siteName}] Notification in ${teamDisplayName}`);

    // * Verify that the email body is correct
    const bodyText = splitEmailBodyText(data.body.text);
    jestExpect(bodyText.length).toEqual(16);
    jestExpect(bodyText[1]).toEqual('You have a new notification.');
    jestExpect(bodyText[4]).toEqual(`Channel: ${channelDisplayName}`);
    jestExpect(bodyText[5]).toContain(`@${byUser.username}`);
    jestExpect(bodyText[7]).toEqual(message);
    jestExpect(bodyText[9]).toContain('Go To Post');
    jestExpect(bodyText[11]).toEqual(`Any questions at all, mail us any time: ${supportEmail}`);
    jestExpect(bodyText[12]).toEqual('Best wishes,');
    jestExpect(bodyText[13]).toEqual(`The ${siteName} Team`);
    jestExpect(bodyText[15]).toEqual('To change your notification preferences, log in to your team site and go to Account Settings > Notifications.');
}
