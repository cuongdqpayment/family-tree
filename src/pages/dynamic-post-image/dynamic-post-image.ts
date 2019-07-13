import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, ModalController, NavParams, Events, ViewController } from 'ionic-angular';
import { ApiImageService } from '../../services/apiImageService';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';

import { CroppieOptions } from 'croppie';

@Component({
  selector: 'page-dynamic-post-image',
  templateUrl: 'dynamic-post-image.html'
})
export class DynamicPostImagePage{

  statusIcon = {
    0:"ios-lock", //only me
    1:"md-globe", //public
    2:"ios-contacts", //friend
    3:"ios-people-outline", //friend of friend
  }

  statusOptions = [
    {name:"Chỉ mình tôi", value:0}
    , {name:"Công khai", value:1}
    , {name:"Bạn bè", value:2}
    , {name:"Bạn của bạn", value:3}
  ]

  postData:any;

  /**
   * Đây là đối tượng form cần mở form này lên để điều khiển post tin tức
   * Được khai báo ngay trên parent các tham số này
   */
  postDataOrigin:any = {
    options:{}, //tùy chọn các tham số gửi lên như nhóm, thư mục lưu trữ, cá nhân hóa...
    status:0,   //hình thức chia sẻ công khai
    crop_area: {
      width: 200,
      height: 200,
      type: 'circle' 
    }, //vùng cắt ảnh
    is_face:1, //nhận diện khuông mặt để crop đúng ảnh mặt người thôi
    // image:undefined, //ảnh hiển thị khi load lên
    // croppied: undefined, //ảnh được crop để truyền lên máy chủ
    action:{name:"Đăng", next: "CALLBACK", url: "http://localhost:9238/site-manager/news/post-news"}
    //next là thực hiện công việc tiếp theo
    //url là link để thực hiện gọi theo phương thức
    //method = POST/FORM-DATA
  }

  fileImages: any;
  owner: any = 1;
 
  userInfo: any;
  
  server = ApiStorageService.newsServer;

  parent:any;
  callback:any;

  //tùy chọn vùng crop (cắt)
  croppieOptions:CroppieOptions;

