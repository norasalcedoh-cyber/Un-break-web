// Runs inside the extension's isolated content-script world on Instagram only.
let modoDemo = false;
try {
  const state = await chrome.runtime.sendMessage({ type: 'demo:get' });
  modoDemo = state?.ok === true && state.enabled === true;
} catch {
  // If the worker is unavailable, preserve normal behavior without claiming demo activation.
}

function showDemoControl(active) {
  const host = document.createElement('div');
  host.id = 'un-break-demo-control';
  host.style.cssText = 'position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;visibility:visible!important;';
  const root = host.attachShadow({ mode: 'closed' });
  const box = document.createElement('section');
  box.style.cssText = 'max-width:320px;padding:16px;background:#eeeeea;color:#111;border:1px solid #111;font:14px/1.45 Arial,sans-serif;box-shadow:0 4px 24px #0003;';
  const text = document.createElement('p');
  text.style.margin = '0 0 12px';
  text.setAttribute('role', 'status');
  text.textContent = active
    ? 'UN-BREAK · Demo activa en esta pestaña. Desliza rápido para comprimir; detente unos segundos para deformar. Tras 15 segundos de navegación activa empezarán a desaparecer imágenes.'
    : 'UN-BREAK · ¿Quieres activar la demostración en esta pestaña? Verás los efectos con tiempos más cortos. No se envían datos personales.';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = active ? 'Salir de la demo' : 'Activar demostración';
  button.style.cssText = 'padding:9px;background:#111;color:white;border:0;cursor:pointer;font:inherit;';
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const result = await chrome.runtime.sendMessage({ type: 'demo:set', enabled: !active });
      if (!result?.ok || result.enabled !== !active) throw new Error('Demo state not confirmed');
      // Reload restores all original DOM styles and restarts the normal/demo timers.
      location.reload();
    } catch {
      text.textContent = 'No se pudo cambiar el modo. Recarga la extensión en chrome://extensions y vuelve a intentarlo.';
      button.disabled = false;
    }
  });
  box.append(text, button);
  if (!active) {
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Ahora no';
    cancel.style.cssText = 'margin-left:12px;padding:9px;cursor:pointer;font:inherit;';
    cancel.addEventListener('click', () => host.remove());
    box.append(cancel);
  }
  root.append(box);
  document.body.append(host);
}

function checkDemoRequest() {
  if (location.hash !== '#un-break-demo') return;
  // Consume the request so exiting and reloading never activates it again.
  history.replaceState(history.state, '', location.pathname + location.search);
  if (!document.getElementById('un-break-demo-control')) showDemoControl(modoDemo);
}
if (modoDemo) showDemoControl(true);
checkDemoRequest();
window.addEventListener('hashchange', checkDemoRequest);
