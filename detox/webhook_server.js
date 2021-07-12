// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable camelcase, no-console */

const axios = require('axios');
var ClientOAuth2 = require('client-oauth2');
const express = require('express');

const postMessageAs = require('./e2e/plugins/post_message_as');
const webhookUtils = require('./e2e/utils/webhook_utils');
const port = 3000;

const {
    SITE_URL,
    WEBHOOK_BASE_URL,
    ADMIN_USERNAME,
    ADMIN_PASSWORD,
} = process.env; // eslint-disable-line no-process-env

const server = express();
server.use(express.json());
server.use(express.urlencoded({extended: true}));

process.title = process.argv[2];

server.get('/', ping);
server.post('/message_menus', postMessageMenus);
server.post('/dialog_request', onDialogRequest);
server.post('/simple_dialog_request', onSimpleDialogRequest);
server.post('/user_and_channel_dialog_request', onUserAndChannelDialogRequest);
server.post('/dialog_submit', onDialogSubmit);
server.post('/boolean_dialog_request', onBooleanDialogRequest);
server.post('/slack_compatible_message_response', postSlackCompatibleMessageResponse);
server.post('/send_message_to_channel', postSendMessageToChannel);
server.post('/post_outgoing_webhook', postOutgoingWebhook);
server.post('/send_oauth_credentials', postSendOauthCredentials);
server.get('/start_oauth', getStartOAuth);
server.get('/complete_oauth', getCompleteOauth);
server.post('/postOAuthMessage', postOAuthMessage);

function ping(req, res) {
    const baseUrl = SITE_URL || 'http://localhost:8065';
    const webhookBaseUrl = WEBHOOK_BASE_URL || 'http://localhost:3000';

    return res.json({
        message: 'I\'m alive!',
        baseUrl,
        webhookBaseUrl,
    });
}

server.listen(port, () => console.log(`Webhook test server listening on port ${port}!`));

let appID;
let appSecret;
let client;
let authedUser;
function postSendOauthCredentials(req, res) {
    appID = req.body.appID.trim();
    appSecret = req.body.appSecret.trim();
    client = new ClientOAuth2({
        clientId: appID,
        clientSecret: appSecret,
        authorizationUri: getBaseUrl() + '/oauth/authorize',
        accessTokenUri: getBaseUrl() + '/oauth/access_token',
        redirectUri: getWebhookBaseUrl() + '/complete_oauth',
    });
    return res.status(200).send('OK');
}

function getStartOAuth(req, res) {
    return res.redirect(client.code.getUri());
}

function getCompleteOauth(req, res) {
    client.code.getToken(req.originalUrl).then((user) => {
        authedUser = user;
        return res.status(200).send('OK');
    }).catch((reason) => {
        return res.status(reason.status).send(reason);
    });
}

async function postOAuthMessage(req, res) {
    const {channelId, message, rootId, createAt} = req.body;
    const apiUrl = getBaseUrl() + '/api/v4/posts';
    authedUser.sign({
        method: 'post',
        url: apiUrl,
    });
    try {
        await axios({
            url: apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                Authorization: 'Bearer ' + authedUser.accessToken,
            },
            method: 'post',
            data: {
                channel_id: channelId,
                message,
                type: '',
                create_at: createAt,
                parent_id: rootId,
                root_id: rootId,
            },
        });
    } catch (err) {
        // Do nothing
    }
    return res.status(200).send('OK');
}

function postSlackCompatibleMessageResponse(req, res) {
    const {spoiler, skipSlackParsing} = req.body.context;

    res.setHeader('Content-Type', 'application/json');
    return res.json({
        ephemeral_text: spoiler,
        skip_slack_parsing: skipSlackParsing,
    });
}

function postMessageMenus(req, res) {
    let responseData = {};
    const {body} = req;
    if (body && body.context.action === 'do_something') {
        responseData = {
            ephemeral_text: `Ephemeral | ${body.type} ${body.data_source} option: ${body.context.selected_option}`,
        };
    }

    res.setHeader('Content-Type', 'application/json');
    return res.json(responseData);
}

async function openDialog(dialog) {
    const baseUrl = getBaseUrl();
    await axios({
        method: 'post',
        url: `${baseUrl}/api/v4/actions/dialogs/open`,
        data: dialog,
    });
}

