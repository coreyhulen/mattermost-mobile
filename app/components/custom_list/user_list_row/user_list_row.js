// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import ProfilePicture from 'app/components/profile_picture';
import {makeStyleSheetFromTheme, changeOpacity} from 'app/utils/theme';

import CustomListRow from 'app/components/custom_list/custom_list_row';

import {displayUsername} from 'mattermost-redux/utils/user_utils';

export default class UserListRow extends React.PureComponent {
    static propTypes = {
        id: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
        user: PropTypes.object.isRequired,
        teammateNameDisplay: PropTypes.string.isRequired,
        ...CustomListRow.propTypes
    };

    render() {
        const style = getStyleFromTheme(this.props.theme);

        return (
            <CustomListRow {...this.props}>
                <ProfilePicture
                    user={this.props.user}
                    size={32}
                />
                <View style={style.textContainer}>
                    <View>
                        <Text style={style.displayName}>
                            {displayUsername(this.props.user, this.props.teammateNameDisplay)}
                        </Text>
                    </View>
                    <View>
                        <Text
                            style={style.username}
                            ellipsizeMode='tail'
                            numberOfLines={1}
                        >
                            {`(@${this.props.user.username})`}
                        </Text>
                    </View>
                </View>
            </CustomListRow>
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            height: 65,
            paddingHorizontal: 15,
            alignItems: 'center',
            backgroundColor: theme.centerChannelBg
        },
        displayName: {
            fontSize: 15,
            color: theme.centerChannelColor
        },
        icon: {
            fontSize: 20,
            color: theme.centerChannelColor
        },
        textContainer: {
            flexDirection: 'row',
            marginLeft: 5
        },
        username: {
            marginLeft: 5,
            fontSize: 15,
            color: changeOpacity(theme.centerChannelColor, 0.5)
        },
        selector: {
            height: 28,
            width: 28,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#888',
            alignItems: 'center',
            justifyContent: 'center'
        },
        selectorContainer: {
            height: 50,
            paddingRight: 15,
            alignItems: 'center',
            justifyContent: 'center'
        },
        selectorDisabled: {
            backgroundColor: '#888'
        },
        selectorFilled: {
            backgroundColor: '#378FD2',
            borderWidth: 0
        }
    });
});
