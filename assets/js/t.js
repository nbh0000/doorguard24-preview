/* 도어가드24 이벤트 전송: 페이지뷰 + 전화·카톡 클릭 (유입 정보는 세션 첫 페이지 기준) */
(function () {
  var s = null;
  try { s = window.sessionStorage; } catch (e) {}
  var src = null;
  try { src = s && JSON.parse(s.getItem('dg_src') || 'null'); } catch (e) {}
  if (!src) {
    var q = new URLSearchParams(location.search);
    src = { r: document.referrer || '', us: q.get('utm_source') || (q.get('n_media') ? 'naver' : ''), um: q.get('utm_medium') || (q.get('n_media') ? 'cpc' : ''), uc: q.get('utm_campaign') || '' };
    try { s && s.setItem('dg_src', JSON.stringify(src)); } catch (e) {}
  }
  function send(t) {
    var body = JSON.stringify({ t: t, p: location.pathname, r: src.r, us: src.us, um: src.um, uc: src.uc });
    if (navigator.sendBeacon) {
      false && navigator.sendBeacon('/doorguard24-preview/api/event', new Blob([body], { type: 'application/json' }));
    } else {
      Promise.resolve('/doorguard24-preview/api/event', { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    }
  }
  send('view');
  // 웹폰트: 첫 방문 페이지에서는 받아서 캐시만 하고(글자 밀림 방지), 다음 페이지부터 적용한다(layout.php 머리 스크립트)
  function loadFont() {
    try { if (localStorage.getItem('dgfont')) return; } catch (e) { return; }
    fetch('/doorguard24-preview/assets/fonts/pretendard-subset.woff2').then(function (r) { if (r.ok) { try { localStorage.setItem('dgfont', '1'); } catch (e) {} } }).catch(function () {});
  }
  // 첫 화면 밖 이미지(data-src): 로드 후, 화면 근처에 오면 불러온다
  function loadImages() {
    var imgs = [].slice.call(document.querySelectorAll('img[data-src]'));
    var show = function (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); };
    if (!('IntersectionObserver' in window)) { imgs.forEach(show); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '600px 0px' });
    imgs.forEach(function (img) { io.observe(img); });
  }
  // 로드 이벤트 후 첫 그림이 끝난 다음(다음 프레임 + 잠깐 뒤) 불러온다
  function afterLoad() {
    requestAnimationFrame(function () { setTimeout(function () { loadImages(); loadFont(); }, 500); });
  }
  if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad);
  // 홈: 첫 화면은 배너만, 스크롤하면 헤더가 내려온다
  if (document.body.hasAttribute('data-home')) {
    var hd = document.querySelector('.site-header');
    var onScroll = function () { hd.classList.toggle('is-shown', window.scrollY > 60); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[data-ev]');
    if (!a) return;
    var t = a.getAttribute('data-ev') || (a.getAttribute('href').indexOf('tel:') === 0 ? 'call' : '');
    if (t === 'call' || t === 'kakao') send(t);
  }, true);
})();
