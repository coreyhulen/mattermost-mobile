// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import QuickActions from './quick_actions';

describe('QuickActions', () => {
    const baseProps = {
        onTextChange: jest.fn(),
        testID: 'post_draft.quick_actions',
        canUploadFiles: true,
        fileCount: 1,
        inputEventType: 'input-event-type',
        maxFileSize: 10,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<QuickActions {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
