// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FormattedText from '@components/formatted_text';
import StatusBar from '@components/status_bar';
import Section from '@screens/settings/section';
import SectionItem from '@screens/settings/section_item';
import {t} from '@utils/i18n';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ClockDisplayBase from './clock_display_base';

export default class ClockDisplay extends ClockDisplayBase {
    render() {
        const {theme} = this.props;
        const {newMilitaryTime} = this.state;
        const style = getStyleSheet(theme);

        return (
            <SafeAreaView
                edges={['left', 'right']}
                style={style.container}
                testID='clock_display_settings.screen'
            >
                <StatusBar/>
                <View style={style.wrapper}>
                    <Section
                        disableHeader={true}
                        footerId={t('user.settings.display.preferTime')}
                        footerDefaultMessage='Select how you prefer time displayed.'
                        theme={theme}
                    >
                        <SectionItem
                            label={(
                                <FormattedText
                                    id='user.settings.display.normalClock'
                                    defaultMessage='12-hour clock (example: 4:00 PM)'
                                />
                            )}
                            action={this.setMilitaryTime}
                            actionType='select'
                            actionValue='false'
                            selected={newMilitaryTime === 'false'}
                            testID='clock_display_settings.normal_clock.action'
                            theme={theme}
                        />
                        <View style={style.divider}/>
                        <SectionItem
                            label={(
                                <FormattedText
                                    id='user.settings.display.militaryClock'
                                    defaultMessage='24-hour clock (example: 16:00)'
                                />
                            )}
                            action={this.setMilitaryTime}
                            actionType='select'
                            actionValue='true'
                            selected={newMilitaryTime === 'true'}
                            testID='clock_display_settings.military_clock.action'
                            theme={theme}
                        />
                    </Section>
                </View>
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
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
        },
    };
});
