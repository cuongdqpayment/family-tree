
const arrObj = require('../utils/array-object');

//quan ly socket nay thuoc usernao va login thoi gian nao o dia chi ip nao
var socketAll = {}; //{socketid:{user}} 
var userAll = {}; //{username:{name,nickname,sockets:[socketid]},...}
var roomAll = {}; //{roomid: {name,messages,users:[{username:[socket-online-joined]}]},...}


/**
 * 1. new socket connection
 * save username, [socket.id]
 * @param {*} io 
 * @param {*} socket 
 */
const sendWelcome = (io,socket)=>{

  if (!socketAll[socket.id])
  socketAll = arrObj.createObjectKey(socketAll, socket.id, {
                                                                username: socket.user.username,
                                                                
                                                                ip: socket.agentUser.ip,
                                                                device: socket.agentUser.device,

                                                                token_ip: socket.user.req_ip, //kiem tra ip va token_ip khong khop nhau la bi hack
                                                                token_device: socket.user.req_device, //kiem tra thiet bi cua token neu khong khop thi nguy co hack

                                                                time_handshake: socket.agentUser.time_handshake,
                                                                time: socket.agentUser.time_issued,
                                                                name: socket.user.data?socket.user.data.fullname:undefined,
                                                                nickname: socket.user.data?socket.user.data.nickname:undefined,
                                                                address: socket.user.data?socket.user.data.address:undefined,
                                                                image: socket.user.data?socket.user.data.image:undefined,

                                                                location: socket.paramS&&socket.paramS.latlng?
                                                                    {
                                                                      latlng:socket.paramS.latlng,
                                                                      accuracy:socket.paramS.accuracy,
                                                                      timestamp:socket.paramS.timestamp,
                                                                      address:socket.paramS.address,
                                                                    }
                                                                    :undefined
                                                              }
    );
  //socket.user of token, socket.agentUser of device, socket.paramS of session
  //console.log('***>socketAll agetnuser:', socket.id, socketAll[socket.id]);

  if (userAll[socket.user.username]){
    userAll[socket.user.username].sockets.unshift(socket.id);
  }else{
    userAll = arrObj.createObjectKey(userAll, socket.user.username,{
      name: socket.user.data?socket.user.data.fullname:undefined
      ,nickname: socket.user.data?socket.user.data.nickname:undefined
      ,sockets:[socket.id]
    });
  }

  //console.log('***>userAll new:',userAll);
  
  //2. send welcome new socket to owner
  let socketUsers ={} 
  userAll[socket.user.username].sockets.forEach(socketId=>{
    socketUsers = arrObj.createObjectKey(socketUsers, socketId, socketAll[socketId]);
  })
  
  socket.send({
          step:'INIT',
          your_socket: {
            socket_id: socket.id, //socket id
            user: socketAll[socket.id], //full user info 
            sockets: userAll[socket.user.username].sockets, //danh sach socket cua 1 user
            users: socketUsers //danh sach vi tri cua user cua tung sockets unique
          }
        });

  //chuyen danh sach user bao cho biet
  socket.send({
          step:'USERS',
          users: userAll //danh sach user dang ket noi len may chu?? can thiet khong?
        });

  //3. send to all online with new user   
  if (userAll[socket.user.username].sockets.length===1){
    //3.1 broadcast all
    io.sockets.emit('server-broadcast-new-user', socketAll[socket.id])
  }else if (userAll[socket.user.username].sockets.length>1){
    userAll[socket.user.username].sockets.forEach(socketId=>{
      if (socketId!==socket.id){
        //3.2 private old socket in username inform new socket
        io.to(socketId).emit('server-private-emit',{step: 'START', socket_id: socket.id, user: socketAll[socket.id]})
      }else{
        //broadcast to me no need 
        //io.to(socketId).emit('server-broadcast-new-user', socketAll[socket.id]);
      }
    })
  } 
}

/**
 * 4. chat joinRooms (cac room da duoc luu truoc do)
 * @param {*} io 
 * @param {*} socket 
 * @param {*} data===data.rooms = [{id: room_id, name: roomname, users:[{username,....}]}]
 */
