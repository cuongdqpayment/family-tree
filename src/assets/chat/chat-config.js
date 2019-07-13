module.exports = {
    userType: '$U#',
    roomType: '$R#',
    client_join_room:'verify-user-room-token',
    server_reply_room: 'server-send-room-chating',
    client_send_message: 'client-send-message',
    server_emit_message: 'server-emit-message',
    client_send_old_message_to_new_user: 'client-send-old-message',
    server_emit_old_message_to_new_user: 'server-emit-old-message',

    server_emit_users_change: 'server-emit-users-change',
    server_send_user_left: 'server_send_user_left',
    client_send_session_to_new_user: 'client_send_session_to_new_user',
    server_emit_old_user_to_new_user: 'server_emit_old_user_to_new_user',
    
    event_login:'event-login-ok',
    event_register_room: 'register-chat-rooms',
    event_change_room:'change-room',
    event_joined_room:'joined-room',
    event_logout: 'logout',
    event_chat_setting: 'event_chat_setting',
    event_chat_search: 'event_chat_search',
    event_chat_add_group:'event_chat_add_group',

  };