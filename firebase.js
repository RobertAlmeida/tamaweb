/**
 * firebase.js – Módulo de persistência Firebase
 * ════════════════════════════════════════════════
 *
 * INSTRUÇÕES DE SETUP DO FIREBASE
 * ─────────────────────────────────
 * 1. Acesse https://console.firebase.google.com/
 * 2. Crie um novo projeto (ex: "tamaweb")
 * 3. Ative o Firestore Database (modo de teste por ora)
 * 4. Ative Authentication → Provedores → E-mail/senha OU Anônimo
 * 5. Em "Configurações do Projeto" → "Seus apps" → adicione um app Web
 * 6. Copie as credenciais e cole na variável FIREBASE_CONFIG abaixo
 * 7. Publique ou sirva o projeto localmente com um servidor HTTP
 *
 * ─────────────────────────────────
 * IMPORTANTE: Sem configuração real do Firebase o jogo funciona
 * normalmente em modo offline (localStorage). Para habilitar a nuvem,
 * preencha as credenciais abaixo.
 */

// ── Credenciais do seu projeto Firebase ──────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDd6SBge4fBBE-TUB6pHNoo5ddtbcNqRZc",
  authDomain: "pedidos-385013.firebaseapp.com",
  projectId: "pedidos-385013",
  storageBucket: "pedidos-385013.appspot.com",
  messagingSenderId: "716994113091",
  appId: "1:716994113091:web:8300c7047dccc367fd2ef6"
};


// ─────────────────────────────────────────────────────────────────

/**
 * FirebaseService
 * Wrapper que isola o restante do app da lib do Firebase.
 * Se não houver Firebase configurado, usa localStorage.
 */
window.FirebaseService = (function () {

  let db = null;
  let auth = null;
  let uid = null;
  let ready = false;

  // Verifica se as credenciais foram preenchidas
  function isConfigured() {
    return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "SUA_API_KEY";
  }

  /**
   * init() – Inicializa Firebase ou entra em modo offline
   * @returns {Promise<boolean>} true se online, false se offline
   */
  async function init() {
    if (!isConfigured()) {
      console.warn("[FirebaseService] Credenciais não configuradas – modo offline ativo.");
      ready = false;
      return false;
    }

    try {
      // Carrega os SDKs dinamicamente (Firebase v9 compat)
      await loadScript("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js");

      firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();

      // Login anônimo
      const cred = await auth.signInAnonymously();
      uid = cred.user.uid;
      ready = true;
      console.log("[FirebaseService] Online. UID:", uid);
      return true;
    } catch (err) {
      console.error("[FirebaseService] Erro ao inicializar:", err);
      ready = false;
      return false;
    }
  }

  /** Salva o estado do pet */
  async function saveState(state) {
    const payload = { ...state, updatedAt: Date.now() };

    // Sempre salva localmente
    localStorage.setItem("tamaweb_state", JSON.stringify(payload));

    if (!ready || !uid) return;
    try {
      await db.collection("pets").doc(uid).set(payload);
    } catch (err) {
      console.error("[FirebaseService] Erro ao salvar:", err);
    }
  }

  /** Carrega o estado do pet */
  async function loadState() {
    // Tenta carregar da nuvem primeiro
    if (ready && uid) {
      try {
        const doc = await db.collection("pets").doc(uid).get();
        if (doc.exists) {
          const data = doc.data();
          // Sincroniza com localStorage
          localStorage.setItem("tamaweb_state", JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.error("[FirebaseService] Erro ao carregar:", err);
      }
    }

    // Fallback: localStorage
    const raw = localStorage.getItem("tamaweb_state");
    return raw ? JSON.parse(raw) : null;
  }

  /** Remove o estado (reset) */
  async function clearState() {
    localStorage.removeItem("tamaweb_state");
    if (ready && uid) {
      try {
        await db.collection("pets").doc(uid).delete();
      } catch (_) { }
    }
  }

  // ── Utilitário: carrega script externo ─────────────────────────
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  return { init, saveState, loadState, clearState, isOnline: () => ready };
})();
