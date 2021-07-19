// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment, {Moment} from 'moment';
import React, {useCallback, useState} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {View, TouchableOpacity} from 'react-native';

import CompassIcon from '@components/compass_icon';
import CustomStatusExpiry from '@components/custom_status/custom_status_expiry';
import CustomStatusText from '@components/custom_status/custom_status_text';
import {durationValues} from '@constants/custom_status';
import {Theme} from '@mm-redux/types/preferences';
import {CustomStatusDuration} from '@mm-redux/types/users';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import DateTimePicker from './date_time_selector';

type Props = {
    handleItemClick: (duration: CustomStatusDuration, expiresAt: string) => void;
    duration: CustomStatusDuration;
    theme: Theme;
    separator: boolean;
    isSelected: boolean;
    intl: typeof intlShape;
    showExpiryTime?: boolean;
    showDateTimePicker?: boolean;
};

const {
    DONT_CLEAR,
    THIRTY_MINUTES,
    ONE_HOUR,
    FOUR_HOURS,
    TODAY,
    THIS_WEEK,
    DATE_AND_TIME,
} = CustomStatusDuration;

const ClearAfterMenuItem = ({handleItemClick, duration, theme, separator, isSelected, intl, showExpiryTime = false, showDateTimePicker = false}: Props) => {
    const style = getStyleSheet(theme);

    const [expiry, setExpiry] = useState<string>('');

    const expiryMenuItems: { [key in CustomStatusDuration]: string } = {
        [DONT_CLEAR]: intl.formatMessage(durationValues[DONT_CLEAR]),
        [THIRTY_MINUTES]: intl.formatMessage(durationValues[THIRTY_MINUTES]),
        [ONE_HOUR]: intl.formatMessage(durationValues[ONE_HOUR]),
        [FOUR_HOURS]: intl.formatMessage(durationValues[FOUR_HOURS]),
        [TODAY]: intl.formatMessage(durationValues[TODAY]),
        [THIS_WEEK]: intl.formatMessage(durationValues[THIS_WEEK]),
        [DATE_AND_TIME]: intl.formatMessage({id: 'custom_status.expiry_dropdown.custom', defaultMessage: 'Custom'}),
    };

    const handleClick = useCallback(
        preventDoubleTap(() => {
            handleItemClick(duration, '');
        }),
        [handleItemClick, duration],
    );

    const handleCustomExpiresAtChange = (expiresAt: Moment) => {
        setExpiry(expiresAt.toISOString());
        handleItemClick(duration, expiresAt.toISOString());
    };

    return (
        <View>
            <TouchableOpacity
                testID={`clear_after.menu_item.${duration}`}
                onPress={handleClick}
            >
                <View style={style.container}>
                    <View style={style.textContainer}>
                        <CustomStatusText
                            text={expiryMenuItems[duration]}
                            theme={theme}
                            textStyle={{color: theme.centerChannelColor}}
                        />
                        {isSelected && (
                            <View style={style.rightPosition}>
                                <CompassIcon
                                    name={'check'}
                                    size={24}
                                    style={style.button}
                                />
                            </View>
                        )}
                        {showExpiryTime && expiry !== '' && (
                            <View style={style.rightPosition}>
                                <CustomStatusExpiry
                                    theme={theme}
                                    time={moment(expiry).toDate()}
                                    textStyles={style.customStatusExpiry}
                                    showTimeCompulsory={true}
                                    showToday={true}
                                />
                            </View>
                        )}
                    </View>
                </View>
                {separator && <View style={style.divider}/>}
            </TouchableOpacity>
            {showDateTimePicker && (
                <DateTimePicker
                    theme={theme}
                    handleChange={handleCustomExpiresAtChange}
                />
            )}
        </View>
    );
};

export default injectIntl(ClearAfterMenuItem);

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        container: {
            backgroundColor: theme.centerChannelBg,
            display: 'flex',
            flexDirection: 'row',
            padding: 10,
        },
        textContainer: {
            marginLeft: 5,
            marginBottom: 2,
            alignItems: 'center',
            width: '70%',
            flex: 1,
            flexDirection: 'row',
            position: 'relative',
        },
        rightPosition: {
            position: 'absolute',
            right: 14,
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            height: 1,
            marginHorizontal: 16,
        },
        button: {
            borderRadius: 1000,
            color: theme.buttonBg,
        },
        customStatusExpiry: {
            color: theme.linkColor,
        },
    };
});
