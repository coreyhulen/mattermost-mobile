// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Markdown from './markdown.js';

describe('Markdown', () => {
    const baseProps = {
        autolinkedUrlSchemes: ['mattermost'],
        baseTextStyle: {},
        mentionKeys: [{key: 'user.name'}, {key: '@channel'}, {key: '@all'}, {key: '@here'}],
        minimumHashtagLength: 3,
        theme: {},
        value: 'This is a message containing @all',
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <Markdown {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match with disableAtChannelMentionHighlight', () => {
        const wrapper = shallow(
            <Markdown
                {...baseProps}
                disableAtChannelMentionHighlight={true}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('MM-32254 should not crash when given string with deeply nested asterisks', () => {
        const props = {
            ...baseProps,
            value: '**'.repeat(50) + 'test' + '**'.repeat(50) + 'test',
        };

        shallow(
            <Markdown {...props}/>,
        );
    });

    test('should not crash when given a non-string value', () => {
        const props = {
            ...baseProps,
            value: 10,
        };

        shallow(
            <Markdown {...props}/>,
        );
    });
});
