// === ASCII ART GOLD PLASMA SHADER BACKGROUND ===
(function () {
  const canvas = document.getElementById('shader-canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const vsSource = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

  const fsSource = `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_scroll;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.0;
        a *= 0.5;
      }
      return v;
    }

    float asciiDensity(float v) {
      float steps = 10.0;
      return floor(v * steps) / steps;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      // ASCII grid
      float cellSize = u_resolution.x < 600.0 ? 8.0 : 12.0;
      vec2 cell = floor(gl_FragCoord.xy / cellSize);
      vec2 cellUV = cell * cellSize / u_resolution;

      // Plasma / solar field
      float t = u_time * 0.15;
      vec2 q = vec2(fbm(cellUV * 4.0 + t * 0.3), fbm(cellUV * 4.0 + vec2(5.2, 1.3) + t * 0.2));
      float f = fbm(cellUV * 4.0 + q * 1.5 + t * 0.1);

      // Solar flare from center
      vec2 center = vec2(0.5 + u_mouse.x * 0.05, 0.5 + u_mouse.y * 0.05);
      float dist = length(cellUV - center);
      float solar = smoothstep(0.8, 0.0, dist) * 0.5;
      f += solar;

      // Quantize for ASCII look
      float ascii = asciiDensity(f);

      // Sub-cell pattern (fake character shapes)
      vec2 inCell = fract(gl_FragCoord.xy / cellSize);
      float charShape = 1.0;
      charShape *= smoothstep(0.0, 0.1, inCell.y) * smoothstep(1.0, 0.85, inCell.y);
      charShape *= smoothstep(0.0, 0.08, inCell.x) * smoothstep(1.0, 0.9, inCell.x);
      float fill = step(1.0 - ascii, max(inCell.x, inCell.y) * 0.5 + 0.3);
      charShape *= mix(0.3, 1.0, fill * ascii);

      // Gold/amber palette (dark to bright)
      vec3 gold0 = vec3(0.02, 0.02, 0.04);   // near black
      vec3 gold1 = vec3(0.06, 0.04, 0.02);
      vec3 gold2 = vec3(0.12, 0.08, 0.02);
      vec3 gold3 = vec3(0.20, 0.14, 0.03);
      vec3 gold4 = vec3(0.30, 0.20, 0.04);
      vec3 gold5 = vec3(0.42, 0.28, 0.05);
      vec3 gold6 = vec3(0.55, 0.38, 0.06);
      vec3 gold7 = vec3(0.68, 0.48, 0.08);
      vec3 gold8 = vec3(0.82, 0.60, 0.12);
      vec3 gold9 = vec3(0.95, 0.75, 0.20);   // bright gold

      vec3 col;
      if (ascii < 0.1) col = gold0;
      else if (ascii < 0.2) col = gold1;
      else if (ascii < 0.3) col = gold2;
      else if (ascii < 0.4) col = gold3;
      else if (ascii < 0.5) col = gold4;
      else if (ascii < 0.6) col = gold5;
      else if (ascii < 0.7) col = gold6;
      else if (ascii < 0.8) col = gold7;
      else if (ascii < 0.9) col = gold8;
      else col = gold9;

      // Apply character shape
      col *= charShape;

      // Vignette
      float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.5;
      col *= vig;

      // Scroll fade
      float scrollFade = max(0.2, 1.0 - u_scroll);
      col *= scrollFade;

      // Scanline overlay
      float scanline = sin(gl_FragCoord.y * 1.5) * 0.03 + 1.0;
      col *= scanline;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function createShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program error:', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // Full-screen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uScroll = gl.getUniformLocation(program, 'u_scroll');

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * -2;
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  const startTime = Date.now();

  function render() {
    requestAnimationFrame(render);
    const t = (Date.now() - startTime) / 1000;
    const scrollNorm = Math.min(1, scrollY / window.innerHeight);

    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.uniform1f(uScroll, scrollNorm);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  render();
})();

// === MOBILE NAV ===
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const nav = document.getElementById('navbar');
  if (!toggle || !links || !nav) return;

  function setOpen(open) {
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }

  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nav-links');
  links.id = links.id || 'nav-links';

  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) setOpen(false);
  });
})();

// === SCROLL FADE-IN ===
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.1 }
);
document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// === NAV SCROLL EFFECT ===
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.style.background = window.scrollY > 50
    ? 'rgba(10, 10, 15, 0.97)'
    : 'rgba(10, 10, 15, 0.92)';
});

// === DAYS ALIVE COUNTER ===
(function () {
  const born = new Date('2026-02-21');
  const now = new Date();
  const days = Math.floor((now - born) / (1000 * 60 * 60 * 24));
  const el = document.getElementById('stat-days');
  if (el) el.textContent = days;
})();

// === FEED LOADER ===
(async function () {
  try {
    const res = await fetch('feed.json');
    const feed = await res.json();
    const list = document.getElementById('feed-list');
    if (!list) return;

    feed.forEach(item => {
      const div = document.createElement('div');
      div.className = 'feed-item fade-in';
      div.innerHTML = `
        <div class="feed-date">${item.date}</div>
        <div class="feed-title">${item.title}</div>
        <div class="feed-body">${item.body}</div>
        <div class="feed-tags">${item.tags.map(t => `<span class="feed-tag">${t}</span>`).join('')}</div>
      `;
      list.appendChild(div);
    });

    // Observe new feed items
    list.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  } catch (e) {
    console.log('Feed load skipped:', e);
  }
})();

// === PROJECT FILTER ===
(function () {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const tags = card.dataset.tags || '';
        if (filter === 'all' || tags.includes(filter)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
})();
