"use strict"


const fs = require('fs');
const mime = require('mime-types');
const systempath = require('path');

const arrObj = require('./utils/array-object');
const db_service = require('./db/sqlite3/excel-sqlite-service');
//const excelFilename = './db/media-setting.xlsx';

/* 
 //1. Tao db - chi chay 1 lan
//du lieu ban dau duoc tao tu manual bang lenh
setTimeout(() => {
    db_service.handler.createDatabase(excelFilename); //ket noi db moi
}, 3000); //doi 1s ket noi db
 */

db_service.handler.db().getRsts("select * from media_files where url like '% %'")
.then(data=>{
    data.forEach(el => {
        console.log(el.id,el.url.replace(" ",""));
        
    });

})

db_service.handler.db().getRst("select\
                                  min(group_id) min_group_id\
                                , max(group_id) max_group_id\
                                , count(1) count_row\
                                  from file_groups\
                                 where user = '903500888'")
.then(data=>{
        console.log(data);
    
})