const socketJoinRooms = (io,socket, data)=>{

  //joint owner user room
  socket.join(socket.user.username);

  //trong socket.adapter.rooms de chua:
  //socket.adapter.rooms[socket.user.username]
  //
  /*
  CUONGDQ: 
   Room {
    sockets: 
     { '/c3-chat#tx8INGblK9x9jJTyAAAE': true,
       '/c3-chat#4hIGTMrvI_LkM2sqAAAF': true },
    length: 2 },
  */

  //ta chi luu socket do thuoc user gi??
  //thuc chat co san trong mySocket roi

  //room Owner
  if (roomAll[socket.user.username]){ //co ai do da tao room
    let userExists = roomAll[socket.user.username].users.find(x=>(x[socket.user.username]));
    if (userExists){
      //room dc tao boi users trong room login truoc 
      //va day la socket moi them
      userExists[socket.user.username].push(socket.id);
    }else{
      //room dc tao boi users trong room login truoc 
      //nhung user nay lan dau login
      roomAll[socket.user.username].users.push(arrObj.createObjectKey({}, socket.user.username, [socket.id]));
    }
  }else{
    //chua co user nao tao room nay truoc do
    //INIT ROOM = {room_id:{name:room_name, users:[{username:[socketId Online in room]}]}}
    roomAll = arrObj.createObjectKey(roomAll, socket.user.username
                                            ,{  
                                              name: 'Private'
                                            , type: 'private'
                                            , created: Date.now()
                                            , time:  Date.now()
                                            , users: [arrObj.createObjectKey({}, socket.user.username, [socket.id])]});
  }

  //joint rooms belong user with data.rooms //rooms duoc luu truoc do
  //[{id:room_id, users:{username:true/false,length:2}, name:,avatar:,created,time}]
  data.rooms.forEach(room => { //room from clients = {id:room_id, name: room_name, users:[username,...]}
    
    //truong hop rooms duoc tao la room user? thi sao
    let roomId = room.id; //mat dinh la room hien tai yeu cau
    let reverseId = room.reverse_id; //mat dinh la room hien tai yeu cau
    //neu tim thay room.id ma 
    if (room.type=="friend"&&roomAll[reverseId]){
      roomId = reverseId;
      console.log('***> '+room.id+' reverse ' + roomId + ' <***');
    }
    //chi cho phep join nhom duoc dinh danh kieu nhom
    if (room.type==="private"|| room.type==="friend"||room.type=="group"){
      
      socket.join(roomId);
  
      //roomAll in server: {room_id_i:{name:room_name,..,users:[{username:[socket.id,...]}]}}}
      //for user joining...
      if (roomAll[roomId]){ //co ai do da tao room
        let userExists = roomAll[roomId].users.find(x=>(x[socket.user.username]));
        if (userExists){
          //room dc tao boi users trong room login truoc 
          //va day la socket moi them
          userExists[socket.user.username].push(socket.id);
        }else{
          //room dc tao boi users trong room login truoc 
          //nhung user nay lan dau login
          roomAll[roomId].users.push(arrObj.createObjectKey({}, socket.user.username, [socket.id]));
        }
      }else{
        //chua co user nao tao room nay truoc do
        //INIT ROOM = {room_id:{name:room_name, users:[{username:[socketId Online in room]}]}}
        roomAll = arrObj.createObjectKey(roomAll, roomId
                                                ,{  name: room.name
                                                  , type: room.type //cho biet kieu friend or group
                                                  , created: room.created
                                                  , time:  room.time
                                                  , avatar: room.avatar
                                                  , admins: room.admins
                                                  , users: [arrObj.createObjectKey({}, socket.user.username, [socket.id])]
                                                });
      }
  
      //for OTHER user in rooms REQUEST?
      //room.users:[username,...];
      
      room.users.forEach(username=>{
        if (username!==socket.user.username){
          //truong hop user ton tai chua?
          let userExists = roomAll[roomId].users.find(x=>(x[username]));
          //neu user nay da ton tai trong room nay thi thoi khong moi nua
          //do no da join truoc do
          if (!userExists){
            //neu user nay chua join room thi moi join
            //neu user chua login???? 
            //phai luu lai users trong room nay de lan sau user login???
            roomAll[roomId].users.push(arrObj.createObjectKey({}, username, []));
            //sockets online
            if (userAll[username]&&userAll[username].sockets.length>0){
              //co sockets online cua username
              //4.1. send to all sockets to invite join this room
              
              userAll[username].sockets.forEach(socketId=>{
  
                let key = room.id;
  
                let roomUsers=[];
                  roomAll[key].users.forEach(el=>{
                    //el = {username:[sockets],length:1}
                    for (let kk in el){
                      if (kk!=="length"){
                        roomUsers.push(kk);
                      }
                    }
                  })
  
                let roomClient = {
                  id: key,
                  type: roomAll[key].type,
                  name: roomAll[key].name,
                  nickname: roomAll[key].nickname,
                  created: roomAll[key].created,
                  time: roomAll[key].time,
                  avatar: roomAll[key].avatar,
                  admins: roomAll[key].admins,
                  users: roomUsers
                }
                io.to(socketId).emit('server-private-join-room-invite'
                //, arrObj.createObjectKey({}, roomId, roomAll[room.id])
                , roomClient
                );
                //neu cac socket nhan invite ma accept thi push socketId vao mang room,user[sockets]
              })
            }
          }
        }
      })
    }

  }); 
 

  //console.log('***>roomAll new:',roomAll);
  
  //tra lai cho chinh socket nay ds room joined
  let roomsBelong = [];
  for (let key in roomAll){
    //let ke tat ca cac room roomAll[key] = {name: room_name...,users:[{username:[socketonline]}]}
    if (roomAll[key].users){
      let userInRoom = roomAll[key].users.find(x=>(x[socket.user.username]));
      if (userInRoom){
        console.log('userInRoom '+key+' belongs socket.id:',userInRoom[socket.user.username].find(socketId=>socketId===socket.id));
        if (!userInRoom[socket.user.username].find(socketId=>socketId===socket.id)){
          //truong hop user moi login lan dau, tao room nhung room cua user khac add vao??
          //socket.id nay chua co trong list cua {username:[socketonline]}
          //thuc hien join this room
          socket.join(key);
          userInRoom[socket.user.username].push(socket.id);  
        }
        roomAll[key].id = key;
        
        //chuyen doi users=[username ] //ko ghi socket
        let roomUsers=[];
        roomAll[key].users.forEach(el=>{
          //el = {username:[sockets],length:1}
          for (let kk in el){
            if (kk!=="length"){
              roomUsers.push(kk);
            }
          }
        })
        
        let roomClient = {
          id: key,
          type: roomAll[key].type,
          name: roomAll[key].name,
          nickname: roomAll[key].nickname,
          created: roomAll[key].created,
          time: roomAll[key].time,
          avatar: roomAll[key].avatar,
          admins: roomAll[key].admins,
          users: roomUsers
        }
        roomsBelong.push(roomClient);
    }
    }
  }
  
  
  //4.2 rooms JOINed
  if (roomsBelong.length>0){
    socket.send(
    {step: 'JOINED'
    , rooms: roomsBelong //la mot danh sach
      });
  }

}

