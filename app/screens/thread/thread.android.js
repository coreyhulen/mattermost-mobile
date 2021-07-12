// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Animated, View} from 'react-native';

import KeyboardLayout from '@components/layout/keyboard_layout';
import Loading from '@components/loading';
import PostDraft from '@components/post_draft';
import PostList from '@components/post_list';
import SafeAreaView from '@components/safe_area_view';
import StatusBar from '@components/status_bar';
import {THREAD} from '@constants/screen';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ThreadBase from './thread_base';

export default class ThreadAndroid extends ThreadBase {
    render() {
        const {
            channelId,
            myMember,
            postIds,
            rootId,
            channelIsArchived,
            theme,
        } = this.props;

        let content;
        if (this.hasRootPost()) {
            content = (
                <>
                    <Animated.View
                        testID='thread.screen'
                        style={{flex: 1, paddingBottom: this.bottomPadding}}
                    >
                        <PostList
                            testID='thread.post_list'
                            renderFooter={this.renderFooter()}
                            indicateNewMessages={false}
                            postIds={postIds}
                            currentUserId={myMember && myMember.user_id}
                            lastViewedAt={this.state.lastViewedAt}
                            location={THREAD}
                            rootId={rootId}
                        />
                    </Animated.View>
                    <PostDraft
                        testID='thread.post_draft'
                        ref={this.postDraft}
                        channelId={channelId}
                        channelIsArchived={channelIsArchived}
                        rootId={rootId}
                        screenId={this.props.componentId}
                        registerTypingAnimation={this.registerTypingAnimation}
                    />
                </>
            );
        } else {
            content = (
                <Loading color={theme.centerChannelColor}/>
            );
        }

        const style = getStyleSheet(theme);
        return (
            <SafeAreaView>
                <StatusBar/>
                <KeyboardLayout>
                    <View style={style.separator}/>
                    {content}
                </KeyboardLayout>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => ({
    separator: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        height: 1,
    },
}));
