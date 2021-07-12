// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {Autocomplete} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Autocomplete', () => {
    const {postInput} = ChannelScreen;
    const {
        atMentionSuggestionList,
        channelMentionSuggestionList,
        emojiSuggestionList,
        slashSuggestionList,
    } = Autocomplete;

    beforeAll(async () => {
        const {user} = await Setup.apiInit();

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    beforeEach(async () => {
        // # Clear text on input
        await postInput.clearText();
        await postInput.tap();
    });

    afterAll(async () => {
        await postInput.clearText();
        await ChannelScreen.logout();
    });

    it('MM-T3392_1 should render emoji_suggestion component', async () => {
        // # Type ":" to activate emoji suggestions
        await expect(emojiSuggestionList).not.toExist();
        await postInput.typeText(':');

        // * Expect emoji suggestions to render
        await expect(emojiSuggestionList).toExist();
    });

    it('MM-T3392_2 should render at_mention component', async () => {
        // # Type "@" to activate at mention autocomplete
        await expect(atMentionSuggestionList).not.toExist();
        await postInput.typeText('@');

        // * Expect at mention autocomplete to render
        await expect(atMentionSuggestionList).toExist();
    });

    it('MM-T3392_3 should render channel_mention component', async () => {
        // # Type "~" to activate channel mention autocomplete
        await expect(channelMentionSuggestionList).not.toExist();
        await postInput.typeText('~');

        // * Expect channel mention to render
        await expect(channelMentionSuggestionList).toExist();
    });

    it('MM-T3392_4 should render slash_suggestion component', async () => {
        // # Type "/" to activate slash command suggestions
        await expect(slashSuggestionList).not.toExist();
        await postInput.typeText('/');

        // * Expect slash suggestions to render
        await expect(slashSuggestionList).toExist();
    });
});
