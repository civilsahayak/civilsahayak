   /* ================================================
   TRIAL BANNER TOGGLE — the only line you need to touch
   'paid'  -> shows "Get Premium Trial @ ₹99" (opens QR/payment flow)
   'free'  -> shows "Free for new users" (downloads installer, request trial in-app)
   ================================================ */
const PREMIUM_TRIAL_MODE = 'free';

document.addEventListener('DOMContentLoaded', () => {
    const paidBanner = document.getElementById('trialBannerPaid');
    const freeBanner = document.getElementById('trialBannerFree');
    if (paidBanner && freeBanner) {
        paidBanner.style.display = PREMIUM_TRIAL_MODE === 'paid' ? 'block' : 'none';
        freeBanner.style.display = PREMIUM_TRIAL_MODE === 'free' ? 'block' : 'none';
    }
});

function downloadInstallerOnly(e) {
    e.preventDefault();
    const a = document.createElement('a');
    a.href = primaryURL;
    a.download = 'CivilSahayak_OnlineInstaller.exe';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


/* ================================================
   0. THEME (Light / Dark) — persisted + synced across pages
   ================================================ */
(function themeInit() {
    const KEY = 'hewp-theme';
    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-toggle .knob i').forEach(icon => {
            icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (!saved) {
        saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    apply(saved);
    window.toggleSiteTheme = function () {
        const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
        document.querySelectorAll('.theme-toggle').forEach(t => t.setAttribute('aria-pressed', next === 'light'));
    };
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.addEventListener('click', window.toggleSiteTheme);
        });
    });
})();

/* ================================================
   1. REFERRAL CODE DETECTION (?ref= in URL)
   ================================================ */
function initReferralDetection() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
        window._autoRefCode = refCode;
        const refSection = document.getElementById('refSection');
        const refCodeEl = document.getElementById('refCode');
        if (refSection) refSection.style.display = 'block';
        if (refCodeEl) refCodeEl.textContent = refCode;
    }
}
function copyRefCode() {
    const codeEl = document.getElementById('refCode');
    const statusEl = document.getElementById('copyStatus');
    if (!codeEl) return;
    const code = codeEl.textContent;
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    try {
        textarea.select();
        document.execCommand('copy');
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Copied!';
            setTimeout(() => { statusEl.innerHTML = ''; }, 3000);
        }
    } catch (err) {
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-times-circle"></i> Copy failed. Please copy manually.';
    }
    document.body.removeChild(textarea);
}
document.addEventListener('DOMContentLoaded', initReferralDetection);

/* ================================================
   2. QR / PURCHASE MODAL — Google Form auto-submit + WhatsApp
   ================================================ */
const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSccpAdkty6BM2pfGCueWiNVaK6TmhUXzhReFiQB8GsbZ_cDmw/formResponse';
const ENTRY_NAME = 'entry.420184449';
const ENTRY_MOBILE = 'entry.92219779';
const ENTRY_EMAIL = 'entry.241056737';
const ENTRY_DISTRICT = 'entry.885222640';
const ENTRY_PLAN = 'entry.911084064';
const ENTRY_REF = 'entry.625804941';
const ENTRY_UTR = 'entry.1377540696';
const ENTRY_DEVICE_ID = 'entry.353922635';

