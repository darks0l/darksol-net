// === ASCII ART SOLARIZED SHADER BACKGROUND ===
(function () {
  const canvas = document.getElementById('moon-canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // Vertex shader
  const vsSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader — ASCII solar/plasma effect
  const fsSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_scroll;

    // Solarized palette
    vec3 sol_base03  = vec3(0.0, 0.169, 0.212);
    vec3 sol_base02  = vec3(0.027, 0.212, 0.259);
    vec3 sol_base01  = vec3(0.345, 0.431, 0.459);
    vec3 sol_blue    = vec3(0.149, 0.545, 0.824);
    vec3 sol_cyan    = vec3(0.165, 0.631, 0.596);
    vec3 sol_green   = vec3(0.522, 0.600, 0.0);
    vec3 sol_yellow  = vec3(0.710, 0.537, 0.0);
    vec3 sol_orange  = vec3(0.796, 0.294, 0.086);
    vec3 sol_red     = vec3(0.863, 0.196, 0.184);
    vec3 sol_magenta = vec3(0.827, 0.212, 0.510);
    vec3 sol_violet  = vec3(0.424, 0.443, 0.769);

    // Hash for pseudo-random
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // Simplex-ish noise
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

    // FBM
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

    // ASCII character density via stepped thresholds
    float asciiDensity(float v) {
      // Simulate ASCII art: quantize to character "weight"
      // Characters from sparse to dense: . : - = + * # @ 
      float steps = 10.0;
      return floor(v * steps) / steps;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      // ASCII grid
      float cellSize = 12.0; // pixel size of each "character"
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
      // Create dot-matrix / character feel
      float charShape = 1.0;
      // Horizontal scan lines
      charShape *= smoothstep(0.0, 0.1, inCell.y) * smoothstep(1.0, 0.85, inCell.y);
      // Vertical gaps between chars
      charShape *= smoothstep(0.0, 0.08, inCell.x) * smoothstep(1.0, 0.9, inCell.x);
      // Density-based fill: darker chars fill more, lighter chars have gaps
      float fill = step(1.0 - ascii, max(inCell.x, inCell.y) * 0.5 + 0.3);
      charShape *= mix(0.3, 1.0, fill * ascii);

      // Blue shades from dark to light
      vec3 blue0 = vec3(0.02, 0.04, 0.10);  // near black
      vec3 blue1 = vec3(0.04, 0.08, 0.18);
      vec3 blue2 = vec3(0.06, 0.12, 0.28);
      vec3 blue3 = vec3(0.08, 0.18, 0.40);
      vec3 blue4 = vec3(0.12, 0.28, 0.55);
      vec3 blue5 = vec3(0.15, 0.38, 0.68);
      vec3 blue6 = vec3(0.20, 0.50, 0.80);
      vec3 blue7 = vec3(0.30, 0.60, 0.90);
      vec3 blue8 = vec3(0.45, 0.72, 0.95);
      vec3 blue9 = vec3(0.65, 0.85, 1.0);  // bright ice

      vec3 col;
      if (ascii < 0.1) col = blue0;
      else if (ascii < 0.2) col = blue1;
      else if (ascii < 0.3) col = blue2;
      else if (ascii < 0.4) col = blue3;
      else if (ascii < 0.5) col = blue4;
      else if (ascii < 0.6) col = blue5;
      else if (ascii < 0.7) col = blue6;
      else if (ascii < 0.8) col = blue7;
      else if (ascii < 0.9) col = blue8;
      else col = blue9;

      // Apply character shape
      col *= charShape;

      // Slight vignette
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
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
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

// === MOBILE NAV TOGGLE ===
document.querySelector('.nav-toggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

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

// === NAV BACKGROUND ON SCROLL ===
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.style.background = window.scrollY > 50 ? 'rgba(10, 10, 15, 0.95)' : 'rgba(10, 10, 15, 0.9)';
});
