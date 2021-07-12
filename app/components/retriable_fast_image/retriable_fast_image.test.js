// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';
import FastImage from 'react-native-fast-image';

import RetriableFastImage, {FAST_IMAGE_MAX_RETRIES} from './index';

describe('RetriableFastImage', () => {
    const baseProps = {
        id: 'id',
        onError: jest.fn(),
    };

    it('should update the FastImage element key on error until max retries has been reached', () => {
        const wrapper = shallow(
            <RetriableFastImage {...baseProps}/>,
        );
        const instance = wrapper.instance();

        let retry = 0;
        expect(wrapper.containsMatchingElement(<FastImage key={`${baseProps.id}-${retry}`}/>)).toEqual(true);
        while (instance.state.retry < FAST_IMAGE_MAX_RETRIES) {
            instance.onError();
            retry += 1;
            expect(wrapper.containsMatchingElement(<FastImage key={`${baseProps.id}-${retry}`}/>)).toEqual(true);
        }

        instance.onError();
        expect(wrapper.containsMatchingElement(<FastImage key={`${baseProps.id}-${retry}`}/>)).toEqual(true);
    });

    it('should call props.onError only after max retries has been reached', () => {
        const wrapper = shallow(
            <RetriableFastImage {...baseProps}/>,
        );
        const instance = wrapper.instance();

        let retry = 0;
        while (instance.state.retry < FAST_IMAGE_MAX_RETRIES) {
            instance.onError();
            retry += 1;
            expect(instance.state.retry).toEqual(retry);
            expect(baseProps.onError).not.toHaveBeenCalled();
        }

        instance.onError();
        expect(instance.state.retry).toEqual(retry);
        expect(baseProps.onError).toHaveBeenCalled();
    });
});
