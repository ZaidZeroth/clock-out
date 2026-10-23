(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const timerLabel = document.querySelector("#timer strong");
  const timerCaption = document.querySelector("#timer-caption");
  const statusLabel = document.querySelector("#status");
  const resetButton = document.querySelector("#reset");

  const WIDTH = 960;
  const HEIGHT = 560;
  const TRACK_Y = 220;
  const CART_START_X = 250;
  const STEP_X = [250, 410, 570, 730];
  const BOOTH_X = 790;
  const BAY = { x: 575, y: 385 };
  const PLAYER_RADIUS = 22;
  const PLAYER_SPEED = 220;
  const ACTION_RANGE = 105;
  const STEP_INTERVAL = 8;
  const CUE_DURATION = 1.5;
  const ARENA = { left: 36, right: 924, top: 284, bottom: 495 };
  const KEY = {
    teacher: { up: "KeyW", left: "KeyA", down: "KeyS", right: "KeyD", action: "KeyF" },
    chef: { up: "ArrowUp", left: "ArrowLeft", down: "ArrowDown", right: "ArrowRight", action: "Slash" }
  };
  const gameKeys = new Set(Object.values(KEY).flatMap(Object.values));
  const held = new Set();
  const justPressed = new Set();
  const teacher = { x: 230, y: 455, color: "#176f91", label: "T", name: "Teacher" };
  const chef = { x: 700, y: 455, color: "#b85122", label: "C", name: "Chef" };

  let cartStep = 0;
  let secondsToStep = STEP_INTERVAL;
  let cueTime = 0;
  let result = "playing";
  let winningTime = 0;
  let message = "Move both characters close to the cart. The marked path lasts 1.5 seconds.";
  let messageTime = 0;
  let lastFrame = 0;
  let announced = "";

  function say(text, duration = 2.2) {
    message = text;
    messageTime = duration;
    if (announced !== text) {
      statusLabel.textContent = text;
      announced = text;
    }
  }

  function cartPosition() {
    return { x: STEP_X[cartStep], y: TRACK_Y };
  }

  function closeToCart(player) {
    const cart = cartPosition();
    return Math.hypot(player.x - cart.x, player.y - cart.y) <= ACTION_RANGE;
  }

  function clearInput() {
    held.clear();
    justPressed.clear();
  }

  function onKeyDown(event) {
    if (!gameKeys.has(event.code)) return;
    event.preventDefault();
    if (!event.repeat && !held.has(event.code)) justPressed.add(event.code);
    held.add(event.code);
  }

  function onKeyUp(event) {
    if (!gameKeys.has(event.code)) return;
    event.preventDefault();
    held.delete(event.code);
  }

  function teacherAction() {
    if (!closeToCart(teacher)) {
      say("Move Teacher closer to the cart to mark its route.");
      return;
    }
    cueTime = CUE_DURATION;
    say("Path marked! Chef, sweep the cart into the safe bay before the cue fades.", CUE_DURATION);
  }

  function chefAction() {
    if (!closeToCart(chef)) {
      say("Move Chef closer to the cart to redirect it.");
      return;
    }
    if (cueTime <= 0) {
      say("Mark a path first! Teacher can press F near the cart.");
      return;
    }
    result = "winning";
    winningTime = 0;
    cueTime = 0;
    say("Great teamwork! The cart is rolling into the safe bay.", 1.2);
  }

  function advanceCart() {
    cartStep += 1;
    if (cartStep >= 3) {
      cartStep = 3;
      result = "lost";
      say("The cart reached the booth. Reset and try the teamwork move again.", Infinity);
      resetButton.hidden = false;
    }
  }

  function movePlayer(player, controls, delta) {
    let dx = Number(held.has(controls.right)) - Number(held.has(controls.left));
    let dy = Number(held.has(controls.down)) - Number(held.has(controls.up));
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    player.x = Math.max(ARENA.left + PLAYER_RADIUS, Math.min(ARENA.right - PLAYER_RADIUS, player.x + dx * PLAYER_SPEED * delta));
    player.y = Math.max(ARENA.top + PLAYER_RADIUS, Math.min(ARENA.bottom - PLAYER_RADIUS, player.y + dy * PLAYER_SPEED * delta));
  }

  function resetGame() {
    teacher.x = 230;
    teacher.y = 455;
    chef.x = 700;
    chef.y = 455;
    cartStep = 0;
    secondsToStep = STEP_INTERVAL;
    cueTime = 0;
    result = "playing";
    winningTime = 0;
    resetButton.hidden = true;
    say("Move both characters close to the cart. The marked path lasts 1.5 seconds.", Infinity);
    clearInput();
  }

  function update(delta) {
    justPressed.forEach(code => {
      if (result !== "playing") return;
      if (code === KEY.teacher.action) teacherAction();
      if (code === KEY.chef.action) chefAction();
    });
    justPressed.clear();

    if (result === "winning") {
      winningTime += delta;
      if (winningTime >= 0.55) {
        result = "won";
        resetButton.hidden = false;
        say("You saved the booth! Press Play again for another round.", Infinity);
      }
      return;
    }
    if (result !== "playing") return;

    movePlayer(teacher, KEY.teacher, delta);
    movePlayer(chef, KEY.chef, delta);

    if (cueTime > 0) {
      cueTime = Math.max(0, cueTime - delta);
    } else {
      secondsToStep -= delta;
      if (secondsToStep <= 0) {
        advanceCart();
        secondsToStep = STEP_INTERVAL;
      }
    }

    if (messageTime !== Infinity && messageTime > 0) {
      messageTime = Math.max(0, messageTime - delta);
      if (messageTime === 0 && result === "playing") {
        say("Move both characters close to the cart. The marked path lasts 1.5 seconds.", Infinity);
      }
    }
  }

  function roundedRect(x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawBackground() {
    ctx.fillStyle = "#f5f8f5";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#e9f0e9";
    ctx.fillRect(0, 282, WIDTH, HEIGHT - 282);

    ctx.fillStyle = "#f0e6d3";
    roundedRect(58, 142, 844, 145, 22, "#f0e6d3", "#e0d3bb");
    ctx.fillStyle = "#8b795d";
    ctx.font = "700 14px system-ui, sans-serif";
    ctx.fillText("CAREER FAIR AISLE", 76, 167);

    ctx.strokeStyle = "#a6977e";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(STEP_X[0], TRACK_Y);
    ctx.lineTo(BOOTH_X, TRACK_Y);
    ctx.stroke();
    ctx.lineCap = "butt";

    for (let i = 0; i < 3; i += 1) {
      const x = STEP_X[i + 1];
      ctx.beginPath();
      ctx.arc(x, TRACK_Y, 13, 0, Math.PI * 2);
      ctx.fillStyle = cartStep >= i + 1 ? "#cb6741" : "#fffaf1";
      ctx.fill();
      ctx.strokeStyle = "#9d8765";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#725e43";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), x, TRACK_Y + 4);
    }
    ctx.textAlign = "start";

    roundedRect(BOOTH_X - 5, 179, 102, 82, 9, "#f3d6c2", "#cf7859");
    ctx.fillStyle = "#663d31";
    ctx.font = "800 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOOTH", BOOTH_X + 46, 204);
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("watch out!", BOOTH_X + 46, 224);
    ctx.textAlign = "start";

    roundedRect(BAY.x - 86, BAY.y - 37, 172, 75, 15, "#d8eee3", "#4c9772");
    ctx.fillStyle = "#236245";
    ctx.font = "800 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SAFE BAY", BAY.x, BAY.y + 5);
    ctx.textAlign = "start";

    ctx.fillStyle = "#71816f";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Move freely in the marked floor area", 66, 318);
  }

  function drawCart() {
    const cart = cartPosition();
    let x = cart.x;
    let y = cart.y;
    if (result === "winning" || result === "won") {
      const progress = result === "won" ? 1 : Math.min(1, winningTime / 0.55);
      x = cart.x + (BAY.x - cart.x) * progress;
      y = cart.y + (BAY.y - cart.y) * progress;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#4f5c60";
    ctx.beginPath();
    ctx.arc(-24, 20, 7, 0, Math.PI * 2);
    ctx.arc(22, 20, 7, 0, Math.PI * 2);
    ctx.fill();
    roundedRect(-34, -23, 68, 42, 9, "#d57736", "#8f4c25");
    ctx.fillStyle = "#fff0d5";
    ctx.font = "800 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CART", 0, 2);
    ctx.textAlign = "start";
    ctx.restore();
  }

  function drawCue() {
    if (cueTime <= 0) return;
    const cart = cartPosition();
    const alpha = Math.min(1, cueTime / 0.25);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#2b9e8c";
    ctx.fillStyle = "#2b9e8c";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cart.x, cart.y + 42);
    ctx.lineTo(cart.x, cart.y + 82);
    ctx.lineTo(BAY.x, BAY.y - 55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(BAY.x, BAY.y - 58);
    ctx.lineTo(BAY.x - 13, BAY.y - 76);
    ctx.lineTo(BAY.x + 13, BAY.y - 76);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#176a5b";
    ctx.font = "800 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`PATH ${cueTime.toFixed(1)}s`, BAY.x, BAY.y - 87);
    ctx.restore();
  }

  function drawPlayer(player, controlsText) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = `${player.color}26`;
    ctx.beginPath();
    ctx.ellipse(0, 25, 27, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(player.label, 0, 1);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#26353c";
    ctx.font = "800 13px system-ui, sans-serif";
    ctx.fillText(player.name, 0, 47);
    ctx.fillStyle = "#52636d";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(controlsText, 0, 63);
    ctx.restore();
  }

  function drawOutcome() {
    if (result === "playing" || result === "winning") return;
    ctx.fillStyle = "#17252dbb";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    roundedRect(242, 202, 476, 150, 22, "#ffffff", "#d7e0e7");
    ctx.fillStyle = result === "won" ? "#236245" : "#8b4029";
    ctx.textAlign = "center";
    ctx.font = "900 30px system-ui, sans-serif";
    ctx.fillText(result === "won" ? "Booth saved!" : "The cart reached the booth", WIDTH / 2, 260);
    ctx.fillStyle = "#4c5b63";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press Play again below to reset the encounter.", WIDTH / 2, 299);
    ctx.textAlign = "start";
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    drawCue();
    drawCart();
    drawPlayer(teacher, "W A S D · F");
    drawPlayer(chef, "ARROWS · /");
    drawOutcome();

    const cueActive = cueTime > 0;
    timerCaption.textContent = cueActive ? "Path fades in" : "Cart moves in";
    timerLabel.textContent = cueActive
      ? cueTime.toFixed(1)
      : Math.max(0, secondsToStep).toFixed(1);
    document.querySelector("#timer").setAttribute("aria-label", cueActive ? "Time remaining on the marked path" : "Time until the cart moves");
  }

  function frame(now) {
    const delta = lastFrame === 0 ? 0 : Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    update(delta);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp, { passive: false });
  window.addEventListener("blur", clearInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearInput();
  });
  resetButton.addEventListener("click", resetGame);
  requestAnimationFrame(frame);
})();