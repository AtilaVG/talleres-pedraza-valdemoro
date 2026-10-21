/* Talleres Pedraza — interacciones propias + respaldo de la intro (cabina de pintura) */
(function () {
  'use strict';
  var intro = document.querySelector('.intro');
  var canvas = intro.querySelector('canvas.fallback');
  var ctx = canvas.getContext('2d');
  var words = [].slice.call(intro.querySelectorAll('.w'));
  var stepEl = intro.querySelector('.ticket-step');
  var steps = ['RECEPCIÓN', 'CHAPA', 'CABINA', 'ENTREGA'];
  var W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize); resize();

  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  // Silueta lateral de un turismo (coordenadas normalizadas 0..1 sobre una caja 2.6:1)
  var body = [[.02,.78],[.03,.6],[.09,.52],[.25,.47],[.36,.24],[.44,.17],[.66,.16],[.76,.22],[.87,.43],[.96,.48],[.99,.6],[.985,.78]];
  function carPath(x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x + body[0][0] * w, y + body[0][1] * h);
    for (var i = 1; i < body.length; i++) {
      var a = body[i - 1], b = body[i];
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      ctx.quadraticCurveTo(x + a[0] * w, y + a[1] * h, x + mx * w, y + my * h);
    }
    ctx.lineTo(x + body[body.length - 1][0] * w, y + body[body.length - 1][1] * h);
    // bajos con pasos de rueda
    ctx.lineTo(x + .86 * w, y + .78 * h);
    ctx.arc(x + .78 * w, y + .78 * h, .095 * w, 0, Math.PI, true);
    ctx.lineTo(x + .31 * w, y + .78 * h);
    ctx.arc(x + .22 * w, y + .78 * h, .095 * w, 0, Math.PI, true);
    ctx.closePath();
  }

  function draw(p, t) {
    // fondo: cabina de pintura (paredes con rejillas de luz)
    ctx.fillStyle = '#1b1c1e'; ctx.fillRect(0, 0, W, H);
    var lights = 6;
    for (var i = 0; i < lights; i++) {
      var lx = (i + .5) * W / lights - W * .04;
      var on = clamp(p * 3 - i * .25);
      ctx.fillStyle = 'rgba(236,232,223,' + (.05 + on * .1) + ')';
      ctx.fillRect(lx, H * .08, W * .08, 6);
    }
    // suelo de rejilla
    ctx.strokeStyle = 'rgba(236,232,223,.07)'; ctx.lineWidth = 1;
    for (var g = 0; g < 26; g++) {
      var gx = W / 2 + (g - 13) * W * .08;
      ctx.beginPath(); ctx.moveTo(W / 2 + (g - 13) * 12, H * .66); ctx.lineTo(gx * 1.4 - W * .2, H); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, H * .66, W, 2);

    var cw = Math.min(W * .86, H * 1.65), ch = cw / 2.6;
    var zoom = 1.18 - ease(p) * .18;
    var cx = W / 2 - cw * zoom / 2 + (1 - ease(p)) * W * .06, cy = H * .66 - ch * .8 * zoom;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(zoom, zoom);

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(cw / 2, ch * .86, cw * .5, ch * .05, 0, 0, Math.PI * 2); ctx.fill();

    // 1) chapa desnuda/aparejo gris → 2) color barrido por la pistola → 3) brillo
    carPath(0, 0, cw, ch);
    ctx.save(); ctx.clip();
    var primer = ctx.createLinearGradient(0, 0, 0, ch);
    primer.addColorStop(0, '#9a9ea4'); primer.addColorStop(1, '#5e6268');
    ctx.fillStyle = primer; ctx.fillRect(0, 0, cw, ch);
    // abolladura que desaparece con la fase de chapa
    var dent = 1 - ease(seg(p, .12, .34));
    if (dent > 0) {
      var dg = ctx.createRadialGradient(cw * .58, ch * .58, 2, cw * .58, ch * .58, cw * .09);
      dg.addColorStop(0, 'rgba(20,20,22,' + .7 * dent + ')'); dg.addColorStop(1, 'rgba(20,20,22,0)');
      ctx.fillStyle = dg; ctx.fillRect(0, 0, cw, ch);
    }
    // barrido de pintura
    var sp = ease(seg(p, .36, .7));
    var edge = -cw * .1 + sp * cw * 1.25;
    var paint = ctx.createLinearGradient(0, 0, 0, ch);
    paint.addColorStop(0, '#ff7a3d'); paint.addColorStop(.55, '#e2410f'); paint.addColorStop(1, '#8e2205');
    ctx.fillStyle = paint;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(edge, 0);
    for (var yy = 0; yy <= ch; yy += 8) ctx.lineTo(edge - Math.sin(yy * .09 + t * 3) * 10 - yy * .12, yy);
    ctx.lineTo(0, ch); ctx.closePath(); ctx.fill();
    // brillo final: reflejo que recorre la carrocería
    var gl = ease(seg(p, .72, .98));
    if (gl > 0) {
      var rx = -cw * .3 + gl * cw * 1.5;
      var sh = ctx.createLinearGradient(rx - cw * .12, 0, rx + cw * .12, ch * .3);
      sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,.55)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = 'rgba(255,255,255,' + .12 * gl + ')'; ctx.fillRect(0, ch * .44, cw, 3);
    }
    ctx.restore();
    // líneas técnicas
    ctx.strokeStyle = 'rgba(236,232,223,.85)'; ctx.lineWidth = 2 / zoom; carPath(0, 0, cw, ch); ctx.stroke();
    // ventanas
    ctx.fillStyle = 'rgba(20,22,26,.85)';
    ctx.beginPath(); ctx.moveTo(cw * .38, ch * .27); ctx.lineTo(cw * .45, ch * .21); ctx.lineTo(cw * .55, ch * .2); ctx.lineTo(cw * .55, ch * .45); ctx.lineTo(cw * .31, ch * .47); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cw * .58, ch * .2); ctx.lineTo(cw * .66, ch * .2); ctx.lineTo(cw * .75, ch * .27); ctx.lineTo(cw * .83, ch * .44); ctx.lineTo(cw * .58, ch * .45); ctx.closePath(); ctx.fill();
    // ruedas
    [[.22], [.78]].forEach(function (wx) {
      ctx.fillStyle = '#0f1011'; ctx.beginPath(); ctx.arc(cw * wx[0], ch * .8, cw * .082, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8b9097'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cw * wx[0], ch * .8, cw * .045, 0, Math.PI * 2); ctx.stroke();
    });
    // cotas tipo plano
    ctx.strokeStyle = 'rgba(255,91,31,' + (.8 - p * .6) + ')'; ctx.lineWidth = 1; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(0, -ch * .12); ctx.lineTo(cw, -ch * .12); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();

    // niebla de pintura durante el barrido
    if (sp > 0 && sp < 1) {
      for (var d = 0; d < 90; d++) {
        var a = (d * 137.5) % 360 * Math.PI / 180, r = (d * 7 % 60) + (t * 40 % 30);
        var px = cx + (edge + 30) * zoom + Math.cos(a) * r, py = cy + ch * (.25 + (d % 10) / 16) * zoom + Math.sin(a) * r * .5;
        ctx.fillStyle = 'rgba(255,110,50,' + (.25 * Math.sin(sp * Math.PI)) + ')';
        ctx.fillRect(px, py, 2, 2);
      }
    }
  }

  // Palabras por fase
  var ranges = [[0, .22], [.22, .46], [.46, .72], [.72, 1.01]];
  function words_(p) {
    words.forEach(function (w, i) {
      var r = ranges[i], local = seg(p, r[0], r[1]);
      var vis = i === 3 ? seg(p, .72, .82) : Math.sin(local * Math.PI);
      w.style.opacity = vis.toFixed(3);
      w.style.transform = 'translateY(' + ((1 - vis) * 30).toFixed(1) + 'px)';
    });
    var s = Math.min(3, Math.floor(p * 4));
    if (stepEl.textContent !== steps[s]) stepEl.textContent = steps[s];
  }

  var p = 0, t0 = performance.now();
  intro.addEventListener('scrub', function (e) { p = e.detail.p; });
  (function loop(now) {
    if (!intro.classList.contains('has-video')) draw(p, (now - t0) / 1000);
    words_(p);
    requestAnimationFrame(loop);
  })(t0);

  // Diagnóstico interactivo
  var DATA = {
    golpe: ['Peritación, chapa y pintura', 'Lo vemos contigo, gestionamos el parte con tu seguro y lo devolvemos con el color igualado en cabina. Si lo necesitas, te dejamos coche de sustitución.', 'según daño · presupuesto sin compromiso'],
    frenos: ['Revisión de frenos', 'Comprobamos pastillas, discos y líquido. Si algo hay que cambiar, te lo enseñamos y te damos el precio antes de tocarlo.', 'normalmente en el día'],
    testigo: ['Diagnosis electrónica', 'Conectamos la máquina de diagnosis, leemos el fallo y te explicamos en claro qué es y qué urge.', 'diagnóstico en el momento'],
    itv: ['Pre-ITV', 'Repasamos luces, frenos, neumáticos, emisiones y holguras para que vayas a la inspección tranquilo.', 'mientras esperas o en el día'],
    luna: ['Lunas y tintado', 'Reparamos el impacto si se puede o sustituimos la luna. También tintamos cristales.', 'consúltanos disponibilidad'],
    revision: ['Mantenimiento', 'Aceite, filtros y puntos de revisión según tu fabricante, con recambio de calidad.', 'normalmente en el día']
  };
  var verdict = document.querySelector('.verdict');
  var vt = verdict.querySelector('.v-title'), vx = verdict.querySelector('.v-text'), vm = verdict.querySelector('.v-time b');
  var btns = [].slice.call(document.querySelectorAll('.symptoms button'));
  function pick(b) {
    btns.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
    var d = DATA[b.getAttribute('data-k')];
    vt.textContent = d[0]; vx.textContent = d[1]; vm.textContent = d[2];
    verdict.classList.remove('flip'); void verdict.offsetWidth; verdict.classList.add('flip');
  }
  btns.forEach(function (b, i) {
    b.tabIndex = i ? -1 : 0;
    b.addEventListener('click', function () { pick(b); });
    b.addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!k) return; e.preventDefault();
      var n = btns[(i + k + btns.length) % btns.length]; n.focus(); pick(n);
    });
  });

  // Muestras de color
  var demo = document.querySelector('.panel-demo'), dname = demo.querySelector('.panel-name'), flipShine = false;
  [].forEach.call(document.querySelectorAll('.chip'), function (c, i) {
    c.setAttribute('aria-pressed', i ? 'false' : 'true');
    c.addEventListener('click', function () {
      [].forEach.call(document.querySelectorAll('.chip'), function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
      demo.style.setProperty('--paint', c.style.getPropertyValue('--c'));
      dname.textContent = c.getAttribute('data-name');
      flipShine = !flipShine; demo.style.setProperty('--shine', flipShine ? '30%' : '-30%');
    });
  });

  // Barra de proceso que se llena al hacer scroll
  var track = document.querySelector('.track'), items = [].slice.call(track.children);
  function fill() {
    var r = track.getBoundingClientRect(), vh = window.innerHeight;
    var f = clamp((vh * .75 - r.top) / (r.height + vh * .2));
    track.style.setProperty('--fill', f.toFixed(3));
    items.forEach(function (li, i) { li.classList.toggle('on', f >= (i + .2) / items.length); });
  }
  window.addEventListener('scroll', fill, { passive: true }); fill();

  // Aparición suave
  var rv = document.querySelectorAll('.lead-grid > *, .sheet, .spec-list li, .process-head, .chips-copy, .insure > *, .shop-card, .shop-contact');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(rv, function (el) { el.classList.add('rv'); io.observe(el); });
  }
})();
