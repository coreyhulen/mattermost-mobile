// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {shallowWithIntl} from '@test/intl-test-helper';

import SearchBar from './index';

jest.useFakeTimers();

describe('SearchBar', () => {
    const baseProps = {
        onBlur: jest.fn,
        onFocus: jest.fn,
        onSearchButtonPress: jest.fn,
        onChangeText: jest.fn,
        onCancelButtonPress: jest.fn,
        onSelectionChange: jest.fn,
        testID: 'search_bar',
        backgroundColor: '#ffffff',
        placeholderTextColor: '#000000',
        titleCancelColor: '#aaaaaa',
        tintColorSearch: '#bbbbbb',
        tintColorDelete: '#cccccc',
        selectionColor: '#dddddd',
        inputStyle: {},
        containerStyle: {},
        cancelButtonStyle: {},
        autoFocus: true,
        placeholder: 'placeholder',
        cancelTitle: 'cancel title',
        returnKeyType: 'return-key-type',
        keyboardType: 'keyboard-type',
        autoCapitalize: 'auto-capitalize',
        inputHeight: 10,
        editable: true,
        blurOnSubmit: true,
        keyboardShouldPersist: true,
        value: 'value',
        keyboardAppearance: 'keyboard-appearance',
        showArrow: true,
        searchBarRightMargin: 5,
        searchIconSize: 1,
        backArrowSize: 1,
        deleteIconSize: 1,
        showCancel: true,
        containerHeight: 20,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<SearchBar {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
