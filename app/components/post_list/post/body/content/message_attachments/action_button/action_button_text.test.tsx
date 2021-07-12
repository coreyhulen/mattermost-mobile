// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import ActionButtonText from './action_button_text';

describe('ActionButtonText emojis', () => {
    const emojis = [
        {
            name: 'smile',
            literal: ':smile:',
        },
        {
            name: 'custom_emoji',
            literal: ':custom_emoji:',
        },
        {
            name: 'heart',
            literal: ':heart:',
        },
        {
            name: 'one',
            literal: ':one:',
        },
        {
            name: 'slightly_smiling_face',
            literal: ':)',
        },
        {
            name: 'wink',
            literal: ';)',
        },
        {
            name: 'open_mouth',
            literal: ':o',
        },
        {
            name: 'scream',
            literal: ':-o',
        },
        {
            name: 'smirk',
            literal: ':]',
        },
        {
            name: 'smile',
            literal: ':D',
        },
        {
            name: 'stuck_out_tongue_closed_eyes',
            literal: 'x-d',
        },
        {
            name: 'stuck_out_tongue',
            literal: ':p',
        },
        {
            name: 'rage',
            literal: ':@',
        },
        {
            name: 'slightly_frowning_face',
            literal: ':(',
        },
        {
            name: 'cry',
            literal: ':`(',
        },
        {
            name: 'confused',
            literal: ':/',
        },
        {
            name: 'confounded',
            literal: ':s',
        },
        {
            name: 'neutral_face',
            literal: ':|',
        },
        {
            name: 'flushed',
            literal: ':$',
        },
        {
            name: 'mask',
            literal: ':-x',
        },
        {
            name: 'heart',
            literal: '<3',
        },
        {
            name: 'broken_heart',
            literal: '</3',
        },
        {
            name: '+1',
            literal: ':+1:',
        },
        {
            name: '-1',
            literal: ':-1:',
        },
    ];

    emojis.forEach(({name, literal}) => {
        test('only emoji ' + name, () => {
            const baseProps = {message: literal, style: {fontSize: 12}};

            const wrapper = shallow(<ActionButtonText {...baseProps}/>);

            expect(wrapper.getElement().props.children.length).toBe(1);

            const child = wrapper.getElement().props.children[0];

            expect(child.type.displayName).toBe('Connect(Emoji)');
            expect(child.props.emojiName).toBe(name);
            expect(child.props.literal).toBe(literal);
            expect(child.props.textStyle.fontSize).toBe(12);
        });

        test('emoji ' + name + ' with additional text', () => {
            const baseProps = {message: 'emoji test with literal equals to ' + literal, style: {fontSize: 12}};

            const wrapper = shallow(<ActionButtonText {...baseProps}/>);

            expect(wrapper.getElement().props.children.length).toBe(2);

            const textChild = wrapper.getElement().props.children[0];
            const emoticonChild = wrapper.getElement().props.children[1];

            expect(textChild.type.displayName).toBe('Text');
            expect(textChild.props.children).toBe('emoji test with literal equals to ');
            expect(textChild.props.style.fontSize).toBe(12);
            expect(emoticonChild.props.emojiName).toBe(name);
            expect(emoticonChild.props.literal).toBe(literal);
            expect(emoticonChild.type.displayName).toBe('Connect(Emoji)');
            expect(emoticonChild.props.textStyle.fontSize).toBe(12);
        });
    });
});
