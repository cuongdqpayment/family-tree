
"use strict"

const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const tokenProxy = require('../utils/token-proxy');

//gui chuoi json nhan duoc len authen server nhan ket qua, tra lai user
router.post('/authorize-token'
            , postHandler.jsonProcess //lay jsonProcess truong hop khong dung interceptor
            , tokenProxy.getToken
            , tokenProxy.verifyProxyToken
            , tokenProxy.getVerifiedToken
            );

module.exports = router;