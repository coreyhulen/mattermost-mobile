// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    Setup,
    System,
    Post,
    Channel,
} from '@support/server_api';
import {SettingsSidebar} from '@support/ui/component';
import {
    AddReactionScreen,
    ChannelInfoScreen,
    ChannelScreen,
    CustomStatusScreen,
    MoreDirectMessagesScreen,
    ThreadScreen,
    UserProfileScreen,
} from '@support/ui/screen';

describe('Custom status', () => {
    const {
        closeMainSidebar,
        closeSettingsSidebar,
        openMainSidebar,
        openSettingsSidebar,
    } = ChannelScreen;
    const {
        getCustomStatusSelectedEmoji,
        getCustomStatusSuggestion,
        getSuggestionClearButton,
        tapSuggestion,
    } = CustomStatusScreen;
    const defaultCustomStatuses = ['In a meeting', 'Out for lunch', 'Out sick', 'Working from home', 'On a vacation'];
    const defaultStatus = {
        emoji: 'calendar',
        text: 'In a meeting',
    };
    const customStatus = {
        emoji: '😀',
        emojiName: 'grinning',
        text: 'Watering plants',
    };
    let testChannel;
    let testUser;

    beforeAll(async () => {
        await System.apiUpdateConfig({TeamSettings: {EnableCustomUserStatuses: true}});
    });

    beforeEach(async () => {
        const {team, user} = await Setup.apiInit();
        const {channel} = await Channel.apiGetChannelByName(team.id, 'town-square');
        testChannel = channel;
        testUser = user;

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterEach(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3890 Setting a custom status', async () => {
        // # Open custom status screen
        await openSettingsSidebar();
        await CustomStatusScreen.open();

        // * Check if all the default suggestions are visible
        const isSuggestionPresentPromiseArray = [];
        defaultCustomStatuses.map(async (text) => {
            isSuggestionPresentPromiseArray.push(expect(getCustomStatusSuggestion(text)).toBeVisible());
        });
        await Promise.all(isSuggestionPresentPromiseArray);

        // * Tap a suggestion and check if it is selected
        await tapSuggestion(defaultStatus);

        // * Tap again and check if it is selected again
        await tapSuggestion(defaultStatus);

        // # Tap on Done button and check if the modal closes
        await CustomStatusScreen.close();

        // * Check if the selected emoji and text are visible in the sidebar
        await openSettingsSidebar();
        await expect(element(by.text(defaultStatus.text))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${defaultStatus.emoji}`))).toBeVisible();

        // # Click on the Set a custom status option and check if the modal opens
        await CustomStatusScreen.open();
        await CustomStatusScreen.close();

        // # Close settings sidebar
        await closeSettingsSidebar();
    });

    it('MM-T3891 Setting your own custom status', async () => {
        // # Open custom status modal and close it after setting the status
        await openCustomStatusModalAndSetStatus(customStatus);
        await openSettingsSidebar();

        // * Check if the selected emoji and text are visible in the sideba
        await expect(element(by.text(customStatus.text).withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${customStatus.emojiName}`))).toBeVisible();

        // # Tap on the clear custom status button in the sidebar
        await SettingsSidebar.customStatusClearButton.tap();

        // * Check if the custom status is cleared and open the modal
        await expect(element(by.text('Set a Status').withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await CustomStatusScreen.open();

        // * Check if the previously set status is present in the Recents section
        await expect(element(by.text(customStatus.text).withAncestor(by.id('custom_status.recents')))).toBeVisible();

        // # Tap on the status in the recents section and close the modal by clicking Done button
        await element(by.text(customStatus.text).withAncestor(by.id('custom_status.recents'))).tap();
        await CustomStatusScreen.close();

        // * Check if the status is set and open the modal
        await openSettingsSidebar();
        await expect(element(by.text(customStatus.text).withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${customStatus.emojiName}`))).toBeVisible();
        await CustomStatusScreen.open();

        // # Tap on the input clear button in the custom status modal
        await CustomStatusScreen.inputClearButton.tap();

        // * Check if the custom status input and emoji have cleared or not and close the modal
        await expect(CustomStatusScreen.input).toHaveText('');
        await expect(getCustomStatusSelectedEmoji('default')).toBeVisible();
        await CustomStatusScreen.close();

        // * Check if the custom status is cleared
        await openSettingsSidebar();
        await expect(element(by.text('Set a Status').withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await expect(element(by.id('custom_status.emoji.default'))).toBeVisible();

        // # Close settings sidebar
        await closeSettingsSidebar();
    });

    it('MM-T3892 Recent statuses', async () => {
        // # Open custom status modal and close it after setting the status
        await openCustomStatusModalAndSetStatus(customStatus);
        await openSettingsSidebar();

        // * Check if the status is set in the sidebar
        await expect(element(by.text(customStatus.text).withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${customStatus.emojiName}`))).toBeVisible();

        // # Tap on the clear custom status button in the sidebar
        await SettingsSidebar.customStatusClearButton.tap();

        // * Check if the custom status is cleared and open the modal
        await expect(element(by.text('Set a Status').withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await CustomStatusScreen.open();

        // * Check if the previously set status is present in the Recents section
        await expect(element(by.text(customStatus.text).withAncestor(by.id('custom_status.recents')))).toBeVisible();

        // # Tap on the clear button corresponding to the suggestion containing the previously set status
        await getSuggestionClearButton(customStatus.text).tap();

        // * Check if the suggestion is removed or not
        await expect(getCustomStatusSuggestion(customStatus.text)).not.toExist();

        // # Choose a status from the suggestions and set the status
        await tapSuggestion(defaultStatus);
        await CustomStatusScreen.close();

        // * Check if the status is set in the sidebar
        await openSettingsSidebar();
        await expect(element(by.text(defaultStatus.text))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${defaultStatus.emoji}`))).toBeVisible();

        // # Tap on the clear custom status button in the sidebar
        await SettingsSidebar.customStatusClearButton.tap();

        // * Check if the custom status is cleared and open the modal
        await expect(element(by.text('Set a Status').withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await CustomStatusScreen.open();

        // * The last set status should be present in Recents list and not in the Suggestions list
        await expect(element(by.text(defaultStatus.text).withAncestor(by.id('custom_status.recents')))).toBeVisible();
        await expect(element(by.text(defaultStatus.text).withAncestor(by.id('custom_status.suggestions')))).not.toExist();

        // # Tap on the clear button of the suggestion containing the last set status
        await getSuggestionClearButton(defaultStatus.text).tap();

        // * The status should be moved from the Recents list to the Suggestions list
        await expect(element(by.text(defaultStatus.text).withAncestor(by.id('custom_status.recents')))).not.toExist();
        await expect(element(by.text(defaultStatus.text).withAncestor(by.id('custom_status.suggestions')))).toBeVisible();
        await CustomStatusScreen.close();

        // # Close settings sidebar
        await closeSettingsSidebar();
    });

    it('MM-T3893 Verifying where the custom status appears', async () => {
        const message = 'Hello';

        // # Open custom status modal and close it after setting the status
        await openCustomStatusModalAndSetStatus(customStatus);
        await openSettingsSidebar();

        // * Check if the status is set in the sidebar and close the sidebar
        await expect(element(by.text(customStatus.text).withAncestor(by.id(SettingsSidebar.testID.customStatusAction)))).toBeVisible();
        await expect(element(by.id(`custom_status.emoji.${customStatus.emojiName}`))).toBeVisible();
        await ChannelScreen.closeSettingsSidebar();

        // # Post a message and check if custom status emoji is present in the post header
        await ChannelScreen.postMessage(message);
        await expect(element(by.id(`post_header.custom_status_emoji.${customStatus.emojiName}`))).toBeVisible();

        // # Open the reply thread for the last post
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await ChannelScreen.openReplyThreadFor(post.id, message);

        // * Check if the custom status emoji is present in the post header and close thread
        await expect(element(by.id(`post_header.custom_status_emoji.${customStatus.emojiName}`))).toBeVisible();
        await ThreadScreen.back();

        // # Open user profile screen
        await openSettingsSidebar();
        await UserProfileScreen.open();
        await UserProfileScreen.toBeVisible();

        // * Check if custom status is present in the user profile screen and close it
        await expect(element(by.id(`custom_status.emoji.${customStatus.emojiName}`)).atIndex(0)).toExist();
        await expect(element(by.text(customStatus.text).withAncestor(by.id(UserProfileScreen.testID.customStatus)))).toBeVisible();
        await UserProfileScreen.close();

        // # Open the main sidebar and click on more direct messages button
        await ChannelScreen.openMainSidebar();
        await MoreDirectMessagesScreen.open();

        // # Type the logged in user's username and tap it to open the DM
        await MoreDirectMessagesScreen.searchInput.typeText(testUser.username);
        await MoreDirectMessagesScreen.getUserAtIndex(0).tap();

        // * Check if the custom status emoji is present in the channel title
        await expect(element(by.id(`custom_status_emoji.${customStatus.emojiName}`).withAncestor(by.id('channel.title.button')))).toBeVisible();

        // # Open the channel info screen
        await ChannelInfoScreen.open();

        // * Check if the custom status is present in the channel info screen and then close the screen
        await expect(element(by.id(`custom_status.emoji.${customStatus.emojiName}`)).atIndex(0)).toExist();
        await expect(element(by.text(customStatus.text).withAncestor(by.id(ChannelInfoScreen.testID.headerCustomStatus)))).toBeVisible();
        await ChannelInfoScreen.close();

        // # Open main sidebar and check if custom status emoji is present next to the username in the Direct messages section
        await openMainSidebar();
        expect(element(by.id(`${testUser.username}.custom_status_emoji.${customStatus.emojiName}`))).toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });
});

async function openCustomStatusModalAndSetStatus(customStatus) {
    const {addReactionScreen} = AddReactionScreen;
    const {getCustomStatusSelectedEmoji} = CustomStatusScreen;

    // # Open settings sidebar
    await ChannelScreen.openSettingsSidebar();

    // # Click on the Set a custom status option and check if the modal opens
    await CustomStatusScreen.open();

    // # Type the custom status text in the custom status input
    await CustomStatusScreen.input.typeText(customStatus.text);

    // * Check if the speech balloon emoji appears when some text is typed in the input
    await expect(getCustomStatusSelectedEmoji('speech_balloon')).toBeVisible();

    // # First tap to dismiss the keyboard and then tap again to open the emoji picker
    await getCustomStatusSelectedEmoji('speech_balloon').multiTap(2);

    // * Check if the Add reaction screen appears
    await expect(addReactionScreen).toBeVisible();

    // * Check if the emoji to be selected is present in the emojipicker and select it
    await expect(element(by.text(customStatus.emoji))).toBeVisible();
    await element(by.text(customStatus.emoji)).tap();

    // * Check if the Add reaction screen disappears
    await expect(addReactionScreen).not.toBeVisible();

    // * Check if the selected emoji is visible and close the modal by clicking on Done button
    await expect(getCustomStatusSelectedEmoji(customStatus.emojiName)).toBeVisible();
    await CustomStatusScreen.close();
}
