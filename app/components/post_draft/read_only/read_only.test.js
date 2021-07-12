// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import ReadOnly from './index';

describe('PostDraft ReadOnly', () => {
    const baseProps = {
        testID: 'post_draft.read_only',
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<ReadOnly {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