function openQR(amount, plan) {
    const qrModal = document.getElementById('qrModal');
    if (!qrModal) return;
    const planLabel = document.getElementById('qrPlanLabel');
    if (planLabel) planLabel.textContent = plan + ' — ₹' + Number(amount).toLocaleString('en-IN');
    const qrImg = document.getElementById('qrImage');
    if (qrImg) qrImg.src = 'assets/qr/' + amount + '.PNG';
    qrModal.dataset.plan = plan;
    qrModal.dataset.amount = amount;
    ['buyerName', 'buyerMobile', 'buyerEmail', 'buyerDistrict', 'buyerUTR', 'buyerDeviceId'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const refInput = document.getElementById('buyerRef');
    if (refInput) {
        refInput.value = window._autoRefCode || '';
        if (window._autoRefCode) {
            refInput.style.border = '1px solid rgba(16,185,129,0.6)';
            refInput.style.background = 'rgba(16,185,129,0.08)';
        } else {
            refInput.style.border = '1px solid rgba(255,255,255,0.12)';
            refInput.style.background = 'rgba(255,255,255,0.06)';
        }
    }
    const isTrial = plan.toLowerCase().includes('trial');
    const devReq = document.getElementById('deviceIdRequired');
    const devOpt = document.getElementById('deviceIdOptionalTag');
    if (devReq) devReq.style.display = isTrial ? 'inline' : 'none';
    if (devOpt) devOpt.style.display = isTrial ? 'none' : 'inline';
    const errEl = document.getElementById('qrFormError');
    if (errEl) errEl.style.display = 'none';

    goToStep1Silent();

    qrModal.scrollTop = 0;
    qrModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function goToStep1Silent() {
    const s1 = document.getElementById('qrStep1');
    const s2 = document.getElementById('qrStep2');
    const line = document.getElementById('stepProgressLine');
    const circle2 = document.getElementById('stepCircle2');
    const dot2 = document.getElementById('stepDot2');
    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';
    if (line) line.style.width = '0%';
    if (circle2) { circle2.style.background = 'rgba(255,255,255,0.1)'; circle2.style.color = 'var(--muted)'; }
    if (dot2) dot2.style.opacity = '0.45';
}

function goToStep2() {
    const s1 = document.getElementById('qrStep1');
    const s2 = document.getElementById('qrStep2');
    const line = document.getElementById('stepProgressLine');
    const circle2 = document.getElementById('stepCircle2');
    const dot2 = document.getElementById('stepDot2');
    if (s1) s1.style.display = 'none';
    if (s2) s2.style.display = 'block';
    if (line) line.style.width = '100%';
    if (circle2) { circle2.style.background = 'var(--accent2)'; circle2.style.color = '#06121c'; }
    if (dot2) dot2.style.opacity = '1';
    const modalInner = document.querySelector('#qrModal > div');
    if (modalInner) modalInner.scrollTop = 0;
}

function backToStep1() { goToStep1Silent(); }

function closeQR() {
    const qrModal = document.getElementById('qrModal');
    if (qrModal) qrModal.style.display = 'none';
    document.body.style.overflow = '';
}

function clearPurchaseForm() {
    ['buyerName', 'buyerMobile', 'buyerEmail', 'buyerDistrict', 'buyerUTR', 'buyerDeviceId', 'buyerRef'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const refInput = document.getElementById('buyerRef');
    if (refInput) {
        refInput.style.border = '1px solid rgba(255,255,255,0.12)';
        refInput.style.background = 'rgba(255,255,255,0.06)';
    }
    const errEl = document.getElementById('qrFormError');
    if (errEl) errEl.style.display = 'none';
}

function closeConfirm() {
    const confirmModal = document.getElementById('confirmModal');
    const qrModal = document.getElementById('qrModal');
    if (confirmModal) confirmModal.style.display = 'none';
    if (qrModal) qrModal.style.display = 'none';
    document.body.style.overflow = '';
    clearPurchaseForm();
}

let _pendingWhatsAppMsg = '';

async function submitOrder() {
    const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const name = get('buyerName');
    const mobile = get('buyerMobile');
    const email = get('buyerEmail');
    const district = get('buyerDistrict');
    const utr = get('buyerUTR');
    const ref = get('buyerRef') || 'N/A';
    const deviceId = get('buyerDeviceId');
    const qrModal = document.getElementById('qrModal');
    const plan = qrModal ? qrModal.dataset.plan : '';
    const amount = qrModal ? qrModal.dataset.amount : '0';
    const errorEl = document.getElementById('qrFormError');
    const isTrial = (plan || '').toLowerCase().includes('trial');

    if (!name || !mobile || !email || !district || !utr) {
        if (errorEl) {
            errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill all required fields before sending.';
            errorEl.style.display = 'block';
        }
        return;
    }
    if (!/^\d{12}$/.test(utr)) {
        if (errorEl) {
            errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> UTR Number must be exactly 12 digits.';
            errorEl.style.display = 'block';
        }
        return;
    }
    if (isTrial && !deviceId) {
        if (errorEl) {
            errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Device ID is required for Trial plan. Go to: Tool Settings → Change Key → Copy ID.';
            errorEl.style.display = 'block';
        }
        return;
    }
    if (errorEl) errorEl.style.display = 'none';

    try {
        const params = new URLSearchParams();
        params.append(ENTRY_NAME, name);
        params.append(ENTRY_MOBILE, mobile);
        params.append(ENTRY_EMAIL, email);
        params.append(ENTRY_DISTRICT, district);
        params.append(ENTRY_PLAN, plan + ' — ₹' + Number(amount).toLocaleString('en-IN'));
        params.append(ENTRY_UTR, utr);
        params.append(ENTRY_REF, ref);
        if (deviceId) params.append(ENTRY_DEVICE_ID, deviceId);
        await fetch(FORM_ACTION, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
    } catch (e) { /* no-cors always throws — submission still goes through */ }

    _pendingWhatsAppMsg =
        `Hi, I have completed payment for Civil Sahayak Tool license.\n\n🧾 *Purchase Details*\n- Plan       : ${plan} (₹${Number(amount).toLocaleString('en-IN')})\n- Name       : ${name}\n- Mobile     : ${mobile}\n- Email      : ${email}\n- District   : ${district}\n- UTR No.    : ${utr}\n- Ref Code   : ${ref}${deviceId ? '\n- Device ID  : ' + deviceId : ''}`;

    const summaryEl = document.getElementById('confirmSummary');
    if (summaryEl) {
        summaryEl.innerHTML =
            `<strong style="color:var(--accent2)">Plan:</strong> ${plan} — ₹${Number(amount).toLocaleString('en-IN')}<br>
         <strong style="color:var(--accent2)">Name:</strong> ${name}<br>
         <strong style="color:var(--accent2)">Mobile:</strong> ${mobile}<br>
         <strong style="color:var(--accent2)">Email:</strong> ${email}<br>
         <strong style="color:var(--accent2)">District:</strong> ${district}<br>
         <strong style="color:var(--accent2)">UTR No.:</strong> ${utr}<br>
         <strong style="color:var(--accent2)">Ref Code:</strong> ${ref}` +
            (deviceId ? `<br><strong style="color:var(--accent2)">Device ID:</strong> ${deviceId}` : '');
    }

    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) confirmModal.style.display = 'flex';
}

function sendWhatsAppFromConfirm() {
    if (_pendingWhatsAppMsg) {
        window.open('https://wa.me/919728532828?text=' + encodeURIComponent(_pendingWhatsAppMsg), '_blank');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.addEventListener('click', function (e) {
            const confirmModal = document.getElementById('confirmModal');
            if (e.target === this && (!confirmModal || confirmModal.style.display === 'none')) closeQR();
        });
    }
});

/* ================================================
   3. CUSTOM CURSOR
   ================================================ */
(function cursorInit() {
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!cursorDot || !cursorRing || isTouch) {
        if (cursorDot) cursorDot.style.display = 'none';
        if (cursorRing) cursorRing.style.display = 'none';
        return;
    }
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
        spawnParticle(mouseX, mouseY);
    });

    function animateCursorRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
        requestAnimationFrame(animateCursorRing);
    }
    animateCursorRing();

    document.querySelectorAll('a, button, .cta, .feature, .panel, .stat, .nav-btn').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorRing.style.width = '50px';
            cursorRing.style.height = '50px';
            cursorRing.style.borderColor = 'rgba(124, 58, 237, 0.8)';
            cursorDot.style.background = 'var(--accent1)';
        });
        el.addEventListener('mouseleave', () => {
            cursorRing.style.width = '32px';
            cursorRing.style.height = '32px';
            cursorRing.style.borderColor = 'rgba(6, 182, 212, 0.6)';
            cursorDot.style.background = 'var(--accent2)';
        });
    });
})();

