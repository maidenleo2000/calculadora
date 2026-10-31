import { Download, MonitorDown, Share, SquarePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Botón "Instalar app". En Chrome, Edge y Android usa el diálogo nativo de instalación.
 * En iPhone/iPad y navegadores sin ese diálogo muestra cómo instalarla a mano.
 * Se oculta cuando la app ya está instalada.
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!deferred) return setHelp(true);
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  };

  return (
    <>
      <Button icon={<Download className="h-4 w-4" />} onClick={install} title="Instalar como aplicación en esta PC o celular">
        Instalar app
      </Button>
      {help && (
        <Modal title="Instalar el Cotizador" onClose={() => setHelp(false)}>
          <div className="space-y-4 text-sm text-slate-700">
            {isIos() ? (
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <Share className="h-5 w-5 shrink-0 text-indigo-600" />
                  <span>Abrí esta página en <strong>Safari</strong> y tocá el botón <strong>Compartir</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <SquarePlus className="h-5 w-5 shrink-0 text-indigo-600" />
                  <span>Elegí <strong>Agregar a inicio</strong> y confirmá con <strong>Agregar</strong>.</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <MonitorDown className="h-5 w-5 shrink-0 text-indigo-600" />
                  <span>
                    En <strong>Chrome</strong> o <strong>Edge</strong> (PC): hacé clic en el ícono de instalar a la derecha de la barra de direcciones,
                    o en el menú ⋮ → <strong>Instalar Cotizador</strong> / <strong>Aplicaciones → Instalar este sitio como aplicación</strong>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <SquarePlus className="h-5 w-5 shrink-0 text-indigo-600" />
                  <span>En <strong>Android</strong>: menú ⋮ → <strong>Instalar app</strong> o <strong>Agregar a la pantalla principal</strong>.</span>
                </li>
              </ol>
            )}
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              La instalación necesita que el sitio se abra por <strong>HTTPS</strong>. Firefox de escritorio no permite instalar sitios como app.
              Una vez instalada, la calculadora funciona sin conexión y tus datos quedan guardados en el dispositivo.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
