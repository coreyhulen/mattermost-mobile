// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import NotificationSettingsMentionsKeywords from './notification_settings_mentions_keywords';

describe('NotificationSettingsMentionsKeywords', () => {
    const baseProps = {
        componentId: 'component-id',
        keywords: '',
        onBack: jest.fn(),
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <NotificationSettingsMentionsKeywords {...baseProps}/>,
        );

        expect(wrapper.instance()).toMatchSnapshot();
    });
});