  //các điểm hiển thị cắt
  croppiePoints: number [];

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    private modalCtrl: ModalController,
    private apiImage: ApiImageService,
    private apiAuth: ApiAuthService,
    private loadingCtrl: LoadingController,
    public events: Events
  ) { }

  ngOnInit() {

    this.postDataOrigin = this.navParams.get("form")?this.navParams.get("form"):this.postDataOrigin;
    this.parent = this.navParams.get("parent");
    this.callback = this.navParams.get("callback");
    this.userInfo = this.apiAuth.getUserInfo();

    this.resetForm();
  }


  /**
   * reset gán lại giá trị ban đầu
   */
  resetForm(){
    this.postData = this.apiAuth.cloneObject(this.postDataOrigin);
    //chuẩn bị croppie option và point để lấy theo kiểu lấy
    //xem tài liệu tại: https://foliotek.github.io/Croppie/

    //khung ảnh hiển thị trước
    //this.croppiePoints =  [100,100,200,200];

    this.croppieOptions = {
                        
                              //Báo cho croppie biết để sử dụng đọc hướng ảnh, 
                              //Ko tự động xoay hướng ảnh trước khi hiển thị để crop
                              enableExif: false,
                              //Phần bên trong của croppie thành phần sẽ cắt lấy
                              viewport: this.postData.crop_area?this.postData.crop_area:{
                                                                                          width: 200,
                                                                                          height: 200,
                                                                                          type: 'circle' 
                                                                                        },
                              //biên ngoài của vùng cropper chiếm không gian màn hình bố trí
                              boundary: {
                                  width: 320,
                                  height: 320
                              },

                              showZoomer: true,
                              enableOrientation: true
                        };

  }

  /**
   * Upload file lên để crop
   * Lấy các tham số về file
   */
  imageUploadEvent(evt: any) {
    if (!evt.target) { return; }
    if (!evt.target.files) { return; }
    if (evt.target.files.length !== 1) { return; }
    const file = evt.target.files[0];
    if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/gif' && file.type !== 'image/jpg') { return; }
    
    console.log('file name',file.name);

    this.postData.file = {
      origin: file.name, //ten file gốc không chỉnh sửa
      alt: file.name, //tên file có thể chỉnh sửa nội dung của ảnh
      file: file, //không biến đổi ảnh để gửi ảnh gốc lên nếu cần
      filename: this.apiImage.encodeFilename(file.name), //được biến đổi tên để gửi lên máy chủ
      file_date: file.lastModified?file.lastModified:file.lastModifiedDate?file.lastModifiedDate.getTime():Date.now(),
      size:file.size, //kích cỡ file
      type:file.type  //kiểu file gì
    };
    
    const fr = new FileReader();
    fr.onloadend = (loadEvent) => {
      this.postData.image = fr.result;
    };
    fr.readAsDataURL(file);
  }

  /**
   * Hàm callback sẽ tự động update kết quả crop ảnh bởi container
   * Kết quả trả về là base64 chứa ảnh
   * @param base64OrBlob 
   */
  newImageResultFromCroppie(base64OrBlob: any) {
    //base64 lấy được để hiển thị xem trước
    this.postData.croppied = base64OrBlob; 
    //chuyển đổi base64 thành blob để truyền đi
    this.postData.file.file = this.postData.croppied?this.apiImage.croppiedImage(this.postData.croppied):this.postData.file.file;
    this.postData.file.size = this.postData.file.file.size
    this.postData.file.type = this.postData.file.file.type
  }

  /**
   * Bỏ qua không post tin này nữa
   */
  onClickCancel(){
    if (this.parent) this.viewCtrl.dismiss();
  }

  /**
   * Chọn ảnh có mặt người
   * @param event 
   */
  fileChangeFace(event){
    if (event.target && event.target.files) {
      const files: any = event.target.files;
      for (let key in files) { //index, length, item
        if (!isNaN(parseInt(key))) {
          //console.log('file chọn',files[key]);
          this.apiImage.getFaceDetected(files[key])
                .then(imageData=>{
                  console.log("Kết quả xử lý",imageData);
                })
                .catch(err=>{
                  console.log("Lỗi",err);
                });
          
        }
      }
    }
  }

  /**
   * Xóa file chi tiết
   * @param idx 
   */
  onClickRemoveFile(idx){
    this.postData.files.splice(idx,1);
  }

  /**
   * Xóa ảnh chi tiết
   * @param event 
   */
  onClickRemoveImage(event){
    this.postData.medias.splice(event.id,1);
  }

  /**
   * Thực hiện post tin lên theo tham số url cho trước
   * trả kết quả về hoặc trả nội dung cho hàm callback như dynamic-web
   */
  onClickPost(btn){
    //console.log('data nhập được', btn, this.postData);
    if (btn){
      if (btn.url){
        let loading = this.loadingCtrl.create({
          content: 'Đang load dữ liệu lên máy chủ ....'
        });
        loading.present();

        let form_data: FormData = new FormData();

        form_data.append("status",this.postData.status);
        if (this.postData.options) form_data.append("options",JSON.stringify(this.postData.options));
        
        if (this.postData.croppied){
          
          let key = "image_0";
          //lấy file ảnh đã crop để gửi lên, các thông tin gốc của file vẫn không đổi
          //console.log('dulieu', this.postData.file.filename, this.postData.file.file);
          form_data.append(key, this.postData.file.file, this.postData.file.filename);
          
          form_data.append("options_"+key, JSON.stringify({
            origin: this.postData.file.origin, //tên file gốc của nó
            alt: this.postData.file.alt, //nội dung của file này được truyền lên
            type: this.postData.file.type,
            size: this.postData.file.size,
            file_date: this.postData.file.file_date
          }));
        }
        
        //group_id, content, title
        //this.apiAuth.postDynamicFormData("http://localhost:9234/media/db/upload-image",form_data,true)
        this.apiAuth.postDynamicFormData(btn.url,form_data,true)
        .then(data=>{
          //console.log('data',data);
          
          loading.dismiss();

          btn.next_data = {
            data: data,
            button: btn
          }
          this.next(btn);

        })
        .catch(err=>{
          //console.log('err',err);
          
          loading.dismiss();

          btn.next_data = {
            error: err,
            button: btn
          }
          this.next(btn);

        });
      }else{
        btn.next_data = {
          data: this.postData,
          button: btn
        }
        this.next(btn);
      }
    }else{
      if (this.parent) this.navCtrl.pop()
    }
  }


  next(btn) {

    if (btn) {
      if (btn.next == 'RESET') {
        this.resetForm();
      } else if (btn.next == 'CLOSE') {
        if (this.parent) this.viewCtrl.dismiss(btn.next_data)
      } else if (btn.next == 'HOME') {
        if (this.parent) this.navCtrl.popToRoot()
      } else if (btn.next == 'BACK') {
        if (this.parent) this.navCtrl.pop()
      } else if (btn.next == 'CALLBACK') {
        if (this.callback) {
          this.callback(btn.next_data)
            .then(nextStep => this.next(nextStep));
        } else {
          if (this.parent) this.navCtrl.pop()
        }
      } else if (btn.next == 'NEXT' && btn.next_data && btn.next_data.data) {
        btn.next_data.callback = this.callback; //gan lai cac function object
        btn.next_data.parent = this.parent;     //gan lai cac function object
        btn.next_data.form = btn.next_data.data; //gan du lieu tra ve tu server
        this.navCtrl.push(DynamicPostImagePage, btn.next_data);
      }
    }

  }

}
