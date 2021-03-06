/* https://github.com/milk-cocoa/chat を参考にあれこれ追加 */
$(function(){

'use strict';

//-----Firebaseの初期化など-----
var config = {
        apiKey: 'AIzaSyCjcgCd72qWN00HN-TBExtkwIZ67BlcPHk',
        authDomain: 'https://chatsystem-ad176.firebaseapp.com',
        databaseURL: 'https://chatsystem-ad176.firebaseio.com'
        //storageBucket: '<your-storage-bucket>'
};
firebase.initializeApp(config);
const database = firebase.database();
const ref = database.ref('messages');

//ログアウト時にリダイレクトする際にonAuthChangedの処理でalertが出ないようにする変数
var logouting_flag = false;

//ログインユーザー情報を保存するグローバル変数
var user_email = null;
var uid = null;

//-----ログイン周りの処理(user_add.html, index.html)-----

//escapeHTMLは https://iwb.jp/jquery-javascript-html-escape/ から引用
var escapeHtml = (function (String) {
  var escapeMap = {
    '&': '&amp;',
    "'": '&#x27;',
    '`': '&#x60;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;'
  };
  var escapeReg = '[';
  var reg;
  for (var p in escapeMap) {
    if (escapeMap.hasOwnProperty(p)) {
      escapeReg += p;
    }
  }
  escapeReg += ']';
  reg = new RegExp(escapeReg, 'g');
 
  return function escapeHtml (str) {
    str = (str === null || str === undefined) ? '' : '' + str;
    return str.replace(reg, function (match) {
      return escapeMap[match];
    });
  };
}(String));

//---user_add(user_add.html)---
$("#user_add").click(() => user_add());
$('#password_add').keydown((e) => {
    //エンターキー押した時の処理
    if(e.which == 13){
        user_add();
        return false;
    }
});

const user_add = () => {
    let confirm_flag = confirm('この内容で登録しますか?');

    if(confirm_flag){
        let email = escapeHtml($('#email_add').val());
        let password = escapeHtml($('#password_add').val());

        //有効であれば処理
        if(email && password && email !== "" && password !== ""){
            firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(function(){
                alert('ユーザーを登録しました');
                location.href = "index.html";
            })
            .catch(function(error) {
                //Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                  
                console.log("Error:" + errorCode + " " + errorMessage);
                alert("ユーザー登録に失敗しました:" + errorCode + " " + errorMessage);
            });
        }
    }
}

//---login(index.html)---
$("#login").click(() => login());

$('#password').keydown((e) => {
    //エンターキー押した時の処理
    if(e.which == 13){
        login();
        return false;
    }
});

const login = () => {
    let email = escapeHtml($('#email').val());
    let password = escapeHtml($('#password').val());

    //有効であればチャット画面へ移動(同時にonAuthStateChangedが呼ばれる)
    if(email && password && email !== "" && password !== ""){
        firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(){
            location.href = "chat.html";
        })
        .catch(function(error) {
            //Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Error:" + errorCode + " " + errorMessage);
            alert("ログインに失敗しました:" + errorCode + " " + errorMessage);
        });
    }
}

//---権限周りの処理---
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        //現在ログインしているユーザーの情報をグローバル変数に追加
        user_email = user.email;
        uid = user.uid;
        console.log(user.email);
    } else {
        //ログインしていない状態
        //ログイン画面に遷移
        console.log("ログインしてないよ");
        console.log(location.pathname);

        //ログイン画面or登録画面でなければログイン必要
        let isAuthLocation = location.pathname == "/chat.html";
        //logoutが原因でonAuThStateChangedが呼ばれた場合はalertを出さない
        if(isAuthLocation && !logouting_flag){
            alert("ログインしてください");
            location.href = "index.html";
        }
        logouting_flag = false;
    }
});

//-----Chat.htmlの処理-----

//---logout---
$("#logout").click(() => logout());

