window.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".preloader")) {
    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        document.querySelector(".preloader").style.display = "none";
      },
    });

    tl.fromTo(
      ".logo",
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
    )

      .to(".logo", { opacity: 0, scale: 0.5, duration: 0.5, ease: "power2.in" })

      .to(".bar1", { y: "-100%", duration: 0.6, ease: "power2.inOut" })
      .to(".bar2", { y: "-100%", duration: 0.6, ease: "power2.inOut" }, "-=0.4")
      .to(
        ".bar3",
        { y: "-100%", duration: 0.6, ease: "power2.inOut" },
        "-=0.4"
      );
  }
});

// Safety net. The reveal above is driven by GSAP, which advances on
// requestAnimationFrame. When rAF does not run — a tab opened in the
// background, a browser throttling animation, reduced-motion or low-power
// modes — the timeline stalls part-way and this overlay would cover the page
// for good, leaving a visitor staring at a blank screen. Hide it regardless
// after four seconds; the normal animated path is untouched.
setTimeout(() => {
  const el = document.querySelector('.preloader');
  if (el && el.style.display !== 'none') {
    el.style.display = 'none';
  }
}, 4000);
