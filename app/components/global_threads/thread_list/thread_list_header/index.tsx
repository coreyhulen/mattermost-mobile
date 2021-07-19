// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle} from 'react-native';
import {injectIntl, intlShape} from 'react-intl';

import CompassIcon from '@components/compass_icon';

export type Props = {
    haveUnreads: boolean;
    intl: typeof intlShape;
    markAllAsRead: () => void;
    style: Record<string, StyleProp<ViewStyle | TextStyle>>;
    testID: string;
    viewAllThreads: () => void;
    viewUnreadThreads: () => void;
    viewingUnreads: boolean;
};

function ThreadListHeader({haveUnreads, intl, markAllAsRead, style, testID, viewAllThreads, viewUnreadThreads, viewingUnreads}: Props) {
    return (
        <View style={[style.headerContainer, style.borderBottom]}>
            <View style={style.menuContainer}>
                <TouchableOpacity
                    onPress={viewAllThreads}
                    testID={`${testID}.all_threads`}
                >
                    <View style={[style.menuItemContainer, viewingUnreads ? undefined : style.menuItemContainerSelected]}>
                        <Text style={[style.menuItem, viewingUnreads ? {} : style.menuItemSelected]}>
                            {
                                intl.formatMessage({
                                    id: 'global_threads.allThreads',
                                    defaultMessage: 'All Your Threads',
                                })
                            }
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={viewUnreadThreads}
                    testID={`${testID}.unread_threads`}
                >
                    <View style={[style.menuItemContainer, viewingUnreads ? style.menuItemContainerSelected : undefined]}>
                        <View>
                            <Text style={[style.menuItem, viewingUnreads ? style.menuItemSelected : {}]}>
                                {
                                    intl.formatMessage({
                                        id: 'global_threads.unreads',
                                        defaultMessage: 'Unreads',
                                    })
                                }
                            </Text>
                            {haveUnreads ? (
                                <View
                                    style={style.unreadsDot}
                                    testID={`${testID}.unreads_dot`}
                                />
                            ) : null}
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
            <View style={style.markAllReadIconContainer}>
                <TouchableOpacity
                    disabled={!haveUnreads}
                    onPress={markAllAsRead}
                    testID={`${testID}.mark_all_read`}
                >
                    <CompassIcon
                        name='playlist-check'
                        style={[style.markAllReadIcon, haveUnreads ? undefined : style.markAllReadIconDisabled]}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export {ThreadListHeader}; // Used for shallow render test cases

export default injectIntl(ThreadListHeader);
