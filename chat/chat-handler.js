const chatFunction = require('./chat-function');
const chatConfig = require('./chat-config');
const _ = require('underscore');

const tokenHandler = require('../utils/token-proxy');

const proxy = require('request');
const authServer = 'https://c3.mobifone.vn/api';

var io;
var countAppOnline = 0;
var countc3Online = 0;
var countAll = 0;

var tokenSession = []; //luu lai session lam viec
//chi verify --> auth 1 lan --> co thoi gian hieu luc va het hieu luc
//khi do chi can verify expires la duoc
const verifyExpire = (socket)=>{
    let userInfo = tokenHandler.getInfoFromToken(socket.token);
    if (userInfo){
        if (userInfo.exp>(new Date().getTime()/1000)) return true;
    }
    return false;
}

/**
 * 
 * @param {*} socket 
 * @param {*} cbNext 
 * return socket.user or error
 */
const checkAuthToken = (socket,cbNext)=>{
    if (socket.token){
      new Promise((resolve, reject) => {

          let aliveToken = tokenSession.find(x=>x.token===socket.token)

          if (aliveToken && verifyExpire(socket)){
            //socket.user = user_info {}
              //console.log('-->aliveToken user_info:');//,aliveToken.user_info); 
              
              aliveToken.last_time = new Date().getTime();
              aliveToken.status = 1;

              resolve({
                  status: 1,
                  user_info: aliveToken.user_info
              });

          }else{
              //neu chua xac thuc server
              proxy.post(authServer + '/ext-auth/authorize-token', { json: {token: socket.token} } 
                  , (error, res, body) => {
                      if (error) {
                          reject(error);
                      }
                      if (res.statusCode == 200&&body.status&&body.user_info) {
                          //
                          //console.log('user_info:')//,body.user_info); //tra ve user_info va trang thai =1
                          //chuyen doi body --> luu lai
                          tokenSession.push({
                              create_time: new Date().getTime(),
                              token: socket.token,
                              user_info: body.user_info
                          })
                          resolve(body); //{status:1,user_info:{username:...,...}}
                      } else {
                          reject(body);
                      }
                  })
          }

      }).then(tokenData => {
          //console.log('tokenData.status', tokenData.status, tokenData.user_info);
          if (tokenData.status){
              //ok successful
              socket.user = tokenData.user_info;  
              cbNext(null,'successful');          
          }else{
              cbNext({message:tokenData}); 
          }
      })
      .catch(err => {
        cbNext({message:err}); 
      })
  }else{
    cbNext({message:'no socket.token'}); 
  }
}

class ChatHandler {

  ///////////////  new-idea //////////////////
  /**
   * Gan bien io de xu ly trong handler
   * @param {*} mainIO 
   */
  setIO(mainIO) {
    io = mainIO;
    
    //console.log('*** namespace:',io.nsps);

    _.each(io.nsps, (nsp)=>{
      nsp.on('connect', (socket)=>{
        if (!socket.auth) {
          console.log('I. '
          + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
          + " Removing socket from", nsp.name)
          delete nsp.connected[socket.id];
        }
      });
    });

  }

  /**
   * tuong tu trong cors-handler.js cho req
   * chuyen doi cac tham so su dung cho he thong thanh socket.agentUser/socket.paramS
   *  
   * @param {*} socket 
   * @param {*} next 
   * input socket --> output socket.paramS/clientIp/clientDevice/origin
   */
  corsHandler(socket, next) {

    if (socket.handshake){
      //console.log('nsps',io.nsps);
      socket.paramS = socket.handshake.query;
  
      let ip;
        if (socket.handshake.headers["client_ip"]){
          ip=socket.handshake.headers["client_ip"];
        }else if (socket.handshake.headers["x-real-ip"]){
          ip=socket.handshake.headers["x-real-ip"];
        }else if (socket.handshake.headers["x-forwarded-for"]){
          ip=socket.handshake.headers["x-forwarded-for"];
        }else if (socket.handshake.headers["remote_add"]){
          ip=socket.handshake.headers["remote_add"];
        }else{
          ip=socket.handshake.address;
        }
  
        socket.agentUser = {
            id:             socket.id
          , ip:             ip
          , device:         socket.handshake.headers["user-agent"]
          , origin:         socket.handshake.headers.origin
          , url:            socket.handshake.url
          , time_handshake: socket.handshake.time
          , time_issued:    socket.handshake.issued
          , time :          new Date().getTime()
        }
        //console.log('**Handshare',socket.handshake);
        // console.log('-->'
        // + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        // +' corsHandler',socket.paramS, socket.agentUser);
        next(); //cho phien tiep theo
    } else {
      next(new Error("no socket.handshake")); //bao loi ngay
    }
  }
  
