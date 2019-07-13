//test thu khong khai bao bien bao loi tra ve xu ly duoi
//const url = require('url');

class ErrorHandler {

    errors(err, req, res, next) {
        if (err&&err.code&&err.message){
            res.writeHead(err.code, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('Error ' + err.message);
        }else{
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('Error unkow: ');
        }
    }
  }
  
  module.exports = new ErrorHandler()