/**
 * 5. accept room from socket
 * @param {*} io 
 * @param {*} socket 
 * @param {*} room 
 */
const socketAcceptRoom = (io,socket, room)=>{
  if (room.type==='friend'||room.type==='group'){
    
    socket.join(room.id);
    
    let userExists = roomAll[room.id].users.find(x=>(x[socket.user.username]));
        if (userExists){
          //room dc tao boi users trong room login truoc 
          //va day la socket moi them
          userExists[socket.user.username].push(socket.id);
        }else{
          //room dc tao boi users trong room login truoc 
          //nhung user nay lan dau login
          roomAll[room.id].users.push(arrObj.createObjectKey({}, socket.user.username, [socket.id]));
        }
    
    //gui thong tin room nay ve cho client vua Accepted
    //5.1 send ACCEPTED to socket with new room 
    let key = room.id;
    let roomUsers=[];
    roomAll[key].users.forEach(el=>{
      //el = {username:[sockets],length:1}
      for (let kk in el){
        if (kk!=="length"){
          roomUsers.push(kk);
        }
      }
    })
    
    let roomClient = {
      id: key,
      type: roomAll[key].type,
      name: roomAll[key].name,
      nickname: roomAll[key].nickname,
      created: roomAll[key].created,
      time: roomAll[key].time,
      avatar: roomAll[key].avatar,
      admins: roomAll[key].admins,
      users: roomUsers
    }


    socket.send(
      {step: 'ACCEPTED'
      , room: roomClient
        });
  }
}

/**
 * 6. create new room 
 * @param {*} io 
 * @param {*} socket 
 * @param {*} room 
 */