  /**
   * Xac thuc token tu query.token
   * @param {*} socket 
   * @param {*} next 
   */
  verifyToken(socket, next) {

    if (socket.paramS&&socket.paramS.token){
      socket.token = socket.paramS.token;
      checkAuthToken(socket, (err, success)=>{
        if (!err && success){
          console.log("I. verifyToken " + socket.id + " for username: " + (socket.user?socket.user.username:""));
          socket.auth = true;
          //gan lai nps
          _.each(io.nsps, function(nsp) {
            if(_.findWhere(nsp.sockets, {id: socket.id})) {
              console.log(" verifyToken restoring socket to", nsp.name);
              nsp.connected[socket.id] = socket;
            }
          });
          next();
        }else{
          
          console.log(" unauthorized by token", socket.token);
          next(new Error("unauthorized by token " + socket.token)); //bao loi ngay
        }
      });
      
    }else{
      
      console.log(" no socket.paramS.token", socket.paramS);
      next(new Error("no socket.paramS.token")); //bao loi ngay
    }
  } 

  /**
   * 
   * Khoi tao socket root
   * @param {*} socket 
   * Gan cho event: io.on('connection') no se la cua ngo 
   * nhan tat ca cac emit tu client
   * thuc hien xac thuc user
   */
  initSocket(socket){

    console.log('II. '+ new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    + ' Root on Connect: ' + socket.id 
    + " for username: " 
    + (socket.user?socket.user.username:"") 
    );

    //1.chat - client open connection - server received new socket
    chatFunction.sendWelcome(io, socket);

    //4.
    socket.on('client-join-rooms', (data) => {
      console.log('### Client JOINT ROOMS : ' 
      + socket.id
      + " for username: " 
      + (socket.user?socket.user.username:"") 
    );
      chatFunction.socketJoinRooms(io, socket, data);
    });

    //5.
    socket.on('client-accept-room', (room) => {
      console.log('### Client ACCEPT ROOM: ' 
      + socket.id
      + " for username: " 
      + (socket.user?socket.user.username:"") 
      );
      chatFunction.socketAcceptRoom(io, socket, room);
    });

    //6. user create newroom
    socket.on('client-create-new-room', (room) => {
      console.log('### Client Create new ROOM in ROOT: ' 
      + socket.id
      + " for username: " 
      + (socket.user?socket.user.username:"") 
      );
      chatFunction.socketCreateRoom(io, socket, room);
    });

    //7. send private message
    socket.on('client-send-private-message', (message) => {
      console.log('### Client send private: ' + socket.id);
      chatFunction.sendPrivateMessage(io, socket, message);
    });
    
    //7.1 send message
    socket.on('client-send-message', (message) => {
      console.log('### Client send message, ROOM and token ROOT: ' + socket.id);
      chatFunction.sendMessage(io, socket, message);
    });

    //x. client chu dong disconnect
    socket.on('disconnect', ()=>{
      console.log('### '+ new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      +' Root disconnect from client: ' + socket.id
      + " for username: " 
      + (socket.user?socket.user.username:"") 
      );
      chatFunction.sendDisconnect(io, socket);
    });
        
        
    //gui emit tu root
    //truong hop token tu query thi buoc nay khong can thiet nua
    if (!socket.auth){
      socket.on('authenticate', (data)=>{
        // check data được send tới client
        socket.token = data?data.token:'';
        console.log("Authenticated token ", socket.token);
        checkAuthToken(socket, (err, success)=>{
          if (!err && success){
            console.log("Authenticated socket ", socket.id);
            socket.auth = true;
  
            //gan lai nps
            _.each(io.nsps, function(nsp) {
              if(_.findWhere(nsp.sockets, {id: socket.id})) {
                console.log("restoring socket to", nsp.name);
                nsp.connected[socket.id] = socket;
              }
            });
  
          }
        });
      });

      setTimeout(()=>{
        //sau 5s mà client vẫn chưa dc auth, lúc đấy chúng ta mới disconnect.
        if (!socket.auth) {
          console.log("-->Timeout "+ new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
          +" Disconnecting socket ", socket.id);
          socket.disconnect('unauthorized');
        }
      }, 60000);
    }

    

    socket.on('error',()=>{
      console.log('error on socket ', socket.id);
    });

    //-----------client communicate-------------//
    
    /* socket.on('client-send-old-message-to-new-user', (data) => {
      console.log('### Client send old message to id: ' + socket.id);
      chatFunction.sendOldMessage(io, socket, data);
    });

    socket.on('client-send-session-to-new-user', (data) => {
      console.log('### Client send old user to id: ' + socket.id);
      chatFunction.sendOldUser(io, socket, data);
    }); */

    //------------end client communicate ----------//

  }

  dynamicNameSpace(socket){
    /* console.log('III. '
    + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    + ' Namespace on Connect: ' + socket.id); */
    
    /* socket.send('hello client');

    socket.on('disconnect', ()=>{
      console.log('### '+ new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      +' Namespace disconnect from client: ' + socket.id);
      chatFunction.userSocketLeftRoom(io, socket);
    }); */

  }




