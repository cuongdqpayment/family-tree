"use strict"

/**
 * ver 1.0 luu file upload cho avatar & background
 *  
 */

const fs = require('fs');
const mime = require('mime-types');
const systempath = require('path');

const arrObj = require('../../utils/array-object');

const db = require('../../db/sqlite3/db-pool');

class ResourceHandler {

    getPrivateFile(req, res, next) {
        db.getRst("select url\
                    from media_files\
                    where user = '"+ (req.paramS && req.paramS.user ? req.paramS.user : req.user && req.user.username ? req.user.username : "702418821") + "'\
                    "+ (req.paramS && req.paramS.func ? "and func='" + req.paramS.func + "'" : "and func is null") + "\
                    order by time desc\
                        LIMIT 1\
                        OFFSET 0\
                        ")
            .then(result => {
                if (result && result.url) {
                    req.file_name = result.url;
                }
                next();
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(err));
            })
    }


    getAnyImageFile(req, res, next) {

        let fileRead = (req.file_name ? req.file_name : "upload_files/noimage.png").replace('/', systempath.sep);
        let contentType = 'image/jpeg';

        if (mime.lookup(fileRead)) contentType = mime.lookup(fileRead);

        fs.readFile(fileRead, { flag: 'r' }, function (error, data) {
            if (!error) {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            } else {
                fs.readFile("upload_files/noimage.png".replace('/', systempath.sep), { flag: 'r' }, function (error, data) {
                    if (!error) {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(data);
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(JSON.stringify(error));
                    }
                })
            }
        });
    }

    getMediaFile(req, res, next) {
        let path = req.pathName
        let params = path.substring('/media/db/get-file/'.length);

        let fileRead = params.replace('/', systempath.sep);
        let contentType = 'image/jpeg';

        if (mime.lookup(fileRead)) contentType = mime.lookup(fileRead);

        fs.readFile(fileRead, { flag: 'r' }, function (error, data) {
            if (!error) {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(error));
            }
        });
    }


    postMediaListAll(req, res, next) {
        //req.user, 
        //req.json_data.follows, 
        //req.json_data.limit
        //req.json_data.offset
        let users = "";
        if (req.user) {
            users +=(users===""?"":",") + "'"+req.user.username+"'";
        }
        if (req.json_data.follows
            &&req.json_data.follows.length>0
            && typeof req.json_data.follows === 'object' 
            && req.json_data.follows.constructor === Array
            ){
            req.json_data.follows.forEach(el => {
                users += (users===""?"":",") + "'"+el+"'";
            });
        }
        
        db.getRsts("select *\
                    from media_files\
                    where user in ("+ users + ")\
                    order by time desc\
                    LIMIT "+ (req.json_data && req.json_data.limit ? req.json_data.limit : 6) + "\
                    OFFSET "+ (req.json_data && req.json_data.offset ? req.json_data.offset : 0) + "\
                    ")
            .then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(results
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        return value
                    }
                ));
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(err));
            })

    }


    getMediaList(req, res, next) {
        db.getRsts("select *\
                                         from media_files\
                                         where user = '"+ (req.paramS && req.paramS.user ? req.paramS.user : req.user && req.user.username ? req.user.username : "702418821") + "'\
                                         "+ (req.paramS && req.paramS.func ? "and (func=" + req.paramS.func + " or func is null)" : "") + "\
                                         order by time desc\
                                         LIMIT "+ (req.paramS && req.paramS.limit ? req.paramS.limit : 10) + "\
                                         OFFSET "+ (req.paramS && req.paramS.offset ? req.paramS.offset : 0) + "\
                                         ")
            .then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(results
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        return value
                    }
                ));
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(err));
            })

    }

    getGroupList(req, res, next) {
        db.getRsts("select *\
                                        from file_groups\
                                        where user = '"+ (req.paramS && req.paramS.user ? req.paramS.user : req.user && req.user.username ? req.user.username : "702418821") + "'\
                                        order by time desc\
                                        LIMIT "+ (req.paramS && req.paramS.limit ? req.paramS.limit : 10) + "\
                                        OFFSET "+ (req.paramS && req.paramS.offset ? req.paramS.offset : 0) + "\
                                        ")
            .then(results => {
                //lay file chi tiet tra cho nhom
                let detailsPromise = new Promise((resolve, reject) => {

                    if (!results || results.length === 0) {
                        resolve();
                    }

                    let countDetails = 0;

                    for (let idx = 0; idx < results.length; idx++) {

                        db.getRsts("select *\
                                             from media_files\
                                             where group_id = '"+ results[idx].group_id + "'\
                                             ")
                            .then(files => {

                                countDetails++; //dem ket qua dat duoc (vi query db cham hon for)

                                results[idx].medias = files;
                                if (countDetails >= results.length) { //so luong ket qua bang so luong bang ghi
                                    resolve();
                                }

                            })
                            .catch(err => {
                                reject(err);
                            })
                    }
                })

                detailsPromise.then(() => {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(results
                        , (key, value) => {
                            if (value === null) { return undefined; }
                            return value
                        }
                    ));
                })
                    .catch(err => {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(JSON.stringify(err));
                    })

            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(err));
            })
    }



    /**
     * dau vao la lay tin tuc toan bo user follows
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    postGroupListAll(req, res, next) {
        //req.user, 
        //req.json_data.follows, 
        //req.json_data.limit
        //req.json_data.offset
        
        let users = "";
        if (req.user) {
            users +=(users===""?"":",") + "'"+req.user.username+"'";
        }
        if (req.json_data.follows
            &&req.json_data.follows.length>0
            && typeof req.json_data.follows === 'object' 
            && req.json_data.follows.constructor === Array
            ){
            req.json_data.follows.forEach(el => {
                users += (users===""?"":",") + "'"+el+"'";
            });
        }
        //console.log(users);
        db.getRsts("select *\
                    from file_groups\
                    where user in ("+ users + ")\
                    order by time desc\
                    LIMIT "+ (req.json_data && req.json_data.limit ? req.json_data.limit : 6) + "\
                    OFFSET "+ (req.json_data && req.json_data.offset ? req.json_data.offset : 0) + "\
                    ")
            .then(results => {
                //lay file chi tiet tra cho nhom
                let detailsPromise = new Promise((resolve, reject) => {

                    if (!results || results.length === 0) {
                        resolve();
                    }

                    let countDetails = 0;

                    for (let idx = 0; idx < results.length; idx++) {

                        db.getRsts("select *\
                                             from media_files\
                                             where group_id = '"+ results[idx].group_id + "'\
                                             ")
                            .then(files => {

                                countDetails++; //dem ket qua dat duoc (vi query db cham hon for)

                                results[idx].medias = files;
                                if (countDetails >= results.length) { //so luong ket qua bang so luong bang ghi
                                    resolve();
                                }

                            })
                            .catch(err => {
                                reject(err);
                            })
                    }
                })

                detailsPromise.then(() => {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(results
                        , (key, value) => {
                            if (value === null) { return undefined; }
                            return value
                        }
                    ));
                })
                    .catch(err => {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(JSON.stringify(err));
                    })

            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(err));
            })
    }

    

    postSetFunction(req, res, next) {
        let sqlUpdate = arrObj.convertSqlFromJson(
            "media_files",
            {
                id: req.json_data.id
                , func: req.json_data.func
                , user: req.user.username
                , time: new Date().getTime()
            }
            , ["id"]
        );
        db.update(sqlUpdate)
            .then(data => {
                console.log(data);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ status: 1, message: "successful" }));
            })
            .catch(err => {
                console.log(err);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(err));
            })
    }

    postMediaFiles(req, res, next) {
        if (req.form_data && req.user && req.form_data.params && req.form_data.files) {
            //luu vao csdl 
            //console.log('***>user:',req.user);
            //console.log('***>form params:',req.form_data.params);

            var count_file = 0;
            var count_max = req.form_data.params.count_file;
            let saveDb = new Promise((resolve, reject) => {

                //chen group vao truoc
                let groupId = req.form_data.params.group_id ? req.form_data.params.group_id : req.user.username + '-' + new Date().getTime();
                let sqlInsertGroup = arrObj.convertSqlFromJson(
                    "file_groups",
                    {
                        group_id: groupId
                        , ip: req.clientIp
                        , title: req.form_data.params.title ? req.form_data.params.title : ""
                        , content: req.form_data.params.content ? req.form_data.params.content : ""
                        , device: req.clientDevice
                        , user: req.user.username
                        , time: new Date().getTime()
                    }
                    , ["user", "time"]
                );

                db.insert(sqlInsertGroup)
                    .then(data => {

                        //console.log('-->data',data);

                        for (let key in req.form_data.files) {

                            count_file++;

                            let sqlInsert = arrObj.convertSqlFromJson(
                                "media_files",
                                {
                                    group_id: groupId
                                    , url: req.form_data.files[key].url
                                    , file_name: req.form_data.files[key].file_name
                                    , file_type: req.form_data.files[key].file_type
                                    , file_date: req.form_data.params['origin_date_' + key]
                                    , file_size: req.form_data.files[key].file_size
                                    , user: req.user.username
                                    , time: new Date().getTime()
                                }
                                , ["url"]
                            );

                            db.insert(sqlInsert)
                                .then(data => {
                                    //console.log('-->data2',data);
                                    if (count_file >= count_max) {
                                        resolve(data);
                                    }
                                })
                                .catch(err => {
                                    //console.log('-->err2',err);
                                    if (err.code === "SQLITE_CONSTRAINT") {
                                        db.update(sqlInsert)
                                            .then(data => {
                                                if (count_file >= count_max) {
                                                    resolve(data);
                                                }
                                            })
                                            .catch(err1 => {
                                                reject(err1);
                                            })
                                    } else {
                                        reject(err);
                                    }
                                });
                        }
                    })
                    .catch(err => {
                        //console.log('-->err',err);
                    });

            });

            if (count_max > 0) {
                saveDb.then(data => {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(req.form_data));
                })
                    .catch(err => {
                        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: err, message: "error insert db" }));
                    })
            } else {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: "No file for save!" }));
            }

        } else {
            res.writeHead(403, { 'Content-Type': 'text/html' });
            res.end("No form data for upload");
        }
    }

    /**
     * Lưu ảnh avatar hoặc ảnh nền
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    uploadAvatarBackground(req, res, next) {
        //console.log('form_data',req.form_data);
        if (req.form_data
            &&req.form_data.files
            &&req.form_data.files.image_0
            &&req.form_data.files.image_0.url
            &&req.form_data.params
            &&req.form_data.params.options
            &&req.form_data.params.options.func
            ){
                let sqlInsert = arrObj.convertSqlFromJson(
                    "media_files",
                    {
                        url: req.form_data.files.image_0.url
                        , func: req.form_data.params.options.func
                        , file_name: req.form_data.files.image_0.file_name
                        , file_type: req.form_data.files.image_0.file_type
                        , file_date: req.form_data.params.origin_date_image_0
                        , file_size: req.form_data.files.image_0.file_size
                        , user: req.user.username
                        , time: new Date().getTime()
                    }
                    , []
                );

                db.insert(sqlInsert)
                .then(data=>{
                    //trả kết quả ghi được cho api server
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                            url: req.form_data.files.image_0.url
                            , func: req.form_data.params.options.func
                            , user: req.user.username
                        }
                        , (key, value) => {
                            if (value === null) { return undefined; }
                            return value
                            }
                        ));
                })
                .catch(err=>{
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                        message:"Lỗi khi ghi dữ liệu vào máy chủ media",
                        error: err,
                        data: req.form_data
                    }
                    ));
                })
        }else{
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                message:"Lỗi không nhận được file",
                error: "No file received",
                data: req.form_data
            }
            ));
        }

    }
}

module.exports = new ResourceHandler();