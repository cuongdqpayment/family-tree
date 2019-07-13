import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, ModalController, NavParams, Events, ViewController } from 'ionic-angular';
import { ApiImageService } from '../../services/apiImageService';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiStorageService } from '../../services/apiStorageService';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'page-dynamic-view',
  templateUrl: 'dynamic-view.html'
})
export class DynamicViewPage implements OnInit {

  statusIcon = {
    0: "ios-lock", //only me
    1: "md-globe", //public
    2: "ios-contacts", //friend
    3: "ios-people-outline", //friend of friend
  }

  statusOptions = [
    { name: "Chỉ mình tôi", value: 0 }
    , { name: "Công khai", value: 1 }
    , { name: "Bạn bè", value: 2 }
    , { name: "Bạn của bạn", value: 3 }
  ]

  
  server = ApiStorageService.newsServer;

  newsData: any = {};
  contacts: any = {};   // this.apiContact.getUniqueContacts()
  userInfo: any = {}; // this.apiAuth.getUserInfo()
  parent: any;
  callback: any;

  /**
   * Đây là đối tượng form cần mở form này lên để điều khiển post tin tức
   */
  newsDataOrigin: any = {
    id: 1, //mã quản lý của tin tức này

    username: "903500888", //user nhập tin tức này
    status: 1,   //hình thức chia sẻ của tin tức này
    time: Date.now(), //thời gian của tin tức này

    content: "Ngày mai, người hâm mộ cả nước sẽ theo dõi đội tuyển Việt Nam đá trận ra quân tại King's Cup với chủ nhà Thái Lan vào 19h45 ngày 5/6. Trận đấu được coi là trận cầu siêu kinh điển, hấp dẫn nhất trong 4 trận của giải đấu này. Trước đó, ở cặp đấu còn lại Ấn Độ sẽ có trận đấu với Curacao lúc 15h30. Đội tuyển Việt Nam hiện đã có mặt ở Thái Lan và bắt đầu có buổi tập làm quen sân Chang Arena từ hôm qua 3/6.\nTheo nguồn tin từ Next Media, VTV sẽ tiếp sóng hai trận đấu của đội tuyển Việt Nam tại King’ Cup 2019 trên kênh VTV5. Như vậy tính đến hôm nay, Next Media đã chấp thuận cho nhiều đơn vị truyền hình tiếp sóng hai trận đấu của đội tuyển Việt Nam tại giải đấu King’ Cup 2019. Cụ thể là các kênh: VTV5, THVL 4, VTVcab 16 - Bóng đá TV, K+PM, Truyền hình FPT và FPT Play, TVod và Smart box VNPT, VOV1, VOV2, Truyền hình nhân dân, HTV Thể thao, THĐT1.\nĐài Truyền hình Kỹ thuật số VTC trực thuộc Đài Tiếng nói Việt Nam VOV là đơn vị phát sóng King's Cup theo thỏa thuận với Next Media. Hai trận đấu của đội tuyển Việt Nam, trong đó có màn so tài \"siêu kinh điển\" Đông Nam Á giữa Việt Nam và Thái Lan, sẽ được tường thuật trực tiếp trên các kênh truyền hình VTC1, VTC3; hai kênh phát thanh VOV1 và VOV2.\nLiên quan đến việc phát sóng 2 trận đấu của tuyển Việt Nam tại King's Cup 2019, BLV Quang Huy khẳng định Đài VTC đã có sự chuẩn bị chu đáo về mặt chuyên môn. BLV Quang Huy và BLV Quang Tùng sẽ bình luận trực tiếp 2 trận đấu này.\nBên cạnh các kênh truyền hình, hai trận đấu của đội tuyển Việt Nam cũng được livestream trên mạng xã hội Next Sports. Các ứng dụng OTT như VTC Now, VTVcab On, Onme cũng sẽ phát trực tiếp các trận đấu này.\n\nCông ty CP Giải pháp Truyền hình thế hệ mới (Next Media) là đơn vị sở hữu bản quyền 2 trận đấu của đội tuyển tại giải bóng King’s Cup 2019 ở Thái Lan. Theo đó, gói bản quyền mà Next Media đang sở hữu bao gồm: độc quyền và được phép phân phối lại cho các đơn vị thứ ba trên toàn bộ hệ thống trả tiền trên hạ tầng vệ tinh, cáp, IPTV, OTT, phát thanh, Internet, mạng xã hội, mạng di động và trình chiếu công cộng.\nDo đó, Next Media cho biết, bất kỳ đơn vị hay doanh nghiệp nào tổ chức trình chiếu giải đấu tại các địa điểm công cộng và mục đích thương mại đều cần phải liên hệ với họ để được cấp quyền.\nSau hai trận bán kết, trận chung kết bắt đầu vào 19h45 ngày 8/6, trận đấu tranh giải 3 diễn ra lúc 15h30 cùng ngày.\nNếu giành chiến thắng trong trận gặp Thái Lan, đội tuyển Việt Nam sẽ gặp đội thắng ở cặp đấu Ấn Độ - Curacao trong trận chung kết ngày 8/6.\nHai đội thua ở 2 cặp đấu ngày khai mạc sẽ gặp nhau ở trận tranh hạng 3.", //Nội dung gốc nhập lên để hiển thị
    medias: [
      { src: "https://image1.ictnews.vn/_Files/2019/05/20/king-cup_225x170.jpg", alt: "VTC sẽ phát sóng chính thức giải đấu bóng đá giao hữu King’ Cup 2019"},
      { src: "https://image1.ictnews.vn/_Files/2019/05/29/king-cup-1206111_225x170.jpg", alt: "Các kênh truyền hình được tiếp sóng hai trận đấu của ĐT Việt Nam tại King’ Cup 2019" },
      { src: "https://image1.ictnews.vn/_Files/2019/06/07/cliptv_zalopay_motion1-min_225x170.jpg", alt: "Clip TV giảm 50% khi đăng ký gói VIP qua ZaloPay" }, { src: "https://image1.ictnews.vn/_Files/2019/06/06/bui_tien_dung_1_225x170.jpg", alt: "VTC3, VTC1, VTV5 và các kênh truyền hình tiếp sóng trận giao hữu U23 Việt Nam và U23 Myanmar" }, { src: "https://image1.ictnews.vn/_Files/2018/12/19/dtvn1_225x170.jpg", alt: "Mới nhất: VTV5 và các kênh tiếp sóng trực tiếp 2 trận đấu của ĐT Việt Nam tại King’ Cup 2019" }, { src: "https://image1.ictnews.vn/_Files/2019/06/06/bui_tien_dung_1_225x170.jpg", alt: "VTC3, VTC1, VTV5 và các kênh truyền hình tiếp sóng trận giao hữu U23 Việt Nam và U23 Myanmar" }, { src: "https://image1.ictnews.vn/_Files/2018/12/19/dtvn1_225x170.jpg", alt: "Mới nhất: VTV5 và các kênh tiếp sóng trực tiếp 2 trận đấu của ĐT Việt Nam tại King’ Cup 2019" }, { src: "https://image1.ictnews.vn/_Files/2019/05/11/k-_225x170.jpg", alt: "Ngày 12/5, K+ mở mã 4 kênh K+ chiêu đãi khán giả xem Ngoại hạng Anh vòng cuối" }, { src: "https://image1.ictnews.vn/_Files/2019/05/20/king-cup_225x170.jpg", alt: "VTC sẽ phát sóng chính thức giải đấu bóng đá giao hữu King’ Cup 2019" }], //danh sách các file ảnh kèm theo
    files: [],  //Danh sách các file kèm theo

    results:{},
    actions:{},

    options: {} //các tùy chọn của tin tức này
  }


  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    private inAppBrowser: InAppBrowser,
    private apiAuth: ApiAuthService,
    private loadingCtrl: LoadingController,
    public events: Events
  ) { }

  ngOnInit() {

    this.newsDataOrigin = this.navParams.get("form") ? this.navParams.get("form") : this.newsDataOrigin;
    this.userInfo = this.navParams.get("user_info");
    this.contacts = this.navParams.get("contacts");
    this.parent = this.navParams.get("parent");
    this.callback = this.navParams.get("callback");

    this.resetForm();
  }

  resetForm() {
    this.newsData = this.newsDataOrigin;
  }

  /**
   * Mở file này ra để xem thử (cái này chỉ dùng trên máy tính)
   * Mở theo kiểu inappbrowser với thuộc tính là file
   * @param f 
   */
  onClickViewFile(f) {
    //open file for review
    console.log(f.file);
  }

  /**
   * Bấm chi tiết từng ảnh
   * thì xem như mở rộng ảnh ra để xem
   * @param event 
   */
  onClickImage(event) {
      var options = "hidden=no,toolbar=yes,location=yes,presentationstyle=fullscreen,clearcache=yes,clearsessioncache=yes";
      this.inAppBrowser.create(event, "_blank", options);
  }

  
  onClickMore(event,id) {
    console.log('more of', id,  event);
  }

  onClickAction(event, id) {
    console.log(id, event);
  }


  /**
   * Bỏ qua không post tin này nữa
   */
  onClickGoBack() {
    if (this.parent) this.viewCtrl.dismiss();
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
        this.navCtrl.push(DynamicViewPage, btn.next_data);
      }
    }

  }

}
