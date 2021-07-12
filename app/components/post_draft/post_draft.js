// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Platform} from 'react-native';
import {KeyboardTrackingView} from 'react-native-keyboard-tracking-view';

import {DeviceTypes} from '@constants';
import {UPDATE_NATIVE_SCROLLVIEW} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';

import Archived from './archived';
import DraftInput from './draft_input';
import ReadOnly from './read_only';

export default class PostDraft extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        accessoriesContainerID: PropTypes.string,
        canPost: PropTypes.bool.isRequired,
        channelId: PropTypes.string.isRequired,
        channelIsArchived: PropTypes.bool,
        channelIsReadOnly: PropTypes.bool.isRequired,
        cursorPositionEvent: PropTypes.string,
        deactivatedChannel: PropTypes.bool.isRequired,
        registerTypingAnimation: PropTypes.func.isRequired,
        rootId: PropTypes.string,
        screenId: PropTypes.string.isRequired,
        scrollViewNativeID: PropTypes.string,
        valueEvent: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    draftInput = React.createRef();
    keyboardTracker = React.createRef();

    componentDidMount() {
        EventEmitter.on(UPDATE_NATIVE_SCROLLVIEW, this.updateNativeScrollView);
    }

    componentWillUnmount() {
        EventEmitter.off(UPDATE_NATIVE_SCROLLVIEW, this.updateNativeScrollView);
    }

    handleInputQuickAction = (value) => {
        if (this.draftInput?.current) {
            this.draftInput.current.handleInputQuickAction(value);
        }
    };

    updateNativeScrollView = (scrollViewNativeID) => {
        if (this.keyboardTracker?.current && this.props.scrollViewNativeID === scrollViewNativeID) {
            const resetScrollView = requestAnimationFrame(() => {
                this.keyboardTracker.current.resetScrollView(scrollViewNativeID);
                cancelAnimationFrame(resetScrollView);
            });
        }
    };

    render = () => {
        const {
            testID,
            accessoriesContainerID,
            canPost,
            channelId,
            channelIsArchived,
            channelIsReadOnly,
            cursorPositionEvent,
            deactivatedChannel,
            registerTypingAnimation,
            rootId,
            screenId,
            scrollViewNativeID,
            theme,
            valueEvent,
        } = this.props;

        if (channelIsArchived || deactivatedChannel) {
            const archivedTestID = `${testID}.archived`;

            return (
                <Archived
                    testID={archivedTestID}
                    defactivated={deactivatedChannel}
                    rootId={rootId}
                    theme={theme}
                />
            );
        }

        const readonly = channelIsReadOnly || !canPost;

        if (readonly) {
            const readOnlyTestID = `${testID}.read_only`;

            return (
                <ReadOnly
                    testID={readOnlyTestID}
                    theme={theme}
                />
            );
        }

        const draftInput = (
            <DraftInput
                testID={testID}
                ref={this.draftInput}
                channelId={channelId}
                cursorPositionEvent={cursorPositionEvent}
                registerTypingAnimation={registerTypingAnimation}
                rootId={rootId}
                screenId={screenId}
                theme={theme}
                valueEvent={valueEvent}
            />
        );

        if (Platform.OS === 'android') {
            return draftInput;
        }

        return (
            <KeyboardTrackingView
                accessoriesContainerID={accessoriesContainerID}
                ref={this.keyboardTracker}
                scrollViewNativeID={scrollViewNativeID}
                inverted={DeviceTypes.IS_TABLET}
            >
                {draftInput}
            </KeyboardTrackingView>
        );
    };
}
