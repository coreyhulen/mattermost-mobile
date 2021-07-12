// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import * as NavigationActions from '@actions/navigation';

import Hashtag from './index';

describe('Hashtag', () => {
    const baseProps = {
        hashtag: 'test',
        linkStyle: {color: 'red'},
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<Hashtag {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('handlePress should open hashtag search', async () => {
        const dismissAllModals = jest.spyOn(NavigationActions, 'dismissAllModals');
        const popToRoot = jest.spyOn(NavigationActions, 'popToRoot');
        const showSearchModal = jest.spyOn(NavigationActions, 'showSearchModal');

        const props = {
            ...baseProps,
        };

        const wrapper = shallow(<Hashtag {...props}/>);

        await wrapper.instance().handlePress();

        expect(dismissAllModals).toHaveBeenCalled();
        expect(popToRoot).toHaveBeenCalled();
        expect(showSearchModal).toHaveBeenCalledWith('#test');
    });
});
