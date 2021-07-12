// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {changeOpacity} from '@utils/theme';

import SendAction from './index';

describe('SendAction', () => {
    const baseProps = {
        testID: 'post_draft.send_action',
        theme: Preferences.THEMES.default,
        handleSendMessage: jest.fn(),
        disabled: false,
    };

    function getWrapper(props = {}) {
        return shallow(
            <SendAction
                {...baseProps}
                {...props}
            />,
        );
    }

    test('should match snapshot', () => {
        const wrapper = getWrapper();

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should render theme backgroundColor', () => {
        const wrapper = getWrapper();

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.childAt(0)).toHaveStyle('backgroundColor', baseProps.theme.buttonBg);
    });

    test('should change theme backgroundColor to 0.3 opacity', () => {
        const wrapper = getWrapper({disabled: true});

        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.childAt(0)).toHaveStyle('backgroundColor', changeOpacity(baseProps.theme.buttonBg, 0.3));
    });
});
