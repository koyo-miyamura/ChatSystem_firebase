'use strict';
//Firebaseの初期化
firebase.initializeApp({databaseURL: "https://chatsystem-ad176.firebaseio.com"});
const database = firebase.database();
const ref = database.ref('messages');
let last_message = "dummy";

//初期読み込み & pushイベント検知
ref.on("child_added", (snapshot) => {
    renderMessage({
        id: snapshot.key,
        value: snapshot.val()
    });
});

//インジェクション対策
const escapeHTML = (val) => $('<div>').text(val).html();

//投稿処理
const postAction = () => {
    const content = escapeHTML($("#content").val());
    if(content && content !== "") {
        ref.push({
            title: 'タイトル',
            content: content,
            date: new Date().getTime()
        })
        .then((res)=>{
            console.log(res);
        });
    }
    $("#content").val("");
};

//投稿除去 by koyo
//アロー関数式使うと「thisがクリックされた要素を返さなくなる」のでfunction()を使う
const removeAction = function(){
    let confirm_flag = confirm("本当に削除してもよろしいですか?");
    if(confirm_flag){
        const removeRef = database.ref("messages/" + this.id);
        removeRef.remove()
        .then(function() {
            console.log("Remove succeeded.")
        })
        .catch(function(error) {
            console.log("Remove failed: " + error.message)
        });

        $(this).closest('div').remove();
    }
};

//メッセージをDOM追加
//削除するボタン追加 by koyo
const renderMessage = (message) => {
    const message_html = `<p class="post-text">${escapeHTML(message.value.content)}</p>`;
    let date_html = '';
    if(message.value.date) {
        date_html = `<p class="post-date">${escapeHTML(new Date(message.value.date).toLocaleString())}</p>`;
    }
    $("#"+last_message).before(
        `<div id="${message.id}" class="post">
        ${message_html}
        ${date_html}
        <button id = "${message.id}" class="remove">削除する</button>
        </div>`);
    last_message = message.id;
}

//クリック時の処理
$('#post').click(() => postAction());

//削除ボタンクリック by koyo
// 関数は参照を渡す
//　第3引数に関数に渡すためのオブジェクトを定義する必要があるので注意
//$('body').on("click", ".remove", {string:this.id}, removeAction);
$('body').on("click", ".remove", removeAction);

//エンターキータイプ時の処理
$('#content').keydown((e) => {
    if(e.which == 13){
        postAction();
        return false;
    }
});