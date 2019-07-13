const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const publicHandler = require('../handlers/public-handler');

//cap key khi co token xac thuc bang isdn
router.get('/your-device'
                        , publicHandler.getYourDevice
                        , publicHandler.returnDevice
                        );

router.get('/shot-info-url'
                        , publicHandler.returnShotInfoUrl
                        );

router.get('/shot-screen-url'
                        , publicHandler.returnShotScreenUrl
                        , publicHandler.returnShotScreenJson
                        );

module.exports = router;