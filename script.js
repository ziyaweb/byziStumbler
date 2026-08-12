const slides = document.querySelectorAll(".slide");
const dotsContainer = document.getElementById("dots");
const next = document.getElementById("next");
const prev = document.getElementById("prev");
const bgMusic = document.getElementById("bgMusic");
const soundBtn = document.getElementById("soundBtn");

let current = 0;
let timer;

slides.forEach((_, i) => {
  const dot = document.createElement("span");
  dot.className = "dot" + (i === 0 ? " active" : "");
  dot.addEventListener("click", () => showSlide(i));
  dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll(".dot");

function showSlide(index) {
  current = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
  dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
  restartTimer();
}

function restartTimer() {
  clearInterval(timer);
  timer = setInterval(() => showSlide(current + 1), 5000);
}

next.addEventListener("click", () => showSlide(current + 1));
prev.addEventListener("click", () => showSlide(current - 1));

restartTimer();

document.querySelector(".slider").addEventListener("mouseenter", () => clearInterval(timer));
document.querySelector(".slider").addEventListener("mouseleave", restartTimer);

// Backsound: browser biasanya memblokir autoplay audio.
// Tombol ini menjadi kontrol manual agar musik tetap bisa diputar setelah user berinteraksi.
async function toggleSound() {
  try {
    if (bgMusic.paused) {
      await bgMusic.play();
      soundBtn.innerHTML = "♪ <span>Sound on</span>";
    } else {
      bgMusic.pause();
      soundBtn.innerHTML = "♪ <span>Sound off</span>";
    }
  } catch (error) {
    soundBtn.innerHTML = "♪ <span>Click to play</span>";
  }
}
soundBtn.addEventListener("click", toggleSound);

// Coba memulai setelah interaksi pertama di halaman.
document.addEventListener("click", async () => {
  if (bgMusic.paused) {
    try {
      await bgMusic.play();
      soundBtn.innerHTML = "♪ <span>Sound on</span>";
    } catch (_) {}
  }
}, { once: true });