const logout = () => {
    //念のため再初期化
    logouting_flag = false;

    let confirm_flag = confirm("ログアウトしますか?");
    if(confirm_flag){
        firebase.auth().signOut()
        .then(function(){
            //onAuthStateChangedの処理に引っかからないようにするためにtrueに
            logouting_flag = true;
            location.href = "index.html";
        })
        .catch(function(error){
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Error:" + errorCode + " " + errorMessage);
            alert("ログアウトに失敗しました:" + errorCode + " " + errorMessage);         
        });
    }
};

//---初期読み込み & pushイベント検知---
//すでに存在する投稿すべてに対してrenderMessageを実行することに注意
ref.on("child_added", (snapshot) => {
    renderMessage({
        id: snapshot.key,
        value: snapshot.val()
    });
});

//投稿をDOM追加
//削除処理の追加 by koyo
const renderMessage = (message) => {

    //ログインしているユーザーかどうかで投稿のスタイルを変更
    if(message.value.name === user_email){
        var post_name_class = 'my-post-name';
        var post_date_class = 'my-post-date';
        var post_text_class = 'my-post-text';

        var message_html = `
        <p class="${post_text_class}">
        <span class="${post_name_class}">${escapeHtml(message.value.name)}</span>
        ${escapeHtml(message.value.content)}
        </p>`;

        var remove_html = `<p id = "${message.id}" class="remove-text">削除</p>`;
    }else{
        var post_name_class = 'other-post-name';
        var post_date_class = 'other-post-date';
        var post_text_class = 'other-post-text';

        var message_html = `
        <p class="${post_text_class}">
        ${escapeHtml(message.value.content)}
        <span class="${post_name_class}">${escapeHtml(message.value.name)}</span>
        </p>`;

        //自分の投稿以外は削除できないようにそもそも表示しない
        var remove_html = `<p></p>`;
    }

    //日付の整形
    let date_html = '';
    if(message.value.date) {
        date_html = `<p class="${post_date_class}">${escapeHtml(new Date(message.value.date).toLocaleString())}</p>`;
    }

    //データベース上の投稿を挿入
    $("#"+last_message).before(
        `<div id="${message.id}" class="post">
            ${message_html}
            ${remove_html}
            ${date_html}
        </div>`);

    //次の要素の挿入のためにidを保存
    last_message = message.id;
}


//---投稿処理---
$('#post').click(() => postAction());

//エンターキータイプ時の処理
$('#content').keydown((e) => {
    if(e.which == 13){
        postAction();
        return false;
    }
});

//メッセージ表示部分のダミーの初期値
let last_message = "dummy";
//投稿処理
const postAction = () => {
    //フォームに入力した内容(htmlエスケープ)
    const content = escapeHtml($("#content").val());
    //フォームが空で無ければ、Firebaseのデータベースに送信 
    if(content && content !== "") {
        ref.push({
            title: 'タイトル',
            content: content,
            date: new Date().getTime(),
            name: user_email
        })
        .then((res)=>{
            console.log(res);
        });
    }
    $("#content").val("");
};

//---投稿削除ボタンの処理---
//アロー関数式使うと「thisがクリックされた要素のオブジェクトを指さなくなる」のでfunction()を使う
const removeAction = function(){
    let confirm_flag = confirm("本当に削除してもよろしいですか?");
    if(confirm_flag){
        //削除するデータベースの要素はthis.idを参照する
        const removeRef = database.ref("messages/" + this.id);
        removeRef.remove()
        .then(function() {
            console.log("Remove succeeded.")
        })
        .catch(function(error) {
            console.log("Remove failed: " + error.message)
        });

        //要素の削除
        $(this).closest('div').fadeOut('slow', function() { $(this).remove(); });
    }
};

//削除ボタンクリック時の処理
//第3引数に関数に渡すためのオブジェクトを定義する必要があるので注意
//第4引数の関数は参照を渡す
//※touchstartを入れないとiOSでタッチに反応しないので注意
$('body').on("click touchstart", ".remove-text", removeAction);

});