  //////////////// old-idea //////////////////
  /* socketTransform = function (socket) {
    let agentUser = {};
    //console.log(socket.handshake);
    if (socket.handshake 
      && socket.handshake.headers 
      && socket.handshake.query
      && socket.handshake.query.token) {
      let clientIp;
      if (socket.handshake.headers["client_ip"]) {
        clientIp = socket.handshake.headers["client_ip"];
      } else if (socket.handshake.headers["x-real-ip"]) {
        clientIp = socket.handshake.headers["x-real-ip"];
      } else if (socket.handshake.headers["x-forwarded-for"]) {
        clientIp = socket.handshake.headers["x-forwarded-for"];
      } else if (socket.handshake.headers["remote_add"]) {
        clientIp = socket.handshake.headers["remote_add"];
      } else {
        clientIp = socket.handshake.address;
      }
      agentUser.token = socket.handshake.query.token;
      agentUser.id = socket.id;
      agentUser.ip = clientIp;
      agentUser.time = socket.handshake.time;
      agentUser.local_time = (new Date()).toLocaleTimeString();
      agentUser.issued = socket.handshake.issued;
      agentUser.device_info = socket.handshake.headers['user-agent'];
      agentUser.origin = socket.handshake.headers.origin;
      socket.agentUser = agentUser; //gan lai cho socket de lay thong tin sau
    }
    //console.log(socket.agentUser);
    return socket;
  
  } */
//chuyen doi mot so thong tin request sang socket truoc khi xu ly tiep
  /**
   * truoc khi cho xu ly tiep thi hay kiem tra quyen truy cap nay
   * @param {*} socket 
   * @param {*} next 
   */
  /* verify(socket, next) {
    console.log('### Socket IO verify: ' + socket.id);
    socket = socketTransform(socket);

    if (!socket.agentUser||!socket.agentUser.token){
      console.log('#-->No agent User & token for chat');
      next(new Error('No agent User & token for chat'));
      //no se khong vao duoc on.connect
    }else if (!chatFunction.tokenVerify(socket,socket.agentUser.token)) {
      console.log('#-->Token for chat invalid!');
      next(new Error('Token for chat invalid!'));
    }else{
      next(); //khi hop le no moi vao duoc connect tiep theo
    }
  } */
  /**
   * khi gui vao / no se goi vao day sau khi verify
   * @param {*} socket 
   */
  rootChat(socket) {
    console.log('### / root (' + ++countAll + ') on Connect: ' + socket.id);
    //xem co bao nhieu rooms

    socket.on('disconnect', ()=>{
      console.log('### disconnect / root(' + countAll-- + ')  on Root: ' + socket.id);
      chatFunction.userSocketLeftRoom(io, socket);
    });

    socket.on('error',()=>{
      console.log('error: ' + socket.id);
    });

    //-----------client communicate-------------//
    socket = socketTransform(socket);
    
    socket.on(chatConfig.client_join_room, (data) => {
      console.log('### Client register ROOMS and token ROOT: ' + socket.id);
      chatFunction.registerUserRoom(io, socket, data);
    });


    socket.on(chatConfig.client_send_message, (data) => {
      console.log('### Client send message, ROOM and token ROOT: ' + socket.id);
      chatFunction.sendMessage(io, socket, data);
    });
    
    socket.on(chatConfig.client_send_old_message_to_new_user, (data) => {
      console.log('### Client send old message to id: ' + socket.id);
      chatFunction.sendOldMessage(io, socket, data);
    });

    socket.on(chatConfig.client_send_session_to_new_user, (data) => {
      console.log('### Client send old user to id: ' + socket.id);
      chatFunction.sendOldUser(io, socket, data);
    });

    //------------end client communicate ----------//

  }


  //neu query boi duong dan thi no se goi vao day
  //vi du: /test thi se goi vao day
  appOnline(socket) {
    console.log('### /app-online (' + ++countAppOnline + ') socket IO ROOM Connect #: ' + socket.id);
    socket.on('disconnect', function () {
      console.log('### disconnect /app-online (' + countAppOnline-- + ') in appOnline #: ' + socket.id);
    });

    socket.on('set-user-token', (data) => {

      console.log('#############################',
        'client gui du lieu Trong ID ne ');

      //chatFunction.registerUserRoom(io,socket,data);
    });
  }

  /**
   * room chat cho c3
   * @param {*} socket 
   */
  c3Online(socket) {
    console.log('### /c3-chat (' + ++countc3Online + ') socket IO ROOM Connect #: ' + socket.id);
    
    
    socket.on('disconnect', function () {
      console.log('### disconnect /c3-chat(' + countc3Online-- + ') in c3Online #: ' + socket.id);
    });
    
    socket = socketTransform(socket);
    
    socket.on('verify-user-room-token', (data) => {
      console.log('### Client register ROOMS and token Online: ' + socket.id);
      chatFunction.registerUserRoom(io, socket, data);
    });
  }

  //tra ve so luong session dang connect
  getOnlineCount() {
    return {
      count_app_online: countAppOnline,
      total: countAll
    }
  }

}

module.exports = {
  ChatHandler: new ChatHandler()
};