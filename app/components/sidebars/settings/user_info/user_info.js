// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import ProfilePicture from '@components/profile_picture';
import {emptyFunction} from '@utils/general';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export default class UserInfo extends PureComponent {
    static propTypes = {
        testID: PropTypes.string,
        user: PropTypes.object.isRequired,
        onPress: PropTypes.func,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        onPress: emptyFunction,
    };

    render() {
        const {testID, user, onPress, theme} = this.props;
        const {first_name: firstName, last_name: lastName} = user;
        const style = getStyleSheet(theme);

        let fullName;
        if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`;
        } else if (firstName) {
            fullName = firstName;
        } else if (lastName) {
            fullName = lastName;
        }

        return (
            <TouchableOpacity
                testID={testID}
                onPress={onPress}
            >
                <View style={style.container}>
                    <ProfilePicture
                        size={48}
                        iconSize={28}
                        showStatus={false}
                        userId={user.id}
                        testID={`${testID}.profile_picture`}
                    />
                    <View style={style.wrapper}>
                        <View>
                            <Text
                                style={style.username}
                                numberOfLines={1}
                            >
                                {`@${user.username}`}
                            </Text>
                        </View>
                        {Boolean(fullName) &&
                        <View>
                            <Text
                                style={style.fullName}
                                numberOfLines={1}
                            >
                                {fullName}
                            </Text>
                        </View>
                        }
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            alignItems: 'center',
            padding: 15,
            flexDirection: 'row',
        },
        wrapper: {
            flex: 1,
            marginLeft: 10,
        },
        username: {
            color: theme.centerChannelColor,
            marginVertical: 5,
            fontWeight: '600',
            fontSize: 15,
        },
        fullName: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 15,
        },
    };
});
