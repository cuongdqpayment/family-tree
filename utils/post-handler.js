"use strict"

/**
 * version 2.0
 * Chỉnh sửa nội dung cho phép lưu file trong đường dẫn phụ tự định nghĩa từ client 
 * sau đường dẫn của biến dirUpload (nếu có: subdirectory)
 * Chuyển đổi các tham số có options (là các chuỗi json gốc chuyển ngược lại)
 * Tham số options sẽ chứa trong thuộc tính file luôn
 * 
 * json_data không có thì sẽ không trả về req.json_data
 * 
 * version 1.0
 * cuongdq
 * create 01/12/2018
 * Thực hiện nhận dữ liệu post lên từ JsonData hoặc từ FormData
 * Lưu file vào đường dẫn định trước qua biến dirUpload
 * và trả kết quả cho req.json_data hoặc req.form_data
 * 
 * các đường dẫn lưu file sẽ sắp xếp theo tháng/ngày /giờ(nếu cần)
 * 
 */
//đường dẫn lưu file khi nhận FormData ở đâu?
const dirUpload = 'upload_files';

const fs = require('fs');
const systempath = require('path');
const mime = require('mime-types');
const formidable = require('formidable');

if (!fs.existsSync(dirUpload)) fs.mkdirSync(dirUpload);
  /**
   * body formdata => req.form_data (file save in dirUpload )
   * eg: /upload_files/yyyymm/dd/hhmmss_filesize_filename
   * return req.form_data.params/files = {key_i:value_i}/{key_i:{url:...}}
   * 
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
var formProcess = (req, res, next) => {
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      let formData = {params:{},files:{}};
      
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(JSON.stringify({message:'Parse Formdata Error', error: err}));
      } else {
        
        for (let key in fields) {

          //chuyển đổi các biến có chữ options thì parse thành json
          //version 2.0
          if (key.indexOf("options")>=0){
              try{
                fields[key] = JSON.parse(fields[key]);
              }catch(e){}
          }
        
          //gan them thuoc tinh dynamic
          Object.defineProperty(formData.params, key, {
            value: fields[key], //gia tri bien duoc bind vao bindVars.p_in_0,1,...n
            writable: false, //khong cho phep sua du lieu sau khi gan gia tri vao
            enumerable: true //cho phep gan thanh thuoc tinh truy van sau khi hoan thanh
          });
        }

        //đây là yêu cầu mới từ client lưu trong đường dẫn phụ này
        let dirUploadNew = dirUpload;
        let subdirectory = formData.params["subdirectory"];
        if (subdirectory){
          if (!fs.existsSync(dirUpload+systempath.sep+subdirectory)) fs.mkdirSync(dirUpload+systempath.sep+subdirectory);
          dirUploadNew = dirUpload+systempath.sep+subdirectory; //đưa đường dẫn phụ vào để không thay đổi đường dẫn gốc
        }

        let count_file = 0;
        for (let key in files) {
          
          let curdatetime = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '');
          let curMonth = curdatetime.slice(0,6);
          let curDate = curdatetime.slice(6,8);
          let curTime = curdatetime.slice(9)
          if (!fs.existsSync(dirUploadNew+systempath.sep+curMonth)) fs.mkdirSync(dirUploadNew+systempath.sep+curMonth);
          if (!fs.existsSync(dirUploadNew+systempath.sep+curMonth+systempath.sep+curDate)) fs.mkdirSync(dirUploadNew+systempath.sep+curMonth+systempath.sep+curDate);

          //luu file theo duong dan he thong
          let filenameStored = dirUploadNew + systempath.sep
                              + curMonth + systempath.sep
                              + curDate + systempath.sep 
                              //+ curTime + "_"
                              + files[key].size + "_"
                              + files[key].name;

          //duong dan truy cap kieu web
          let urlFileName = dirUploadNew.replace(systempath.sep,"/") + "/"
                            + curMonth + "/"
                            + curDate + "/"
                            //+ curTime + "_"
                            + files[key].size + "_"
                            + files[key].name;

          fs.createReadStream(files[key].path)
              .pipe(fs.createWriteStream(filenameStored));
          
          count_file++;

          let contentType='image/jpeg';
          if (mime.lookup(files[key].name)) contentType = mime.lookup(files[key].name);

          //vi da tinh hop le cua token roi
          Object.defineProperty(formData.files, key, {
            value: { url: urlFileName
                    , file_name: files[key].name
                    , file_size: files[key].size
                    , file_type: contentType
                    , options: formData.params["options_"+key]
                   }, //gia tri bien duoc bind vao bindVars.p_in_0,1,...n
            writable: false, //khong cho phep sua du lieu sau khi gan gia tri vao
            enumerable: true //cho phep gan thanh thuoc tinh truy van sau khi hoan thanh
          });

        }

        formData.params.count_file = count_file;
        req.form_data = formData;
        
        next();
      }
    });
  }


  /**
   * body json => req.json_data
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
 var jsonProcess = (req, res, next) =>{
    let postDataString = '';
    req.on('data', (chunk) => {
        postDataString += chunk;
    });
    req.on('end', () => {
      try{
        req.json_data = JSON.parse(postDataString);
      }catch(err){}
      next();
    })
  }

  module.exports = {
    jsonProcess: jsonProcess,
    formProcess: formProcess
  };