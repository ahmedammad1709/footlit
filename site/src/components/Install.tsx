import { DOWNLOADS, VERSION } from '@/lib/data';
import { site } from '@/site.config';
import { TicketButton } from './TicketButton';
import { CopyText } from './CopyText';
import { Down } from './Icons';
import s from './Install.module.css';

export function Install() {
  const chrome = DOWNLOADS.chrome;
  const firefox = DOWNLOADS.firefox;
  return (
    <section id="install" className={`paper ${s.section} band`} aria-labelledby="h-install">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">06 / Take a seat</p>
          <h2 id="h-install" className={`display ${s.h2}`}>Install it in a minute.</h2>
          <p className="lede">Free, no account, no sign-up. Version {VERSION}.</p>
        </header>

        <dl className={s.glance}>
          <div><dt>Price</dt><dd>Free</dd></div>
          <div><dt>Works with</dt><dd>Chrome 111+ and Chromium browsers; Firefox 140+ (preview)</dd></div>
          <div><dt>Version</dt><dd>{VERSION}</dd></div>
          <div><dt>Download</dt><dd>{chrome ? `${chrome.kb} KB` : 'n/a'}</dd></div>
          <div><dt>Data collected</dt><dd>None</dd></div>
          <div><dt>Permissions</dt><dd>github.com access and storage</dd></div>
        </dl>

        <div className={s.grid}>
          <div className={s.tickets}>
            {site.chromeStoreUrl ? (
              <TicketButton href={site.chromeStoreUrl} title="Add to Chrome" sub="Chrome Web Store · one click · updates itself" stub="Store" tone="tungsten" />
            ) : (
              <TicketButton href="#" title="Chrome Web Store" sub="Coming soon" stub="Soon" stubSmall="Not yet" tone="ink" disabled />
            )}
            {chrome ? (
              <TicketButton href={chrome.file} download title={site.chromeStoreUrl ? 'Manual install' : 'Chrome'} sub={`Direct download · .zip · ${chrome.kb} KB`} stub="Free" tone="ink" icon={<Down />} />
            ) : null}
            {firefox ? (
              <TicketButton href={firefox.file} download title="Firefox" sub={`Preview · .zip · ${firefox.kb} KB`} stub="Beta" stubSmall="Admit one" tone="ink" icon={<Down />} />
            ) : null}
          </div>

          <div className={s.steps}>
            {site.chromeStoreUrl ? (
              <>
                <h3 className="display">Chrome and Chromium browsers</h3>
                <ol>
                  <li><b>Press “Add to Chrome”</b> and confirm. Chrome will say Footlit can read and change your data on github.com. That is standard wording for any extension that runs on a site: Footlit only runs on github.com, looks at page labels on your machine to know when something happened, and sends nothing anywhere.</li>
                  <li><b>Reload any GitHub tab</b> you already had open, click the Footlit icon, and press Rehearse on any event.</li>
                </ol>
                <p>Brave and other Chromium browsers can install straight from the Chrome Web Store too. The store version updates itself.</p>
                <h3 className="display">Manual install (zip)</h3>
                <p>Only needed if you cannot use the store. Steps are below.</p>
              </>
            ) : (
              <h3 className="display">Chrome and Chromium browsers</h3>
            )}
            <ol>
              <li>
                <b>Download and unzip</b> the file somewhere it can stay. Chrome loads the extension from that folder, so do not delete it afterwards.
              </li>
              <li>
                <b>Open the extensions page</b> by pasting <CopyText text="chrome://extensions" /> into the address bar, then switch on <b>Developer mode</b>.
              </li>
              <li>
                <b>Click “Load unpacked”</b> and choose the unzipped folder. The folder you pick must be the one that contains <code>manifest.json</code>.
              </li>
              <li>
                <b>Reload any GitHub tab</b> you already had open, click the Footlit icon, and press Rehearse on any event.
              </li>
            </ol>

            <h3 className="display">Firefox (experimental)</h3>
            <p>
              Open <CopyText text="about:debugging" />, choose <b>This Firefox</b>, then <b>Load Temporary Add-on</b> and pick <code>manifest.json</code> from the unzipped folder. Needs Firefox 140 or later. Firefox removes temporary add-ons when it restarts, so treat this as a preview until the Firefox Add-ons listing is approved.
            </p>
            <p className={s.update}>
              <b>Installed from a zip? Updates are not automatic.</b> Chrome only updates extensions that came from the store. When a new version is released, download the latest zip here, replace the files in your folder, then press the reload button on Footlit at <CopyText text="chrome://extensions" /> and reload your GitHub tabs. The store version updates itself.
            </p>
            <p className={s.note}>
              {site.chromeStoreUrl
                ? 'The Firefox Add-ons listing is under review. Until it is approved, the Firefox zip above is a preview.'
                : 'The Chrome Web Store and Firefox Add-ons listings are on the way. Until then, the direct download is the real thing: the same package that will be submitted.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
