"use strict"

const request = require('request');
const url = require('url');
const systempath = require('path');
const fs = require('fs');

const cheerio = require('cheerio');
const screenShotHtml = require("node-server-screenshot");

const dirScreenShot = "screen_shot";


const returnDevice = (req,res,next)=>{
    let yourDeviceInfo = {
        origin: req.origin
        , device: req.headers["user-agent"]
        , ip: req.clientIp
        , method: req.method
        , url: req.url
        , path: req.pathName
        , params: req.paramS
        , ip_info: req.ip_info
    }
  if (req.paramS.id=='SPEEDTEST'){
    yourDeviceInfo.share_url = {url:"https://c3.mobifone.vn/api/speedtest/post-result", method:"POST"}
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(yourDeviceInfo));
}


const getYourDevice = (req, res, next) =>{
   //req.ipInfo 
   request('https://ipinfo.io/'+req.clientIp+'/json', 
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        req.ip_info = JSON.parse(body);
                    }  
                    next();
        });
}

const returnShotInfoUrl = (req, res, next) =>{
    if (req.paramS.url){

        var $hostname = url.parse(req.paramS.url).hostname;

        request( req.paramS.url, 
            (error, response, body) => {
             if (!error && response.statusCode == 200) {
               const $ = cheerio.load(body);
               let $title = $( "title" ).text().trim();
               if (!$title||$title==""){
                   $( "p" ).each( (i, el ) => {
                     if (!$title||$title=="") $title= $(el).text();
                     if ($title) $title= $title.trim();
                     if ($title.length>10) return true;
                   });
               }
               let $src,$alt;
               $( "img" ).each( (i, el ) => {
                   let src = $(el).attr('src');
                   let alt = $(el).attr('alt');
                   if (alt) alt = alt.trim();
                   let ext = src.replace(/^.*\./, '');
                   if ((!$src||!$alt)&&ext&&ext.toLowerCase()==='jpg'){
                        $src = src;
                        $alt = alt;
                   }
               });

               res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
               res.end(JSON.stringify({
                   hostname: $hostname,
                   url: req.paramS.url,
                   title: $title,
                   image: $src,
                   alt : $alt
               }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(error));
            }
        });
    }else{
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(req.paramS));
    }
}


const screenShot = (link, hostname)=>{
    return new Promise((resolve,reject)=>{

        const curdatetime = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '');
        const curYear = curdatetime.slice(0,4);
        const curMonth = curdatetime.slice(4,6);
        const curDate = curdatetime.slice(6,8);
        if (!fs.existsSync(dirScreenShot)) fs.mkdirSync(dirScreenShot);
        if (!fs.existsSync(dirScreenShot+systempath.sep+curYear)) 
            fs.mkdirSync(dirScreenShot+systempath.sep+curYear);
        if (!fs.existsSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth)) 
            fs.mkdirSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth);
        if (!fs.existsSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth+systempath.sep+curDate)) 
            fs.mkdirSync(dirScreenShot+systempath.sep+curYear+systempath.sep+curMonth+systempath.sep+curDate);
        
            let urlFileNameSave = dirScreenShot + systempath.sep
                                    + curYear + systempath.sep
                                    + curMonth + systempath.sep
                                    + curDate + systempath.sep
                                    + hostname
                                    + "-screen-shot-"
                                    + new Date().getTime() 
                                    + ".png"
                                    ;

            //duong dan truy cap kieu web
          let urlFileName = urlFileNameSave.replace(systempath.sep,"/");

        screenShotHtml.
        fromHTML(
          'Shot by Cuongdq', 
          urlFileNameSave,
            {
              width:680, //default 1200
              height:480, //default 720
              waitAfterSelector:"html", //default html
              waitMilliseconds:300, //default 1000
              inject: {
                url: link,
                selector: {tag:"title"} //noi ma text o tren duoc nhung vao
        
            }},
          function(err){
              if (err){
                reject(err)
              }else{
                resolve(urlFileName)
              }
          }
        ); 

    })
}


const returnShotScreenUrl = (req, res, next) =>{
    if (req.paramS.url){

        var $hostname = url.parse(req.paramS.url).hostname;

        request( req.paramS.url, 
            (error, response, body) => {
             if (!error && response.statusCode == 200) {
               const $ = cheerio.load(body);
               let $title = $( "title" ).text().trim();
               if (!$title||$title==""){
                   $( "p" ).each( (i, el ) => {
                     if (!$title||$title=="") $title= $(el).text();
                     if ($title) $title= $title.trim();
                     if ($title.length>10) return true;
                   });
               }
               let $src,$alt;
               $( "img" ).each( (i, el ) => {
                   let src = $(el).attr('src');
                   let alt = $(el).attr('alt');
                   if (alt) alt = alt.trim();
                   let ext = src.replace(/^.*\./, '');
                   if ((!$src||!$alt)&&ext&&ext.toLowerCase()==='jpg'){
                        $src = src;
                        $alt = alt;
                   }
               });

               screenShot(req.paramS.url,$hostname)
               .then(filename=>{

                   req.url_data = {
                                    hostname: $hostname,
                                    url: req.paramS.url,
                                    title: $title,
                                    image: $src,
                                    screen: filename,
                                    alt : $alt
                                };
        
                   next();

                })
                .catch(err=>{
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(err));
               })


            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(error));
            }
        });
    }else{
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(req.paramS));
    }
}

const returnShotScreenJson = (req, res, next) =>{
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(req.url_data));
}

module.exports = {
    getYourDevice: getYourDevice,
    returnDevice: returnDevice,
    returnShotInfoUrl: returnShotInfoUrl,
    returnShotScreenUrl: returnShotScreenUrl,
    returnShotScreenJson: returnShotScreenJson
};