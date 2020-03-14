/**
 * Created by Hongcai Deng on 2015/12/28.
 */

'use strict';

let fs = require("fs");
let path = require('path');
let shortid = require('shortid');
let config = require(path.join(__dirname, '..', 'config-default.json'));
let data_path = path.join(__dirname, '..', 'data');

class Util {

  constructor() {
    this.blacklist = this.initBlankList()
    this.character = config.shortid.character
    this.min_length = config.shortid.min_length
    this.max_length = config.shortid.max_length
    this.try_times = config.shortid.try_times
    let ext_str = '/^[' + this.character + ']{' + this.min_length + ',' + this.max_length + '}$/'
    this.exp = eval(ext_str)
    this.save_mail = config.save_mail
  }

  genShortId = function (id) {
    for (let count = 1; count <= this.try_times; count++) {
      if (undefined != id && this.exp.test(id) && !this.inBlankList(id)) {
        return id
      }
      id = shortid.generate().toLowerCase();
    }
    return undefined
  }

  /**
   * save mail
   */
  saveMail = function (shortid, data) {
    if (!this.save_mail) {
      return
    }
    let datas = []
    let line = '===================================================='
    datas.push(line)
    datas.push('From: ' + data.headers.from)
    datas.push('To: ' + data.headers.to)
    datas.push('Subject: ' + data.subject)
    let datetime_str = this.dateFormat(data.date, 'yyyy-MM-dd HH:mm:ss')
    datas.push('Date: ' + datetime_str)
    datas.push(line)
    datas.push(data.text)
    datas.push(line)
    datas.push(data.html)
    datas.push(line)
    let content = datas.join('\r\n')

    let file_path = path.join(data_path, shortid)
    this.mkDirsSync(file_path)

    let file_name = data.subject.replace(/\//g, '_') + '_' + this.dateFormat(data.date, 'yyyyMMdd_HHmmss')
    let data_file = path.join(file_path, file_name)
    fs.writeFile(data_file, content, function (err) {
      if (err) {
        return console.error(err)
      }
      console.log(data.headers.from + ' - ' + data.subject + ' - ' + datetime_str)
      console.log("save successful.")
    })
  }

  inBlankList = function (id) {
    return this.blacklist.has(id)
  }

  initBlankList = function () {
    let blacklist = new Set()
    fs.readFile("./blacklist", "utf-8", function (error, data) {
      if (error) {
        console.log("read black list error.\n" + error.message)
      }
      console.log("read black list success.")
      let list = data.split(/[^\w-]+/);
      let exp = /[\w-]{4,}/i;
      list.forEach(function (item, idx) {
        if (exp.test(item)) {
          console.log((idx + 1) + "." + item + ', added.')
          blacklist.add(item)
        } else {
          console.log((idx + 1) + "." + item + ', format illegal.')
        }
      })
    })
    return blacklist
  }

  dateFormat = function (v, format) {
    if (v) {
      var o = {
        "M+": v.getMonth() + 1, //月份           
        "d+": v.getDate(), //日           
        "h+": v.getHours() % 12 == 0 ? 12 : v.getHours() % 12, //小时           
        "H+": v.getHours(), //小时           
        "m+": v.getMinutes(), //分           
        "s+": v.getSeconds(), //秒           
        "q+": Math.floor((v.getMonth() + 3) / 3), //季度           
        "S": v.getMilliseconds() //毫秒           
      };
      var week = {
        "0": "\u65e5",
        "1": "\u4e00",
        "2": "\u4e8c",
        "3": "\u4e09",
        "4": "\u56db",
        "5": "\u4e94",
        "6": "\u516d"
      };
      if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (v.getFullYear() + "").substr(4 - RegExp.$1.length));
      }
      if (/(E+)/.test(format)) {
        format = format.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "\u661f\u671f" : "\u5468") : "") + week[v.getDay() + ""]);
      }
      for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
          format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
      }
      return format;
    }
  }
  
  mkDirsSync = function (dirname) {
    if (fs.existsSync(dirname)) {
      return true
    } else {
      if (this.mkDirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
  }

}

let util = new Util()

module.exports = util;
