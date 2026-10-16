import { DOWNLOADS, VERSION } from '@/lib/data';
import { site } from '@/site.config';
import { TicketButton } from './TicketButton';
import { CopyText } from './CopyText';
import s from './Install.module.css';

export function Install() {
  const chrome = DOWNLOADS.chrome;
  return (
    <section id="install" className={s.section} aria-labelledby="h-install">
      <div className={`wrap ${s.grid}`}>
        <div>
          <h2 id="h-install" className="display">Give your next<br />merge a moment.</h2>
          <p>Install Footlit, reload GitHub, and carry on building.<br />We’ll take care of the curtain call.</p>
        </div>
        <div className={s.actions}>
          <TicketButton href={site.chromeStoreUrl || chrome?.file || '#manual-install'} download={!site.chromeStoreUrl && !!chrome} title={site.chromeStoreUrl ? 'Add to Chrome' : 'Download for Chrome'} sub="Free. No account. No sound." tone="tungsten" />
          {site.firefoxStoreUrl && <a className={s.firefox} href={site.firefoxStoreUrl}>Add to Firefox</a>}
          <p className={s.version}>v{VERSION} · Chrome 111+ and Firefox 140+</p>
          {site.chromeStoreUrl && <p className={s.permission}>Chrome asks for access to github.com so Footlit can notice status changes and draw its animations.</p>}
          <details id="manual-install" className={s.details} open={!site.chromeStoreUrl}>
            <summary>Manual installation for Chrome</summary>
            <div className={s.instructions}>
              {chrome && <><h3>Chrome from a zip</h3><p><a href={chrome.file} download>Download Chrome zip ({chrome.kb} KB)</a></p><ol><li>Unzip to a folder you will keep.</li><li>Open <CopyText text="chrome://extensions" />, enable Developer mode, and choose Load unpacked.</li><li>Select the folder containing <code>manifest.json</code>, then reload GitHub.</li></ol><p>For updates, replace the folder’s files with the latest zip and reload the extension.</p></>}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
