// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';
import {NativeEventEmitter} from 'react-native';

import {PASTE_FILES} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';

import {PasteableTextInput} from './index';

const nativeEventEmitter = new NativeEventEmitter();

describe('PasteableTextInput', () => {
    const emit = jest.spyOn(EventEmitter, 'emit');

    test('should render pasteable text input', () => {
        const onPaste = jest.fn();
        const text = 'My Text';
        const component = shallow(
            <PasteableTextInput onPaste={onPaste}>{text}</PasteableTextInput>,
        );
        expect(component).toMatchSnapshot();
    });

    test('should call onPaste props if native onPaste trigger', () => {
        const event = {someData: 'data'};
        const text = 'My Text';
        shallow(
            <PasteableTextInput>{text}</PasteableTextInput>,
        );
        nativeEventEmitter.emit('onPaste', event);
        expect(emit).toHaveBeenCalledWith(PASTE_FILES, null, event);
    });

    test('should remove onPaste listener when unmount', () => {
        const mockRemove = jest.fn();
        const text = 'My Text';
        const component = shallow(
            <PasteableTextInput>{text}</PasteableTextInput>,
        );

        component.instance().subscription.remove = mockRemove;
        component.instance().componentWillUnmount();
        expect(mockRemove).toHaveBeenCalled();
    });

    test('should emit PASTE_FILES event only for last subscription', () => {
        const component1 = shallow(<PasteableTextInput/>);
        const instance1 = component1.instance();
        const component2 = shallow(<PasteableTextInput/>);
        const instance2 = component2.instance();

        instance1.onPaste();
        expect(emit).not.toHaveBeenCalled();
        instance2.onPaste();
        expect(emit).toHaveBeenCalledTimes(1);
    });
});