/* ================================================
   4. PARTICLE TRAIL on cursor
   ================================================ */
let lastParticleTime = 0;
function spawnParticle(x, y) {
    const now = Date.now();
    if (now - lastParticleTime < 40) return;
    lastParticleTime = now;
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 3;
    const colors = ['#7c3aed', '#06b6d4', '#f97316', '#f43f5e', '#10b981'];
    p.style.cssText = `
        left: ${x}px; top: ${y}px;
        width: ${size}px; height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        --tx: ${(Math.random() - 0.5) * 40}px;
        --ty: ${(Math.random() - 0.5) * 40 - 20}px;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
}

/* ================================================
   5. THREE.JS — Animated 3D Particle Mesh Background
   ================================================ */
(function initThreeJS() {
    const canvas = document.getElementById('threejs-canvas');
    const isMobile = window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(pointer: coarse)').matches;
    if (!canvas || typeof THREE === 'undefined' || isMobile) {
        if (canvas) canvas.style.display = 'none';
        return;
    }
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorPalette = [
        new THREE.Color(0x7c3aed),
        new THREE.Color(0x06b6d4),
        new THREE.Color(0xf97316),
        new THREE.Color(0x10b981),
    ];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        sizes[i] = Math.random() * 2 + 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
        size: 0.035, vertexColors: true,
        transparent: true, opacity: 0.7,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = [];
    const lineColors = [];
    const lineCount = 150;
    for (let i = 0; i < lineCount; i++) {
        const x1 = (Math.random() - 0.5) * 14, y1 = (Math.random() - 0.5) * 14, z1 = (Math.random() - 0.5) * 10;
        const x2 = x1 + (Math.random() - 0.5) * 3, y2 = y1 + (Math.random() - 0.5) * 3, z2 = z1;
        linePositions.push(x1, y1, z1, x2, y2, z2);
        lineColors.push(0.48, 0.23, 0.93, 0.023, 0.71, 0.83);
    }
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lineColors), 3));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.15 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Store reference and control visibility based on theme, added from here to hide in light mode
    window._threeLines = lines;

    function updateLineVisibility() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (window._threeLines) {
            window._threeLines.visible = (theme !== 'light');
        }
    }
    updateLineVisibility();

    // Watch for theme changes
    const themeObserver = new MutationObserver(() => {
        updateLineVisibility();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    // added till here to hide in light mode

    let targetRotX = 0, targetRotY = 0;
    document.addEventListener('mousemove', (e) => {
        targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.5;
        targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.3;
    });

    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    function animate() {
        requestAnimationFrame(animate);
        const t = Date.now() * 0.0003;

        particles.rotation.y += (targetRotY - particles.rotation.y) * 0.04;
        particles.rotation.x += (targetRotX - particles.rotation.x) * 0.04;
        particles.rotation.z += 0.0006;

        lines.rotation.y = particles.rotation.y;
        lines.rotation.x = particles.rotation.x;
        lines.rotation.z = particles.rotation.z;

        camera.position.y = -scrollY * 0.0006;

        mat.size = 0.035 + Math.sin(t * 2) * 0.008;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

/* ================================================
   6. SCROLL PROGRESS BAR
   ================================================ */
(function () {
    const scrollBar = document.getElementById('scroll-progress');
    if (!scrollBar) return;
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        scrollBar.style.width = scrolled + '%';
    });
})();

/* ================================================
   7. SCROLL-TO-TOP BUTTON
   ================================================ */
(function () {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (!scrollTopBtn) return;
    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

/* ================================================
   8. 3D CARD TILT on feature/panel cards
   ================================================ */
(function initCardTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.feature, .stat, .testimonial').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            card.style.transform = `perspective(600px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) translateY(-8px) scale(1.02)`;
            card.style.boxShadow = `${-dx * 15}px ${-dy * 15}px 40px rgba(124,58,237,0.15)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
            card.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    });
})();

