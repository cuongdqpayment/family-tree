"use strict"
/**
 * ver 2.0
 * Date: 17/06/2019
 * By cuong.dq
 */


/**
 * upload-files; list-files; get-file
 * sys,func,dir/file_name,file_type,file_date,file_size/ip,user,time,status
 * 
 */

const router = require('express').Router();

const postHandler = require('../../utils/post-handler');
const tokenProxy = require('../../utils/token-proxy');

let handlers = require('../../handlers/medias/media-handler');


//---------------start administrator-------------//
//quản trị phân quyền by cuong.dq
const adminHandler = require("../../handlers/medias/admin-handler");

/**
 * Dưới đây là phần phân quyền hệ thống 
 * Tạo bởi cuong.dq
 * */

//Lấy menu để phân quyền
router.get('/get-menus'
, adminHandler.getMenus
);

//lấy chức năng để phân quyền
router.get('/get-functions'
, adminHandler.getFunctions
);

//lấy cấu trúc bảng của cơ sở dữ liệu để tạo trên máy di động
router.get('/get-tables'
, adminHandler.getTables
);

//lấy cấu trúc tổ chức
router.get('/get-organizations'
, adminHandler.getOrganizations
);

//lấy danh sách user để phân quyền
router.get('/get-users'
, adminHandler.getUsers
);


//lấy menu của user được phân quyền
router.get('/get-menu'
, tokenProxy.getTokenNext //req.token
, tokenProxy.verifyProxyTokenNext //req.user
, adminHandler.checkPrivilege      
, adminHandler.getUserMenu
);

router.post('/edit-user' //chỉ có user được phân quyền hoặc quản trị hệ thống mới được sửa
, postHandler.jsonProcess //lay json_data
, tokenProxy.getToken   //req.token
, tokenProxy.verifyProxyToken //req.user
, adminHandler.setFunctionFromPath //thiet lap chuc nang tu pathName
, adminHandler.checkFunctionRole   //kiem tra quyen co khong de cho phep
, adminHandler.editUser    //ghi xuong csdl
);   //ok


router.get('/get-your-roles' //lấy quyền của user được cấp
, tokenProxy.getTokenNext
, tokenProxy.verifyProxyTokenNext
, adminHandler.getYourRoles
);

//---------------end administrator-------------//



//Xác thực proxy gộp chung cùng /media/db/authorize-token
router.post('/authorize-token'
            , postHandler.jsonProcess //lay jsonProcess truong hop khong dung interceptor
            , tokenProxy.getToken
            , tokenProxy.verifyProxyToken
            , tokenProxy.getVerifiedToken
            );


router.get('/get-file/*'
    //, tokenProxy.getToken
    //, tokenProxy.verifyProxyToken
    , handlers.getMediaFile
); 

router.get('/get-private'
    , tokenProxy.getToken
    , tokenProxy.verifyProxyToken
    , handlers.getPrivateFile
    , handlers.getAnyImageFile
); 


router.get('/list-files'
    , tokenProxy.getToken
    , tokenProxy.verifyProxyToken
    , handlers.getMediaList
    );   
    
    //get publics files
router.get('/public-files'
    , handlers.getMediaList
    );   

router.post('/public-files'
    , postHandler.jsonProcess //lay du lieu req.json_data.friends/follows/publics/limit/offset
    , tokenProxy.getTokenNext   //lay du lieu req.token neu co, 
    , tokenProxy.verifyProxyTokenNext //lay req.user tu req.token new co
    , handlers.postMediaListAll //lay tin tuc tu req.user?, publics, follows, friends, 
);       
    
    
router.get('/list-groups'
    , tokenProxy.getToken
    , tokenProxy.verifyProxyToken
    , handlers.getGroupList
    );   
    
router.get('/public-groups'
    , handlers.getGroupList
    );   
    

router.post('/public-groups'
        , postHandler.jsonProcess //lay du lieu req.json_data.friends/follows/publics/limit/offset
        , tokenProxy.getTokenNext   //lay du lieu req.token neu co, 
        , tokenProxy.verifyProxyTokenNext //lay req.user tu req.token neu co
        , handlers.postGroupListAll //lay tin tuc tu req.user?, publics, follows, friends, 
    );   

router.post('/upload-files'
    , tokenProxy.getToken          //lay req.token
    , tokenProxy.verifyProxyToken  //lay req.user
    , postHandler.formProcess        //lay req.form_data
    , handlers.postMediaFiles        //luu csdl
);

/**
 * Lưu ảnh nền và ảnh đại diện
 */

router.post('/set-function'
    , tokenProxy.getToken          //lay req.token
    , tokenProxy.verifyProxyToken  //lay req.user
    , postHandler.jsonProcess        //lay req.json_data
    , handlers.postSetFunction        //luu csdl
);

//Ghi ảnh avatar và background
router.post('/upload-image'
    , tokenProxy.getToken          //lay req.token
    , tokenProxy.verifyProxyToken  //lay req.user
    , postHandler.formProcess      //lay req.form_data
    , handlers.uploadAvatarBackground  //Lưu ảnh avatar hoặc ảnh background
);

module.exports = router;