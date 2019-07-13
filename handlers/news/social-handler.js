"use strict"

/**
 * 
 * ver social 7.0 21/06/2019
 * thêm trường content_cache để ghi nội dung biên dịch link trước
 * Thay đổi các JSON.parse ngay khi stringify 
 * 
 * 
 * ver 2.0 
 * Bổ sung tiêu đề của trang chủ phục vụ hệ thống
 * 
 * Bộ xử lý post tin tức, lấy tin, và các thao tác trên tin như mạng xã hội thu nhỏ
 * Bao gồm một cấu trúc dữ liệu bởi file excel và tạo ra csdl social
 * Nó đi kèm với một file route
 * Đường dẫn lấy file bắt buộc phải là .../get-file/<url của file>
 * ver 1.0
 * 12/06/2019
 */

const fs = require('fs');
const mime = require('mime-types');
const systempath = require('path');

const arrObj = require('../../utils/array-object');
const htmlUtil = require('../../utils/html-util');
const db = require('../../db/sqlite3/db-pool-social');

class ResourceHandler {

    /**
     * Trả về tiêu đề của trang chủ, cho người dùng nhận dạng hệ thống
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getHome(req, res, next) {
        db.getRst("select * \
                    from home where id = 1")
            .then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(results
                    , (key, value) => {
                        if (value === null) { return undefined }
                        return value;
                    }
                ));
            })
            .catch(err => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ name: "HOME - Trang chủ" }));
            });
    }
    /**
     * Lay file bat ky tren may chu nay
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getFile(req, res, next) {

        let params = req.pathName.substring(req.pathName.indexOf("/get-file/") + 10); //'/site-manager/news/get-file/'.length);

        let fileRead = params.replace('/', systempath.sep);

        //gioi han chi doc file tu duong dan upload_files thoi nhe
        if (fileRead.indexOf("upload_files") === 0) {

            let contentType = 'image/jpeg';
            if (mime.lookup(fileRead)) contentType = mime.lookup(fileRead);

            fs.readFile(fileRead, { flag: 'r' }, function (error, data) {
                if (!error) {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end("No file to read!");
                }
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end("Not permit to read!");
        }
    }

    /**
     * Lấy chi tiết tin tức nhập vào
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    listNewsSocial(req, res, next) {

        let users = "903500888"; //default tin post của admin
        //user
        if (req.user) {
            users += (users === "" ? "" : ",") + "'" + req.user.username + "'";
        }
        //public user
        let publics = "";
        if (req.publicUsers
            && req.publicUsers
            && req.publicUsers.length > 0
            && typeof req.publicUsers === 'object'
            && req.publicUsers.constructor === Array
        ) {
            req.publicUsers.forEach(el => {
                publics += (publics === "" ? "" : ",") + "'" + el.username + "'";
            });
        }
        if (publics.length > 0) users += (users === "" ? "" : ",") + publics;

        let friends = "";
        //doc danh sach ban be cua user de lay tin
        if (friends.length > 0) users += (users === "" ? "" : ",") + friends;

        let friendOfFriends = "";
        //doc danh sach ban cua ban be cua user de lay tin
        if (friendOfFriends.length > 0) users += (users === "" ? "" : ",") + friendOfFriends;

        //follow user
        let follows = "";
        if (req.json_data
            && req.json_data.follows
            && req.json_data.follows.length > 0
            && typeof req.json_data.follows === 'object'
            && req.json_data.follows.constructor === Array
        ) {
            req.json_data.follows.forEach(el => {
                follows += (follows === "" ? "" : ",") + "'" + el + "'";
            });
        }

        if (follows.length > 0) users += (users === "" ? "" : ",") + follows;

        //console.log('users',users);

        //console.log(users);
        db.getRsts("select *\
                    from news\
                    where username in ("+ users + ")\
                    and (status=1\
                         "+ (req.user && req.user.username ? "or username='" + req.user.username + "' and status >=0" : "") + "\
                         "+ (friends.length > 0 ? "or (username in (" + friends + ") and status in (2,3))" : "") + "\
                         "+ (friendOfFriends.length > 0 ? "or (username in (" + friendOfFriends + ") and status in (3))" : "") + "\
                        )\
                    order by time desc\
                    LIMIT "+ (req.json_data && req.json_data.limit ? req.json_data.limit : 6) + "\
                    OFFSET "+ (req.json_data && req.json_data.offset ? req.json_data.offset : 0) + "\
                    ")
            .then(async results => {
                //lấy được 6 tin mới nhất mỗi lần truy vấn này
                if (results && results.length > 0) {
                    for (let idx = 0; idx < results.length; idx++) {
                        try {
                            //chuyển đổi các dữ liệu jsonString sang json trước ghi gửi trả kết quả
                            // results[idx].content_cache = results[idx].content_cache?JSON.parse(results[idx].content_cache):null;

                            // results[idx].details = JSON.parse(results[idx].details);
                            // results[idx].results = JSON.parse(results[idx].results);
                            // results[idx].actions = JSON.parse(results[idx].actions);

                            results[idx].files = await db.getRsts("select * from news_details where news_id = " + results[idx].id);
                            //chuyển đổi các jsonString sang json trong news_details trước khi trả kết quả

                            /* if (results[idx].files){
                                for (let j=0;j<results[idx].files.length; j++)
                                {
                                    results[idx].files[j].results= JSON.parse(results[idx].files[j].results);
                                    results[idx].files[j].actions= JSON.parse(results[idx].files[j].actions);
                                    results[idx].files[j].options= JSON.parse(results[idx].files[j].options);
                                }
                            } */
                            //console.log('ket qua', results[idx].files);
                        } catch (e) {
                            //console.log('Loi', e);
                        }
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(results
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        if ((
                            key === "details"
                            || key === "results"
                            || key === "actions"
                            || key === "options"
                            || key === "content_cache"
                        )
                            && value !== null && value.length > 0) { return JSON.parse(value) }
                        return value
                    }
                ));

            })
            .catch(err => {
                res.writeHead(438, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    error: err,
                    message: "Lỗi ghi mới dữ liệu"
                }
                ));
            })
    }

    /**
     * Lưu thông tin post vào csdl
     * req.user.username
     * req.form_data.params.content/status/options
     * req.form_data.files.file_i/image_i={url,options.alt/origin/type/size}
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    postNewsSocial(req, res, next) {
        //console.log('Du lieu truyen', req.form_data.files);
        let filesDetails = [];
        if (req.form_data.files) {
            for (let key in req.form_data.files) {
                filesDetails.push({
                    type: (key.indexOf('image') >= 0 ? 1 : 0), //chuyen anh hoac file don thuan
                    url: req.form_data.files[key].url,
                    content: req.form_data.files[key].options ? req.form_data.files[key].options.alt : "",
                    options: req.form_data.files[key].options ? req.form_data.files[key].options : {},
                    file_name: req.form_data.files[key].options ? req.form_data.files[key].options.origin : req.form_data.files[key].file_name,
                    file_size: req.form_data.files[key].file_size,
                    file_type: req.form_data.files[key].file_type,
                    file_date: req.form_data.files[key].options ? req.form_data.files[key].options.file_date : Date.now()
                })
            }
        }
        //co can thiet doc content de lay url va link khong???
        let groupId = req.user.username + "-" + Date.now();
        //thuc hien chuye doi content thanh noi dung html ???...
        if (req.form_data.params) {

            new Promise(async (resolve, reject) => {
                try {
                    let jsonObj = {
                        group_id: groupId,
                        content: req.form_data.params.content,

                        //Biên dịch nội dung content để ghi cache lại 
                        //gồm các link ảnh, nội dung được dịch ra (mãng thông tin bằng content_cache)
                        //nội dung cache lại không cần linkyfies trên web nếu có cache
                        content_cache: req.form_data.params.content ? JSON.stringify(await htmlUtil.linkify(req.form_data.params.content)) : null,

                        details: JSON.stringify(filesDetails),
                        results: JSON.stringify({ likes: {}, comments: {}, shares: {}, reads: {} }),
                        actions: JSON.stringify({ like: true, comment: true, share: true }),

                        device: req.clientDevice,
                        ip: req.clientIp,

                        username: req.user.username,
                        time: Date.now(),
                        status: req.form_data.params.status
                    }
                    //console.log('chuoi nay',jsonObj);


                    await db.insert(arrObj.convertSqlFromJson("news", jsonObj, []));
                    let newsId = await db.getRst("select * from news where group_id ='" + groupId + "'");
                    if (newsId && newsId.id) {

                        //chuyển trả json gốc
                        newsId.details = JSON.parse(newsId.details);
                        newsId.results = JSON.parse(newsId.results);
                        newsId.actions = JSON.parse(newsId.actions);

                        for (let i = 0; i < filesDetails.length; i++) {
                            let jsonDetail = {
                                news_id: newsId.id,
                                results: JSON.stringify({ likes: {}, comments: {}, shares: {}, reads: {} }),
                                actions: JSON.stringify({ like: true, comment: true, share: true }),
                                options: JSON.stringify(filesDetails[i].options),
                                type: filesDetails[i].type,
                                url: filesDetails[i].url,
                                content: filesDetails[i].content,
                                file_name: filesDetails[i].file_name,
                                file_type: filesDetails[i].file_type,
                                file_date: filesDetails[i].file_date,
                                file_size: filesDetails[i].file_size,
                                user: req.user.username,
                                time: Date.now(),
                                status: req.form_data.params.status
                            }
                            await db.insert(arrObj.convertSqlFromJson("news_details", jsonDetail, []));
                        }
                        resolve(newsId);
                    } else {
                        reject("Can NOT insert news!");
                    }
                } catch (e) {
                    reject(e);
                }
            })
                .then(data => {
                    //data ghi nhận là bản tin vừa nhập lên
                    req.newId = data;
                    next(); //chuyển cho phiên kế tiếp lấy tin hoặc xử lý nếu có
                })
                .catch(err => {
                    res.writeHead(438, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                        error: err,
                        message: "Lỗi ghi mới dữ liệu"
                    }
                    ));
                })
        }
    }

    /**
     * Trả kết quả cho nơi nhập tin là id của bản tin hoặc lấy nội dung bản tin ra
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    responseNewsId(req, res, next) {
        //console.log(req.newId);
        db.getRst("select * from news where id = '" + req.newId + "'")
            .then(data => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(data
                    , (key, value) => {
                        if (value === null) { return undefined }
                        if ((
                            key === "details"
                            || key === "results"
                            || key === "actions"
                            || key === "content_cache"
                        )
                            && value !== null && value.length > 0) { return JSON.parse(value) }
                        return value
                    }
                ));
            })
            .catch(err => {
                res.writeHead(435, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: "Có lỗi đọc tin", error: err }
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        return value
                    }
                ));
            });
    }

    /**
     * Cập nhập trạng thái của bản tin do người dùng báo cáo lên
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    updateNewsId(req, res, next) {

        //console.log(req.json_data);

        if (req.json_data && req.json_data.id) {
            let jsonObj = {
                id: req.json_data.id,
                signature: JSON.stringify({
                    username: req.user.username,
                    device: req.clientDevice,
                    ip: req.clientIp,
                    status: req.json_data.status,
                    time: Date.now()
                }),
                status: req.json_data.status !== undefined ? req.json_data.status : -1
            }

            //console.log(jsonObj);

            req.newId = req.json_data.id; //trả cho phiên đọc lại tin

            db.update(arrObj.convertSqlFromJson("news", jsonObj, ["id"]))
                .then(data => {
                    //console.log('data',data);
                    next();
                })
                .catch(err => {
                    //console.log('loi',err);
                    next();
                });
        } else {
            //console.log('loi',err);
            next();
        }
    }
}

module.exports = new ResourceHandler()