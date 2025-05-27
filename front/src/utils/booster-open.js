import gsap from "https://cdn.skypack.dev/gsap";

const packCards = [
  "https://img.freepik.com/free-photo/neoclassical-medieval-portrait-knight-illustration_23-2151891945.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Paladin
  "https://i.pinimg.com/736x/14/03/77/140377c21b3f03c9e7e0293030871b48.jpg", // Titan
  "https://img.freepik.com/free-photo/portrait-male-scribe-medieval-times_23-2150932226.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Mage
  "https://plus.unsplash.com/premium_photo-1698168385751-4873a712d2f0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8V2FycmlvcnxlbnwwfDF8MHx8fDA%3D", // Warrior
  "https://img.freepik.com/free-photo/fantasy-bird-illustration_23-2151496127.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Dragon
  "https://img.freepik.com/premium-photo/professional-male-archer-action-precision-skill-full-tactical-gear-with-intense-focus_1110513-16217.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Archer
];

const modal = document.getElementById("packModal");
const grid = document.getElementById("packCards");
const title = document.getElementById("packTitle");

window.openPack = (packType) => {
  title.textContent = `Відкриття ${
    packType.charAt(0).toUpperCase() + packType.slice(1)
  } бустера`;
  grid.innerHTML = "";
  modal.classList.remove("hidden");

  const selected = Array.from(
    { length: 5 },
    () => packCards[Math.floor(Math.random() * packCards.length)]
  );

  selected.forEach((imgSrc, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "w-full h-64 relative overflow-hidden rounded-lg";
    const img = document.createElement("img");
    img.src = imgSrc;
    img.className = "w-full h-full object-cover scale-0 opacity-0";
    wrapper.appendChild(img);
    grid.appendChild(wrapper);

    gsap.to(img, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: "back.out(1.7)",
      delay: i * 0.3,
    });
  });
};

window.closePack = () => {
  modal.classList.add("hidden");
};
