// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';
import {View} from 'react-native';

import Preferences from '@mm-redux/constants/preferences';

import CustomList, {FLATLIST, SECTIONLIST} from './index';

describe('CustomList', () => {
    const baseProps = {
        canRefresh: false,
        data: [{username: 'username_1'}, {username: 'username_2'}],
        listType: FLATLIST,
        loading: false,
        loadingComponent: (<View/>),
        onLoadMore: jest.fn(),
        onRowPress: jest.fn(),
        onRowSelect: null,
        renderItem: jest.fn(),
        listInitialSize: 0,
        listScrollRenderAheadDistance: 0,
        showSections: true,
        selectable: true,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot with FlatList', () => {
        const wrapper = shallow(
            <CustomList {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find('FlatList')).toHaveLength(1);
    });

    test('should match snapshot with SectionList', () => {
        const props = {
            ...baseProps,
            listType: SECTIONLIST,
        };

        const wrapper = shallow(
            <CustomList {...props}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
        expect(wrapper.find('SectionList')).toHaveLength(1);
    });

    test('should match snapshot, renderSectionHeader', () => {
        const wrapper = shallow(
            <CustomList {...baseProps}/>,
        );
        const section = {
            id: 'section_id',
        };
        expect(wrapper.instance().renderSectionHeader({section})).toMatchSnapshot();
    });

    test('should call props.renderItem on renderItem', () => {
        const props = {...baseProps};
        const wrapper = shallow(
            <CustomList {...props}/>,
        );
        wrapper.instance().renderItem({item: {id: 'item_id', selected: true}, index: 0, section: null});
        expect(props.renderItem).toHaveBeenCalledTimes(1);
    });

    test('should match snapshot, renderSeparator', () => {
        const wrapper = shallow(
            <CustomList {...baseProps}/>,
        );
        expect(wrapper.instance().renderSeparator()).toMatchSnapshot();
    });

    test('should match snapshot, renderFooter', () => {
        const props = {...baseProps};
        const wrapper = shallow(
            <CustomList {...props}/>,
        );

        // should return null
        expect(wrapper.instance().renderFooter()).toMatchSnapshot();

        // should return element
        wrapper.setProps({loading: true});
        expect(wrapper.instance().renderFooter()).toMatchSnapshot();
    });
});
