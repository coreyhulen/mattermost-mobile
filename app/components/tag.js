// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {View, ViewPropTypes} from 'react-native';

import FormattedText from '@components/formatted_text';
import {t} from '@utils/i18n';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export function BotTag(props) {
    const id = t('post_info.bot');
    const defaultMessage = 'BOT';

    return (
        <Tag
            id={id}
            defaultMessage={defaultMessage}
            {...props}
        />
    );
}

export function GuestTag(props) {
    const id = t('post_info.guest');
    const defaultMessage = 'GUEST';

    return (
        <Tag
            id={id}
            defaultMessage={defaultMessage}
            {...props}
        />
    );
}

export default class Tag extends PureComponent {
    static propTypes = {
        id: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string.isRequired,
        inTitle: PropTypes.bool,
        show: PropTypes.bool,
        style: ViewPropTypes.style,
        testID: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        show: true,
    };

    render() {
        if (!this.props.show) {
            return null;
        }
        const style = createStyleSheet(this.props.theme);

        return (
            <View style={[style.container, this.props.style]}>
                <FormattedText
                    id={this.props.id}
                    defaultMessage={this.props.defaultMessage}
                    style={[style.text, this.props.inTitle ? style.title : null]}
                    testID={this.props.testID}
                />
            </View>
        );
    }
}

const createStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            alignSelf: 'center',
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.15),
            borderRadius: 2,
            marginRight: 2,
            marginBottom: 1,
            marginLeft: 2,
            paddingVertical: 2,
            paddingHorizontal: 4,
        },
        text: {
            color: theme.centerChannelColor,
            fontSize: 10,
            fontWeight: '600',
        },
        title: {
            backgroundColor: changeOpacity(theme.sidebarHeaderTextColor, 0.15),
            color: changeOpacity(theme.sidebarHeaderTextColor, 0.6),
        },
    };
});
