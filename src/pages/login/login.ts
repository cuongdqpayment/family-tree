/**
 * 
 * ver 3.0
 * Bổ sung tính năng crop ảnh đại diện và ảnh nền
 * Ngày 11/7/2019 by cuongdq
 * 
 * Trang Login
 * ver 2.2
 * Xóa token khi logout đồng thời xóa luôn userInfo để yêu cầu login lại
 * debug: Loi khong xac dinh
 * 
 * 
 * ver 2.0
 * Kiểm tra đường dẫn url của email chưa có sẽ yêu cầu người dùng chọn một ảnh đại diện
 * Kiểm tra đường dẫn url của background nếu chưa có sẽ yêu cầu người dùng chọn một ảnh nền cho mình
 * 
 * ver 1.0 
 * ngày 01/01/2019
 * Yêu cầu nhập số điện thoại không có số 0 
 * Sau đó hệ thống sẽ gửi mã OTP xác nhận
 * Hệ thống yêu cầu nhập đầy đủ thông tin cá nhân để tiếp tục hoạt động
 * Kết quả máy chủ API trả về một token để sử dụng các hệ thống phát triển tiếp theo
 * 
 */
import { Component } from '@angular/core';
import { NavController, ModalController, Platform, LoadingController, AlertController, Events } from 'ionic-angular';

