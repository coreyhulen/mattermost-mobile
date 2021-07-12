// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';

import OptionModalListAndroid from './options_modal_list.android';
import OptionModalListIOS from './options_modal_list.ios';

describe('OptionModalList', () => {
    const baseProps = {
        items: [{
            action: jest.fn(),
            text: {
                id: 'mobile.file_upload.camera',
                defaultMessage: 'Take Photo or Video',
            },
            icon: 'camera',
        }, {
            action: jest.fn(),
            text: {
                id: 'mobile.file_upload.library',
                defaultMessage: 'Photo Library',
            },
            icon: 'photo',
        }],
        onCancelPress: jest.fn(),
        title: 'test',
    };

    test('should match snapshot for iOS', async () => {
        const wrapper = shallow(
            <OptionModalListIOS {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Android', async () => {
        const wrapper = shallow(
            <OptionModalListAndroid {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
