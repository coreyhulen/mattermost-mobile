// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Archived from './index';

describe('PostDraft Archived', () => {
    const baseProps = {
        selectPenultimateChannel: jest.fn(),
        testID: 'post_draft.archived',
        deactivated: false,
        rootId: 'root-id',
        teamId: 'team-id',
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<Archived {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
