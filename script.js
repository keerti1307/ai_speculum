/* script.js — used by both index.html and trainer.html
   - stores username in localStorage key "speculumUser"
   - trainer page auto-reads that and greets
   - fitness & acting arrays include text + seconds
   - circular progress animation syncs to seconds
*/

(() => {
  // utility: find current page
  const path = window.location.pathname.split("/").pop();

  // --- SHARED: register/login on index.html ---
  if (path === "" || path === "index.html") {
    document.addEventListener("DOMContentLoaded", () => {
      const usernameInput = document.getElementById("username");
      const registerBtn = document.getElementById("registerBtn");
      const loginBtn = document.getElementById("loginBtn");
      const guestBtn = document.getElementById("guestBtn");

      registerBtn.onclick = () => {
        const name = usernameInput.value.trim();
        if (!name) return alert("Please enter your name to register.");
        localStorage.setItem("speculumUser", name);
        alert("Registered! Now click Login.");
      };

      loginBtn.onclick = () => {
        const name = usernameInput.value.trim();
        const saved = localStorage.getItem("speculumUser");
        if (!name) return alert("Please type your registered name to login.");
        if (name === saved) {
          // store current session user and go to trainer
          localStorage.setItem("speculumCurrent", name);
          window.location.href = "trainer.html";
        } else {
          alert("User not found. Make sure you registered with this name.");
        }
      };

      guestBtn.onclick = () => {
        localStorage.setItem("speculumCurrent", "Guest");
        window.location.href = "trainer.html";
      };
    });

    return; // done for index.html
  }

  // --- TRAINER PAGE LOGIC ---
  if (path === "trainer.html") {
    document.addEventListener("DOMContentLoaded", () => {
      const dollEl = document.getElementById("doll");
      const greetingText = document.getElementById("greetingText");
      const logoutBtn = document.getElementById("logoutBtn");
      const fitnessBtn = document.getElementById("fitnessModeBtn");
      const actingBtn = document.getElementById("actingModeBtn");
      const instructionEl = document.getElementById("instructionText");
      const timerText = document.getElementById("timerText");
      const timerLabel = document.getElementById("timerLabel");
      const progressCircle = document.getElementById("progressCircle");
      const timerSvg = document.getElementById("timerSvg");
      const circleRadius = 60; // r
      const circumference = 2 * Math.PI * circleRadius;

      // audio cue
      const beep = () => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 880;
          g.gain.value = 0.03;
          o.connect(g);
          g.connect(ctx.destination);
          o.start();
          setTimeout(() => { o.stop(); ctx.close(); }, 150);
        } catch (e) { /* audio context blocked in some browsers */ }
      };

      // speech
      const speak = (text) => {
        try {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "en-IN";
          u.rate = 1;
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        } catch (e) {}
      };

      // read user
      const current = localStorage.getItem("speculumCurrent") || "Guest";
      greetingText.textContent = current === "Guest" ? "Welcome, Guest" : `Hey ${current}, ready to move?`;

      logoutBtn.onclick = () => {
        localStorage.removeItem("speculumCurrent");
        window.location.href = "index.html";
      };

      // define exercises (text + seconds)
      const fitnessMoves = [
        { text: "Do 10 squats.", seconds: 20 },
        { text: "Stretch your arms upward for 12 seconds.", seconds: 12 },
        { text: "Do 8 push-ups.", seconds: 18 },
        { text: "Rotate your neck slowly for 10 seconds.", seconds: 10 },
        { text: "Jump lightly in place for 15 seconds.", seconds: 15 },
        { text: "Touch your toes and hold for 8 seconds.", seconds: 8 },
        { text: "Do 15 jumping jacks.", seconds: 20 },
        { text: "Hold a plank for 25 seconds.", seconds: 25 }
      ];

      const actingPrompts = [
        { text: "Act surprised for 5 seconds!", seconds: 5 },
        { text: "Show me a confident smile for 6 seconds.", seconds: 6 },
        { text: "Pretend to be scared for 7 seconds!", seconds: 7 },
        { text: "Act like you’re talking to your best friend for 12 seconds.", seconds: 12 },
        { text: "Do a dramatic pose and hold it for 8 seconds!", seconds: 8 }
      ];

      // state
      let modeList = [];
      let currentIndex = 0;
      let intervalId = null;
      let startTime = 0;
      let totalSeconds = 25;

      // circle setup
      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = circumference;

      function setProgress(percent) {
        const offset = circumference - percent * circumference;
        progressCircle.style.strokeDashoffset = offset;
      }

      function resetProgress() {
        progressCircle.style.strokeDashoffset = circumference;
      }

      // start routine
      function startRoutine(list, modeName) {
        modeList = list;
        currentIndex = 0;
        dollEl.textContent = "🩵";
        instructionEl.textContent = `${modeName} mode starting... Get ready.`;
        speak(`${modeName} mode starting. Get ready.`);
        setTimeout(() => playItem(currentIndex), 1200);
      }

      function playItem(idx) {
        if (idx >= modeList.length) {
          instructionEl.textContent = "🏁 All done! Great job!";
          speak("Workout complete! Great job!");
          timerText.textContent = "";
          resetProgress();
          return;
        }

        const item = modeList[idx];
        const text = item.text;
        totalSeconds = Number(item.seconds) || 25;
        startTime = Date.now();

        // show & speak
        instructionEl.textContent = text;
        timerLabel.textContent = `Do it —`;
        timerText.textContent = `⏳ ${totalSeconds}s`;
        speak(text);

        // reset circle
        progressCircle.style.transition = "none";
        progressCircle.style.strokeDashoffset = circumference;
        // force reflow to apply no-transition baseline then enable transition
        void progressCircle.offsetWidth;
        progressCircle.style.transition = `stroke-dashoffset 1s linear`;

        // timer loop every second
        let remaining = totalSeconds;
        setProgress(0);
        clearInterval(intervalId);
        intervalId = setInterval(() => {
          remaining--;
          if (remaining <= 0) {
            clearInterval(intervalId);
            timerText.textContent = "✅ Done!";
            setProgress(1);
            beep();
            // short pause then next
            setTimeout(() => {
              currentIndex++;
              playItem(currentIndex);
            }, 1200);
            return;
          }
          // update UI
          timerText.textContent = `⏳ ${remaining}s`;
          const elapsed = (Date.now() - startTime) / 1000;
          const percent = Math.min(elapsed / totalSeconds, 1);
          setProgress(percent);
        }, 1000);
      }

      fitnessBtn.onclick = () => startRoutine(fitnessMoves, "Fitness");
      actingBtn.onclick = () => startRoutine(actingPrompts, "Acting");
    }); // DOMContentLoaded
  } // trainer.html
})(); // IIFE
