// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import 'intl';
import moment from 'moment';
import {addLocaleData} from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';

import en from '@assets/i18n/en.json';

import availableLanguages from './languages';

export const DEFAULT_LOCALE = 'en';

addLocaleData(enLocaleData);

function loadTranslation(locale) {
    try {
        let translations;
        let localeData;
        let momentData;
        switch (locale) {
        case 'bg':
            translations = require('@assets/i18n/bg.json');
            localeData = require('react-intl/locale-data/bg');
            momentData = require('moment/locale/bg');
            break;
        case 'de':
            translations = require('@assets/i18n/de.json');
            localeData = require('react-intl/locale-data/de');
            momentData = require('moment/locale/de');
            break;
        case 'en-AU':
            translations = require('@assets/i18n/en_AU.json');
            localeData = require('react-intl/locale-data/en');
            momentData = require('moment/locale/en-au');
            break;
        case 'es':
            translations = require('@assets/i18n/es.json');
            localeData = require('react-intl/locale-data/es');
            momentData = require('moment/locale/es');
            break;
        case 'fr':
            translations = require('@assets/i18n/fr.json');
            localeData = require('react-intl/locale-data/fr');
            momentData = require('moment/locale/fr');
            break;
        case 'hu':
            translations = require('@assets/i18n/hu.json');
            localeData = require('react-intl/locale-data/hu');
            momentData = require('moment/locale/hu');
            break;
        case 'it':
            translations = require('@assets/i18n/it.json');
            localeData = require('react-intl/locale-data/it');
            momentData = require('moment/locale/it');
            break;
        case 'ja':
            translations = require('@assets/i18n/ja.json');
            localeData = require('react-intl/locale-data/ja');
            momentData = require('moment/locale/ja');
            break;
        case 'ko':
            translations = require('@assets/i18n/ko.json');
            localeData = require('react-intl/locale-data/ko');
            momentData = require('moment/locale/ko');
            break;
        case 'nl':
            translations = require('@assets/i18n/nl.json');
            localeData = require('react-intl/locale-data/nl');
            momentData = require('moment/locale/nl');
            break;
        case 'pl':
            translations = require('@assets/i18n/pl.json');
            localeData = require('react-intl/locale-data/pl');
            momentData = require('moment/locale/pl');
            break;
        case 'pt-BR':
            translations = require('@assets/i18n/pt-BR.json');
            localeData = require('react-intl/locale-data/pt');
            momentData = require('moment/locale/pt-br');
            break;
        case 'ro':
            translations = require('@assets/i18n/ro.json');
            localeData = require('react-intl/locale-data/ro');
            momentData = require('moment/locale/ro');
            break;
        case 'ru':
            translations = require('@assets/i18n/ru.json');
            localeData = require('react-intl/locale-data/ru');
            momentData = require('moment/locale/ru');
            break;
        case 'sv':
            translations = require('@assets/i18n/sv.json');
            localeData = require('react-intl/locale-data/sv');
            momentData = require('moment/locale/sv');
            break;
        case 'tr':
            translations = require('@assets/i18n/tr.json');
            localeData = require('react-intl/locale-data/tr');
            momentData = require('moment/locale/tr');
            break;
        case 'uk':
            translations = require('@assets/i18n/uk.json');
            localeData = require('react-intl/locale-data/uk');
            momentData = require('moment/locale/uk');
            break;
        case 'zh-CN':
            translations = require('@assets/i18n/zh-CN.json');
            localeData = require('react-intl/locale-data/zh');
            momentData = require('moment/locale/zh-cn');
            break;
        case 'zh-TW':
            translations = require('@assets/i18n/zh-TW.json');
            localeData = require('react-intl/locale-data/zh');
            momentData = require('moment/locale/zh-tw');
            break;
        default:
            translations = en;
            localeData = enLocaleData;
            break;
        }

        if (localeData) {
            addLocaleData(localeData);
        }

        if (momentData) {
            moment.updateLocale(locale.toLowerCase(), momentData);
        } else {
            resetMomentLocale();
        }
        return translations;
    } catch (e) {
        console.error('NO Translation found', e); //eslint-disable-line no-console
        return en;
    }
}

export function getLocaleFromLanguage(lang) {
    const languageCode = lang.split('-')[0];
    const locale = availableLanguages[lang] || languageCode;
    return locale;
}

export function resetMomentLocale() {
    moment.locale(DEFAULT_LOCALE);
}

export function getTranslations(locale) {
    return loadTranslation(locale);
}

export function getLocalizedMessage(lang, id) {
    const locale = getLocaleFromLanguage(lang);
    const translations = getTranslations(locale);

    return translations[id];
}
