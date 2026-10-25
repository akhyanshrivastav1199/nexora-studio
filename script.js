
"use strict";

const WHATSAPP_DESTINATION = "916388114460";

document.documentElement.classList.add("js-ready");

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Loader
  const loader = $("#pageLoader");
  const hideLoader = () => loader?.classList.add("is-done");
  window.addEventListener("load", () => setTimeout(hideLoader, reduceMotion ? 0 : 450), { once: true });
  setTimeout(hideLoader, 3000);

  // Footer year
  const year = $("#currentYear");
  if (year) year.textContent = new Date().getFullYear();

  // Header
  const header = $("#siteHeader");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 35);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Mobile navigation
  const toggle = $("#menuToggle");
  const nav = $("#siteNav");

  function closeMenu() {
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation");
    nav?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  toggle?.addEventListener("click", () => {
    const opening = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(opening));
    toggle.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation");
    nav?.classList.toggle("is-open", opening);
    document.body.classList.toggle("menu-open", opening);
  });

  $$("#siteNav a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  // Smooth anchor navigation
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const selector = link.getAttribute("href");
      if (!selector || selector === "#") return;
      const target = $(selector);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  // Reveal sections as they enter the viewport
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${index % 3 * 65}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  // Cursor glow
  const cursorGlow = $("#cursorGlow");
  if (cursorGlow && finePointer && !reduceMotion) {
    let pointerFrame = 0;
    document.addEventListener("pointermove", event => {
      if (event.pointerType === "touch") return;
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
        document.body.classList.add("pointer-active");
      });
    }, { passive: true });
    document.addEventListener("pointerleave", () => document.body.classList.remove("pointer-active"));
  }

  // Project card depth and light response
  if (finePointer && !reduceMotion) {
    $$(".project-card").forEach(card => {
      const art = $(".project-art", card);
      if (!art) return;
      card.addEventListener("pointermove", event => {
        if (event.pointerType === "touch") return;
        const rect = art.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        art.style.setProperty("--mouse-x", `${px * 100}%`);
        art.style.setProperty("--mouse-y", `${py * 100}%`);
      });
      card.addEventListener("pointerleave", () => {
        art.style.removeProperty("--mouse-x");
        art.style.removeProperty("--mouse-y");
      });
    });
  }

  // WhatsApp enquiry form
  const form = $("#contactForm");
  const status = $("#formStatus");

  form?.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const service = String(data.get("project") || "").trim();
    const budget = String(data.get("budget") || "Not decided yet").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !email || !service || !message) {
      if (status) status.textContent = "Please complete all required fields.";
      return;
    }

    const enquiry = [
      "Hello NEXORA STUDIO!",
      "",
      "I'd like to discuss a project.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Service: ${service}`,
      `Budget: ${budget}`,
      "",
      "Project details:",
      message
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_DESTINATION}?text=${encodeURIComponent(enquiry)}`;
    if (status) status.textContent = "Opening WhatsApp. Review your enquiry and press Send there.";

    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) window.location.href = url;
  });

  // Three.js hero sculpture
  function initThreeHero() {
    const canvas = $("#heroCanvas");
    const stage = $("#heroStage");
    const object = $("#heroObject");

    if (!canvas || !stage || !object || !window.THREE) return;

    const THREE = window.THREE;
    let renderer;
    let scene;
    let camera;
    let sculpture;
    let animationFrame = 0;
    let lastFrame = 0;
    let visible = true;
    let disposed = false;
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio < 2
      });
    } catch (error) {
      console.warn("3D rendering is unavailable on this device; showing the CSS visual instead.", error);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(Math.max(stage.clientWidth, 1), Math.max(stage.clientHeight, 1), false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      38,
      Math.max(stage.clientWidth, 1) / Math.max(stage.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0, 8.6);

    const sculptureGroup = new THREE.Group();
    sculpture = sculptureGroup;
    scene.add(sculptureGroup);

    // Materials
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf3ffe1,
      metalness: 0.45,
      roughness: 0.12,
      transmission: 0.2,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.08
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe4e9e3,
      metalness: 0.92,
      roughness: 0.19
    });

    const greenMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8f52d,
      emissive: 0x5b8d08,
      emissiveIntensity: 0.65,
      metalness: 0.4,
      roughness: 0.2
    });

    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc6ff5a,
      emissive: 0x70ad0a,
      emissiveIntensity: 0.85,
      metalness: 0.45,
      roughness: 0.15,
      clearcoat: 1
    });

    // Glowing central sphere
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 48, 48),
      coreMaterial
    );
    sculptureGroup.add(core);

    // Twisted chrome forms
    const torusOne = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.25, 0.16, 180, 20, 2, 3),
      chromeMaterial
    );
    torusOne.rotation.set(0.5, 0.25, -0.3);
    sculptureGroup.add(torusOne);

    const torusTwo = new THREE.Mesh(
      new THREE.TorusGeometry(1.62, 0.055, 16, 120),
      glassMaterial
    );
    torusTwo.rotation.set(1.1, 0.25, 0.55);
    sculptureGroup.add(torusTwo);

    const torusThree = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.035, 12, 120),
      greenMaterial
    );
    torusThree.rotation.set(0.3, 1.05, -0.6);
    sculptureGroup.add(torusThree);

    // Floating metallic fragments
    const fragmentGeometry = new THREE.IcosahedronGeometry(0.16, 1);
    for (let i = 0; i < 14; i++) {
      const material = i % 3 === 0 ? greenMaterial : chromeMaterial;
      const fragment = new THREE.Mesh(fragmentGeometry, material);
      const angle = (i / 14) * Math.PI * 2;
      const radius = 2.05 + Math.sin(i * 2.1) * 0.25;
      fragment.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.7) * 1.6,
        Math.sin(angle) * 0.75
      );
      fragment.scale.setScalar(0.55 + (i % 4) * 0.2);
      sculptureGroup.add(fragment);
    }

    // Small particle field
    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.8;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x789e3b,
        size: 0.022,
        transparent: true,
        opacity: 0.68,
        sizeAttenuation: true
      })
    );
    scene.add(particles);

    // Soft studio lighting
    scene.add(new THREE.HemisphereLight(0xf7fff0, 0x53635a, 2.0));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const greenLight = new THREE.PointLight(0xb8ff42, 3.2, 12);
    greenLight.position.set(-3, 1.8, 2.8);
    scene.add(greenLight);

    const rimLight = new THREE.PointLight(0xa7d8ff, 2.2, 14);
    rimLight.position.set(2.5, -3, -1);
    scene.add(rimLight);

    function resize() {
      if (disposed) return;
      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      camera.aspect = width / height;
      camera.position.z = width < 500 ? 9.5 : 8.6;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    const resizeObserver = "ResizeObserver" in window
      ? new ResizeObserver(resize)
      : null;

    resizeObserver?.observe(stage);
    window.addEventListener("resize", resize, { passive: true });

    if (finePointer && !reduceMotion) {
      stage.addEventListener("pointermove", event => {
        const rect = stage.getBoundingClientRect();
        target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.65;
        target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.45;
      }, { passive: true });

      stage.addEventListener("pointerleave", () => {
        target.x = 0;
        target.y = 0;
      });
    }

    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) startLoop();
      else cancelAnimationFrame(animationFrame);
    }, { threshold: 0.02 });
    visibilityObserver.observe(stage);

    function renderFrame(time) {
      if (disposed || !visible || document.hidden) return;

      // Keep the render workload moderate on mobile.
      if (time - lastFrame < 30) {
        animationFrame = requestAnimationFrame(renderFrame);
        return;
      }
      lastFrame = time;

      const t = time * 0.00035;

      if (!reduceMotion) {
        sculpture.rotation.y += 0.0025;
        sculpture.rotation.x += (target.y - sculpture.rotation.x) * 0.025;
        sculpture.rotation.z += (target.x - sculpture.rotation.z) * 0.025;
        sculpture.position.y = Math.sin(t * 4) * 0.08;
        particles.rotation.y = t * 0.16;
        particles.rotation.x = Math.sin(t) * 0.04;
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(renderFrame);
    }

    function startLoop() {
      if (disposed || document.hidden || !visible || animationFrame) return;
      animationFrame = requestAnimationFrame(renderFrame);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else {
        lastFrame = 0;
        startLoop();
      }
    });

    // Dispose renderer resources if the page is being unloaded.
    window.addEventListener("pagehide", () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      visibilityObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      scene.traverse(item => {
        if (item.geometry) item.geometry.dispose();
        if (item.material) {
          if (Array.isArray(item.material)) item.material.forEach(material => material.dispose());
          else item.material.dispose();
        }
      });
      renderer.dispose();
    }, { once: true });

    object.classList.add("webgl-ready");
    resize();
    startLoop();
  }

  initThreeHero();
});
