// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {SettingsSidebar} from '@support/ui/component';

class CustomStatusScreen {
    testID = {
        customStatusScreen: 'custom_status.screen',
        input: 'custom_status.input',
        selectedEmojiPrefix: 'custom_status.emoji.',
        inputClearButton: 'custom_status.input.clear.button',
        doneButton: 'custom_status.done.button',
        suggestionPrefix: 'custom_status_suggestion.',
        suggestionClearButton: 'custom_status_suggestion.clear.button',
        clearAfterAction: 'custom_status.clear_after.action',
    }

    customStatusScreen = element(by.id(this.testID.customStatusScreen));
    input = element(by.id(this.testID.input));
    inputClearButton = element(by.id(this.testID.inputClearButton))
    doneButton = element(by.id(this.testID.doneButton))

    getCustomStatusSelectedEmoji = (emoji) => {
        const emojiTestID = `${this.testID.selectedEmojiPrefix}${emoji}`;
        return element(by.id(emojiTestID));
    }

    getCustomStatusSuggestion = (text) => {
        const suggestionID = `${this.testID.suggestionPrefix}${text}`;
        return element(by.id(suggestionID));
    }

    getSuggestionClearButton = (text) => {
        const suggestionID = `${this.testID.suggestionPrefix}${text}`;
        return element(by.id(this.testID.suggestionClearButton).withAncestor(by.id(suggestionID)));
    }

    toBeVisible = async () => {
        await expect(this.customStatusScreen).toBeVisible();

        return this.customStatusScreen;
    }

    open = async () => {
        // # Open custom status screen
        await SettingsSidebar.tapCustomStatusAction();

        return this.toBeVisible();
    }

    tapSuggestion = async ({emoji, text}) => {
        await this.getCustomStatusSuggestion(text).tap();

        await expect(this.input).toHaveText(text);
        await expect(this.getCustomStatusSelectedEmoji(emoji)).toBeVisible();
    }

    openClearAfterModal = async () => {
        await element(by.id(this.testID.clearAfterAction)).tap();
    }

    close = async () => {
        await this.doneButton.tap();
        return expect(this.customStatusScreen).not.toBeVisible();
    }
}

const customStatusScreen = new CustomStatusScreen();
export default customStatusScreen;
