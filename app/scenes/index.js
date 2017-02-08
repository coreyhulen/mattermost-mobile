// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import Channel from './channel';
import ChannelDrawer from './channel_drawer';
import ChannelInfo from './channel_info';
import ChannelMembers from './channel_members';
import ChannelAddMembers from './channel_add_members';
import LoadTeam from './load_team';
import Login from './login/login_container.js';
import Mfa from './mfa';
import RightMenuDrawer from './right_menu_drawer';
import Root from './root/root_container.js';
import Search from './search/search_container.js';
import SelectServer from './select_server/select_server_container.js';
import SelectTeam from './select_team/select_team_container.js';
import Thread from './thread';

module.exports = {
    ChannelView: Channel, // Special case the name for this one to avoid ambiguity
    ChannelDrawer,
    ChannelInfo,
    ChannelMembers,
    ChannelAddMembers,
    LoadTeam,
    Login,
    Mfa,
    RightMenuDrawer,
    Root,
    Search,
    SelectServer,
    SelectTeam,
    Thread
};
