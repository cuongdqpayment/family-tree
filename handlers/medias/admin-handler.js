"use strict"
/**
 * 
 * ver 2.0     21/06/2019
 * Dieu chinh tra menu options parse cho client
 * 
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99?"" la quyen root (chi developer 903500888 \
 * 
 * thoi)
 */
const arrObj = require('../../utils/array-object');
const db = require('../../db/sqlite3/db-pool');

//danh sách menu cơ bản khi user chưa được phân quyền
const basicMenu = [1,2,3,8]; //menu cơ bản khi chưa phân quyền
const basicFunctions =[1];    //chức năng cơ bản khi chưa phân quyền

class Handler {

    /**
     * Thủ tục này lấy nội dung req.form_data.params.content
     * và req.user 
     * để phân tích lấy địa chỉ email, lấy user và chèn user cho bảng user
     * kết quả trả về là trạng thái đang chờ xét duyệt trong vòng 24h
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async postNewsWelcome(req,res,next){
        try{
            if (req.form_data
                &&req.user
                &&req.user.username
                &&req.form_data.params
                &&req.form_data.params.content){
                //lấy địa chỉ email trong nội dung nếu có
                let emails = arrObj.getEmailFromText(req.form_data.params.content);
                let emailMobifone = emails.find(x=>x.lastIndexOf("@mobifone.vn"));
                let row = await db.getRst("select *\
                                                from users\
                                                where username='"+req.user.username+"'");
                if (emailMobifone){
                    emailMobifone = emailMobifone.toLowerCase();
                    if (!row){
                        row = await db.getRst("select *\
                                                    from users\
                                                    where email like '%"+emailMobifone+"%'");
                    }
                    if (row&&row.id){
    
                        if ((""+row.id)===row.username){//trường hợp username giả lập theo id
                            await db.runSql("update users \
                                            set username='" + req.user.username + "'\
                                            , fullname = '" + (row.fullname?row.fullname:req.user&&req.user.data?req.user.data.fullname:"") + "'\
                                            , nickname = '" + (row.nickname?row.nickname:req.user&&req.user.data?req.user.data.nickname:"") + "'\
                                            , image = '" + (row.image?row.image:req.user&&req.user.data?req.user.data.image:"") + "'\
                                            , background = '" + (row.background?row.background:req.user&&req.user.data?req.user.data.background:"") + "'\
                                            , phone= '" + (row.phone?row.phone:'0'+req.user.username) + "'\
                                            , email= '" + (row.email?row.email:emails.length>0?emails.toString():req.user.data?req.user.data.email:"") + "'\
                                            , role= '" + (row.role?row.role:req.user.data?req.user.data.role:1) + "'\
                                            , status= '" + (row.status?row.status:req.user&&req.user.data&&req.user.data.role===99?1:2) + "'\
                                            , start_time = " + Date.now() + "\
                                            , change_time = " + Date.now() + "\
                                            , login_time = " + Date.now() + "\
                                            where id = " + row.id + "");

                            //console.log('update user', req.user.username, row.id);
                        }
                        //đến đây bảng users đã được update username
                        //nên trả cho phiên kế tiếp để kiểm tra quyền được phân quyền
                        //next(); //chuyển phiên kế tiếp kiểm tra quyền như lấy menu
                    }
                    //email này chưa tồn tại khai báo thì chèn vào bản ghi như các phương án khác
                    //console.log('emailMobifone', emailMobifone, row);
                }
                //trường hợp này chưa có user trong bảngs
                await db.insert(
                    arrObj.convertSqlFromJson("users", {
                        username: req.user.username,
                        fullname: req.user.data?req.user.data.fullname:"",
                        nickname: req.user.data?req.user.data.nickname:"",
                        image: req.user.data?req.user.data.image:"",
                        background: req.user.data?req.user.data.background:"",
                        organization_id: 1, //danh mục tổ chức có thể được nhân từ người dùng đưa lên khi post
                        phone: '0'+req.user.username,
                        email: emails.length>0?emails.toString():req.user.data?req.user.data.email:"",
                        role: req.user.data?req.user.data.role:1, //vai trò từ danh sách user
                        change_time: Date.now(),
                        start_time: Date.now(),
                        login_time: Date.now(),
                        status:req.user&&req.user.data&&req.user.data.role===99?1:2 //nếu không phải quản trị thì vai trò chờ xét duyệt
                    },
                    []))
                //console.log('Trường hợp này chưa có user trong bảng nên chèn thành công');
            }
        }catch(e){
            console.log('Lỗi toàn cục postNewWelcome',e)
        }
        //chuyển next bước tiếp theo để kiểm tra user trong bảng cùng trạng thái của nó
        next();
    }


    /**
     * Thiết lập chức năng dựa trên đường dẫn của get/post
     * Đường dẫn cuối sẽ là duy nhất của từng chức năng
     * ví dụ: /db/edit-customer thì edit-customer là chức năng
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    setFunctionFromPath(req,res,next){
        //gán đường dẫn phía sau cùng để gán chức năng cho nó
        req.functionCode = req.pathName.substring(req.pathName.lastIndexOf("/")+1);
        next();
    }

    /**
     * req.functionCode = "active" //chuc nang toi thieu la active 
     * 
     * req.functionCode = "edit-customer" //yeu cau kiem tra quyen
     * //neu khong co functionCode thi xem nhu khong can kiem tra quyen
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async checkFunctionRole(req,res,next){

        if (req.functionCode){ //can kiem tra quyen cua user co khong
            if (req.user&&req.user.data){

                if (req.user.data.role===99){
                    next() //quyen root
                }else{
                    try{
                        let row = await db.getRst("select b.roles from users a, admin_roles b\
                                                    where a.id = b.user_id\
                                                    and a.username='"+req.user.username+"'");
                        
                        // console.log('row:', row);
                        

                        let row2 = await db.getRst("select id\
                                                    from admin_functions\
                                                    where function_code ='"+req.functionCode+"'");
                        
                        // console.log('row2:', row2, req.functionCode);       

                        let roles = row&&row.roles?JSON.parse(row.roles):undefined; //tra ve object
                        let functionId = row2?row2.id:undefined; //tra ve id
                        //console.log('rolesFunction', functionId, roles);
                        let index =  roles&&functionId&&roles.functions?roles.functions.findIndex(x=>x===functionId):-1;
    
                        if (index>=0){
                            next()
                        }else{
                            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({message:'Bạn KHÔNG ĐƯỢC PHÂN QUYỀN thực hiện chức năng này'}));
                        }

                    }catch(e){
                        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({message:'Lỗi trong lúc kiểm tra quyền', error: e}));
                    }
                }
            } else {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({message:'Bạn không có quyền thực hiện chức năng này'}));
            }
        }else{
            next(); //xem nhu khong can kiem tra quyen
        }

    }


    /**
     * Truy vấn bảng user nếu không có thì trả về 
     * trạng thái yêu cầu nhập tin lời chào truy cập hệ thống
     * Nếu user đã có thì update thời gian truy cập, 
     * và dựa vào trạng thái để yêu cầu người dùng đợi xác nhận
     * hoặc trả đến bước nhận menu
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * 
     * status = 
     * -2 chưa đăng ký sử dụng
     * -1 lỗi hệ thống
     * 0 user bị khóa
     * 1 user đang hoạt động --> req.userRoles.menu --> next
     * 2 user đang chờ xét duyệt trong 24h
     */
    async checkPrivilege(req,res,next){
        //console.log('user',req.user);
        try{
            let user = await db.getRst("select * from users where username = '"+(req.user?req.user.username:"")+"'");
            //console.log('buoc 1');
            if (user&&user.id){ //user đã được khai báo
                await db.runSql("update users set login_time = " + Date.now() + "\
                            where id="+user.id);
                //console.log('buoc 2');
                if (user.status===1){ //nếu user đã tồn tại và đang hoạt động
                    //console.log('buoc 3');
                    let row = await db.getRst("select roles from admin_roles where user_id = '"+user.id+"'");
                    //console.log('buoc 4',row);
                    if (row&&row.roles){ //đã được phân quyền trong bảng roles
                        req.userRoles = JSON.parse(row.roles); //'{"menu":[1,2],"functions":[1,2,3,4]} sẽ cho quyền của user này làm được gì
                    }
                    next(); //chuyển sang bước tiếp theo để lấy menu
                }else{//user đã tồn tại nhưng trạng thái của nó là đang bị khóa, hoặc chờ xác nhận thì trả kết quả cho người dùng
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                        status: user.status===2?2:0,
                        message:"User của bạn " + (user.status===2?"đang chờ xét duyệt. Vui lòng đợi trong 24h":"đã bị khóa. Liên hệ quản trị hệ thống để khôi phục")
                    }));
                }
            } else { //user không tồn tại trong bảng users
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    status: -2,
                    message:"User của bạn chưa được đăng ký hệ thống này. Vui lòng xác nhận đăng ký để được phục vụ!"
                }));
            }
        }catch(e){
            //console.log("Loi kiem tra quyen", e);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                status:-1,
                message:"Có lỗi khi kiểm tra quyền",
                error: e
            }));
        }

    }

    /**
     * Phân quyền user để lấy menu
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getUserMenu(req,res,next){
        //sau khi đã có req.userRoles.menu
        //console.log('role cua user',req.userRoles);
        //Nếu user có vai trò là 99 (admin toàn quyền thì lấy hết menu)
        //nếu user có voi trò khác thì dựa vào phân quyền sẽ lấy menu cho phép thôi
        //nếu user chưa được cấp phép menu thì sẽ cho phép danh sách menu cơ bản thôi
        db.getRsts("select *\
                    from admin_menu\
                     where status = 1\
                     "+(req.user&&req.user.data&&req.user.data.role===99?"":"\
                     and id in ("+(req.userRoles&&req.userRoles.menu?req.userRoles.menu.toString():basicMenu.toString())+")\
                     ")+"\
                     order by order_1")
        .then(results => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results
                , (key, value) => {
                    if (value === null) { return undefined; }
                    if (key === "options"&&value!==null&&value.length>0) { return JSON.parse(value) }
                    return value;
                }
            ));
        })
        .catch(err => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify([]));
        });
    }

    /**
     * Lấy danh mục tổ chức cây tổ chức đã khai báo cho hệ thống này
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getOrganizations(req,res,next){
        db.getRsts("select *\
                    from organizations\
                     where status = 1\
                     order by order_1")
        .then(results => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        })
        .catch(err => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify([]));
        });
    }

    /**
     * Lấy danh sách user và quyền được phân cho nó
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getUsers(req,res,next){
        db.getRsts("select a.*, b.roles\
                    from users a\
                    LEFT JOIN admin_roles b\
                    ON a.id = b.user_id\
                     order by a.status desc, a.change_time desc")
        .then(results => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results
                , (key, value) => {
                    if (value === null) { return undefined }
                    if (key === "roles"&&value!==null&&value.length>0) { return JSON.parse(value) }
                    return value;
                }
            ));
        })
        .catch(err => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify([]));
        });
    }
    /**
     * Lấy các bảng dữ liệu để tạo bảng trong device client
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getTables(req,res,next){
        db.getRsts("select *\
                    from tables")
        .then(results => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        })
        .catch(err => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify([]));
        });
    }


    getMenus(req,res,next){
        db.getRsts("select *\
                    from admin_menu\
                     where status = 1\
                     order by order_1")
        .then(results => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results
                , (key, value) => {
                    if (value === null) { return undefined; }
                    if (key === "options"&&value!==null&&value.length>0) { return JSON.parse(value) }
                    return value;
                }
            ));
        })
        .catch(err => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify([]));
        });
    }

    getFunctions(req,res,next){
        db.getRsts("select *\
                    from admin_functions\
                     where status = 1\
                     order by order_1")
        .then(results => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        })
        .catch(err => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify([]));
        });
    }

    /**
     * Lấy quyền theo token của bạn
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async getYourRoles(req,res,next){
        if (req.user&&req.user.data){
            try{
                let yourRoles = [];
                
                let adminFunctions = await db.getRsts("select * from admin_functions where status=1");                
                
                //nếu voi trò chính là 99 (admin/root) thì lấy toàn quyền
                if (req.user.data.role===99){
                    yourRoles = adminFunctions;
                }else{
                    let row = await db.getRst("select b.roles from users a, admin_roles b\
                                                        where a.id = b.user_id\
                                                        and a.username='"+req.user.username+"'");

                    //nếu đã có phân quyền rồi
                    let rowRoles = row&&row.roles?JSON.parse(row.roles):undefined; //tra ve object
                    
                    //có quyền được phân
                    if (rowRoles&&rowRoles.functions&&rowRoles.functions.length>0) {
                        rowRoles.functions.forEach(el => {
                            //tìm chức năng được phân quyền
                            let yourFunction = adminFunctions.find(x=>x.id===el);
                            if (yourFunction){ //nếu tìm thấy thì bổ sung quyền cho bạn
                                yourRoles.push(yourFunction);
                            }
                        }); 
                    }else{
                        basicFunctions.forEach(el => {
                            //tìm chức năng được phân quyền
                            let yourFunction = adminFunctions.find(x=>x.id===el);
                            if (yourFunction){ //nếu tìm thấy thì bổ sung quyền cho bạn
                                yourRoles.push(yourFunction);
                            }
                        }); 
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(yourRoles //tra tập quyền được phân cho người dùng
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        return value;
                    }
                ));

            }catch(e){
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({message:"Lỗi truy cập db",error: e}));
            }
        }else{
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({message:"Bạn không có quyền vào đây", error:"Lỗi hacking"}));
        }
    }

    /**
     * Sửa thông tin user
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
   async editUser(req, res, next) {

        let dataJson = req.json_data;

        //Lấy 2 vai trò là menu và functions bên trong
        //để cập nhập hoặc chèn vào bảng role
        let roles = {};
        if (dataJson["menu"]){
            let menu = dataJson["menu"]; 
            //chuyển đổi dạng số trước khi cập nhập để đồng nhất kiểu số
            menu = menu.map(function(item) {return parseInt(item);});
            arrObj.createObjectKey(roles, "menu", menu);
            delete dataJson["menu"]; //xóa đi để cập nhập bảng user
        }
        if (dataJson["functions"]){
            let functions = dataJson["functions"]; //chuyển đổi dạng số trước khi cập nhập để đồng nhất kiểu số
            functions = functions.map(function(item) {return parseInt(item);});
            arrObj.createObjectKey(roles, "functions", functions);
            delete dataJson["functions"]; //xóa đi để cập nhập bảng user

        }
        
        if (roles.length===2){
            //đã phân quyền đầy đủ chức năng và menu
            //thực hiện ghi vào bảng roles
            //console.log(roles,dataJson);
            try{
                await db.insert(arrObj.convertSqlFromJson("admin_roles",{user_id: dataJson.id,
                                                                         roles: JSON.stringify(roles),
                                                                         created_time: Date.now(),
                                                                         change_time:Date.now(),
                                                                         signature: JSON.stringify({ username: req.user.username, data: roles, time: Date.now() })
                                                                        },[]));
            }catch(e){
                await db.update(arrObj.convertSqlFromJson("admin_roles",
                    {user_id: dataJson.id,
                    roles: JSON.stringify(roles),
                    change_time:Date.now(),
                    signature: JSON.stringify({ username: req.user.username, data: roles, time: Date.now() })
                   },["user_id"]));
            }
        }

        dataJson.change_time = Date.now();
        dataJson.signature = JSON.stringify({ username: req.user.username, data: req.json_data, time: dataJson.change_time });
        let jsonUpdate = arrObj.convertSqlFromJson("users", dataJson, ["id"]);

        db.update(jsonUpdate)
            .then(data => {
                let sqlSelect = "select a.*, b.roles\
                                from users a\
                                LEFT JOIN admin_roles b\
                                ON a.id = b.user_id\
                                where a.id = '"+dataJson.id+"'";
                db.getRst(sqlSelect)
                    .then(result => {
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify(result
                            , (key, value) => {
                                if (value === null) { return undefined }
                                if (key === "roles"&&value!==null&&value.length>0) { return JSON.parse(value) }
                                return value;
                            }
                        ));
                    })
                    .catch(err => {
                        console.log('Loi select', err);
                        res.writeHead(435, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ message: "Lỗi select CSDL", error: err }));
                    })
                //trả lại user đã được chỉnh sửa
            })
            .catch(err => {
                console.log('Loi update', err);
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: "Lỗi cập nhật CSDL", error: err }));
            })
    }

}

module.exports = new Handler();