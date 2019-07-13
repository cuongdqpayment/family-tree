/**
 * Điều hướng tin tức
 * ver 2.0
 * by Cuong.dq 12/06/2019
 * 
 */
const router = require('express').Router();

const postHandler = require('../../utils/post-handler');
const tokenHandler = require('../../utils/token-proxy');

const handlers  = require('../../handlers/news/social-handler');

//co so du lieu nghiep vu
const adminHandler  = require('../../handlers/medias/admin-handler');


router.get('/get-home'
   , handlers.getHome                   //Lấy nội dung tiêu đề trang chủ
);

router.get('/get-file/*'
    , tokenHandler.getTokenNext          //lay req.token (nếu có)
    , tokenHandler.verifyProxyTokenNext  //lay req.user (nếu có)
    , handlers.getFile                   //Lấy file
);

router.get('/list-news'
    , tokenHandler.getPublicUser     //lấy các user public
    , postHandler.jsonProcess        //lay req.json_data
    , tokenHandler.getTokenNext          //lay req.token (nếu có)
    , tokenHandler.verifyProxyTokenNext  //lay req.user (nếu có)
    , handlers.listNewsSocial        //Lấy thông tin từ bảng news
);


router.post('/list-news'
    , tokenHandler.getPublicUser     //lấy các user public
    , postHandler.jsonProcess        //lay req.json_data
    , tokenHandler.getTokenNext          //lay req.token (nếu có)
    , tokenHandler.verifyProxyTokenNext  //lay req.user (nếu có)
    , handlers.listNewsSocial        //Lấy thông tin từ bảng news
);

router.post('/post-news'
    , tokenHandler.getToken          //lay req.token
    , tokenHandler.verifyProxyToken  //lay req.user
    , postHandler.formProcess        //lay req.form_data
    , handlers.postNewsSocial        //luu csdl
    , handlers.responseNewsId        //trả kết quả cho người dùng
);

router.post('/post-welcome'
    , tokenHandler.getToken          //lay req.token
    , tokenHandler.verifyProxyToken  //lay req.user
    , postHandler.formProcess        //lay req.form_data
    , handlers.postNewsSocial        //luu csdl tin tức
    //chuyen csdl nghiep vu lay menu
    , adminHandler.postNewsWelcome  //lấy địa chỉ email và mã đơn vị từ req.form_data khi post lên trả next()
    , adminHandler.checkPrivilege   //kiểm tra user và lấy menu như quá trình lấy menu trước   
    , adminHandler.getUserMenu
);

router.post('/delete-news'
    , tokenHandler.getToken          //lay req.token
    , tokenHandler.verifyProxyToken  //lay req.user
    , postHandler.jsonProcess        //lay req.json_data
    , handlers.updateNewsId          //update trạng thái của bảng tin này
    , handlers.responseNewsId        //Trả tin tức về
);



module.exports = router;