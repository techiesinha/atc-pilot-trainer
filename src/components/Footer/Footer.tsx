import React from 'react';
import { Link } from 'react-router-dom';
import { config } from '../../config';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.copyright}>
        © {config.copyright.year} {config.developer.name}
        &nbsp;·&nbsp;
        {config.app.name} {config.app.version}
      </span>
      <Link to="/legal" className={styles.legalLink}>
        Legal &amp; Disclaimer
      </Link>
    </footer>
  );
}
