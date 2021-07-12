// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    Keyboard,
    TouchableOpacity,
    View,
} from 'react-native';

import {showSearchModal} from '@actions/navigation';
import CompassIcon from '@components/compass_icon';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';
import {makeStyleSheetFromTheme} from '@utils/theme';

export default class ChannelSearchButton extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            clearSearch: PropTypes.func.isRequired,
        }).isRequired,
        theme: PropTypes.object,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    handlePress = preventDoubleTap(async () => {
        const {actions} = this.props;

        Keyboard.dismiss();
        await actions.clearSearch();
        showSearchModal();
    });

    render() {
        const {
            theme,
        } = this.props;

        const {formatMessage} = this.context.intl;

        const buttonDescriptor = {
            id: t('navbar.search.button'),
            defaultMessage: 'Search',
            description: 'Accessibility helper for search button in channel header.',
        };
        const accessibilityLabel = formatMessage(buttonDescriptor);

        const buttonHint = {
            id: t('navbar.search.hint'),
            defaultMessage: 'Opens the channel search modal',
            description: 'Accessibility helper for explaining what the search button in the channel header will do.',
        };
        const accessibilityHint = formatMessage(buttonHint);

        const style = getStyle(theme);

        return (
            <View style={style.container}>
                <TouchableOpacity
                    testID={'channel.search.button'}
                    accessible={true}
                    accessibilityHint={accessibilityHint}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole='button'
                    onPress={this.handlePress}
                    style={style.flex}
                >
                    <View style={style.wrapper}>
                        <CompassIcon
                            name='magnify'
                            size={24}
                            style={style.icon}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        );
    }
}

const getStyle = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            width: 40,
        },
        flex: {
            flex: 1,
        },
        wrapper: {
            position: 'relative',
            alignItems: 'flex-end',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
        },
        icon: {
            backgroundColor: theme.sidebarHeaderBg,
            color: theme.sidebarHeaderTextColor,
        },
    };
});
