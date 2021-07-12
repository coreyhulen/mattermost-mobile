// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Preferences} from '@mm-redux/constants';
import {shallowWithIntl} from '@test/intl-test-helper';

import SearchResultPost from './search_result_post';

describe('SearchResultPost', () => {
    const baseProps = {
        postId: 'post-id',
        isDeleted: false,
        highlightPinnedOrFlagged: false,
        skipFlaggedHeader: false,
        skipPinnedHeader: false,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', async () => {
        const wrapper = shallowWithIntl(<SearchResultPost {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
