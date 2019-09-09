(function ($) {
    $.fn.timeSchedule = function (options) {
        // LIN 日時初期値
        var date = new Date();
        var nowYear = date.getFullYear();
        var nowMonth = ((date.getMonth() + 1) < 10) ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
        var nowDate = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate();
        var today = nowYear + '/' + nowMonth + '/' + nowDate;

        var defaults = {
            rows: {},
            startDate: today,
            endDate: today,
            weekday: ['日', '月', '火', '水', '木', '金', '土'], // LIN 追加機能 - DOW表示
            today: today,
            nowTime: '24:00',
            startTime: "07:00",
            endTime: "19:30",
            widthTimeX: 25, // 1cell辺りの幅(px)
            widthTime: 600, // 区切り時間(秒)
            timeLineY: 50, // timeline height(px)
            timeLineBorder: 1, // timeline height border
            timeBorder: 1, // border width
            timeLinePaddingTop: 0,
            timeLinePaddingBottom: 0,
            headTimeBorder: 1, // time border width
            dataWidth: 160, // data width
            verticalScrollbar: 0, // vertical scrollbar width
            multiple: false, // LIN 追加機能-複数選択機能有無
            // event
            initData: null,
            change: null,
            dateClick: null,
            titleClick: null,
            click: null,
            append: null,
            timeClick: null,
            timeDrag: null,
            delete: null,
            nextNo: 1, // LIN 追加機能 - 複数選択初期番号
            debug: "" // debug selecter
        };

        this.calcStringTime = function (string) {
            var slice = string.split(':');
            var h = Number(slice[0]) * 60 * 60;
            var i = Number(slice[1]) * 60;
            var min = h + i;
            return min;
        };
        this.formatTime = function (min) {
            var h = "" + (min / 36000 | 0) + (min / 3600 % 10 | 0);
            var i = "" + (min % 3600 / 600 | 0) + (min % 3600 / 60 % 10 | 0);
            var string = h + ":" + i;
            return string;
        };

        // LIN 時だけの表示
        this.formatHour = function (min) {
            var h = "" + (min / 36000 | 0) + (min / 3600 % 10 | 0);
            var i = "" + (min % 3600 / 600 | 0) + (min % 3600 / 60 % 10 | 0);
            var string = h;
            return string;
        };

        // dateオブジェクトをstring へ
        this.dateToString = function (date) {
            var nowYear = date.getFullYear();
            var nowMonth = this.zeroPadding((date.getMonth() + 1), 2);
            var nowDate = this.zeroPadding(date.getDate(), 2);
            var nowHour = this.zeroPadding(date.getHours(), 2);
            var nowMinutes = this.zeroPadding(date.getMinutes(), 2);
            return nowYear + '/' + nowMonth + '/' + nowDate + ' ' + nowHour + ':' + nowMinutes;
        }

        this.zeroPadding = function (num, length) {
            return (Array(length).join('0') + num).slice(-length);
        }

        var setting = $.extend(defaults, options);
        this.setting = setting;
        var scheduleData = new Array();
        var timelineData = new Array();
        var liveDataNo = new Array(); // LIN 生きている追加番号
        var $element = $(this);
        var element = (this);
        var tableStartTime = element.calcStringTime(setting.startTime);
        var tableEndTime = element.calcStringTime(setting.endTime);
        var currentNode = null;
        tableStartTime -= (tableStartTime % setting.widthTime);
        tableEndTime -= (tableEndTime % setting.widthTime);

        // LIN 表示範囲を決める
        var milliseconds1 = new Date(setting.startDate).getTime();
        var milliseconds2 = new Date(setting.endDate).getTime();
        if (milliseconds1 > milliseconds2) {
            var differenceMs = milliseconds1 - milliseconds2;
        } else {
            var differenceMs = milliseconds2 - milliseconds1;
        }
        var diffDays = (Math.floor(differenceMs / (1000 * 60 * 60 * 24))) + 1;

        // LIN 表示範囲を配列に納入
        var daysArray = [];
        for (var n = 0; n < diffDays; n++) {
            var dateElement = new Date(setting.startDate);
            dateElement.setDate(dateElement.getDate() + n);
            var newYear = dateElement.getFullYear();
            var newMonth = (((dateElement.getMonth() + 1) < 10) ? '0' : '') + (dateElement.getMonth() + 1);
            var newDate = ((dateElement.getDate() < 10) ? '0' : '') + dateElement.getDate();
            var dateLabel = newYear + '/' + newMonth + '/' + newDate;
            daysArray[n] = dateLabel;
        }

        this.getScheduleData = function () {
            return scheduleData;
        }
        this.getTimelineData = function () {
            return timelineData;
        }
        // LIN 現在のタイムライン番号を取得
        this.getTimeLineNumber = function (top) {
            var num = 0;
            var n = 0;
            var tn = Math.ceil(top / (setting.timeLineY + setting.timeLinePaddingTop + setting.timeLinePaddingBottom));
            for (var i in setting.rows) {
                var r = setting.rows[i];
                var tr = 0;
                if (typeof r["schedule"] == Object) {
                    tr = r["schedule"].length;
                }
                if (currentNode && currentNode["timeline"]) {
                    tr++;
                }
                n += Math.max(tr, 1);
                if (n >= tn) {
                    break;
                }
                num++;
            }
            return num;
        }
        // LIN 背景データ追加
        this.addScheduleBgData = function (data) {
            var st = Math.ceil((data["start"] - tableStartTime) / setting.widthTime);
            var et = Math.floor((data["end"] - tableStartTime) / setting.widthTime);
            var $bar = jQuery('<div class="sc_bgBar"><span class="text"></span></div>');
            $bar.css({
                left: (st * setting.widthTimeX),
                top: 0,
                width: ((et - st) * setting.widthTimeX),
                height: $element.find('.sc_main .timeline').eq(data["timeline"]).height()
            });
            if (data["text"]) {
                $bar.find(".text").text(data["text"]);
            }
            if (data["class"]) {
                $bar.addClass(data["class"]);
            }
            // $element.find('.sc_main').append($bar);
            $element.find('.sc_main .timeline').eq(data["timeline"]).append($bar);
        }

        // LIN スケジュール追加（日付あり）
        this.addScheduleData = function (data, startDate, endDate) {
            var show = false;
            $.each(daysArray, function (i, day) {
                var selectedDateMs = new Date(day).getTime();
                var startDateMs = new Date(startDate).getTime();
                var endDateMs = new Date(endDate).getTime();
                if (startDateMs <= selectedDateMs && selectedDateMs <= endDateMs) {
                    show = true;
                    return false;
                }
            });
            if (show) {
                // LIN 画面を超えないように
                var startDaysNum = daysArray.indexOf(startDate);
                var endDaysNum = daysArray.indexOf(endDate);
                if (startDaysNum < 0) {
                    startDaysNum = 0;
                    data['start'] = element.calcStringTime(setting.startTime);
                }
                if (endDaysNum < 0) {
                    endDaysNum = (daysArray.length - 1);
                    data['end'] = element.calcStringTime(setting.endTime);
                }
                var startMultiples = startDaysNum * (tableEndTime / setting.widthTime);
                var endMultiples = endDaysNum * (tableEndTime / setting.widthTime);

                // LIN 1時間単位なので、無条件切り上げ
                var st = Math.floor((data["start"] - tableStartTime) / setting.widthTime) + startMultiples;
                var et = Math.ceil((data["end"] - tableStartTime) / setting.widthTime) + endMultiples;

                // 削除ボタンの追加
                var $deleteBtn = jQuery('<span style="float: right; padding: 5px">✖</span>');
                $deleteBtn.click(function () {
                    // LIN 削除した列の高さを調整する
                    var sc_key = $bar.data("sc_key");
                    var deleteTimelineNum = scheduleData[sc_key].timeline;
                    var tempDeleteData = scheduleData[sc_key];
                    $bar.remove();
                    element.resetBarPosition(deleteTimelineNum);

                    // LIN 追加したエレメントの削除は追加番号を削除する
                    if (tempDeleteData['data']['No'] !== undefined) {
                        var key = jQuery.inArray(tempDeleteData['data']['No'], liveDataNo);
                        liveDataNo.splice(key, 1);
                    }

                    if (setting.delete) {
                        if (jQuery(this).data("dragCheck") !== true && jQuery(this).data("resizeCheck") !== true) {
                            setting.delete(tempDeleteData);
                        }
                    }
                });

                // ブロック内容の追加
                var $content = jQuery('<span class="head"><span class="startTime time"></span>～<span class="endTime time"></span></span><span class="text"></span>');
                var $bar = jQuery('<div class="sc_Bar ' + data['class'] + '"></div>').append($deleteBtn).append($content);
                var stext = startDate + ' ' + element.formatTime(data["start"]);
                var etext = endDate + ' ' + element.formatTime(data["end"]);
                var snum = element.getScheduleCount(data["timeline"]);
                $bar.css({
                    left: (st * setting.widthTimeX),
                    top: ((snum * setting.timeLineY) + setting.timeLinePaddingTop),
                    width: ((et - st) * setting.widthTimeX),
                    height: (setting.timeLineY) - 2
                });
                $bar.find(".startTime").text(stext);
                $bar.find(".endTime").text(etext);
                if (data["text"]) {
                    $bar.find(".text").text(data["text"]);
                }
                if (data["class"]) {
                    $bar.addClass(data["class"]);
                }
                $element.find('.sc_main .timeline').eq(data["timeline"]).append($bar);
                // LIN データの追加
                scheduleData.push(data);
                // key
                var key = scheduleData.length - 1;
                $bar.data("sc_key", key);

                $bar.bind("mouseup", function () {
                    // LIN コールバックがセットされていたら呼出
                    if (setting.click) {
                        if (jQuery(this).data("dragCheck") !== true && jQuery(this).data("resizeCheck") !== true) {
                            var node = jQuery(this);
                            var sc_key = node.data("sc_key");
                            setting.click(node, scheduleData[sc_key]);
                        }
                    }
                });

                // var $node = $element.find(".sc_Bar");
                // move bar.
                $bar.draggable({
                    grid: [setting.widthTimeX, setting.timeLineY],
                    containment: ".sc_main",
                    helper: 'original',
                    opacity: 0.5,
                    start: function (event, ui) {
                        var node = {};
                        node["node"] = this;
                        node["offsetTop"] = ui.position.top;
                        node["offsetLeft"] = ui.position.left;
                        node["currentTop"] = ui.position.top;
                        node["currentLeft"] = ui.position.left;
                        node["timeline"] = element.getTimeLineNumber(ui.position.top);
                        node["nowTimeline"] = node["timeline"];
                        // LIN 元の位置へ戻すために初期位置を記憶する
                        node['startedTop'] = jQuery(this).position().top;
                        node['startedLeft'] = jQuery(this).position().left;
                        node["startedTimeline"] = scheduleData[jQuery(this).data("sc_key")].timeline;
                        node["movedDiff"] = 0;
                        currentNode = node;
                    },
                    revert: function (event) {
                        var node = jQuery(this);
                        var sc_key = node.data("sc_key");
                        var x = node.position().left;
                        var w = node.width();
                        // LIN 予約できない場合、戻す
                        var timelineNum = scheduleData[sc_key].timeline
                        var $movedStartTarget = jQuery(jQuery(".line_" + (timelineNum + 1))[Math.floor(x / setting.widthTimeX)]);
                        var $movedEndTarget = jQuery(jQuery(".line_" + (timelineNum + 1))[(Math.floor((x + w) / setting.widthTimeX)) - 1]);
                        if ($movedStartTarget.hasClass("cant_res") || $movedEndTarget.hasClass("cant_res")) {
                            // LIN 元の位置へ戻す
                            var timelineDiff = currentNode["startedTimeline"] - timelineNum;
                            jQuery(this).data("uiDraggable").originalPosition = {
                                top: setting.timeLineY * timelineDiff,
                                left: Math.floor(currentNode['startedLeft'] / setting.widthTimeX) * setting.widthTimeX
                            };
                            return true;
                        }
                        return false;
                    },
                    drag: function (event, ui) {
                        jQuery(this).data("dragCheck", true);
                        if (!currentNode) {
                            return false;
                        }
                        currentNode["movedDiff"] = parseInt((ui.position.top - currentNode["startedTop"]) / setting.timeLineY);
                        return true;
                    },
                    // 要素の移動が終った後の処理
                    stop: function (event, ui) {
                        jQuery(this).data("dragCheck", false);

                        var node = jQuery(this);
                        var sc_key = node.data("sc_key");
                        var x = node.position().left;
                        var w = node.width();

                        var start = tableStartTime + (Math.floor(x / setting.widthTimeX) * setting.widthTime);
                        var end = tableStartTime + (Math.floor((x + w) / setting.widthTimeX) * setting.widthTime);

                        scheduleData[sc_key]["start"] = start;
                        scheduleData[sc_key]["end"] = end;

                        var timelineNum = element.getTimeLineNumber(ui.position.top);

                        ui.position.left = Math.floor(ui.position.left / setting.widthTimeX) * setting.widthTimeX;

                        if (currentNode["timeline"] != timelineNum) {
                            // 現在のタイムライン
                            currentNode["timeline"] = timelineNum;
                        }

                        currentNode["currentTop"] = currentNode["timeline"] * setting.timeLineY;
                        currentNode["currentLeft"] = ui.position.left;

                        currentNode = null;

                        element.rewriteBarText(node, scheduleData[sc_key]);
                        // コールバックがセットされていたら呼出
                        if (setting.change) {
                            setting.change(node, scheduleData[sc_key]);
                        }
                    },
                });
                $bar.resizable({
                    handles: 'e',
                    grid: [setting.widthTimeX, setting.timeLineY],
                    minWidth: setting.widthTimeX,
                    start: function (event, ui) {
                        var node = jQuery(this);
                        node.data("resizeCheck", true);
                    },
                    resize: function (event, ui) {
                        var node = jQuery(this);
                        node.data("resizeCheck", true);

                        // LIN 予約できない場合、戻す
                        var sc_key = node.data("sc_key");
                        var x = node.position().left;
                        var w = node.width();
                        var timelineNum = scheduleData[sc_key]["timeline"];
                        var $movedTarget = jQuery(jQuery(".line_" + (timelineNum + 1))[(Math.floor((x + w) / setting.widthTimeX)) - 1]);
                        if ($movedTarget.hasClass("cant_res")) {
                            ui.element.css(ui.originalSize);
                        }
                    },
                    // 要素の移動が終った後の処理
                    stop: function (event, ui) {
                        var node = jQuery(this);
                        var sc_key = node.data("sc_key");
                        var x = node.position().left;
                        var w = node.width();
                        var start = tableStartTime + (Math.floor(x / setting.widthTimeX) * setting.widthTime);
                        var end = tableStartTime + (Math.floor((x + w) / setting.widthTimeX) * setting.widthTime);
                        var timelineNum = scheduleData[sc_key]["timeline"];

                        scheduleData[sc_key]["start"] = start;
                        scheduleData[sc_key]["end"] = end;

                        // 高さ調整
                        element.resetBarPosition(timelineNum);
                        // テキスト変更
                        element.rewriteBarText(node, scheduleData[sc_key]);

                        node.data("resizeCheck", false);
                        // コールバックがセットされていたら呼出
                        if (setting.change) {
                            setting.change(node, scheduleData[sc_key]);
                        }
                    }
                });

                return key;
            }
        };

        // LIN スケジュール数の取得
        this.getScheduleCount = function (n) {
            var num = 0;
            for (var i in scheduleData) {
                if (scheduleData[i]["timeline"] == n) {
                    num++;
                }
            }
            return num;
        };

        // LIN アンエスケープ
        this.unescapeHtml = function (string) {
            return string.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x60;/g, '`').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#039;/g, "'");
        };

        // LIN 複数選択の場合、番号追加
        var addNo = setting.nextNo;
        var maxRow = 1;
        this.addRow = function (timeline, row) {
            // LIN ラインID
            var lineId = maxRow;

            var title = this.unescapeHtml(row["title"]);
            var id = $element.find('.sc_main .timeline').length;

            var html;

            var $data = jQuery('<div class="timeline">');
            var $title_span = jQuery('<span class="title_' + lineId + '" data-id="' + lineId + '">' + title + '</span>').appendTo($data);
            if (setting.titleClick) {
                $title_span.css('cursor', 'pointer');
                $title_span.click(function () {
                    setting.titleClick({
                        timeline: $(this).data('id')
                    });
                });
            }

            // event call
            if (setting.initData) {
                setting.initData($data, row);
            }
            $element.find('.sc_data_scroll').append($data);

            html = '';
            html += '<div class="timeline"></div>';
            var $timeline = jQuery(html);
            var impossibleDate = (row["impossibleDate"] !== undefined && row["impossibleDate"] !== null) ? row["impossibleDate"] : [];
            for (var count = 0; count < diffDays; count++) {
                var dayOfWeek = (count == 6) ? 0 : (count + 1);
                var businessStartTime = element.calcStringTime(row["businessHours"][dayOfWeek]['start']);
                var businessEndTime = element.calcStringTime(row["businessHours"][dayOfWeek]['end']);
                for (var t = tableStartTime; t < tableEndTime; t += setting.widthTime) {
                    var $tl = jQuery('<div class="tl line_' + lineId + '"></div>');
                    $tl.width(setting.widthTimeX - setting.timeBorder);
                    $tl.addClass("date_" + daysArray[count].replace(/\//gi, ''));
                    // LIN ラインIDを埋め込む
                    $tl.data("lineId", lineId);
                    // LIN dataに日付を埋め込む
                    $tl.data("date", daysArray[count]);
                    $tl.data("time_start", element.formatTime(t));
                    $tl.data("time_end", element.formatTime(t + setting.widthTime));
                    var isPastDate = (new Date(daysArray[count]).getTime() < new Date(setting.today).getTime()) ? true : false;
                    if (new Date(daysArray[count]).getTime() == new Date(setting.today).getTime()) {
                        isPastDate = (t <= element.calcStringTime(setting.nowTime)) ? true : false;
                    }
                    if (isPastDate || impossibleDate.indexOf(daysArray[count]) >= 0 || (t < businessStartTime || t >= businessEndTime)) {
                        $tl.addClass("cant_res");
                    } else {
                        $tl.addClass("can_res");
                    }
                    $tl.data("timeline", timeline);
                    $timeline.append($tl);
                }
            }

            // クリックイベント
            // left click
            $timeline.find(".tl").click(function () {
                if (setting.timeClick) {
                    setting.timeClick(this, [jQuery(this).data("date") + " " + jQuery(this).data('time_start')]);
                }
            });

            // LIN ドラッグイベント
            if (setting.timeDrag) {
                var isMouseDown = false;
                var lineId = null;
                var startX = 0;
                var $startElement;
                var $endElement;
                $timeline.find(".tl").bind("mousedown", function (event) {
                    if (!setting.multiple && liveDataNo.length > 0) {
                        console.log('not support multiple!');
                        return false;
                    }
                    $startElement = jQuery(this);
                    if ($startElement.hasClass('can_res')) {
                        $endElement = undefined;
                        if (!$startElement.hasClass('selected_time')) {
                            $startElement.toggleClass('time_first', true);
                            $startElement.toggleClass('selected_no_' + addNo, true);
                            lineId = $startElement.data('lineId');
                            startX = event.pageX;
                            if (!setting.multiple) {
                                jQuery('.selected_time').toggleClass('selected_time', false);
                            }
                            isMouseDown = true;
                            $startElement.toggleClass("selected_time", true);
                            if (setting.multiple) {
                                $startElement.html('');
                                $startElement.append($('<div>' + addNo + '</div>'));
                            }
                        }
                    }
                });
                jQuery('body').mouseup(function (event) {
                    if (isMouseDown) {
                        isMouseDown = false;
                        var startDate = $startElement.data('date');
                        var startTime = $startElement.data('time_start');
                        var endDate = ($endElement === undefined) ? startDate : $endElement.data('date');
                        var endTime = ($endElement === undefined) ? $startElement.data('time_end') : $endElement.data('time_end');
                        if (!$startElement.hasClass('cant_res') && ($endElement == undefined || !$endElement.hasClass('cant_res'))) {
                            var timelintnum = (lineId - 1);
                            var addTempData = {
                                timeline: timelintnum,
                                start: element.calcStringTime(startTime),
                                end: element.calcStringTime(endTime),
                                class: 'newAdd',
                                text: addNo,
                                data: {
                                    'No': addNo
                                }
                            };
                            element.addScheduleData(addTempData, startDate, endDate);
                            element.resetBarPosition(timelintnum);
                            jQuery('.selected_no_' + addNo)
                                .html('')
                                .removeClass('time_first')
                                .removeClass('time_last')
                                .removeClass('selected_time')
                                .removeClass('selected_no_' + addNo);

                            setting.timeDrag(addTempData);
                            // setting.timeDrag({
                            //     timeline: lineId,
                            //     start: startDate + ' ' + startTime,
                            //     end: endDate + ' ' + endTime,
                            //     addNo: addNo
                            // });
                            liveDataNo.push(addNo);
                            addNo++;
                        }
                    }
                });
                jQuery('body').mousemove(function (event) {
                    if (isMouseDown) {
                        var nowX = event.pageX;
                        var setSelectedTime = function ($element, nowX) {
                            var elementPositionX = $element.offset().left;
                            if (startX <= nowX) {
                                if (elementPositionX <= nowX) {
                                    $element.toggleClass("selected_time", true);
                                    $element.toggleClass('selected_no_' + addNo, true);
                                    jQuery('.time_last').removeClass('time_last');
                                    $element.addClass('time_last');
                                    $endElement = $element;
                                    var $next_element = $element.next();
                                    if ($next_element.hasClass('can_res') && (!$next_element.hasClass('selected_time') || ($next_element.hasClass('selected_time') && $next_element.hasClass('selected_no_' + addNo)))) {
                                        setSelectedTime($next_element, nowX);
                                    }
                                    if (setting.multiple) {
                                        $element.html('');
                                        $element.append($('<div>' + addNo + '</div>'));
                                    }
                                } else {
                                    if (!$element.hasClass('time_first')) {
                                        $element.toggleClass("selected_time", false);
                                        if (setting.multiple) {
                                            $element.html('');
                                        }
                                    }
                                }
                            }
                        }
                        setSelectedTime($startElement, nowX);
                    }
                });
            }

            $element.find('.sc_main').append($timeline);

            timelineData[timeline] = row;

            if (row["class"] && (row["class"] != "")) {
                $element.find('.sc_data .timeline').eq(id).addClass(row["class"]);
                $element.find('.sc_main .timeline').eq(id).addClass(row["class"]);
            }
            // スケジュールタイムライン
            if (row["schedule"]) {
                for (var i in row["schedule"]) {
                    // LIN IE対策
                    if (!isNaN(i)) {
                        var bdata = row["schedule"][i];
                        var startDateArr = bdata["start"].split(' ');
                        var endDateArr = bdata["end"].split(' ');
                        var startDate = startDateArr[0];
                        var endDate = endDateArr[0];
                        var s = element.calcStringTime(startDateArr[1]);
                        var e = element.calcStringTime(endDateArr[1]);
                        var data = {};
                        data["timeline"] = id;
                        data["start"] = s;
                        data["end"] = e;
                        data["class"] = (bdata['class'] !== undefined) ? bdata['class'] : '';
                        if (bdata["text"]) {
                            data["text"] = bdata["text"];
                        }
                        data["data"] = {};
                        if (bdata["data"]) {
                            data["data"] = bdata["data"];
                        }
                        element.addScheduleData(data, startDate, endDate);
                    }
                }
            }
            // 高さの調整
            element.resetBarPosition(id);
            $element.find('.sc_main .timeline').eq(id).droppable({
                accept: ".sc_Bar",
                drop: function (ev, ui) {
                    var node = ui.draggable;
                    var sc_key = node.data("sc_key");
                    var nowTimelineNum = scheduleData[sc_key]["timeline"];
                    var timelineNum = $element.find('.sc_main .timeline').index(this);
                    var x = node.position().left;
                    var w = node.width();
                    // LIN 予約できない場合、タイムライン変更不可
                    var $movedStartTarget = jQuery(jQuery(".line_" + (timelineNum + 1))[Math.floor(x / setting.widthTimeX)]);
                    var $movedEndTarget = jQuery(jQuery(".line_" + (timelineNum + 1))[(Math.floor((x + w) / setting.widthTimeX)) - 1]);
                    if ($movedStartTarget.hasClass("can_res") && $movedEndTarget.hasClass("can_res")) {
                        // タイムラインの変更
                        scheduleData[sc_key]["timeline"] = timelineNum;
                        node.appendTo(this);
                    }
                    // 高さ調整
                    element.resetBarPosition(nowTimelineNum);
                    element.resetBarPosition(timelineNum);
                }
            });
            // コールバックがセットされていたら呼出
            if (setting.append) {
                $element.find('.sc_main .timeline').eq(id).find(".sc_Bar").each(function () {
                    var node = jQuery(this);
                    var sc_key = node.data("sc_key");
                    setting.append(node, scheduleData[sc_key]);
                });
            }
            maxRow++;
        };

        this.getScheduleData = function () {
            var data = new Array();

            for (var i in timelineData) {
                if (typeof timelineData[i] == "undefined") continue;
                var timeline = jQuery.extend(true, {}, timelineData[i]);
                timeline.schedule = new Array();
                data.push(timeline);
            }

            for (var i in scheduleData) {
                if (typeof scheduleData[i] == "undefined") continue;
                var schedule = jQuery.extend(true, {}, scheduleData[i]);
                schedule.start = this.formatTime(schedule.start);
                schedule.end = this.formatTime(schedule.end);
                var timelineIndex = schedule.timeline;
                delete schedule.timeline;
                data[timelineIndex].schedule.push(schedule);
            }

            return data;
        };
        // テキストの変更
        this.rewriteBarText = function (node, data) {
            var x = node.position().left;
            var w = node.width();
            var start = tableStartTime + (Math.floor(x / setting.widthTimeX) * setting.widthTime);
            var end = tableStartTime + (Math.floor((x + w) / setting.widthTimeX) * setting.widthTime);

            // LIN 複数日対応のため追加
            var startDateTime = new Date(setting.startDate);
            var endDateTime = new Date(setting.startDate);
            startDateTime.setSeconds(startDateTime.getSeconds() + start);
            endDateTime.setSeconds(endDateTime.getSeconds() + end);

            jQuery(node).find(".startTime").html(this.dateToString(startDateTime));
            jQuery(node).find(".endTime").html(this.dateToString(endDateTime));
        }
        this.resetBarPosition = function (n) {
            // 要素の並び替え
            var $bar_list = $element.find('.sc_main .timeline').eq(n).find(".sc_Bar");
            var codes = [];
            for (var i = 0; i < $bar_list.length; i++) {
                codes[i] = {
                    code: i,
                    x: jQuery($bar_list[i]).position().left
                };
            };
            // ソート
            codes.sort(function (a, b) {
                if (a["x"] < b["x"]) {
                    return -1;
                } else if (a["x"] > b["x"]) {
                    return 1;
                }
                return 0;
            });
            var check = [];
            var h = 0;
            var $e1, $e2;
            var c1, c2;
            var s1, e1, s2, e2;
            for (var i = 0; i < codes.length; i++) {
                c1 = codes[i]["code"];
                $e1 = jQuery($bar_list[c1]);
                for (h = 0; h < check.length; h++) {
                    var next = false;
                    L: for (var j = 0; j < check[h].length; j++) {
                        c2 = check[h][j];
                        $e2 = jQuery($bar_list[c2]);

                        s1 = $e1.position().left;
                        e1 = $e1.position().left + $e1.width();
                        s2 = $e2.position().left;
                        e2 = $e2.position().left + $e2.width();
                        if (s1 < e2 && e1 > s2) {
                            next = true;
                            continue L;
                        }
                    }
                    if (!next) {
                        break;
                    }
                }
                if (!check[h]) {
                    check[h] = [];
                }
                $e1.css({
                    top: ((h * setting.timeLineY) + setting.timeLinePaddingTop)
                });
                check[h][check[h].length] = c1;
            }
            // 高さの調整
            this.resizeRow(n, check.length);
        };
        this.resizeRow = function (n, height) {
            var h = Math.max(height, 1);

            $element.find('.sc_data .timeline').eq(n).height((h * setting.timeLineY) - setting.timeLineBorder + setting.timeLinePaddingTop + setting.timeLinePaddingBottom);
            $element.find('.sc_main .timeline').eq(n).height((h * setting.timeLineY) - setting.timeLineBorder + setting.timeLinePaddingTop + setting.timeLinePaddingBottom);

            $element.find('.sc_main .timeline').eq(n).find(".sc_bgBar").each(function () {
                jQuery(this).height(jQuery(this).closest(".timeline").height());
            });

            $element.find(".sc_data").height($element.find(".sc_main_box").height());
        }
        // resizeWindow
        this.resizeWindow = function () {
            var sc_width = $element.width();
            var sc_main_width = sc_width - setting.dataWidth - (setting.verticalScrollbar);

            // LIN セル数の加算
            var cellNum = (Math.floor((tableEndTime - tableStartTime) / setting.widthTime)) * diffDays;
            $element.find(".sc_header_cell").width(setting.dataWidth);
            $element.find(".sc_data,.sc_data_scroll").width(setting.dataWidth);
            $element.find(".sc_header").width(sc_main_width);
            $element.find(".sc_main_box").width(sc_main_width);
            $element.find(".sc_header_scroll").width(setting.widthTimeX * cellNum);
            $element.find(".sc_main_scroll").width(setting.widthTimeX * cellNum);

        };
        // init
        this.init = function () {
            var html = '';
            html += '<div class="sc_menu">' + "\n";
            html += '<div class="sc_header_cell"><span>&nbsp;</span></div>' + "\n";
            html += '<div class="sc_header">' + "\n";
            html += '<div class="sc_header_date_scroll" style="display: flex;">' + "\n";
            html += '</div>' + "\n";
            html += '</div>' + "\n";
            html += '<br class="clear" />' + "\n";
            html += '</div>' + "\n";

            // LIN
            html += '<div class="sc_menu">' + "\n";
            html += '<div class="sc_header_cell"><span>&nbsp;</span></div>' + "\n";
            html += '<div class="sc_header">' + "\n";
            html += '<div class="sc_header_scroll">' + "\n";
            html += '</div>' + "\n";
            html += '</div>' + "\n";
            html += '<br class="clear" />' + "\n";
            html += '</div>' + "\n";

            html += '<div class="sc_wrapper">' + "\n";
            html += '<div class="sc_data">' + "\n";
            html += '<div class="sc_data_scroll">' + "\n";
            html += '</div>' + "\n";
            html += '</div>' + "\n";
            html += '<div class="sc_main_box">' + "\n";
            html += '<div class="sc_main_scroll">' + "\n";
            html += '<div class="sc_main">' + "\n";
            html += '</div>' + "\n";
            html += '</div>' + "\n";
            html += '</div>' + "\n";
            html += '<br class="clear" />' + "\n";
            html += '</div>' + "\n";

            $element.append(html);

            $element.find(".sc_main_box").scroll(function () {
                $element.find(".sc_data_scroll").css("top", $(this).scrollTop() * -1);
                $element.find(".sc_header_scroll").css("left", $(this).scrollLeft() * -1);
                $element.find(".sc_header_date_scroll").css("left", $(this).scrollLeft() * -1);

            });

            // add time cell
            var beforeTime = -1;

            // LIN セル数の加算
            var cellNum = Math.floor((tableEndTime - tableStartTime) / setting.widthTime) * diffDays

            for (var count = 0; count < diffDays; count++) {

                // LIN 日付ヘッダーの作成
                var nowDate = new Date(daysArray[count]);
                var $dateDiv = $('<div class="sc_date" data-date="' + daysArray[count] + '">' + daysArray[count] + '(' + setting.weekday[nowDate.getDay()] + ')</div>');
                var $timeDiv = $('<div class="sc_header_time"></div>');
                var allWidth = 0;
                if (nowDate.getDay() === 0 || nowDate.getDay() == 6) {
                    $dateDiv.css('background', '#fe393980');
                }
                if (setting.dateClick) {
                    $dateDiv.css('cursor', 'pointer');
                    $dateDiv.click(function () {
                        setting.dateClick(jQuery(this).data('date'));
                    });
                }

                for (var t = tableStartTime; t < tableEndTime; t += setting.widthTime) {
                    if (
                        (beforeTime < 0) ||
                        (Math.floor(beforeTime / 3600) != Math.floor(t / 3600))) {
                        var html = '';
                        html += '<div class="sc_time">' + element.formatHour(t) + '</div>';
                        var $time = jQuery(html);
                        var cellNum = Math.floor(Number(Math.min((Math.ceil((t + setting.widthTime) / 3600) * 3600), tableEndTime) - t) / setting.widthTime);
                        $time.width((cellNum * setting.widthTimeX) - setting.headTimeBorder);
                        $time.appendTo($timeDiv);
                        beforeTime = t;
                        allWidth += (cellNum * setting.widthTimeX);
                    }
                }
                // LIN 日付ヘッダー、時間ヘッダーの挿入
                $dateDiv.width(allWidth - (setting.headTimeBorder * 2));
                $timeDiv.width(allWidth);
                $element.find(".sc_header_date_scroll").append($dateDiv);
                $element.find(".sc_header_scroll").append($timeDiv);
            }

            jQuery(window).resize(function () {
                element.resizeWindow();
            }).trigger("resize");

            // addrow
            for (var i in setting.rows) {
                // LIN IE対策
                if (!isNaN(i)) {
                    this.addRow(i, setting.rows[i]);
                }
            }

        };
        // 初期化
        this.init();

        this.debug = function () {
            var html = '';
            for (var i in scheduleData) {
                html += '<div>';

                html += i + " : ";
                var d = scheduleData[i];
                for (var n in d) {
                    var dd = d[n];
                    html += n + " " + dd;
                }

                html += '</div>';
            }
            jQuery(setting.debug).html(html);
        };
        if (setting.debug && setting.debug != "") {
            setInterval(function () {
                element.debug();
            }, 10);
        }

        return (this);
    };
})(jQuery);