/* ================================================
   9. MAGNETIC BUTTONS
   ================================================ */
(function () {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.cta.primary, .nav-btn.primary').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) * 0.25;
            const dy = (e.clientY - cy) * 0.25;
            btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    });
})();

/* ================================================
   10. INTERSECTION OBSERVER — staggered reveal
   ================================================ */
(function () {
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.fadeInUp, .fadeInLeft, .fadeInRight').forEach((el, i) => {
        const siblingIndex = Array.from(el.parentElement.children).indexOf(el);
        el.style.setProperty('--reveal-delay', Math.min(siblingIndex * 0.08, 0.5) + 's');
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
            el.classList.remove('fadeInUp', 'fadeInLeft', 'fadeInRight');
        } else {
            revealObserver.observe(el);
        }
    });
})();

/* ================================================
   11. ANIMATED STAT NUMBERS
   ================================================ */
function animateNumber(element, start, end, duration, suffix) {
    const range = end - start;
    const startTime = performance.now();
    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        element.textContent = Math.floor(start + range * eased) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
(function () {
    const stats = document.querySelectorAll('.stat');
    if (!stats.length) return;
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                if (!statNumber) return;
                const targetText = statNumber.textContent;
                if (targetText.includes('%')) {
                    animateNumber(statNumber, 0, parseInt(targetText), 1800, '%');
                } else if (targetText.includes('+')) {
                    animateNumber(statNumber, 0, parseInt(targetText), 1800, '+');
                }
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });
    stats.forEach(s => statsObserver.observe(s));
})();

/* ================================================
   12. STICKY HEADER SCROLL
   ================================================ */
(function () {
    const header = document.querySelector('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
})();

/* ================================================
   13. CONTACT MODAL
   ================================================ */
(function () {
    const contactBtn = document.getElementById('contactBtn');
    const contactModal = document.getElementById('contactModal');
    const emailBtn = document.getElementById('emailBtn');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const floatingSocial = document.querySelector('.floating-social');
    if (!contactBtn || !contactModal) return;
    contactBtn.addEventListener('click', e => {
        e.stopPropagation();
        contactModal.classList.toggle('active');
        if (floatingSocial) floatingSocial.classList.toggle('is-hidden', contactModal.classList.contains('active'));
    });
    document.addEventListener('click', () => {
        contactModal.classList.remove('active');
        if (floatingSocial) floatingSocial.classList.remove('is-hidden');
    });
    contactModal.addEventListener('click', e => e.stopPropagation());
    if (emailBtn) emailBtn.addEventListener('click', () => {
        window.location.href = 'mailto:civilSahayak@gmail.com?subject=HEWP%20Excel%20Addins%20Support&body=Hello%20MRGARGSIR%20Team,%0D%0A%0D%0AI%20need%20help%20with...';
    });
    if (whatsappBtn) whatsappBtn.addEventListener('click', () => {
        window.open('https://wa.me/919728532828?text=' + encodeURIComponent("Hello MRGARGSIR Team, I need help with Civil Sahayak Tool."), '_blank');
    });
})();

/* ================================================
   14. DOCUMENTS MODAL
   ================================================ */
(function () {
    const documentsBtn = document.getElementById('documentsBtn');
    const documentsModal = document.getElementById('documentsModal');
    const closeDocumentsModal = document.getElementById('closeDocumentsModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const floatingSocial = document.querySelector('.floating-social');
    if (!documentsBtn || !documentsModal) return;
    documentsBtn.addEventListener('click', e => {
        e.stopPropagation();
        documentsModal.classList.add('active');
        if (modalBackdrop) modalBackdrop.classList.add('active');
        if (floatingSocial) floatingSocial.classList.add('is-hidden');
    });
    if (closeDocumentsModal) closeDocumentsModal.addEventListener('click', () => {
        documentsModal.classList.remove('active');
        if (modalBackdrop) modalBackdrop.classList.remove('active');
        if (floatingSocial) floatingSocial.classList.remove('is-hidden');
    });
    if (modalBackdrop) modalBackdrop.addEventListener('click', () => {
        documentsModal.classList.remove('active');
        modalBackdrop.classList.remove('active');
        if (floatingSocial) floatingSocial.classList.remove('is-hidden');
    });
})();

/* ================================================
   15. NAV "EXTENSIONS" DROPDOWN
   ================================================ */
(function () {
    document.querySelectorAll('.nav-dropdown').forEach(dd => {
        const trigger = dd.querySelector('.nav-dropdown-trigger');
        if (!trigger) return;
        trigger.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = dd.classList.contains('open');
            document.querySelectorAll('.nav-dropdown.open').forEach(o => o.classList.remove('open'));
            if (!isOpen) dd.classList.add('open');
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.nav-dropdown.open').forEach(o => o.classList.remove('open'));
    });
})();

/* ================================================
   16. ACCORDION (feature breakdown)
   ================================================ */
(function () {
    document.querySelectorAll('.item button').forEach(btn => {
        btn.addEventListener('click', function () {
            const item = this.parentElement;
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.item').forEach(i => i.classList.remove('active'));
            if (!wasActive) item.classList.add('active');
        });
    });
})();

/* ================================================
   17. FAQ
   ================================================ */
(function () {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', function () {
            const faqItem = this.parentElement;
            const wasActive = faqItem.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!wasActive) faqItem.classList.add('active');
        });
    });
})();

