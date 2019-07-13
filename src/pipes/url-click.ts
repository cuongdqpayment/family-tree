import { Pipe, PipeTransform } from '@angular/core';
/*
 * Converts urlClick into html breaks
*/
@Pipe({ name: 'urlClick' })
export class UrlClickPipe implements PipeTransform {
    transform(value: string, args: string[]): any {
        var urlRegex = /(\b(https?|ftp):\/\/[^\s]+)/g;
        return value.replace(urlRegex, function (url) {
            return "<a href='"+url+"' target='_blank' onclick='onClickUrl(\"" + url + "\")'>" + url + "</a>";
            //return "<div onclick='onClickUrl(\"" + url + "\")'>" + url + "</div>";
        })

    }
}