const socketCreateRoom = (io,socket, room)=>{

  //neu room.type khong phai 'friend','group' thi bo qua
  if (room.type==='friend'||room.type==='group'){

      socket.join(room.id);
    
      //roomAll in server: {room_id_i:{name:room_name,..,users:[{username:[socket.id,...]}]}}}
      //for user joining...
      if (roomAll[room.id]){ //co ai do da tao room
        let userExists = roomAll[room.id].users.find(x=>(x[socket.user.username]));
        if (userExists){
          //room dc tao boi users trong room login truoc 
          //va day la socket moi them
          userExists[socket.user.username].push(socket.id);
        }else{
          //room dc tao boi users trong room login truoc 
          //nhung user nay lan dau login
          roomAll[room.id].users.push(arrObj.createObjectKey({}, socket.user.username, [socket.id]));
        }
      }else{
        //chua co user nao tao room nay truoc do
        //INIT ROOM = {room_id:{name:room_name, users:[{username:[socketId Online in room]}]}}
        roomAll = arrObj.createObjectKey(roomAll, room.id
                                                ,{  name: room.name
                                                  , type: room.type
                                                  , created: room.created
                                                  , time:  room.time
                                                  , image: room.image
                                                  , avatar: room.avatar
                                                  , admin: room.admin
                                                  , users: [arrObj.createObjectKey({}, socket.user.username, [socket.id])]
                                                });
      }
    
      //for OTHER user in rooms REQUEST?
      //room{id,name,users:[username,....]}
      room.users.forEach(username=>{
        if (username!==socket.user.username){
          //truong hop user ton tai chua?
          let userExists = roomAll[room.id].users.find(x=>(x[username]));
          //neu user nay da ton tai trong room nay thi thoi khong moi nua
          //do no da join truoc do
          if (!userExists){
            //neu user nay chua join room thi moi join
            //neu user chua login???? 
            //phai luu lai users trong room nay de lan sau user login???
            roomAll[room.id].users.push(arrObj.createObjectKey({}, username, []));
            //sockets online
            if (userAll[username]&&userAll[username].sockets.length>0){
              //co sockets online cua username
              //6.1. send to all sockets to invite join this room
              userAll[username].sockets.forEach(socketId=>{
                
                let key = room.id;
    
                let roomUsers=[];
                
                roomAll[key].users.forEach(el=>{
                    //el = {username:[sockets],length:1}
                    for (let kk in el){
                      if (kk!=="length"){
                        roomUsers.push(kk);
                      }
                    }
                  });
    
                let roomClient = {
                  id: key,
                  type: roomAll[key].type,
                  name: roomAll[key].name,
                  nickname: roomAll[key].nickname,
                  created: roomAll[key].created,
                  time: roomAll[key].time,
                  avatar: roomAll[key].avatar,
                  admins: roomAll[key].admins,
                  users: roomUsers
                }
                io.to(socketId).emit('server-private-join-room-invite'
                //, arrObj.createObjectKey({}, room.id, roomAll[room.id])
                , roomClient
                , {
    
                }
                );
                //neu cac socket nhan invite ma accept thi push socketId vao mang room,user[sockets]
              })
            }
          }
        }
      });
    
    //user nay nhung socket khac chua noi???
    //danh sach users tu client co the khong gui chinh username nay len
    userAll[socket.user.username].sockets.forEach(socketId=>{
      if (socketId!==socket.id){
        
        let key = room.id;
    
        let roomUsers=[];
          roomAll[key].users.forEach(el=>{
            //el = {username:[sockets],length:1}
            for (let kk in el){
              if (kk!=="length"){
                roomUsers.push(kk);
              }
            }
          })
        
        let roomClient = {
          id: key,
          type: roomAll[key].type,
          name: roomAll[key].name,
          nickname: roomAll[key].nickname,
          created: roomAll[key].created,
          time: roomAll[key].time,
          avatar: roomAll[key].avatar,
          admins: roomAll[key].admins,
          users: roomUsers
        }
        io.to(socketId).emit('server-private-join-room-invite'
          //, arrObj.createObjectKey({}, room.id, roomAll[room.id])
          , roomClient
          );
      }
    })  
    
    //gui thong tin room nay ve cho client vua Accepted
    //6.2 send ACCEPTED to socket with new room 
    roomAll[room.id].id = room.id;
    socket.send(
      {step: 'ACCEPTED'
      , room: roomAll[room.id]
        });
  }

}