/* ================================================
   18. CAROUSEL
   ================================================ */
(function () {
    const slidesEl = document.querySelector('#carousel .slides');
    const dotsEl = document.getElementById('dots');
    if (!slidesEl || !dotsEl) return;
    const total = slidesEl.children.length;
    let idx = 0;
    let autoInterval;
    for (let i = 0; i < total; i++) {
        const d = document.createElement('div');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => { idx = i; update(); resetAuto(); });
        dotsEl.appendChild(d);
    }
    function update() {
        slidesEl.style.transform = `translateX(-${idx * 100}%)`;
        Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle('active', i === idx));
    }
    function startAuto() { autoInterval = setInterval(() => { idx = (idx + 1) % total; update(); }, 4000); }
    function resetAuto() { clearInterval(autoInterval); startAuto(); }
    startAuto();
    const car = document.getElementById('carousel');
    if (car) {
        car.addEventListener('mouseenter', () => clearInterval(autoInterval));
        car.addEventListener('mouseleave', startAuto);
    }
})();

/* ================================================
   19. SMOOTH SCROLL for in-page anchor links
   ================================================ */
(function () {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const header = document.querySelector('header');
                    const headerHeight = header ? header.offsetHeight : 0;
                    window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20, behavior: 'smooth' });
                }
            }
        });
    });
})();

/* ================================================
   20. DOWNLOAD FUNCTIONALITY (download.html)
   ================================================ */
const primaryURL = 'https://github.com/mrgargsir/HEWP-Excel-Addins/releases/download/latest/OnlineInstaller.exe';
const standaloneURL = 'https://github.com/mrgargsir/HEWP-Releases/releases/latest/download/Installer.exe';
const fallbackURL = 'https://www.dropbox.com/scl/fi/im5wrvw2rbooke9hzf2tp/Installer.exe?rlkey=1gdochm746czv53n38uvfne7l&st=106xolzv&dl=1';
const secondfallbackURL = 'https://drive.google.com/drive/folders/1piwXbr2Df7CESRsw6ezKuDv_VIoQq7il?usp=sharing';
let secondURL;
function startDownload(button) {
    const status = document.getElementById('dlStatus');
    button = button || document.getElementById('downloadBtnTop') || document.getElementById('downloadBtnStandalone');
    if (!button) return;
    let downloadURL, installerName;
    if (button.id === 'downloadBtnStandalone') {
        downloadURL = standaloneURL; secondURL = fallbackURL; installerName = 'CivilSahayak_Installer.exe';
    } else {
        downloadURL = primaryURL; secondURL = fallbackURL; installerName = 'CivilSahayak_OnlineInstaller.exe';
    }
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing download...';
    const a = document.createElement('a');
    a.href = downloadURL; a.download = installerName; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => {
        if (status) {
            status.style.display = 'block';
            status.style.background = 'rgba(16,185,129,0.06)';
            status.style.border = '1px solid rgba(16,185,129,0.12)';
            status.style.color = '#b7f3df';
            status.innerHTML = `<strong>Download started.</strong> If something went wrong, <a href="${secondURL}" style="color:#fbcfe8;text-decoration:underline" target="_blank" rel="noreferrer">Click here to Download the Other Installer</a>. <a href="${secondfallbackURL}" style="color:#fbcfe8;text-decoration:underline" target="_blank" rel="noreferrer">Or use Google Drive</a>.`;
        }
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-download"></i> Download Again';
    }, 2200);
}
function DownloadedgeExtension() { window.open('https://microsoftedge.microsoft.com/addons/detail/hewp-extension-tool-%E2%80%93-thi/gahgpjihjlnfaepifeipedfdnnfhlghn', '_blank'); }
document.addEventListener('DOMContentLoaded', () => {
    const dlTop = document.getElementById('downloadBtnTop');
    const dlStand = document.getElementById('downloadBtnStandalone');
    const edgeBtn = document.getElementById('edgeExtensionBtn');
    if (dlTop) dlTop.addEventListener('click', function () { startDownload(this); });
    if (dlStand) dlStand.addEventListener('click', function () { startDownload(this); });
    if (edgeBtn) edgeBtn.addEventListener('click', function () { DownloadedgeExtension(); });
});

