// top-friends.js

const friendsData = [
  {
    name: "Андрій",
    rating: 2450,
    img: "../assets/avatars/p1.svg",
  },
  {
    name: "Олена",
    rating: 2380,
    img: "../assets/avatars/p2.svg",
  },
  {
    name: "Іван",
    rating: 2300,
    img: "../assets/avatars/p3.svg",
  },
  {
    name: "Марія",
    rating: 2250,
    img: "../assets/avatars/p4.svg",
  },
  {
    name: "Сергій",
    rating: 2200,
    img: "../assets/avatars/p5.svg",
  },
];

const container = document.getElementById("friends-grid");
if (container) {
  friendsData.forEach((friend) => {
    const card = document.createElement("div");
    card.className =
      "bg-[rgba(26,26,26,0.75)] rounded-xl shadow-lg p-4 flex flex-col items-center card-hover";
    card.title = `${friend.name} - Рейтинг ${friend.rating}`;

    card.innerHTML = `
      <img
        alt="Портрет гравця ${friend.name}"
        class="rounded-full mb-3 shadow-md"
        height="96"
        src="${friend.img}"
        width="96"
      />
      <h4 class="text-[var(--color-text-light)] font-semibold text-lg">
        ${friend.name}
      </h4>
      <p class="text-[var(--color-text-muted)]">Рейтинг: ${friend.rating}</p>
    `;

    container.appendChild(card);
  });
}
