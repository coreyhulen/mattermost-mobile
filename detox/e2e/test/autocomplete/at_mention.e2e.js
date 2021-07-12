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
    let user;
    const {postInput} = ChannelScreen;
    const {atMentionSuggestionList} = Autocomplete;
    let userAtMentionAutocomplete;

    beforeAll(async () => {
        ({user} = await Setup.apiInit());
        ({atMentionItem: userAtMentionAutocomplete} = Autocomplete.getAtMentionItem(user.id));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    beforeEach(async () => {
        // # Clear text and verify that Autocomplete disappeared
        await postInput.clearText();
        await Autocomplete.toBeVisible(false);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3409_1 should suggest user based on username', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type username
        await postInput.typeText(user.username);

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_2 should suggest user based on nickname', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type nickname
        await postInput.typeText(user.nickname);

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_3 should suggest user based on first name', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type first name
        await postInput.typeText(user.first_name);

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_4 should suggest user based on last name', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type last name
        await postInput.typeText(user.last_name);

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_5 should suggest user based on lowercase first name', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type lowercase first name
        await postInput.typeText(user.first_name.toLowerCase());

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_6 should suggest user based on lowercase last name', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type lowercase last name
        await postInput.typeText(user.last_name.toLowerCase());

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_7 should suggest user based on full name with space', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type full name
        await postInput.typeText(`${user.first_name} ${user.last_name}`);

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_8 should suggest user based on partial full name with space', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type partial full name
        await postInput.typeText(`${user.first_name} ${user.last_name.substring(0, user.last_name.length - 6)}`);

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();
    });

    it('MM-T3409_9 should stop suggesting user after full name with trailing space', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type full name
        await postInput.typeText(`${user.first_name} ${user.last_name}`);

        // * Expect at mention autocomplete to contain associated user suggestion
        await expect(userAtMentionAutocomplete).toExist();

        // # Type trailing space
        await postInput.typeText(' ');

        // * Expect at mention autocomplete not to contain associated user suggestion
        await expect(userAtMentionAutocomplete).not.toExist();
    });

    it('MM-T3409_10 should stop suggesting user when keyword is not associated with any user', async () => {
        // # Type "@" to activate at mention autocomplete
        await postInput.typeText('@');
        await Autocomplete.toBeVisible();
        await expect(atMentionSuggestionList).toExist();

        // # Type keyword not associated with any user
        await postInput.typeText(Date.now().toString());

        // * Expect at mention autocomplete not to contain associated user suggestion
        await expect(userAtMentionAutocomplete).not.toExist();
    });

    it('MM-T3409_11 should be able to select at mention multiple times', async () => {
        // # Type "@" to activate at mention autocomplete
        await expect(atMentionSuggestionList).not.toExist();
        await postInput.typeText('@');
        await expect(atMentionSuggestionList).toExist();

        // # Type username
        await postInput.typeText(user.username);

        // # Tap user
        await userAtMentionAutocomplete.tap();

        // * expect mention autocomplete to dissappear
        await expect(atMentionSuggestionList).not.toExist();

        // # Type "@" again to re-activate mention autocomplete
        await postInput.typeText('@');
        await expect(atMentionSuggestionList).toExist();
    });
});
