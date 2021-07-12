// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';

import Swiper from './swiper.js';

describe('Swiper', () => {
    const baseProps = {
        children: [],
    };

    test('should match snapshot', async () => {
        const wrapper = shallow(
            <Swiper {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should not call scrollView.scrollTo and updateIndex when children < 2', () => {
        const children = [];
        while (children.length < 2) {
            const props = {...baseProps, children};
            const wrapper = shallow(
                <Swiper {...props}/>,
            );

            const instance = wrapper.instance();
            instance.updateIndex = jest.fn();
            instance.refScrollView({
                scrollTo: jest.fn(),
            });

            instance.scrollToIndex(1, false);
            expect(instance.scrollView.scrollTo).not.toHaveBeenCalled();
            expect(instance.updateIndex).not.toHaveBeenCalled();

            children.push('test');
        }

        expect(children.length).toBe(2);
    });

    test('should call scrollView.scrollTo and updateIndex when children >= 2', () => {
        const children = [1, 2, 3];
        while (children.length >= 2) {
            const props = {...baseProps, children};
            const wrapper = shallow(
                <Swiper {...props}/>,
            );

            const instance = wrapper.instance();
            instance.updateIndex = jest.fn();
            instance.refScrollView({
                scrollTo: jest.fn(),
            });

            instance.scrollToIndex(1, false);
            expect(instance.scrollView.scrollTo).toHaveBeenCalled();
            expect(instance.updateIndex).toHaveBeenCalled();

            children.pop();
        }

        expect(children.length).toBe(1);
    });
});
