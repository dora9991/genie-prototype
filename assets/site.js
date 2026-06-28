/* =========================================================
   教員コミュニティ ジーニー — 共通スクリプト
   ========================================================= */
(function(){
  var LINE = "https://lin.ee/SjBHjVV";
  // 記事・カレンダーの配信API（管理画面と同じWorker）
  var API = "https://genie-api.kenett999.workers.dev";

  // 記事一覧を取得（APIが落ちていたら静的JSONにフォールバック）
  async function getPosts(){
    try{
      var r = await fetch(API + "/api/posts");
      if(!r.ok) throw 0;
      return await r.json();
    }catch(e){
      var r2 = await fetch("data/posts.json");
      return await r2.json();
    }
  }
  // 単一記事を取得
  async function getPost(slug){
    try{
      var r = await fetch(API + "/api/posts/" + encodeURIComponent(slug));
      if(r.ok) return await r.json();
    }catch(e){}
    var r2 = await fetch("data/posts.json");
    var all = await r2.json();
    return all.filter(function(x){return x.slug===slug;})[0] || all[0];
  }
  // カレンダー（定例＋特別）を取得
  async function getEvents(){
    try{
      var r = await fetch(API + "/api/events");
      if(r.ok) return await r.json();
    }catch(e){}
    return { recurring:[{dow:3,title:"定例交流会 21:00",warm:0},{dow:4,title:"定例交流会 21:00",warm:0}], special:[] };
  }

  // --- HTMLエスケープ ---
  function esc(s){
    return (s||'').replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }

  // --- カテゴリ別の配色（タグ色＋プレースホルダのグラデ）---
  var CAT = {
    'イベント報告':{bg:'#fbe6d8',fg:'#a8481c',g1:'#f6c89a',g2:'#e0773c'},
    'ブログ'      :{bg:'#eaf1fa',fg:'#234f86',g1:'#9cc2ec',g2:'#2f6db3'},
    'メンバー紹介':{bg:'#e3f1e7',fg:'#3f7a52',g1:'#a9d6b4',g2:'#5a9e6f'},
    'News'        :{bg:'#fbe3e3',fg:'#a83c3c',g1:'#f0a9a9',g2:'#d05a5a'},
    '講師陣'      :{bg:'#ece8fa',fg:'#5648a0',g1:'#c3b8ec',g2:'#7b6cc4'},
    'イベント'    :{bg:'#def2ef',fg:'#2c7a6f',g1:'#9bd9d2',g2:'#3fa093'},
    'コラム'      :{bg:'#f2e8d8',fg:'#7a5e2f',g1:'#d8c2a0',g2:'#a8854f'}
  };
  function cat(c){ return CAT[c] || {bg:'#eaf1fa',fg:'#234f86',g1:'#9cc2ec',g2:'#2f6db3'}; }

  // --- 記事カードのHTML ---
  function cardHTML(p){
    var c = cat(p.category);
    var thumb = p.thumb
      ? '<div class="thumb"><img src="'+esc(p.thumb)+'" alt="" loading="lazy"></div>'
      : '<div class="thumb ph" style="background:linear-gradient(135deg,'+c.g1+','+c.g2+')">'
        + '<span class="ph-cat">'+esc(p.category||'記事')+'</span></div>';
    return '<a class="card" href="post.html?slug='+encodeURIComponent(p.slug)+'">'+thumb+
      '<div class="body">'+
        '<span class="tag" style="background:'+c.bg+';color:'+c.fg+'">'+esc(p.category)+'</span>'+
        '<h3>'+esc(p.title)+'</h3>'+
        '<div class="date">'+esc((p.date||'').replace(/-/g,'.'))+'</div>'+
      '</div></a>';
  }

  // --- モバイルメニュー開閉 ---
  function initMenu(){
    var btn = document.querySelector('.menu-btn');
    var mm  = document.querySelector('.mobile-menu');
    if(btn && mm){ btn.addEventListener('click', function(){ mm.classList.toggle('open'); }); }
  }
  if(document.readyState!=='loading'){ initMenu(); }
  else{ document.addEventListener('DOMContentLoaded', initMenu); }

  // --- 公開API ---
  window.GENIE = { esc:esc, cat:cat, cardHTML:cardHTML, LINE:LINE, API:API,
                   getPosts:getPosts, getPost:getPost, getEvents:getEvents };
})();
