// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Search from './search';

jest.useFakeTimers();

describe('Search', () => {
    const baseProps = {
        actions: {
            clearSearch: jest.fn(),
            closePermalink: jest.fn(),
            handleSearchDraftChanged: jest.fn(),
            getPostThread: jest.fn(),
            removeSearchTerms: jest.fn(),
            searchPostsWithParams: jest.fn(),
            getMorePostsForSearch: jest.fn(),
            selectPost: jest.fn(),
            showPermalink: jest.fn(),
        },
        currentTeamId: 'current-team-id',
        initialValue: 'initial value',
        isLandscape: false,
        postIds: [],
        archivedPostIds: [],
        recent: [],
        isSearchGettingMore: true,
        theme: Preferences.THEMES.default,
        enableDateSuggestion: true,
        timezoneOffsetInSeconds: 0,
        viewArchivedChannels: false,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<Search {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
