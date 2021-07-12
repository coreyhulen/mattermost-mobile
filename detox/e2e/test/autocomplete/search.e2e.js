// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {Autocomplete} from '@support/ui/component';
import {
    ChannelScreen,
    SearchScreen,
} from '@support/ui/screen';

describe('Autocomplete', () => {
    const {
        atMentionSuggestionList,
        channelMentionSuggestionList,
        dateSuggestion,
    } = Autocomplete;

    beforeAll(async () => {
        const {user} = await Setup.apiInit();

        // # Open search screen
        await ChannelScreen.open(user);
        await SearchScreen.open();
    });

    beforeEach(async () => {
        await SearchScreen.searchInput.clearText();
    });

    afterAll(async () => {
        await SearchScreen.cancel();
        await ChannelScreen.logout();
    });

    it('MM-T3393_1 should render at_mention component', async () => {
        await expect(atMentionSuggestionList).not.toExist();

        // # Tap "from:" modifier
        await SearchScreen.searchFromSection.tap();

        // * Expect at mention to render
        await expect(atMentionSuggestionList).toExist();
    });

    it('MM-T3393_2 should render channel_mention component', async () => {
        await expect(channelMentionSuggestionList).not.toExist();

        // # Tap "in:" modifier
        await SearchScreen.searchInSection.tap();

        // * Expect channel mention to render
        await expect(channelMentionSuggestionList).toExist();
    });

    it('MM-T3393_3 should render date_suggestion component', async () => {
        await expect(dateSuggestion).not.toExist();

        // # Tap "on:" modifier
        await SearchScreen.searchOnSection.tap();

        // * Expect date suggestion to render
        await expect(dateSuggestion).toExist();
    });
});
