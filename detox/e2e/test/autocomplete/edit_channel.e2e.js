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
    ChannelInfoScreen,
    EditChannelScreen,
} from '@support/ui/screen';

describe('Autocomplete', () => {
    beforeAll(async () => {
        const {user} = await Setup.apiInit();

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3390 should render autocomplete in channel header edit screen', async () => {
        // # Open edit channel screen
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();

        // # Activate at_mention autocomplete
        await EditChannelScreen.headerInput.typeText('@');

        // * Expect autocomplete to render
        await Autocomplete.toBeVisible();
        await expect(Autocomplete.atMentionSuggestionList).toExist();

        // # Go to previous screen
        await EditChannelScreen.back();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });
});