function onDialogRequest(req, res) {
    const {body} = req;
    if (body.trigger_id) {
        const webhookBaseUrl = getWebhookBaseUrl();
        const dialog = webhookUtils.getFullDialog(body.trigger_id, webhookBaseUrl);
        openDialog(dialog);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.json({text: 'Full dialog triggered via slash command!'});
}

function onSimpleDialogRequest(req, res) {
    const {body} = req;
    if (body.trigger_id) {
        const webhookBaseUrl = getWebhookBaseUrl();
        const dialog = webhookUtils.getSimpleDialog(body.trigger_id, webhookBaseUrl);
        openDialog(dialog);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.json({text: 'Simple dialog triggered via slash command!'});
}

function onUserAndChannelDialogRequest(req, res) {
    const {body} = req;
    if (body.trigger_id) {
        const webhookBaseUrl = getWebhookBaseUrl();
        const dialog = webhookUtils.getUserAndChannelDialog(body.trigger_id, webhookBaseUrl);
        openDialog(dialog);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.json({text: 'Simple dialog triggered via slash command!'});
}

function onBooleanDialogRequest(req, res) {
    const {body} = req;
    if (body.trigger_id) {
        const webhookBaseUrl = getWebhookBaseUrl();
        const dialog = webhookUtils.getBooleanDialog(body.trigger_id, webhookBaseUrl);
        openDialog(dialog);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.json({text: 'Simple dialog triggered via slash command!'});
}

function onDialogSubmit(req, res) {
    const {body} = req;

    res.setHeader('Content-Type', 'application/json');

    let message;
    if (body.cancelled) {
        message = 'Dialog cancelled';
        sendSysadminResponse(message, body.channel_id);
    } else {
        message = 'Dialog submitted';
        sendSysadminResponse(message, body.channel_id);
    }

    return res.json({text: message});
}

/**
 * @route "POST /send_message_to_channel?type={messageType}&channel_id={channelId}"
 * @query type - message type of empty string for regular message if not provided (default), "system_message", etc
 * @query channel_id - channel where to send the message
 */
function postSendMessageToChannel(req, res) {
    const channelId = req.query.channel_id;
    const response = {
        response_type: 'in_channel',
        text: 'Extra response 2',
        channel_id: channelId,
        extra_responses: [{
            response_type: 'in_channel',
            text: 'Hello World',
            channel_id: channelId,
        }],
    };

    if (req.query.type) {
        response.type = req.query.type;
    }

    res.json(response);
}

function getWebhookBaseUrl() {
    return WEBHOOK_BASE_URL || 'http://localhost:3000';
}

function getBaseUrl() {
    return SITE_URL || 'http://localhost:8065';
}

// Convenient way to send response in a channel by using sysadmin account
function sendSysadminResponse(message, channelId) {
    const username = ADMIN_USERNAME || 'sysadmin';
    const password = ADMIN_PASSWORD || 'Sys@dmin-sample1';
    const baseUrl = getBaseUrl();
    postMessageAs({sender: {username, password}, message, channelId, baseUrl});
}

const responseTypes = ['in_channel', 'comment'];

function getWebhookResponse(body, {responseType, username, iconUrl}) {
    const payload = Object.entries(body).map(([key, value]) => `- ${key}: "${value}"`).join('\n');

    return `
\`\`\`
#### Outgoing Webhook Payload
${payload}
#### Webhook override to Mattermost instance
- response_type: "${responseType}"
- type: ""
- username: "${username}"
- icon_url: "${iconUrl}"
\`\`\`
`;
}

/**
 * @route "POST /post_outgoing_webhook?override_username={username}&override_icon_url={iconUrl}&response_type={comment}"
 * @query override_username - the user name that overrides the user name defined by the outgoing webhook
 * @query override_icon_url - the user icon url that overrides the user icon url defined by the outgoing webhook
 * @query response_type - "in_channel" (default) or "comment"
 */
function postOutgoingWebhook(req, res) {
    const {body, query} = req;
    if (!body) {
        res.status(404).send({error: 'Invalid data'});
    }

    const responseType = query.response_type || responseTypes[0];
    const username = query.override_username || '';
    const iconUrl = query.override_icon_url || '';

    const response = {
        text: getWebhookResponse(body, {responseType, username, iconUrl}),
        username,
        icon_url: iconUrl,
        type: '',
        response_type: responseType,
    };
    res.status(200).send(response);
}