function startDownloadAndRedirect(e) {
    e.preventDefault();
    window.open(primaryURL, '_blank');
    window.location.href = 'tool/download.html';
}

/* ================================================
   21. VIDEO CARDS (tutorials.html)
   ================================================ */
document.addEventListener('DOMContentLoaded', function () {
    const videoCards = document.querySelectorAll('.video-card');
    if (!videoCards.length) return;
    const videoIframe = document.querySelector('.video-container iframe');
    videoCards.forEach(card => {
        card.addEventListener('click', function () {
            const videoId = this.getAttribute('data-video-id');
            if (videoId && videoIframe) {
                videoIframe.src = `https://www.youtube.com/embed/${videoId}`;
                const vc = document.querySelector('.video-container');
                if (vc) vc.scrollIntoView({ behavior: 'smooth', block: 'center' });
                videoCards.forEach(c => c.style.opacity = '0.7');
                this.style.opacity = '1';
                setTimeout(() => videoCards.forEach(c => c.style.opacity = '1'), 300);
            }
        });
    });
});

/* ================================================
   22. FULLSCREEN VIDEO SCROLL FIX
   ================================================ */
(function () {
    const vc = document.querySelector('.video-container');
    if (!vc) return;
    let vPos = null;
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
        document.addEventListener(ev, () => {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                vPos = vc.getBoundingClientRect().top + window.scrollY;
            } else if (vPos !== null) {
                setTimeout(() => { window.scrollTo({ top: vPos - 100, behavior: 'smooth' }); vPos = null; }, 100);
            }
        });
    });
})();

/* ================================================
   23. WEATHER EFFECTS (seasonal) — only runs if a
   #weather-effects container is present on the page
   ================================================ */
function initWeatherEffects() {
    const effectsContainer = document.getElementById('weather-effects');
    if (!effectsContainer) return; // feature disabled unless the container exists
    const weatherInfo = document.getElementById('weather-info');
    const defaultEffect = getSeasonalEffect();
    if (weatherInfo) {
        weatherInfo.style.display = 'flex';
        weatherInfo.innerHTML = `<i class="${defaultEffect.icon}"></i> <span>${defaultEffect.name} Mode</span>`;
    }
    applyWeatherEffect(defaultEffect);

    function getSeasonalEffect() {
        const m = new Date().getMonth();
        if (m >= 11 || m <= 1) return { type: 'snow', name: 'Winter Snow', icon: 'fas fa-snowflake', intensity: 'light' };
        if (m >= 2 && m <= 4) return { type: 'rain', name: 'Spring Showers', icon: 'fas fa-cloud-rain', intensity: 'light' };
        if (m >= 5 && m <= 8) return { type: 'sun', name: 'Summer Sun', icon: 'fas fa-sun', intensity: 'medium' };
        return { type: 'clouds', name: 'Autumn Breeze', icon: 'fas fa-wind', intensity: 'light' };
    }

    function applyWeatherEffect(effect) {
        effectsContainer.innerHTML = '';
        if (effect.type === 'snow') createSnowEffect(effect.intensity);
        else if (effect.type === 'rain') createRainEffect(effect.intensity);
        else if (effect.type === 'sun') createSunEffect();
        else createCloudEffect();
    }

    function createSnowEffect(intensity) {
        const count = intensity === 'heavy' ? 80 : 40;
        if (!document.getElementById('snow-styles')) {
            const s = document.createElement('style');
            s.id = 'snow-styles';
            s.textContent = `@keyframes snowFall { 0%{transform:translateY(-10px) translateX(0) rotate(0deg);opacity:0} 10%{opacity:1} 90%{opacity:0.8} 100%{transform:translateY(calc(100vh + 20px)) translateX(30px) rotate(360deg);opacity:0} } @keyframes snowSway { 0%,100%{margin-left:0} 50%{margin-left:15px} }`;
            document.head.appendChild(s);
        }
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            const size = Math.random() * 5 + 3;
            el.style.cssText = `position:fixed;width:${size}px;height:${size}px;background:rgba(255,255,255,0.9);border-radius:50%;pointer-events:none;z-index:9999;left:${Math.random() * 100}%;top:-10px;box-shadow:0 0 6px rgba(255,255,255,0.8);opacity:${Math.random() * 0.6 + 0.2};animation:snowFall ${Math.random() * 8 + 5}s linear ${Math.random() * 5}s infinite,snowSway ${Math.random() * 12 + 8}s ease-in-out ${Math.random() * 5}s infinite`;
            effectsContainer.appendChild(el);
        }
    }

    function createRainEffect(intensity) {
        const count = intensity === 'heavy' ? 150 : 80;
        const s = document.createElement('style');
        s.textContent = '@keyframes rainFall { to { transform: translateY(100vh); } }';
        document.head.appendChild(s);
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            const h = Math.random() * 10 + 8;
            el.style.cssText = `position:fixed;width:1.5px;height:${h}px;background:linear-gradient(to bottom,transparent,rgba(150,200,255,0.5));pointer-events:none;z-index:9999;left:${Math.random() * 100}vw;top:-20px;opacity:${Math.random() * 0.5 + 0.2};animation:rainFall ${Math.random() * 0.8 + 0.4}s linear ${Math.random() * 2}s infinite`;
            effectsContainer.appendChild(el);
        }
    }

    function createSunEffect() {
        const sun = document.createElement('div');
        sun.style.cssText = 'position:fixed;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(255,220,100,0.9),rgba(255,160,40,0));top:8%;left:20%;transform:translate(-50%,-50%);pointer-events:none;z-index:1;box-shadow:0 0 60px rgba(255,200,80,0.5),0 0 120px rgba(255,180,60,0.3);animation:sunPulse 4s ease-in-out infinite';
        const s = document.createElement('style');
        s.textContent = '@keyframes sunPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.9}50%{transform:translate(-50%,-50%) scale(1.1);opacity:1}}';
        document.head.appendChild(s);
        effectsContainer.appendChild(sun);
    }

    function createCloudEffect() {
        const s = document.createElement('style');
        s.textContent = '@keyframes cloudDrift{0%{transform:translateX(-200px)}100%{transform:translateX(calc(100vw + 200px))}}';
        document.head.appendChild(s);
        for (let i = 0; i < 5; i++) {
            const el = document.createElement('div');
            const w = Math.random() * 120 + 60;
            el.style.cssText = `position:fixed;width:${w}px;height:${w * 0.4}px;background:radial-gradient(ellipse,rgba(255,255,255,0.04),transparent);border-radius:50%;pointer-events:none;z-index:1;top:${Math.random() * 30 + 5}%;left:-200px;filter:blur(20px);animation:cloudDrift ${Math.random() * 40 + 30}s linear ${Math.random() * -40}s infinite`;
            effectsContainer.appendChild(el);
        }
    }
}
initWeatherEffects();

