/**
 * © 2025-2026 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React from 'react';
import { config } from '../config';
import { t } from '../locales';
import styles from './LegalPage.module.css';

export function LegalPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>{t.legal.title}</div>
        <div className={styles.subtitle}>{t.legal.subtitle}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t.legal.sections.copyright}</div>
        <div className={styles.sectionBody}>
          © {config.copyright.year} {config.developer.name}. {config.app.name} {config.app.version}.
          All rights reserved.
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t.legal.sections.disclaimer}</div>
        <div className={styles.sectionBody}>{config.copyright.disclaimer}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t.legal.sections.code}</div>
        <div className={styles.sectionBody}>{t.legal.codeText}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t.legal.sections.training}</div>
        <div className={styles.sectionBody}>{t.legal.trainingText}</div>
      </div>

      <div className={styles.stamp}>
        {config.developer.name} · {config.developer.location} · {config.copyright.year}
      </div>
    </div>
  );
}
