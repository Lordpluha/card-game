// top-friends.js

const friendsData = [
  {
    name: "Андрій",
    rating: 2450,
    img: "https://storage.googleapis.com/a1aa/image/e2445a7b-66f4-4114-c271-452054efa6a4.jpg",
  },
  {
    name: "Олена",
    rating: 2380,
    img: "https://storage.googleapis.com/a1aa/image/605606f6-40ef-474a-548e-7b8122852c5b.jpg",
  },
  {
    name: "Іван",
    rating: 2300,
    img: "https://storage.googleapis.com/a1aa/image/d18fd198-8851-4ea9-b433-71b53b9ae827.jpg",
  },
  {
    name: "Марія",
    rating: 2250,
    img: "https://storage.googleapis.com/a1aa/image/9a34c472-eecc-454f-bb47-d452b11ff814.jpg",
  },
  {
    name: "Сергій",
    rating: 2200,
    img: "https://storage.googleapis.com/a1aa/image/5e972707-30c4-4c22-b739-be9bb74a4601.jpg",
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
