import { useRef } from 'react';
import { Icon } from './Icon';
import './landing.css';

declare const __BILLSORT_APK_URL__: string | null;

function platform() {
  if (/iPad|iPhone|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return /Android/i.test(navigator.userAgent) ? 'android' : 'desktop';
}

function PaycheckPreview() {
  return <figure className="paycheck-preview" aria-label="Example paycheck plan. A ₱12,000 paycheck covers ₱2,150 in bills, leaving ₱9,850.">
    <div className="preview-grid" aria-hidden="true">
      <div className="receipt-shadow"><div className="sample-receipt">
        <div className="receipt-brand"><Icon name="layers" /> BillWise</div>
        <div className="receipt-title">Paycheck plan</div>
        <div className="receipt-line"><span>Paycheck</span><b>₱12,000</b></div>
        <div className="receipt-line"><span>Electricity</span><b>−₱1,450</b></div>
        <div className="receipt-line"><span>Internet</span><b>−₱700</b></div>
        <div className="barcode" />
      </div></div>
      <div className="balance-slip">
        <span className="slip-icon"><Icon name="wallet" /></span>
        <div><small>After bills</small><strong>₱9,850</strong></div>
        <span className="slip-check">✓</span>
      </div>
    </div>
    <figcaption>Sample paycheck plan</figcaption>
  </figure>;
}

export function Landing() {
  const device = platform();
  const iosGuide = useRef<HTMLDetailsElement>(null);
  const androidGuide = useRef<HTMLDetailsElement>(null);
  const apk = __BILLSORT_APK_URL__;

  function reveal(guide: HTMLDetailsElement | null) {
    if (!guide) return;
    guide.open = true;
    guide.querySelector('summary')?.focus({ preventScroll: true });
    guide.scrollIntoView({ block: 'center' });
  }

  const iphoneAction = <button className={'install-action ' + (device === 'android' ? '' : 'featured')}
    onClick={() => reveal(iosGuide.current)} aria-controls="iphone-guide"><Icon name="phone" />Install on iPhone</button>;
  const androidClass = 'install-action ' + (device === 'android' ? 'featured' : '');
  const androidAction = apk
    ? <a className={androidClass} href={apk} download="BillWise.apk"><Icon name="download" />Download APK for Android</a>
    : <button className={androidClass} onClick={() => reveal(androidGuide.current)} aria-controls="android-guide"
        aria-describedby="apk-status"><Icon name="download" />Download APK for Android</button>;

  return <div className="install-page">
    <header className="install-header"><div className="install-wrap install-bar">
      <a className="brand" href="/" aria-label="BillWise home"><img src="/icons/billsort-192.png" width="42" height="42" alt="" />BillWise</a>
      <div className="install-links"><a href="#installation">Installation guide</a><a className="web-link" href="/#app">Open web app</a></div>
    </div></header>
    <main className="install-wrap install-main page-enter">
      <section className="install-hero" aria-labelledby="install-title">
        <div className="hero-copy">
          <h1 id="install-title">Your paycheck,<br /><em>sorted.</em></h1>
          <p>Plan your bills around payday. See what’s due, what’s covered, and what’s left to spend with BillWise.</p>
          <div className="install-actions">{device === 'android' ? <>{androidAction}{iphoneAction}</> : <>{iphoneAction}{androidAction}</>}</div>
          {!apk && <p className="apk-status" id="apk-status">Android APK awaiting upload. <a href="/#app">Use the web app</a> today.</p>}
        </div>
        <PaycheckPreview />
      </section>
      <section id="installation" className="installation" aria-labelledby="guide-title">
        <h2 id="guide-title">Installation guide</h2>
        <p>{device === 'desktop' ? 'For iPhone, complete these steps on your phone in Safari.' : 'Choose your device for step-by-step instructions.'}</p>
        <div className="guide-grid">
          <details ref={iosGuide} id="iphone-guide" open={device === 'ios'}>
            <summary><span className="guide-icon ios"><Icon name="phone" /></span><span><strong>iPhone</strong><small>Safari · Home Screen web app</small></span><span className="disclosure" /></summary>
            <ol>
              <li>Open this page in <b>Safari</b> on your iPhone.</li>
              <li>Tap <b>Share</b> (the square with an upward arrow). If it’s hidden, open the page menu or <b>More</b>, then tap <b>Share</b>.</li>
              <li>Scroll down and tap <b>Add to Home Screen</b>. If it’s missing, look under <b>Edit Actions</b>.</li>
              <li>Keep the name <b>BillWise</b>, turn on <b>Open as Web App</b> if shown, and tap <b>Add</b>. Open BillWise from its new Home Screen icon.</li>
            </ol>
          </details>
          <details ref={androidGuide} id="android-guide" open={device === 'android'}>
            <summary><span className="guide-icon android"><Icon name="download" /></span><span><strong>Android</strong><small>Android phones · APK installation</small></span><span className="disclosure" /></summary>
            <div className="android-steps">
              {!apk && <p>The Android installer will be available here once the BillWise APK is uploaded.</p>}
              <ol>
                <li>{apk ? <a href={apk} download="BillWise.apk">Download BillWise.apk</a> : 'Once available, download BillWise.apk'} and open it from <b>Downloads</b>.</li>
                <li>Android may ask for permission to install unknown apps. If prompted, open <b>Settings</b>, allow this browser or file manager to <b>install unknown apps</b>, then return to the installer.</li>
                <li>Tap <b>Install</b>, then <b>Open</b>. You can turn off that permission afterward.</li>
              </ol>
            </div>
          </details>
        </div>
      </section>
    </main>
  </div>;
}
