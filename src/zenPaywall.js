/**
 * Zen Paywall — TripZen 課金ゲート（軽量版・買い切り）
 *
 * 無料 N 回 → 上限でペイウォール → Stripe Payment Link で買い切り → Pro解放。
 * Stripe 登録後、PAYMENT_LINK に URL を差すだけで課金が有効化される。
 */

const STORE_KEY = 'zen-paywall-v1';

// ── TripZen の課金設定 ──
const SLUG = 'tripzen';
const FREE_LIMIT = 1; // 無料で旅行プラン作成できる回数（端末ごと）
const APP_TITLE = 'TripZen';
const PRICE = '¥580';
const PRO_FEATURES = ['複数旅行プラン', '家族で共有', 'テンプレート'];
/** Proで見られる結果のチラ見せ（ぼかし表示で損失回避を喚起） */
const TEASER = '【旅行プラン】3泊4日・沖縄: Day1空港→ホテル→国際通り。持ち物リスト18点・予算: …';
/** Stripe Payment Link。登録後にここへ URL を貼る（空のうちは購入ボタンが案内のみ） */
const PAYMENT_LINK = 'https://buy.stripe.com/4gM4gAbaufDvd4Tcoc2ZO07';

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
  catch { return {}; }
}
function state() {
  return loadAll()[SLUG] || { used: 0, pro: false, purchasedAt: null };
}
function setState(s) {
  const all = loadAll();
  all[SLUG] = s;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
}

/** 購入完了の検知（Stripe success URL の ?zen_pro=1&slug=tripzen） */
export function checkPurchaseReturn() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('zen_pro') === '1' && params.get('slug') === SLUG) {
    unlockPro();
    params.delete('zen_pro'); params.delete('slug');
    const clean = window.location.pathname + (params.toString() ? '?' + params : '');
    window.history.replaceState({}, '', clean);
  }
}

export function isPro() { return state().pro === true; }
export function canUse() { return isPro() || state().used < FREE_LIMIT; }
export function remaining() {
  return isPro() ? Infinity : Math.max(0, FREE_LIMIT - state().used);
}
export function recordUse() {
  if (isPro()) return;
  const s = state();
  s.used += 1;
  setState(s);
}
export function unlockPro() {
  setState({ ...state(), pro: true, purchasedAt: new Date().toISOString() });
}

function startCheckout() {
  if (!PAYMENT_LINK) {
    // eslint-disable-next-line no-alert
    alert('決済リンクは準備中です（Stripe 設定後に有効化されます）');
    return;
  }
  const ret = encodeURIComponent(
    window.location.origin + window.location.pathname + `?zen_pro=1&slug=${SLUG}`,
  );
  const url = PAYMENT_LINK + (PAYMENT_LINK.includes('?') ? '&' : '?')
    + `client_reference_id=${SLUG}&redirect=${ret}`;
  window.location.href = url;
}

/** 無料上限到達時のペイウォールモーダルを表示 */
export function showPaywall() {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('zen-paywall-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'zen-paywall-modal';
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:sans-serif';
  const feats = PRO_FEATURES.map((f) => `<li>${f}</li>`).join('');
  overlay.innerHTML =
    `<div style="background:#fff;border-radius:16px;padding:28px 24px;max-width:340px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">`
    + `<div style="font-size:2rem;margin-bottom:8px">💎</div>`
    + `<h2 style="margin:0 0 6px;font-size:1.2rem;color:#111">${APP_TITLE} Pro</h2>`
    + `<p style="margin:0 0 14px;font-size:.85rem;color:#666">無料分を使い切りました。Proで全機能が使えます。</p>`
    + `<ul style="text-align:left;font-size:.82rem;color:#444;margin:0 0 16px;padding-left:18px">${feats}</ul>`
    + `<button id="zen-paywall-buy" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:700;font-size:.95rem;cursor:pointer">${PRICE} でProを購入（買い切り）</button>`
    + `<button id="zen-paywall-close" style="width:100%;padding:10px;margin-top:8px;border:none;background:none;color:#999;font-size:.82rem;cursor:pointer">あとで</button>`
    + `</div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#zen-paywall-buy').onclick = () => startCheckout();
  overlay.querySelector('#zen-paywall-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// TEASER は Pro 訴求 UI 拡張時に使用予定
export { TEASER };