/* ================================================
   24. PLAN SWITCHER (purchase.html)
   ================================================ */
function switchPlan(plan) {
    const reg = document.getElementById('plan-regular');
    const prem = document.getElementById('plan-premium');
    if (!reg || !prem) return;
    reg.style.display = 'none';
    prem.style.display = 'none';
    document.getElementById('plan-' + plan).style.display = 'flex';
    ['regular', 'premium'].forEach(p => {
        const tab = document.getElementById('tab-' + p);
        if (!tab) return;
        tab.style.opacity = p === plan ? '1' : '0.5';
        tab.style.transform = p === plan ? 'scale(1.06)' : 'scale(1)';
    });
}
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('plan-premium')) switchPlan('premium');
});

/* ================================================
   25. FAQ "Show More" TOGGLE
   ================================================ */
function toggleFaq() {
    const moreItems = document.getElementById('faqMoreItems');
    const btn = document.getElementById('faqToggleBtn');
    const icon = document.getElementById('faqToggleIcon');
    if (!moreItems || !btn) return;
    const isHidden = moreItems.style.display === 'none' || !moreItems.style.display;
    moreItems.style.display = isHidden ? 'block' : 'none';
    if (icon) icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    btn.innerHTML = isHidden ? '<i class="fas fa-chevron-up"></i> Show Less' : '<i class="fas fa-chevron-down"></i> Show More Questions';
}

/* ================================================
   26. GLOWING SECTION ENTRANCE
   ================================================ */
(function () {
    const glowObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'box-shadow 0.6s ease';
                entry.target.style.boxShadow = '0 0 30px rgba(124,58,237,0.1)';
                setTimeout(() => { entry.target.style.boxShadow = ''; }, 1200);
            }
        });
    }, { threshold: 0.2 });
    document.querySelectorAll('section').forEach(s => glowObserver.observe(s));
})();

/* ================================================
   27. RIPPLE EFFECT on button clicks
   ================================================ */