/**
 * 7. client send private message to socketId
 * @param {*} io 
 * @param {*} socket 
 * @param {*} message 
 */
var sendPrivateMessage = (io, socket, message)=>{
  
  //console.log('client send message', message);
  /**
   *      socket_id: this.socketId, //chi gui den socketId nay thoi
          text: this.message,
          created: new Date().getTime()
   */

  let sender_id = socket.id;
  let receiver_id = message.socket_id;

  let msg = {
    sender: socketAll[sender_id],
    sender_id: sender_id,
    receiver: socketAll[receiver_id],
    receiver_id: receiver_id,
    created: message.created,
    text: message.text
  };

  //luu tru trong array message tren server de neu
  //session kia off thi lay lai
  //{text,room,created} //gui den id rieng

  io.to(receiver_id)
  .emit('server-emit-priate-message',msg);

}


var sendMessage = (io,socket,message)=>{
  //console.log('client send message', message);
  /**
   * { room: this.room, //receiver_room {id,name,nickname,avatar}
          text: this.message,
          created: Date.now()
       }

    sender: socketAll[sender_id],
    sender_id: sender_id,
    receiver: socketAll[receiver_id],
    receiver_id: receiver_id,
    created: message.created,
    text: message.text
   */
       
  let sender_id = socketAll[socket.id].username;
  let receiver_id = message.room?message.room.id:"";

  let msg = {
    sender: socketAll[socket.id],
    sender_id: sender_id, //username
    receiver: message.room,
    receiver_id: receiver_id, //room id
    created: message.created,
    text: message.text
  };

  //luu message tren server de cac phien sau login vao la co 
  //(luu gioi han 100 msg)
  /* if (roomAll[message.room.id]){
    roomAll[message.room.id].messages.push(msg);
    console.log('room message', roomAll[message.room.id].messages);
    if (roomAll[message.room.id].messages.length>10) 
        roomAll[message.room.id].messages.shift();
  } */
  
  //{text,room,created}
  io.to(receiver_id)
  .emit('server-emit-message',msg);

}

/**
 * x. socket disconnect all
 * @param {*} io 
 * @param {*} socket 
 */
const sendDisconnect = (io,socket)=>{
  
  let index = userAll[socket.user.username].sockets.findIndex(x=>x===socket.id)
  if (index>=0){
    userAll[socket.user.username].sockets.splice(index,1);
  }

  console.log('***>Disconnect '+socket.id
              +' of user ' + socket.user.username 
              + ' sockets now ' + userAll[socket.user.username].sockets);
  
  if (userAll[socket.user.username].sockets.length===0){
    //x.1 all user
    io.sockets.emit('server-broadcast-end-user', socketAll[socket.id]);
  }else if (userAll[socket.user.username].sockets.length>0){
    userAll[socket.user.username].sockets.forEach(socketId=>{
      if (socketId!==socket.id){
        //x.2 the same user and other socket
        io.to(socketId).emit('server-private-emit',{step: 'END',socket_id: socket.id, user: socketAll[socket.id]} )
      }
    })
  }
  
  for (let key in roomAll){
    //let ke tat ca cac room roomAll[key] = {name: room_name...,users:[{username:[socketonline]}]}
    if (roomAll[key].users){
      let userInRoom = roomAll[key].users.find(x=>(x[socket.user.username]));
      //{username:[sockets]}
      if (userInRoom){
        //luu y splice xoa bo user trong tu index, bao nhieu doi tuong, va muon thay the doi tuong thi them vao cuoi
        userInRoom[socket.user.username].splice(userInRoom[socket.user.username].indexOf(socket.id),1);
        console.log('***>roomAll ' + key + ' end belongs users:', roomAll[key].users);
      }
    }
  }


  //khi gui het thong tin moi xoa socket
  if (socketAll[socket.id]){
    //delete socketAll[socket.id];
    arrObj.deleteObjectKey(socketAll,socket.id);
  }

}

module.exports = {
  sendWelcome: sendWelcome,
  sendDisconnect: sendDisconnect,
  socketJoinRooms: socketJoinRooms,
  socketAcceptRoom: socketAcceptRoom,
  socketCreateRoom: socketCreateRoom,
  sendPrivateMessage: sendPrivateMessage,
  sendMessage: sendMessage
};