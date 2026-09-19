const observers = new WeakMap();

export const reveal = {
  mounted(element, binding) {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const delay = Math.min(240, Math.max(0, Number(binding.value?.delay) || 0));
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    element.classList.add("motion-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        element.classList.add("is-visible");
        observer.disconnect();
        observers.delete(element);
      },
      {
        root: document.getElementById("public-scroll"),
        rootMargin: "0px 0px -24px 0px",
        threshold: 0.08,
      },
    );

    observers.set(element, observer);
    observer.observe(element);
  },
  unmounted(element) {
    observers.get(element)?.disconnect();
    observers.delete(element);
  },
};
