/**
 * card hien thi thong tin text noi dung
 * đưa vào text có chứa nội dung và url,
 * card này sẽ hiển thị nội dung có link cho phép kích vào
 * hiển thị các ảnh lấy được trong các link để hiển thị trong khung ảnh
 * đồng thời hiển thị các link bên dưới của trang cho phép gọi inappbrowser
 */
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PopoverCard } from '../popover-card/popover-card';
import { PopoverController } from 'ionic-angular';

@Component({
    selector: 'user-card',
    templateUrl: "user-card.html"
})
export class UserCard implements OnInit{
    //các biến dữ liệu đầu vào
    @Input() ownerData: any; //Là thông tin của đối tượng userInfo chứa username, .data.fullname...
    @Input() userData: any; //là thông tin chứa: id của bản tin, username, cùng thời gian tạo bản tin này
    @Input() contactData: any; //danh bạ unique có chứa avatar đã chuyển đổi
    
    //sự kiện sinh ra truyền giá trị con cho cấp cha 1 cấp
    @Output() onClickSub = new EventEmitter();
    
    statusIcon = {
        0:"ios-lock", //only me
        1:"md-globe", //public
        2:"ios-contacts", //friend
        3:"ios-people-outline", //friend of friend
    }

    constructor(
        private popoverCtrl: PopoverController
    ) { }

    ngOnInit() {}

    //sự kiện này được sinh ra khi bấm nút more
    //hiển thị popup menu tùy chọn cho các lệnh tùy vào tin của user hay của người khác
    onClickMore(ev,isPrivate,icon){

        //neu tin cua user thi hien thi menu:
        //chinh sua nguoi doc tin (status) --list
        //xoa bo tin nay
        //chinh sua noi dung cua tin

        //neu tin cua user khac:
        //block khong xem tin nay nua
        //bao cao spam
    
        let menu;

        if (isPrivate){
            menu = 
            [
                {
                    icon: icon,
                    color:"primary",
                    name: "Sửa trạng thái tin",
                    value: "edit-status"
                }
                ,
                {
                    icon:"trash",
                    color:"danger",
                    name: "Xóa bỏ tin này",
                    value: "delete"
                }
                ,
                {
                    icon:"md-create",
                    color:"secondary",
                    name: "Chỉnh sửa tin này",
                    value: "edit-content"
                }
            ];
        } else {
            menu = 
            [
                {
                    icon:"md-eye-off",
                    color:"secondary",
                    name: "Block tin này",
                    value: "block"
                }
                ,
                {
                    icon:"md-megaphone",
                    color:"danger",
                    name: "Báo cáo Spam",
                    value: "report"
                }
            ];
            if (this.ownerData 
                && this.ownerData.data
                && this.ownerData.data.role===99
                ){
                    menu.splice(2,0,{
                        icon:"trash",
                        color:"danger",
                        name: "Xóa bỏ tin này",
                        value: "delete"
                    }) 
                }
        }


        let popover = this.popoverCtrl.create(PopoverCard,  {form: {
            type: "item", //icon/color/tab/item
            menu: menu
        }});
      
        popover.present({ev: ev}); //su kien lay toa do hien thi menu

        //this.onClickSub.emit(data);
        popover.onDidDismiss(data => {
            if (data){
                //console.log('Nhận dữ liệu chọn',data);
                this.onClickSub.emit({command:data})
            }
        })

    }

}