import { DynamicFormMobilePage } from '../dynamic-form-mobile/dynamic-form-mobile';
import { ApiHttpPublicService } from '../../services/apiHttpPublicServices';
import { DynamicFormWebPage } from '../dynamic-form-web/dynamic-form-web';
import { ApiStorageService } from '../../services/apiStorageService';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiMediaService } from '../../services/apiMediaService';
import { QrBarCodePage } from '../qr-bar-code/qr-bar-code';
import { DynamicPostImagePage } from '../dynamic-post-image/dynamic-post-image';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  userInfo:any;
  token: any;


  formLoginOk:any; //bien ghi contro de hien thi form login ok

  constructor(
    private navCtrl: NavController
    , private pubService: ApiHttpPublicService
    , private apiAuth: ApiAuthService
    , private apiStorageService: ApiStorageService
    , private apiMedia: ApiMediaService //goi trong callback
    , private events: Events    //goi trong callback
    , private platform: Platform
    , private modalCtrl: ModalController
    , private loadingCtrl: LoadingController
    , private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    //console.log('2. ngOnInit Home');
    this.userInfo = this.apiAuth.getUserInfo();
    //nếu đã login thì không cần kiểm tra xác thực nữa
    if (this.userInfo&&this.userInfo.data
      //&&this.userInfo.data.image&&this.userInfo.data.background
      ){
        this.callLoginOk();
    }else{
      //user chưa login thì đi check token và login lại
      this.checkTokenLogin();
    }
  }

  //kiểm tra login
  checkTokenLogin(){
    
    this.token = this.apiStorageService.getToken();

    if (this.token) {

      let loading = this.loadingCtrl.create({
        content: 'Đang kiểm tra từ máy chủ xác thực ...'
      });
      loading.present();

      this.apiAuth.authorize
        (this.token)
        .then(data => {
          
          if (data.user_info){
            
            this.userInfo = this.apiAuth.getUserInfo();
            //Đã có thông tin user được khai báo
            //console.log('sau khi khai bao',this.userInfo);

            //thì Tiêm token cho các phiên làm việc lấy số liệu cần xác thực
            if (this.userInfo.data) this.apiAuth.injectToken(); 

            this.callLoginOk();
  
            loading.dismiss();
            
          }else{
            //console.log('no User Info',data);
            loading.dismiss();
            throw "no data.user_info";
          }

        })
        .catch(err => {
          loading.dismiss();
          //console.log('Token invalid: ', err);
          this.apiAuth.deleteToken();
          this.ionViewDidLoad_Login();

        });
    } else {
      this.ionViewDidLoad_Login();
    }
  }


  onClickUserImage(func) {

    if (func==="avatar"){
      //console.log("Chưa có ảnh đại diện");
      this.openModal(DynamicPostImagePage, {
        parent: this,
        callback: this.callBackProcessAvatar,
        form: {
          status: 0,   //hình thức không chia sẻ
          title: "CHỌN ẢNH ĐẠI DIỆN", //tiêu để của trang post
          options: { func: "avatar" }, //Các tham số gửi lên máy chủ ảnh đại diện
          crop_area: {
            width: 200,
            height: 200,
            type: 'circle' 
          }, //vùng cắt ảnh
          is_face: 1, //nhận diện khuông mặt để crop đúng ảnh mặt người thôi
          image:undefined, //ảnh hiển thị khi load lên
          croppied: undefined, //ảnh được crop để truyền lên máy chủ
          action: { name: "Gửi ảnh", next: "CALLBACK", url: ApiStorageService.mediaServer + "/upload-image" }
        }
      })
    }
    
    if (func==="background"){
      //nếu chưa có ảnh nền thì yêu cầu mở form nhập ảnh nền
      //console.log("Chưa có ảnh nền");
      this.openModal(DynamicPostImagePage, {
        parent: this,
        callback: this.callBackProcessAvatar,
        form: {
          status: 0,   //hình thức chia sẻ công khai
          title: "CHỌN ẢNH NỀN", //tiêu để của trang post
          options:{func:"background"}, //Các tham số gửi lên máy chủ ảnh đại diện
          crop_area:{
              width: 300,
              height: 200,
              type: 'square'
          }, //vùng cắt ảnh
          is_face: 0, //nhận diện khuông mặt để crop đúng ảnh mặt người thôi
          image:undefined, //ảnh hiển thị khi load lên
          croppied: undefined, //ảnh được crop để truyền lên máy chủ
          action: { name: "Gửi ảnh", next: "CALLBACK", url: ApiStorageService.mediaServer + "/upload-image" }
        }
      })
    }
  }

  callBackProcessAvatar = function (res) {
    return new Promise((resolve, reject) => {
      //console.log('Ket qua:', res);
      if (res.error) {
        this.presentAlert("Có lỗi khi truyền dữ liệu");
        resolve();
      } else {

        if (res.data&&res.data.func&&res.data.url){
          //có dữ liệu để ghi vào máy chủ api link này
          let json_data = {};
          let image = ApiStorageService.mediaServer + "/get-file/" + encodeURI(res.data.url);
          Object.defineProperty(json_data, res.data.func==="background"?"background":"image", { value: image, writable: true, enumerable: true, configurable: true });
          this.apiAuth.postDynamicForm(ApiStorageService.authServer+"/ext-auth/save-user-info",json_data,true)
          .then(data=>{
            //console.log('du lieu ghi xong',data);
            this.userInfo.data[res.data.func==="background"?"background":"image"] = image;
            //ghi lai tren
            
            //console.log('sau khi dong cua so roi co ghi tiep khong day');
            if (res.data.func==="avatar" && !this.userInfo.data.background){
              this.onClickUserImage("background");
            }

            if (res.data.func==="background" && !this.userInfo.data.image){
              this.onClickUserImage("avatar");
            }

            //ghi lai anh cho form hien thi
            if (res.data.func==="avatar"){
              this.formLoginOk.items.find(x=>x.id==="avatar").url = image;
            }else{
              this.formLoginOk.items.find(x=>x.id==="background").url = image;
            }


            //Trigger cho login ok
            if ( this.userInfo.data.image && this.userInfo.data.background){
              this.events.publish('user-log-in-ok');
            }


            resolve({ next: "CLOSE" });

          })
          .catch(err=>{
            console.log('du lieu ghi loi',err);
            this.presentAlert("Có lỗi khi lưu trên máy chủ xác thực <br>" + JSON.stringify(err));
            resolve();
          })
        }else{
          //giữ lại form không cho đóng
          this.presentAlert("Có lỗi khi lưu trên máy chủ phương tiện<br>"+JSON.stringify(res.data));
          resolve();
        }
      }
    })
  }.bind(this);

  /**
   * Khi xac thuc duoc otp thong tin nay se hien thi
   * Tuy nhien, neu userInfo.data khong co du lieu, tuc chua dang ky user
   * thi se tu dong bat len cua so nhap thong tin ca nhan xem nhu chua cho phep login
   */
  callLoginOk() {

    if (this.userInfo&&this.userInfo.data){

      //Nếu chưa có ảnh đại diện thì yêu cầu mở form nhập ảnh đại diện
      if (!this.userInfo.data.image){
        //console.log("Chưa có ảnh đại diện");
        this.openModal(DynamicPostImagePage, {
          parent: this,
          callback: this.callBackProcessAvatar,
          form: {
            status: 0,   //hình thức không chia sẻ
            title: "CHỌN ẢNH ĐẠI DIỆN", //tiêu để của trang post
            options: { func: "avatar" }, //Các tham số gửi lên máy chủ ảnh đại diện
            crop_area: {
              width: 200,
              height: 200,
              type: 'circle' 
            }, //vùng cắt ảnh
            is_face: 1, //nhận diện khuông mặt để crop đúng ảnh mặt người thôi
            image:undefined, //ảnh hiển thị khi load lên
            croppied: undefined, //ảnh được crop để truyền lên máy chủ
            action: { name: "Gửi ảnh", next: "CALLBACK", url: ApiStorageService.mediaServer + "/upload-image" }
          }
        })
      } else if (!this.userInfo.data.background){
        //nếu chưa có ảnh nền thì yêu cầu mở form nhập ảnh nền
        //console.log("Chưa có ảnh nền");
        this.openModal(DynamicPostImagePage, {
          parent: this,
          callback: this.callBackProcessAvatar,
          form: {
            status: 0,   //hình thức chia sẻ công khai
            title: "CHỌN ẢNH NỀN", //tiêu để của trang post
            options:{func:"background"}, //Các tham số gửi lên máy chủ ảnh đại diện
            crop_area:{
                width: 300,
                height: 200,
                type: 'square'
            }, //vùng cắt ảnh
            is_face: 0, //nhận diện khuông mặt để crop đúng ảnh mặt người thôi
            image:undefined, //ảnh hiển thị khi load lên
            croppied: undefined, //ảnh được crop để truyền lên máy chủ
            action: { name: "Gửi ảnh", next: "CALLBACK", url: ApiStorageService.mediaServer + "/upload-image" }
          }
        })
      }

      if ( this.userInfo.data.image && this.userInfo.data.background){
        this.events.publish('user-log-in-ok');
      }

      
      //bien con tro de ghi lai gia tri
      this.formLoginOk = {
        title: "Đã Login"
        , buttons: [
          {color:"primary", icon: "barcode", command: "CODE-GENERATOR" , next:"CALLBACK"} 
        ]
        , items: [
          {
            type: "details",
            details: [
              {
                name: "Username(*)",
                value: this.userInfo.username
              },
              {
                name: "Họ và tên(*)",
                value: this.userInfo.data?this.userInfo.data.fullname:""
              },
              {
                name: "Nickname(*)",
                value: this.userInfo.data?this.userInfo.data.nickname:""
              },
              {
                name: "Địa chỉ(*)",
                value: this.userInfo.data?this.userInfo.data.address:""
              },
              {
                name: "Điện thoại(*)",
                value: this.userInfo.data?this.userInfo.data.phone:""
              },
              {
                name: "Email(*)",
                value: this.userInfo.data?this.userInfo.data.email:""
              },
              {
                name: "Địa chỉ ip",
                value: this.userInfo.req_ip
              },
              {
                name: "Địa chỉ nguồn",
                value: this.userInfo.origin
              },
              {
                name: "Thiết bị",
                value: this.userInfo.req_device
              },
              {
                name: "Mức xác thực",
                value: this.userInfo.level
              },
              {
                name: "Thời gian khởi tạo",
                value: this.userInfo.iat * 1000,
                pipe_date: "HH:mm:ss dd/MM/yyyy"
              },
              {
                name: "Thời gian hết hạn",
                value: this.userInfo.exp * 1000,
                pipe_date: "HH:mm:ss dd/MM/yyyy"
              },
              {
                name: "Giờ GMT",
                value: this.userInfo.local_time,
                pipe_date: "HH:mm:ss dd/MM/yyyy"
              }
            ]
          },
          {id:"avatar", type: "image",  name: "ẢNH ĐẠI DIỆN", url: this.userInfo.data&&this.userInfo.data.image?this.userInfo.data.image: "/assets/imgs/noimage.png" }
          ,
          {id:"background", type: "image",  name: "ẢNH NỀN", url: this.userInfo.data&&this.userInfo.data.background?this.userInfo.data.background: "/assets/imgs/noimage.png" }
          ,
          { 
            type: "button"
          , options: [
            { name: "Sửa (*)", command:"EDIT" , next: "CALLBACK"}
            ,{ name: "Logout", command:"EXIT" , next: "CALLBACK"}
            ,{ name: "Quay về", command:"HOME" , next: "CALLBACK"}
          ]
        }
        ]
      }
      
      this.navCtrl.push(DynamicFormWebPage
        , {
          parent: this, //bind this for call
          callback: this.callbackUserInfo,
          form: this.formLoginOk
        });
    }else if (this.userInfo){
      //Khi chưa có thông tin cá nhân
      //Thì yêu cầu nhập thông tin cá nhân
      let phoneNumber = this.userInfo.data&&this.userInfo.data.phone?this.userInfo.data.phone:this.userInfo.username;
      phoneNumber = phoneNumber.indexOf('0')===0&&phoneNumber.indexOf('+')<0?phoneNumber:'0'+phoneNumber;

        let form = {
          title: "TẠO THÔNG TIN CÁ NHÂN"
          , home_disable: true //khong cho nut hom
          , items: [
             {          name: "USER " + this.userInfo.username, type: "title"}
            , { key: "nickname", name: "Biệt danh(*)", hint:"Nickname", type: "text", input_type: "text", icon: "heart", value: this.userInfo.data?this.userInfo.data.nickname:"", validators: [{required: true, min: 1}]}
            , { key: "name", name: "Họ và tên (*)", hint:"Họ và tên đầy đủ", type: "text", input_type: "text", icon: "person", value: this.userInfo.data?this.userInfo.data.fullname:"", validators: [{required: true, min: 5}]}
            , { key: "address", name: "Địa chỉ (*)", hint:"Địa chỉ đầy đủ", type: "text", input_type: "text", icon: "pin", value: this.userInfo.data?this.userInfo.data.address:"", validators: [{required: true, min: 5}]}
            , { key: "phone", name: "Điện thoại (*)", hint: "Yêu cầu định dạng số điện thoại nhé", type: "text", input_type: "tel", icon: "call", validators: [{ pattern: "^[0-9]*$" }], value: phoneNumber}
            , { key: "email", name: "email(*)", hint: "Yêu cầu định dạng email nhé", type: "text", input_type: "email", icon: "mail", validators: [{ pattern: "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$" }], value: this.userInfo.data?this.userInfo.data.email:""}
            , { key: "broadcast_status", name: "Quyền riêng tư", hint: "Lựa chọn quyền riêng tư", type: "select", icon: "md-globe", value: this.userInfo.data?this.userInfo.data.broadcast_status:"1", options: [{ name: "Chỉ mình tôi", value: 0 }, { name: "Cho mọi người", value: 1 }, { name: "Chỉ bạn bè tôi", value: 2 }, { name: "Bạn của bạn tôi", value: 3 }]}
            , { 
              type: "button"
            , options: [
                { name: "Logout", command:"EXIT" , next: "CALLBACK"}
              , { name: "Tạo mới", command:"CREATE", url: ApiStorageService.authServer+"/ext-auth/save-user-info", token: this.token, next: "CALLBACK"}
            ]
          }
          ]
        }
        
        this.openModal(DynamicFormMobilePage
          , {
            parent: this, //bind this for call
            callback: this.callbackUserInfo,
            form: form
          });

    }

  }


  callEditForm(){
    //truy van thong tin tu may chu boi user nay
    
    if (this.userInfo){
      let phoneNumber = this.userInfo.data&&this.userInfo.data.phone?this.userInfo.data.phone:this.userInfo.username;
      phoneNumber = phoneNumber.indexOf('0')===0&&phoneNumber.indexOf('+')<0?phoneNumber:'0'+phoneNumber;

      let form = {
        title: "Sửa thông tin cá nhân"
        , items: [
           {          name: "USER " + this.userInfo.username, type: "title"}
          , { key: "nickname", name: "Biệt danh(*)", hint:"Nickname", type: "text", input_type: "text", icon: "heart", value: this.userInfo.data?this.userInfo.data.nickname:"", validators: [{required: true, min: 1}]}
          , { key: "name", name: "Họ và tên (*)", hint:"Họ và tên đầy đủ", type: "text", input_type: "text", icon: "person", value: this.userInfo.data?this.userInfo.data.fullname:"", validators: [{required: true, min: 5}]}
          , { key: "address", name: "Địa chỉ (*)", hint:"Địa chỉ đầy đủ", type: "text", input_type: "text", icon: "pin", value: this.userInfo.data?this.userInfo.data.address:"", validators: [{required: true, min: 5}]}
          , { key: "phone", name: "Điện thoại (*)", hint: "Yêu cầu định dạng số điện thoại nhé", type: "text", input_type: "tel", icon: "call", validators: [{ pattern: "^[0-9]*$" }], value: phoneNumber}
          , { key: "email", name: "email(*)", hint: "Yêu cầu định dạng email nhé", type: "text", input_type: "email", icon: "mail", validators: [{ pattern: "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$" }], value: this.userInfo.data?this.userInfo.data.email:""}
          , { key: "broadcast_status", name: "Quyền riêng tư", hint: "Lựa chọn quyền riêng tư", type: "select", icon: "md-globe", value: this.userInfo.data?this.userInfo.data.broadcast_status:"1", options: [{ name: "Chỉ mình tôi", value: 0 }, { name: "Cho mọi người", value: 1 }, { name: "Chỉ bạn bè tôi", value: 2 }, { name: "Bạn của bạn tôi", value: 3 }]}
          , { 
            type: "button"
          , options: [
            { name: "Bỏ qua", command:"CLOSE" , next: "CLOSE"}
            , { name: "Cập nhập", next: "CALLBACK", command:"UPDATE", url: ApiStorageService.authServer+"/ext-auth/save-user-info", token: this.token}
          ]
        }
        ]
      }

      this.openModal(DynamicFormMobilePage
        , {
          parent: this, //bind this for call
          callback: this.callbackUserInfo,
          form: form
        });
    }

  }

  callbackUserInfo = function (res) {
    //console.log('Goi logout',res);
    return new Promise((resolve, reject) => {
      if (res.button&&res.button.command==="EXIT"){
        this.apiAuth.deleteToken();
        this.ionViewDidLoad_Login();
        this.events.publish('user-log-out-ok');
        //console.log('Goi logout');
        this.checkTokenLogin(); //kiem tra lai login xem
        resolve({next:"CLOSE"}); //vi dung modal nen phai dong lai

      }

      if (res.button&&res.button.command==="EDIT"){
        this.callEditForm();
      }

      if (res.button&&res.button.command==="HOME"){
        //this.navCtrl.setRoot(HomeMenuPage); //vi push nen khong can dong
        this.navCtrl.popToRoot(); //tro ve trang chu ban dau
      }
      
      if (res.button&&res.button.command==="CREATE"){
        
        //luu token truoc khi goi su kien kiem tra login
        if (this.token) this.apiStorageService.saveToken(this.token);
        //this.events.publish('user-log-in-ok');
        this.checkTokenLogin(); //kiem tra lai login xem
        resolve({next:"CLOSE"}); //vi dung modal nen phai dong lai

      } 

      if (res.button&&res.button.command==="UPDATE"){
        
        if (this.token) this.apiStorageService.saveToken(this.token);
        //this.events.publish('user-log-in-ok'); 
        //this.navCtrl.push(HomeMenuPage);
        resolve({next:"CLOSE"}); //vi dung modal nen phai dong lai

      }else{
        resolve();
      }
      
      if (res.button&&res.button.command==="CODE-GENERATOR"){
        this.openModal(QrBarCodePage
            , {
              parent: this,
              type: 'QR',
              visible: false,
              data: this.token
              });  
      }

      
    });

  }.bind(this);


  ionViewDidLoad_Login() {
    //khởi tao form login
    let form = {
      items: [
        { name: "Nhập số điện thoại",type: "title"}
        , { key: "phone", name: "Phone number", hint: "Số điện thoại di động như 9035xxxxx", type: "text",input_type: "tel",icon: "call",validators: [{ required: true, min: 9, max: 9, pattern: "^[0-9]*$" }]}
         , {
          type: "button"
          ,options: [
              { name: "Xác thực", next: "CALLBACK", command:"FORM-PHONE" , url: ApiStorageService.authServer + "/ext-auth/request-isdn"}
          ]
        }]
      }

        if (this.platform.platforms()[0] === 'core') {
            //nếu môi trường web thì gọi form web
            this.navCtrl.push(DynamicFormWebPage
              , {
                parent: this, //bind this for call
                callback: this.callbackFunction,
                form: form
              });
          
        } else {
          //nếu môi trường mobile thì gọi form mobile
          this.navCtrl.push(DynamicFormMobilePage
            , {
              parent: this, //bind this for call
              callback: this.callbackFunction,
              form: form
            });
        }
  }


  /**
   * Hàm gọi lại trang login và xác thực OTP
   * @param res 
   */
  callbackFunction = function (res) {
      
    return new Promise((resolve, reject) => {
      
      //console.log('login res',res);

      if (res && res.error) {
        this.presentAlert('Lỗi:<br>' + (res.error.error?res.error.error.message:"Error Unknow: " + JSON.stringify(res.error)));
        resolve();
      } else if (res && res.data && res.button && res.button.command === 'FORM-PHONE') {
        // console.log('forward data:', res.data.database_out);
        if (res.data.status === 1 && res.data.message) {
          this.presentAlert('Chú ý:<br>' + res.data.message);
        }
        //gui nhu mot button forward
        resolve({
          next: "NEXT" //mo form tiep theo
          , next_data: {
            data: //new form 
            {
              items: [
                { name: "Nhập mã OTP", type: "title" }
                , { key: "key", name: "Mã OTP", hint: "Nhập mã OTP gửi đến điện thoại", type: "text", input_type: "text", validators: [{ required: true, min: 6, max: 6, pattern: "^[0-9A-Z]*$" }] }
                , {
                  type: "button"
                  , options: [
                    { name: "Trở về", next: "BACK" }
                    , { name: "Xác nhận OTP", next: "CALLBACK", command:"FORM-KEY" , url: ApiStorageService.authServer + "/ext-auth/confirm-key", token: res.data.token }
                  ]
                }]
            }
          }
        });
      } else if (res && res.button && res.button.command === 'FORM-KEY' && res.data && res.data.token) {
        //lay duoc token
        //ktra token co user, image thi pass new ko thi gui ...
        //console.log('token verified:', res.data.token);
        // neu nhu gai quyet xong
        let loading = this.loadingCtrl.create({
          content: 'Đang xử kiểm tra từ máy chủ Đa phương tiện....'
        });
        loading.present();

        //console.log('res.data 1',res.data);

        //Xác thực qua máy chủ lưu hình ảnh, kiểm tra hình ảnh
        this.apiAuth.postDynamicForm( ApiStorageService.mediaServer + '/authorize-token', {check: true}, res.data.token)
          .then(login => {
            //console.log('data', login);
            if (login.status
              && login.user_info
              && login.token
            ) {
              this.userInfo = login.user_info;

              this.token = res.data.token;

              //tiem token cho phien xac thuc tiep theo
              if (this.userInfo.data) {
                //Lưu trữ token này lại xuống đĩa, để lần sau không cần xác thực nữa
                this.apiStorageService.saveToken(this.token);
                //bẩy sự kiện đã login xong
                //this.events.publish('user-log-in-ok');
              }
              //da login thanh cong, kiem tra token 
              this.callLoginOk();
              
            } else {
              //nếu xác thực máy chủ Đa phương tiện không thành công thì cảnh báo
              this.presentAlert('Dữ liệu xác thực không đúng <br>' + JSON.stringify(login))
            }

            loading.dismiss();
            resolve();
          })
          .catch(err => {
            //trường hợp lỗi do máy chủ đa phương tiện thì cảnh báo để thông báo cho Developer Media server
            this.presentAlert('Lỗi xác thực - authorizeFromResource'+ JSON.stringify(err))
            loading.dismiss();
            resolve();
          })
      } else {
        resolve();
      }

    });
  }.bind(this);

  /**
   * Hàm gọi popup trang
   * @param form 
   * @param data 
   */
  openModal(form,data) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }

  //Hàm thông báo 
  presentAlert(msg) {
    this.alertCtrl.create({
      title: 'Cảnh báo!',
      subTitle: msg,
      buttons: ['Đóng lại']
    }).present();
  }

}
