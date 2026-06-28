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

  // ---- サイト設定（カラー・文言・リンク・ロゴ）----
  var SETTINGS = null;
  async function getSettings(){
    if (SETTINGS) return SETTINGS;
    try{ var r = await fetch(API + "/api/settings"); if(r.ok){ SETTINGS = await r.json(); return SETTINGS; } }catch(e){}
    SETTINGS = {}; return SETTINGS;
  }
  function darken(hex, amt){
    try{ hex=(hex||'').replace('#',''); if(hex.length!==6) return '#'+hex;
      var n=parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
      r=Math.round(r*(1-amt)); g=Math.round(g*(1-amt)); b=Math.round(b*(1-amt));
      return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
    }catch(e){ return '#'+hex; }
  }
  function applySettings(s){
    if(!s) return;
    var root=document.documentElement.style;
    if(s.colors){
      if(s.colors.brand){ root.setProperty('--brand', s.colors.brand); root.setProperty('--brand-d', darken(s.colors.brand,0.2)); }
      if(s.colors.accent){ root.setProperty('--accent', s.colors.accent); root.setProperty('--accent-d', darken(s.colors.accent,0.13)); }
    }
    // ロゴ（マーク＋サイト名）
    document.querySelectorAll('.logo').forEach(function(l){
      var mark = s.logoImage
        ? '<span class="mark" style="background-image:url('+s.logoImage+');background-size:cover;color:transparent">G</span>'
        : '<span class="mark">'+esc(s.logoText||'G')+'</span>';
      l.innerHTML = mark + esc(s.siteName||'ジーニー');
    });
    // リンク
    if(s.links){
      if(s.links.line) document.querySelectorAll('a[href*="lin.ee"], a.line').forEach(function(a){a.href=s.links.line;});
      if(s.links.youtube) document.querySelectorAll('.social a.yt').forEach(function(a){a.href=s.links.youtube;});
      if(s.links.instagram) document.querySelectorAll('.social a.ig').forEach(function(a){a.href=s.links.instagram;});
    }
    // ヒーロー（トップのみ）
    if(s.hero){
      var ey=document.getElementById('heroEyebrow'); if(ey&&s.hero.eyebrow) ey.textContent=s.hero.eyebrow;
      var hl=document.getElementById('heroHeadline');
      if(hl&&s.hero.headline){
        var html=esc(s.hero.headline).replace(/\n/g,'<br>');
        if(s.hero.emphasis){ html=html.split(esc(s.hero.emphasis)).join('<span class="em">'+esc(s.hero.emphasis)+'</span>'); }
        hl.innerHTML=html;
      }
      var ld=document.getElementById('heroLead'); if(ld&&s.hero.lead) ld.textContent=s.hero.lead;
      var art=document.getElementById('heroArt');
      if(art&&s.hero.image){ art.innerHTML='<img src="'+esc(s.hero.image)+'" alt="" style="width:100%;max-width:440px;border-radius:20px;box-shadow:0 18px 40px rgba(60,50,30,.18)">'; }
    }
    // お知らせ帯
    if(s.band){
      var bh=document.getElementById('bandHeading'); if(bh&&s.band.heading) bh.textContent=s.band.heading;
      var bt=document.getElementById('bandText'); if(bt&&s.band.text) bt.textContent=s.band.text;
      var bb=document.getElementById('bandBtn'); if(bb&&s.band.button) bb.textContent=s.band.button;
    }
    // フッター紹介文
    if(s.footerText){ var ft=document.querySelector('footer.site .fcols>div:first-child>p'); if(ft) ft.textContent=s.footerText; }
  }
  async function loadSettings(){
    try{ var c=localStorage.getItem('genieSettings'); if(c) applySettings(JSON.parse(c)); }catch(e){}
    var s=await getSettings();
    if(s && Object.keys(s).length){ try{localStorage.setItem('genieSettings',JSON.stringify(s));}catch(e){} applySettings(s); }
  }
  // 即時適用（色のチラつきを抑える）
  if(document.readyState!=='loading'){ loadSettings(); }
  else{ document.addEventListener('DOMContentLoaded', loadSettings); }

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
                   getPosts:getPosts, getPost:getPost, getEvents:getEvents, getSettings:getSettings };
})();
