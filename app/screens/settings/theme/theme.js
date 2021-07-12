// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {intlShape} from 'react-intl';
import {Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import Preferences from '@mm-redux/constants/preferences';
import Section from '@screens/settings/section';
import SectionItem from '@screens/settings/section_item';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ThemeTile from './theme_tile';

const thumbnailImages = {
    default: require('@assets/images/themes/mattermost.png'),
    organization: require('@assets/images/themes/organization.png'),
    mattermostDark: require('@assets/images/themes/mattermost_dark.png'),
    windows10: require('@assets/images/themes/windows_dark.png'),
};

export default class Theme extends React.PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            savePreferences: PropTypes.func.isRequired,
        }).isRequired,
        allowedThemes: PropTypes.arrayOf(PropTypes.object),
        customTheme: PropTypes.object,
        isLandscape: PropTypes.bool.isRequired,
        isTablet: PropTypes.bool.isRequired,
        teamId: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
        userId: PropTypes.string.isRequired,
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    state = {
        customTheme: null,
    };

    static getDerivedStateFromProps(props, state) {
        if (!state.customTheme && props.customTheme) {
            return {
                customTheme: props.customTheme,
            };
        }
        return null;
    }

    setTheme = (key) => {
        const {
            userId,
            teamId,
            allowedThemes,
            actions: {savePreferences},
        } = this.props;
        const {customTheme} = this.state;
        const selectedTheme = allowedThemes.concat(customTheme).find((theme) => theme.key === key);

        savePreferences(userId, [{
            user_id: userId,
            category: Preferences.CATEGORY_THEME,
            name: teamId,
            value: JSON.stringify(selectedTheme),
        }]);
    };

    renderAllowedThemeTiles = () => {
        const {theme, allowedThemes, isLandscape, isTablet} = this.props;

        return allowedThemes.map((allowedTheme) => (
            <ThemeTile
                key={allowedTheme.key}
                label={(
                    <Text>
                        {allowedTheme.type}
                    </Text>
                )}
                action={this.setTheme}
                actionValue={allowedTheme.key}
                selected={allowedTheme.type.toLowerCase() === theme.type.toLowerCase()}
                theme={theme}
                imageSrc={thumbnailImages[allowedTheme.key]}
                isLandscape={isLandscape}
                isTablet={isTablet}
            />
        ));
    };

    renderCustomThemeRow = ({item}) => {
        const {theme} = this.props;

        return (
            <SectionItem
                label={(
                    <FormattedText
                        id='user.settings.display.custom_theme'
                        defaultMessage={'Custom Theme'}
                    />
                )}
                action={this.setTheme}
                actionType='select'
                actionValue={item.key}
                selected={item.type.toLowerCase() === theme.type.toLowerCase()}
                theme={theme}
            />
        );
    };

    render() {
        const {theme} = this.props;
        const {customTheme} = this.state;
        const style = getStyleSheet(theme);
        return (
            <View style={style.container}>
                <StatusBar/>
                <View style={style.wrapper}>
                    <View style={style.tilesContainer}>
                        {this.renderAllowedThemeTiles()}
                    </View>
                    {customTheme &&
                        <SafeAreaView
                            edges={['left', 'right']}
                            style={style.container}
                        >
                            <Section
                                disableHeader={true}
                                theme={theme}
                            >
                                {this.renderCustomThemeRow({item: customTheme})}
                            </Section>
                        </SafeAreaView>
                    }
                </View>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
        },
        wrapper: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            flex: 1,
            paddingTop: 35,
        },
        tilesContainer: {
            marginBottom: 30,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            backgroundColor: theme.centerChannelBg,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
    };
});
