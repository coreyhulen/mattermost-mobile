// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {NativeEventEmitter, NativeModules, Platform, TextInput} from 'react-native';

import {PASTE_FILES} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';

const {OnPasteEventManager} = NativeModules;
const OnPasteEventEmitter = new NativeEventEmitter(OnPasteEventManager);

export class PasteableTextInput extends React.PureComponent {
    static propTypes = {
        ...TextInput.PropTypes,
        forwardRef: PropTypes.any,
    }

    componentDidMount() {
        this.subscription = OnPasteEventEmitter.addListener('onPaste', this.onPaste);
    }

    componentWillUnmount() {
        if (this.subscription) {
            this.subscription.remove();
        }
    }

    getLastSubscriptionKey = () => {
        const subscriptions = OnPasteEventEmitter._subscriber._subscriptionsForType.onPaste?.filter((sub) => sub); // eslint-disable-line no-underscore-dangle
        return subscriptions?.length && subscriptions[subscriptions.length - 1].key;
    }

    onPaste = (event) => {
        const lastSubscriptionKey = this.getLastSubscriptionKey();
        if (this.subscription.key !== lastSubscriptionKey) {
            return;
        }

        let data = null;
        let error = null;

        if (Platform.OS === 'android') {
            const {nativeEvent} = event;
            data = nativeEvent.data;
            error = nativeEvent.error;
        } else {
            data = event;
        }

        EventEmitter.emit(PASTE_FILES, error, data);
    }

    render() {
        const {testID, forwardRef, ...props} = this.props;

        return (
            <TextInput
                testID={testID}
                {...props}
                onPaste={this.onPaste}
                ref={forwardRef}
            />
        );
    }
}

const WrappedPasteableTextInput = (props, ref) => (
    <PasteableTextInput
        {...props}
        forwardRef={ref}
    />
);

export default React.forwardRef(WrappedPasteableTextInput);
