    
      /**
       * SecurePass - Premium Cryptographic Suite
       * Uses window.crypto.getRandomValues() for CSPRNG
       */

      const TERRIBLE_PASSWORDS = [
        "password",
        "123456",
        "qwerty",
        "12345678",
        "admin",
        "welcome",
        "123456789",
        "pass123",
        "guest",
        "football",
        "princess",
        "iloveyou",
        "secret",
        "monkey",
        "dragon",
        "letmein",
        "qwertyuiop",
        "password123",
        "shadow",
        "superman",
      ];

      // DOM Elements
      const inputCheck = document.getElementById("inputCheck");
      const strengthBar = document.getElementById("strength-bar");
      const strengthLabel = document.getElementById("strength-label");
      const crackTimeDisplay = document.getElementById("crack-time");
      const lengthSlider = document.getElementById("lengthSlider");
      const lengthDisplay = document.getElementById("lengthDisplay");
      const generateBtn = document.getElementById("generateBtn");
      const resultField = document.getElementById("resultField");
      const historyFeed = document.getElementById("historyFeed");
      const clearBtn = document.getElementById("clearBtn");
      const copyBtn = document.getElementById("copyResult");
      const resultContainer = document.getElementById("resultContainer");

      const criteria = {
        len: document.getElementById("crit-len"),
        up: document.getElementById("crit-up"),
        low: document.getElementById("crit-low"),
        num: document.getElementById("crit-num"),
        sym: document.getElementById("crit-sym"),
        unique: document.getElementById("crit-unique"),
      };

      /**
       * Strength Analysis Engine
       */
      function analyzeStrength(p) {
        if (!p) {
          resetUI();
          return;
        }

        const checks = {
          len: p.length >= 12,
          up: /[A-Z]/.test(p),
          low: /[a-z]/.test(p),
          num: /[0-9]/.test(p),
          sym: /[^A-Za-z0-9]/.test(p),
          unique: !TERRIBLE_PASSWORDS.includes(p.toLowerCase()),
        };

        // Update Criteria UI
        Object.keys(checks).forEach((k) => {
          criteria[k].classList.toggle("active", checks[k]);
        });

        // Calculate Entropy (Approx)
        let poolSize = 0;
        if (checks.up) poolSize += 26;
        if (checks.low) poolSize += 26;
        if (checks.num) poolSize += 10;
        if (checks.sym) poolSize += 32;

        const entropy = p.length * Math.log2(poolSize || 1);
        const score = Math.min(100, (entropy / 80) * 100);
        updateMatrixState(p ? score / 100 : 0);

        renderStrength(score, checks.unique);
        estimateCrackTime(entropy);
      }

      function renderStrength(score, isUnique) {
        let color = "var(--very-weak)";
        let label = "Very Weak";

        if (!isUnique) {
          score = 15;
          label = "Terrible (Common)";
          inputCheck.parentElement.classList.add("shake");
          setTimeout(
            () => inputCheck.parentElement.classList.remove("shake"),
            400,
          );
        } else {
          if (score >= 90) {
            color = "var(--very-strong)";
            label = "Very Strong";
          } else if (score >= 70) {
            color = "var(--strong)";
            label = "Strong";
          } else if (score >= 50) {
            color = "var(--medium)";
            label = "Medium";
          } else if (score >= 30) {
            color = "var(--weak)";
            label = "Weak";
          }
        }

        strengthBar.style.width = score + "%";
        strengthBar.style.backgroundColor = color;
        strengthLabel.innerText = label;
        strengthLabel.style.color = color;
      }

      function estimateCrackTime(bits) {
        // Basic logarithmic crack estimation (10B guesses/sec)
        const years = Math.pow(2, bits) / (10 ** 10 * 3600 * 24 * 365);
        let timeStr = "Instant";

        if (bits === 0) timeStr = "—";
        else if (years > 1000000) timeStr = "Centuries+";
        else if (years > 1000) timeStr = "Millennia";
        else if (years > 1) timeStr = Math.round(years) + " Years";
        else if (years > 1 / 12) timeStr = Math.round(years * 12) + " Months";
        else if (years > 1 / 365) timeStr = Math.round(years * 365) + " Days";
        else timeStr = "Minutes/Hours";

        crackTimeDisplay.innerText = `Crack Time: ${timeStr}`;
      }

      function resetUI() {
        strengthBar.style.width = "0%";
        strengthLabel.innerText = "Waiting...";
        strengthLabel.style.color = "var(--text-secondary)";
        crackTimeDisplay.innerText = "Crack Time: —";
        Object.values(criteria).forEach((c) => c.classList.remove("active"));
        criteria.unique.classList.add("active"); // Default to true if empty
      }

      inputCheck.addEventListener("input", (e) =>
        analyzeStrength(e.target.value),
      );

      /**
       * Cryptographic Generator
       */
      const CHAR_POOLS = {
        up: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        low: "abcdefghijklmnopqrstuvwxyz",
        num: "0123456789",
        sym: "!@#$%^&*()_+-=[]{}|;:,.<>?",
      };

      lengthSlider.addEventListener("input", (e) => {
        lengthDisplay.innerText = e.target.value;
      });

      function generate() {
        const length = parseInt(lengthSlider.value);
        const pools = [
          document.getElementById("genUp").checked ? CHAR_POOLS.up : "",
          document.getElementById("genLow").checked ? CHAR_POOLS.low : "",
          document.getElementById("genNum").checked ? CHAR_POOLS.num : "",
          document.getElementById("genSym").checked ? CHAR_POOLS.sym : "",
        ].filter((p) => p !== "");

        if (pools.length === 0) {
          alert("Security violation: Select at least one character type.");
          return;
        }

        let password = [];
        const allChars = pools.join("");

        // Ensure variety: 1 from each selected pool
        pools.forEach((p) => {
          password.push(secureRandomChar(p));
        });

        // Fill the rest
        while (password.length < length) {
          password.push(secureRandomChar(allChars));
        }

        // Secure Shuffle (Fisher-Yates)
        for (let i = password.length - 1; i > 0; i--) {
          const j = getSecureInt(0, i);
          [password[i], password[j]] = [password[j], password[i]];
        }

        const final = password.join("");
        resultField.innerText = final;
        addToHistory(final);

        // Animate generation
        resultContainer.classList.add("shake");
        setTimeout(() => resultContainer.classList.remove("shake"), 400);
      }

      function secureRandomChar(str) {
        return str[getSecureInt(0, str.length - 1)];
      }

      function getSecureInt(min, max) {
        const range = max - min + 1;
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return min + (array[0] % range);
      }

      generateBtn.addEventListener("click", generate);

      /**
       * History & Clipboard
       */
      function addToHistory(pw) {
        const history = JSON.parse(
          localStorage.getItem("pwgen_history") || "[]",
        );
        const newEntry = { pw, time: new Date().toLocaleTimeString() };

        history.unshift(newEntry);
        if (history.length > 20) history.splice(20);

        localStorage.setItem("pwgen_history", JSON.stringify(history));
        renderHistory();
      }

      function renderHistory() {
        const history = JSON.parse(
          localStorage.getItem("pwgen_history") || "[]",
        );
        historyFeed.innerHTML = history.length
          ? ""
          : '<div style="color:#333;text-align:center;padding:40px;font-size:0.8rem">No encrypted entries in history</div>';

        history.forEach((item) => {
          const div = document.createElement("div");
          div.className = "history-item";
          div.innerHTML = `
        <div class="pw-info">
          <span class="pw-text">${item.pw}</span>
          <span class="pw-meta">${item.time} Today</span>
        </div>
        <button class="icon-btn copy-hist"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
      `;

          div.querySelector(".copy-hist").addEventListener("click", () => {
            copyText(item.pw, div.querySelector(".copy-hist"));
          });

          historyFeed.appendChild(div);
        });
      }

      function copyText(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
          const toast = document.createElement("div");
          toast.className = "copied-toast";
          toast.innerText = "COPIED";
          btn.parentElement.appendChild(toast);
          setTimeout(() => toast.remove(), 1200);
        });
      }

      copyBtn.addEventListener("click", () => {
        if (resultField.innerText !== "Click to generate...") {
          copyText(resultField.innerText, copyBtn);
        }
      });

      clearBtn.addEventListener("click", () => {
        localStorage.removeItem("pwgen_history");
        renderHistory();
      });

      // Initial render
      renderHistory();

      /**
       * THREE.JS ELECTRIFIED SHIELD LATTICE ENGINE
       */
      const vertexShader = `
        varying vec2 vUv;
        varying float vStrength;
        varying float vEdge;
        uniform float uTime;
        uniform float uStrength;
        uniform vec3 uMouse;
        
        void main() {
          vUv = uv;
          vStrength = uStrength;
          vec3 pos = position;
          
          // Harmonic Spring & Noise motion
          float noise = sin(pos.x * 4.0 + uTime) * cos(pos.y * 4.0 + uTime * 0.8) * 0.1;
          pos += normalize(pos) * noise * (1.2 - uStrength);
          
          // Mouse Interaction
          float dist = distance(pos, uMouse);
          float attraction = 1.0 / (1.0 + dist * dist);
          pos += normalize(uMouse - pos) * attraction * 0.5 * uStrength;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `;

      const fragmentShader = `
        varying vec2 vUv;
        varying float vStrength;
        uniform float uTime;

        void main() {
          vec3 cyan = vec3(0.0, 1.0, 1.0);
          vec3 purple = vec3(0.6, 0.2, 1.0);
          vec3 green = vec3(0.2, 1.0, 0.4);
          
          vec3 color = mix(purple, cyan, vStrength);
          color = mix(color, green, pow(vStrength, 3.0));
          
          // Electrical Flicker & Scanlines
          float flicker = step(0.98, sin(uTime * 50.0)) * 0.2;
          float scanline = sin(vUv.y * 500.0) * 0.05;
          
          // Edge glow
          float edge = 1.0 - length(vUv - 0.5) * 2.0;
          
          gl_FragColor = vec4(color + flicker - scanline, 0.4 * edge);
        }
      `;

      let scene, camera, renderer, material, lattice, lightningGroup;
      let targetStrength = 0, currentStrength = 0;
      let mouse = new THREE.Vector3();
      let raycaster = new THREE.Raycaster();
      let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

      function initThree() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // 1. Shield Lattice (Wireframe Polyhedra)
        const geometry = new THREE.IcosahedronGeometry(3, 2);
        const wireframe = new THREE.WireframeGeometry(geometry);
        material = new THREE.ShaderMaterial({
          transparent: true,
          uniforms: {
            uTime: { value: 0 },
            uStrength: { value: 0 },
            uMouse: { value: new THREE.Vector3() }
          },
          vertexShader,
          fragmentShader,
          blending: THREE.AdditiveBlending
        });

        lattice = new THREE.LineSegments(wireframe, material);
        scene.add(lattice);

        // 2. Lightning Group
        lightningGroup = new THREE.Group();
        scene.add(lightningGroup);

        camera.position.z = 6;
        window.addEventListener('mousemove', onMouseMove);
        animate();
      }

      function onMouseMove(event) {
        let mouseCoords = new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouseCoords, camera);
        raycaster.ray.intersectPlane(plane, mouse);
      }

      function generateLightning(start, end, depth) {
        if (depth <= 0) return [];
        
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ).multiplyScalar(depth * 0.5);
        
        mid.add(offset);
        
        let segments = [[start.clone(), mid.clone()], [mid.clone(), end.clone()]];
        
        // Occasional forks
        if (Math.random() > 0.7) {
          const forkEnd = mid.clone().add(offset.clone().multiplyScalar(2));
          segments.push([mid.clone(), forkEnd]);
        }
        
        return [
          ...segments,
          ...generateLightning(start, mid, depth - 1),
          ...generateLightning(mid, end, depth - 1)
        ];
      }

      function updateLightning() {
        lightningGroup.clear();
        
        // Probability of strike based on strength
        if (Math.random() > (0.95 - currentStrength * 0.1)) {
          // Find closest vertex to mouse
          const positions = lattice.geometry.attributes.position.array;
          let closest = new THREE.Vector3();
          let minDist = Infinity;
          
          for (let i = 0; i < positions.length; i += 3) {
            let v = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
            v.applyMatrix4(lattice.matrixWorld);
            let d = v.distanceTo(mouse);
            if(d < minDist) { minDist = d; closest = v; }
          }

          if (minDist < 4) {
            const segments = generateLightning(closest, mouse, 4);
            const lineGeom = new THREE.BufferGeometry().setFromPoints(segments.flat());
            const lineMat = new THREE.LineBasicMaterial({ 
              color: currentStrength > 0.7 ? 0x4dff88 : 0x00ffff, 
              transparent: true, 
              opacity: 0.8 * Math.random(),
              blending: THREE.AdditiveBlending 
            });
            const strike = new THREE.LineSegments(lineGeom, lineMat);
            lightningGroup.add(strike);
          }
        }
      }

      function animate() {
        requestAnimationFrame(animate);
        currentStrength += (targetStrength - currentStrength) * 0.05;
        
        material.uniforms.uTime.value += 0.01;
        material.uniforms.uStrength.value = currentStrength;
        material.uniforms.uMouse.value.copy(mouse);
        
        lattice.rotation.y += 0.002 * (1.0 - currentStrength);
        lattice.rotation.x += 0.001 * (1.0 - currentStrength);
        
        updateLightning();
        
        renderer.render(scene, camera);
      }

      function updateMatrixState(val) { targetStrength = val; }

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      initThree();

