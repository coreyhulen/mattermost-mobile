// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {SafeAreaView, View, StatusBar} from 'react-native';
import React from 'react';
import {intlShape, injectIntl} from 'react-intl';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import {
    Navigation,
    NavigationButtonPressedEvent,
    NavigationComponent,
    NavigationComponentProps,
    Options,
    OptionsTopBarButton,
} from 'react-native-navigation';

import {Theme} from '@mm-redux/types/preferences';
import {CustomStatusDuration} from '@mm-redux/types/users';
import {makeStyleSheetFromTheme, changeOpacity} from '@utils/theme';

import {mergeNavigationOptions, popTopScreen} from 'app/actions/navigation';
import ClearAfterMenuItem from './clear_after_menu_item';
interface Props extends NavigationComponentProps {
    intl: typeof intlShape;
    theme: Theme;
    handleClearAfterClick: (duration: CustomStatusDuration, expiresAt: string) => void;
    initialDuration: CustomStatusDuration;
}

type State = {
    duration: CustomStatusDuration;
    expiresAt: string;
    showExpiryTime: boolean;
}

const {DATE_AND_TIME} = CustomStatusDuration;
class ClearAfterModal extends NavigationComponent<Props, State> {
    rightButton: OptionsTopBarButton = {
        id: 'update-custom-status-clear-after',
        testID: 'clear_after.done.button',
        enabled: true,
        showAsAction: 'always',
    };

    static options(): Options {
        return {
            topBar: {
                title: {
                    alignment: 'center',
                },
            },
        };
    }

    constructor(props: Props) {
        super(props);
        this.rightButton.text = props.intl.formatMessage({
            id: 'mobile.custom_status.modal_confirm',
            defaultMessage: 'Done',
        });

        this.rightButton.color = props.theme.sidebarHeaderTextColor;
        const options: Options = {
            topBar: {
                rightButtons: [this.rightButton],
            },
        };

        mergeNavigationOptions(props.componentId, options);

        this.state = {
            duration: props.initialDuration,
            expiresAt: '',
            showExpiryTime: false,
        };
    }

    componentDidMount() {
        Navigation.events().bindComponent(this);
    }

    navigationButtonPressed({buttonId}: NavigationButtonPressedEvent) {
        switch (buttonId) {
        case 'update-custom-status-clear-after':
            this.onDone();
            break;
        }
    }

    onDone = () => {
        this.props.handleClearAfterClick(this.state.duration, this.state.expiresAt);
        popTopScreen();
    };

    handleItemClick = (duration: CustomStatusDuration, expiresAt: string) =>
        this.setState({
            duration,
            expiresAt,
            showExpiryTime: duration === DATE_AND_TIME && expiresAt !== '',
        });

    renderClearAfterMenu = () => {
        const {theme} = this.props;
        const style = getStyleSheet(theme);
        const {duration} = this.state;

        const clearAfterMenu = Object.values(CustomStatusDuration).map(
            (item, index, arr) => {
                if (index === arr.length - 1) {
                    return null;
                }

                return (
                    <ClearAfterMenuItem
                        key={item}
                        handleItemClick={this.handleItemClick}
                        duration={item}
                        theme={theme}
                        separator={index !== arr.length - 2}
                        isSelected={duration === item}
                    />
                );
            },
        );

        if (clearAfterMenu.length === 0) {
            return null;
        }

        return (
            <View testID='clear_after.menu'>
                <View style={style.block}>{clearAfterMenu}</View>
            </View>
        );
    };

    render() {
        const {theme} = this.props;
        const style = getStyleSheet(theme);
        const {duration, expiresAt, showExpiryTime} = this.state;
        return (
            <SafeAreaView
                testID='clear_after.screen'
                style={style.container}
            >
                <StatusBar/>
                <KeyboardAwareScrollView bounces={false}>
                    <View style={style.scrollView}>
                        {this.renderClearAfterMenu()}
                    </View>
                    <View style={style.block}>
                        <ClearAfterMenuItem
                            handleItemClick={this.handleItemClick}
                            duration={DATE_AND_TIME}
                            theme={theme}
                            separator={false}
                            isSelected={duration === DATE_AND_TIME && expiresAt === ''}
                            showExpiryTime={showExpiryTime}
                            showDateTimePicker={duration === DATE_AND_TIME}
                        />
                    </View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
        );
    }
}

export default injectIntl(ClearAfterModal);

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
        },
        scrollView: {
            flex: 1,
            paddingTop: 32,
            paddingBottom: 32,
        },
        block: {
            borderBottomColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderBottomWidth: 1,
            borderTopColor: changeOpacity(theme.centerChannelColor, 0.1),
            borderTopWidth: 1,
        },
    };
});
