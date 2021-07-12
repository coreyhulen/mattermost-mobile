// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {ScrollView, View} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {popTopScreen} from '@actions/navigation';
import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import TextInputWithLocalizedPlaceholder from '@components/text_input_with_localized_placeholder';
import {
    changeOpacity,
    makeStyleSheetFromTheme,
    getKeyboardAppearanceFromTheme,
} from '@utils/theme';

export default class NotificationSettingsMentionsKeywords extends PureComponent {
    static propTypes = {
        keywords: PropTypes.string,
        onBack: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            keywords: props.keywords,
        };
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidAppear() {
        if (this.keywordsInput) {
            this.keywordsInput.focus();
        }
    }

    componentDidDisappear() {
        this.props.onBack(this.state.keywords);
    }

    handleSubmit = () => {
        popTopScreen();
    };

    keywordsRef = (ref) => {
        this.keywordsInput = ref;
    };

    onKeywordsChangeText = (keywords) => {
        return this.setState({keywords});
    };

    render() {
        const {theme} = this.props;
        const {keywords} = this.state;

        const style = getStyleSheet(theme);
        return (
            <SafeAreaView
                edges={['left', 'right']}
                style={style.container}
            >
                <StatusBar/>
                <ScrollView
                    contentContainerStyle={style.wrapper}
                    alwaysBounceVertical={false}
                >
                    <View style={style.inputContainer}>
                        <TextInputWithLocalizedPlaceholder
                            ref={this.keywordsRef}
                            value={keywords}
                            blurOnSubmit={true}
                            onChangeText={this.onKeywordsChangeText}
                            onSubmitEditing={this.handleSubmit}
                            multiline={true}
                            numberOfLines={1}
                            style={style.input}
                            autoCapitalize='none'
                            autoCorrect={false}
                            placeholder={{id: 'mobile.notification_settings_mentions.keywordsDescription', defaultMessage: 'Other words that trigger a mention'}}
                            placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.4)}
                            returnKeyType='done'
                            keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                        />
                    </View>
                    <View style={style.helpContainer}>
                        <FormattedText
                            id='mobile.notification_settings_mentions.keywordsHelp'
                            defaultMessage='Keywords are non-case sensitive and should be separated by a comma.'
                            style={style.help}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
        },
        wrapper: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            flex: 1,
            paddingTop: 35,
        },
        inputContainer: {
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
            backgroundColor: theme.centerChannelBg,
        },
        input: {
            color: theme.centerChannelColor,
            fontSize: 15,
            height: 150,
            paddingVertical: 10,
            paddingHorizontal: 15,
        },
        helpContainer: {
            marginTop: 10,
            paddingHorizontal: 15,
        },
        help: {
            color: changeOpacity(theme.centerChannelColor, 0.4),
            fontSize: 13,
        },
    };
});
