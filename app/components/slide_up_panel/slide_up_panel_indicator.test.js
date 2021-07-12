// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import SlideUpPanelIndicator from './slide_up_panel_indicator';

describe('SlideUpPanelIndicator', () => {
    const baseProps = {
        dragIndicatorColor: '#fff',
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <SlideUpPanelIndicator {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
