import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { config } from '../../config';
import { t } from '../../locales';
import styles from './UpiDonation.module.css';

/**
 * UpiDonation
 *
 * QR code is generated client-side by qrcode.react from the UPI string
 * built using config.donations.upi values.
 *
 * UPI deep-link format (NPCI standard):
 *   upi://pay?pa={upiId}&pn={displayName}&tn={note}&cu=INR
 *
 *   pa  — payee address (UPI ID)
 *   pn  — payee name shown in donor's UPI app
 *   tn  — transaction note pre-filled for donor
 *   cu  — currency (always INR for UPI)
 *
 * Amount is intentionally omitted — donor chooses what to give.
 * Changing config.donations.upi.id automatically updates the QR.
 */

function buildUpiString(): string {
  const { id, displayName, note } = config.donations.upi;
  const params = new URLSearchParams({
    pa: id,
    pn: displayName,
    tn: note,
    cu: 'INR',
  });
  return `upi://pay?${params.toString()}`;
}

export function UpiDonation() {
  const [copied, setCopied] = useState(false);

  if (!config.donations.enabled) return null;

  const upiString = buildUpiString();
  const upiId     = config.donations.upi.id;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = upiId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.title}>{t.donations.title}</div>
        <div className={styles.subtitle}>{t.donations.subtitle}</div>
      </div>

      <div className={styles.card}>
        <div className={styles.qrWrap}>
          <div className={styles.qrLabel}>{t.donations.upiLabel}</div>
          <div className={styles.qrBox}>
            {/* White background required for QR readability by UPI apps */}
            <QRCodeSVG
              value={upiString}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </div>
        </div>

        <div className={styles.idRow}>
          <div className={styles.idBlock}>
            <span className={styles.idLabel}>{t.donations.upiId}</span>
            <span className={styles.idValue}>{upiId}</span>
          </div>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
          >
            {copied ? t.donations.copiedBtn : t.donations.copyBtn}
          </button>
        </div>

        <div className={styles.howTo}>{t.donations.howTo}</div>
        <div className={styles.thankYou}>{t.donations.thankYou}</div>
      </div>
    </div>
  );
}
