// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Preferences} from '@constants';
import React from 'react';

import {renderWithIntl} from '@test/intl-test-helper';

import StatusBar from './index';

describe('@components/app_version', () => {
    it('should match snapshot', () => {
        const wrapper = renderWithIntl(<StatusBar theme={Preferences.THEMES.default}/>);
        expect(wrapper.toJSON()).toMatchSnapshot();
    });
});
