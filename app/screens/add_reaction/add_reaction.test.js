// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {shallowWithIntl} from '@test/intl-test-helper';

import AddReaction from './index';

describe('AddReaction', () => {
    const baseProps = {
        onEmojiPress: jest.fn(),
        componentId: 'component-id',
        closeButton: {},
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<AddReaction {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
