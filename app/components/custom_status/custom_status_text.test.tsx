// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {renderWithIntl} from '@test/intl-test-helper';
import React from 'react';

import CustomStatusText from '@components/custom_status/custom_status_text';
import Preferences from '@constants/preferences';

describe('@components/custom_status/custom_status_text', () => {
    const baseProps = {
        text: 'In a meeting',
        theme: Preferences.THEMES.default,
    };

    it('should match snapshot', () => {
        const wrapper = renderWithIntl(<CustomStatusText {...baseProps}/>);
        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with empty text', () => {
        const wrapper = renderWithIntl(
            <CustomStatusText
                {...baseProps}
                text={''}
            />,
        );

        expect(wrapper.toJSON()).toMatchSnapshot();
    });
});
