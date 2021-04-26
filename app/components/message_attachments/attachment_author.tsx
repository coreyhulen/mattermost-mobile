// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {Alert, Text, View} from 'react-native';
import FastImage from '@components/retriable_fast_image';
import {intlShape} from 'react-intl';

import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {tryOpenURL} from '@utils/url';
import {Theme} from '@mm-redux/types/preferences';

type Props = {
    icon?: string;
    link?: string;
    name?: string;
    theme: Theme;
}
export default class AttachmentAuthor extends PureComponent<Props> {
    static contextTypes = {
        intl: intlShape.isRequired,
    };

    openLink = () => {
        const {link} = this.props;
        const {intl} = this.context;

        if (link) {
            const onError = () => {
                Alert.alert(
                    intl.formatMessage({
                        id: 'mobile.link.error.title',
                        defaultMessage: 'Error',
                    }),
                    intl.formatMessage({
                        id: 'mobile.link.error.text',
                        defaultMessage: 'Unable to open the link.',
                    }),
                );
            };

            tryOpenURL(link, onError);
        }
    };

    render() {
        const {
            icon,
            link,
            name,
            theme,
        } = this.props;

        if (!icon && !name) {
            return null;
        }

        const style = getStyleSheet(theme);

        return (
            <View style={style.container}>
                {Boolean(icon) &&
                <FastImage
                    source={{uri: icon}}
                    key='author_icon'
                    style={style.icon}
                    renderOnError={true}
                />
                }
                {Boolean(name) &&
                <Text
                    key='author_name'
                    style={[style.name, Boolean(link) && style.link]}
                    onPress={this.openLink}
                >
                    {name}
                </Text>
                }
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
            flexDirection: 'row',
        },
        name: {
            color: changeOpacity(theme.centerChannelColor, 0.5),
            fontSize: 11,
        },
        icon: {
            height: 12,
            marginRight: 3,
            width: 12,
        },
        link: {
            color: changeOpacity(theme.linkColor, 0.5),
        },
    };
});
