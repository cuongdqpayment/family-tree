/**
 * card hien thi thong tin text noi dung
 * đưa vào text có chứa nội dung và url,
 * card này sẽ hiển thị nội dung có link cho phép kích vào
 * hiển thị các ảnh lấy được trong các link để hiển thị trong khung ảnh
 * đồng thời hiển thị các link bên dưới của trang cho phép gọi inappbrowser
 */
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
    selector: 'input-card',
    templateUrl: "input-card.html"
})
export class InputCard implements OnInit{
    //các biến dữ liệu đầu vào
    @Input() resultData: any; //Là đối tượng kết quả hành động like, comment, share ở dưới
    @Input() actionData: any; //Là đối tượng hành động like, comment, share
    
    //sự kiện truyền các hành động thực hiện trên card này ra 
    @Output() onClickSub = new EventEmitter();

    ngOnInit() {
        
    }
    //khi bấm vào phần tử item (toàn bộ dòng - thuộc tích click=true) 
    //thì sự kiện này được sinh ra
    onClickActions(action){
        this.onClickSub.emit({action});
    }
    
}