(function () {
    document.querySelectorAll('.cta, .nav-btn, button').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position:absolute;
                border-radius:50%;
                background:rgba(255,255,255,0.2);
                width:10px;height:10px;
                left:${e.clientX - rect.left - 5}px;
                top:${e.clientY - rect.top - 5}px;
                animation:rippleAnim 0.6s ease-out forwards;
                pointer-events:none;z-index:999;
            `;
            if (!document.getElementById('ripple-style')) {
                const rs = document.createElement('style');
                rs.id = 'ripple-style';
                rs.textContent = '@keyframes rippleAnim{0%{transform:scale(0);opacity:0.8}100%{transform:scale(30);opacity:0}}';
                document.head.appendChild(rs);
            }
            const pos = getComputedStyle(this).position;
            if (pos !== 'relative' && pos !== 'absolute' && pos !== 'fixed') this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
})();

/* ================================================
   28. IN-PAGE TAB ACTIVE STATE (tutorials.html .page-tab)
   ================================================ */
(function () {
    const tabs = document.querySelectorAll('.page-tab');
    if (!tabs.length) return;
    const sections = Array.from(tabs).map(t => t.getAttribute('href').replace('#', ''));
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el && window.scrollY >= el.offsetTop - 100) current = id;
        });
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('href') === '#' + current);
        });
    });
})();


// ================================================
// CALL REQUEST MODAL
// ================================================
function openCallModal() {
    const modal = document.getElementById('callModal');
    if (!modal) return;
    const input = document.getElementById('callMobile');
    if (input) input.value = '';
    const error = document.getElementById('callError');
    if (error) error.style.display = 'none';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCallModal() {
    const modal = document.getElementById('callModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function submitCallRequest() {
    const input = document.getElementById('callMobile');
    const error = document.getElementById('callError');
    if (!input || !error) return;
    const mobile = input.value.trim();
    if (!/^\d{10}$/.test(mobile)) {
        error.style.display = 'block';
        return;
    }
    error.style.display = 'none';

    // Prepare data for Google Form
    const name = 'Call Request';
    const plan = 'Demo';
    const email = '';
    const district = 'N/A';
    const utr = 'N/A';
    const ref = 'N/A';
    const deviceId = 'N/A';

    const params = new URLSearchParams();
    params.append(ENTRY_NAME, name);
    params.append(ENTRY_MOBILE, mobile);
    params.append(ENTRY_EMAIL, email);
    params.append(ENTRY_DISTRICT, district);
    params.append(ENTRY_PLAN, plan);
    params.append(ENTRY_UTR, utr);
    params.append(ENTRY_REF, ref);
    if (deviceId) params.append(ENTRY_DEVICE_ID, deviceId);

    // Send to Google Form (no-cors)
    fetch(FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    }).catch(() => { }); // no-cors always throws

    // Show success message (replace modal content)
    const modal = document.getElementById('callModal');
    if (modal) {
        modal.querySelector('.modal-content')?.remove(); // fallback
        const container = modal.querySelector('div > div:first-child');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center;padding:20px 0;">
                    <div style="font-size:50px;margin-bottom:12px;">✅</div>
                    <div style="font-size:18px;font-weight:800;color:#10b981;">Request Sent!</div>
                    <div style="font-size:13px;color:var(--muted);margin-top:8px;">We'll call you at <strong>${mobile}</strong> within 24 hours.</div>
                    <button onclick="closeCallModal()" 
                            style="margin-top:20px;background:var(--gradient-main);color:white;padding:10px 24px;border-radius:8px;border:none;font-weight:700;cursor:pointer;">
                        Close
                    </button>
                </div>
            `;
        }
    }
}

// Attach event listener to the "Get a Call from us" button
document.addEventListener('DOMContentLoaded', function () {
    const callBtn = document.getElementById('callRequestBtn');
    if (callBtn) {
        callBtn.addEventListener('click', openCallModal);
    }
});

// ================================================
// TOGGLE CHROME STORE MESSAGE (show/hide on click)
// ================================================
function toggleChromeMessage(btn) {
    const wrapper = btn.closest('.chrome-wrapper');
    if (!wrapper) return;
    const msg = wrapper.querySelector('.chrome-message');
    if (msg) {
        // Hide all other messages first
        document.querySelectorAll('.chrome-message.active').forEach(el => {
            if (el !== msg) el.classList.remove('active');
        });
        // Toggle this one
        msg.classList.toggle('active');
    }
}

// Auto-close when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.chrome-wrapper')) {
        document.querySelectorAll('.chrome-message.active').forEach(el => el.classList.remove('active'));
    }
});

// ================================================
// 👆 GLOBAL TICKER — Inside header, with dynamic padding
// ================================================
(function injectTicker() {
    if (document.querySelector('.ticker-bar-global')) {
        // If already injected, just ensure padding is correct
        updateBodyPadding();
        return;
    }

    const header = document.querySelector('header');
    if (!header) return;

    const tickerHTML = `
        <div class="ticker-bar ticker-bar-global" style="flex-basis:100%; order:2; width:100%;">
            <div class="ticker-wrap">
                <div class="ticker-track">
                    <span class="ticker-item">🚀 Civil Sahayak Tool • BOQ • Estimate • Variation • MB</span>
                    <span class="ticker-item">⚡ Auto Upload to HEWP Portal — One Click</span>
                    <span class="ticker-item">🔥 Save 90% Time • Zero Errors • Professional Output</span>
                    <span class="ticker-item">📊 Material Consumption • Steel Summary • Abstract Bill</span>
                    <span class="ticker-item">🔄 Bill Compare • Variation Table • PDF Import</span>
                    <span class="ticker-item">📥 Import Estimates/Bills/Variations from Portal to Excel</span>
                    <span class="ticker-item">🎯 Built for Engineers, JEs & Contractors</span>
                    <span class="ticker-item">🔥 Features added: Add and Upload all Components Automatically, Aba Jba Format.. </span>
                </div>
            </div>
        </div>
    `;

    header.insertAdjacentHTML('beforeend', tickerHTML);

    // After insertion, update body padding to match header height
    updateBodyPadding();

    // Also update on resize (e.g. mobile orientation change)
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateBodyPadding, 100);
    });
})();

function updateBodyPadding() {
    const header = document.querySelector('header');
    if (header) {
        const headerHeight = header.offsetHeight;
        document.body.style.paddingTop = headerHeight + 'px';
    }
}

