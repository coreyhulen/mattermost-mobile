// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import EditChannel from './edit_channel';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> EditChannel', () => {
    const baseProps = {
        testID: 'test-id',
        canEdit: true,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot for Edit Channel', () => {
        const wrapper = shallowWithIntl(
            <EditChannel
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot Not render EditChannel', () => {
        const wrapper = shallowWithIntl(
            <EditChannel
                {...baseProps}
                canEdit={false}
            />,
        );
        expect(wrapper.getElement()).toBeNull();
    });
});
