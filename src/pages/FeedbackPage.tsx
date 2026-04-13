/**
 * © 2025-2026 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useState } from 'react';
import { UpiDonation } from '../components/UpiDonation/UpiDonation';
import { config } from '../config';
import { t } from '../locales';
import { sendFeedback } from '../services/emailService';
import { AppUser } from '../types';
import styles from './FeedbackPage.module.css';

// ── Enums ─────────────────────────────────────────────────────────────────────

enum FormState {
  Idle = 'idle',
  Sending = 'sending',
  Sent = 'sent',
  Error = 'error',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  user: AppUser | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FeedbackPage({ user }: Props) {
  const [type, setType] = useState(t.feedback.types[0]);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [pilotLevel, setLevel] = useState(t.registration.pilotLevels[0]);
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<FormState>(FormState.Idle);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setFormState(FormState.Sending);
    setErrorMsg('');
    try {
      await sendFeedback({
        from_name: name.trim(),
        from_email: email.trim(),
        sent_time: new Date().toUTCString(),
        pilot_level: pilotLevel,
        feedback_type: type,
        message: message.trim(),
      });
      setFormState(FormState.Sent);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.feedback.errors.sending);
      setFormState(FormState.Error);
    }
  };

  const handleReset = () => {
    setFormState(FormState.Idle);
    setMessage('');
    setName('');
    setEmail('');
  };

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.title}>{t.feedback.title}</div>
        <div className={styles.subtitle}>{t.feedback.subtitle}</div>
      </div>

      <UpiDonation />

      {/* ── Hire banner ──────────────────────────────────────────────────── */}
      <div className={styles.hireBanner}>
        <div className={styles.hireBannerTag}>{t.feedback.hireBanner.tag}</div>
        <div className={styles.hireBannerTitle}>{t.feedback.hireBanner.title}</div>
        <div className={styles.hireBannerSub}>{t.feedback.hireBanner.sub}</div>
        <div className={styles.hireBannerLinks}>
          <a
            href={config.contactus.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.hireBannerLink}
          >
            <span className={styles.hireBannerLinkIcon}>in</span>
            <span>{t.feedback.hireBanner.linkedin}</span>
            <span className={styles.hireBannerArrow}>&#8599;</span>
          </a>
          <a
            href={`mailto:${config.developer.email}`}
            className={`${styles.hireBannerLink} ${styles.hireBannerLinkEmail}`}
          >
            <span className={styles.hireBannerLinkIcon}>&#9993;</span>
            <span>{config.developer.email}</span>
            <span className={styles.hireBannerArrow}>&#8599;</span>
          </a>
        </div>
      </div>

      {/* ── Developer intro ───────────────────────────────────────────────── */}
      <div className={styles.intro}>
        <div className={styles.introText}>
          <p>
            {t.feedback.intro.builtBy}{' '}
            <strong>{config.developer.name}</strong>{' '}
            — {config.developer.pilotLicense}, {config.developer.hamCallsign},
            Senior Frontend Engineer, {config.developer.location}.
          </p>
          <p>{t.feedback.intro.description}</p>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>{t.feedback.badges.pilotLicense}</span>
          <span className={styles.badge}>{t.feedback.badges.aircraft}</span>
          <span className={styles.badge}>{config.developer.hamCallsign}</span>
          <span className={styles.badge}>{t.feedback.badges.ceh}</span>
          <span className={styles.badge}>{t.feedback.badges.research}</span>
        </div>
      </div>

      {/* ── Contact links ─────────────────────────────────────────────────── */}
      <div className={styles.contactLinks}>
        <a
          href={config.contactus.social.githubIssues}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactLink}
        >
          <span className={styles.linkIcon}>{t.feedback.contactLinks.github.icon}</span>
          <div>
            <div className={styles.linkTitle}>{t.feedback.contactLinks.github.title}</div>
            <div className={styles.linkDesc}>{t.feedback.contactLinks.github.desc}</div>
          </div>
        </a>
        <a
          href={config.contactus.social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactLink}
        >
          <span className={styles.linkIcon}>{t.feedback.contactLinks.linkedin.icon}</span>
          <div>
            <div className={styles.linkTitle}>{t.feedback.contactLinks.linkedin.title}</div>
            <div className={styles.linkDesc}>{t.feedback.contactLinks.linkedin.desc}</div>
          </div>
        </a>
        <a
          href={config.contactus.social.stackoverflow}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactLink}
        >
          <span className={styles.linkIcon}>{t.feedback.contactLinks.stackoverflow.icon}</span>
          <div>
            <div className={styles.linkTitle}>{t.feedback.contactLinks.stackoverflow.title}</div>
            <div className={styles.linkDesc}>{t.feedback.contactLinks.stackoverflow.desc}</div>
          </div>
        </a>
      </div>

      {/* ── Feedback form ─────────────────────────────────────────────────── */}
      {formState === FormState.Sent ? (
        <div className={styles.successPanel}>
          <div className={styles.successIcon}>{t.feedback.success.icon}</div>
          <div className={styles.successTitle}>{t.feedback.success.title}</div>
          <div className={styles.successText}>{t.feedback.success.text}</div>
          <button className={styles.resetBtn} onClick={handleReset}>
            {t.feedback.success.reset}
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formTitle}>{t.feedback.form.title}</div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>{t.feedback.form.typeLabel}</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); }}
                className={styles.select}
              >
                {t.feedback.types.map((ft) => (
                  <option key={ft} value={ft}>{ft}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t.feedback.form.levelLabel}</label>
              <select
                value={pilotLevel}
                onChange={(e) => { setLevel(e.target.value); }}
                className={styles.select}
              >
                {t.registration.pilotLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>
                {t.feedback.form.nameLabel}{' '}
                <span className={styles.req}>{t.feedback.form.nameReq}</span>
              </label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                placeholder={t.feedback.form.namePlaceholder}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                {t.feedback.form.emailLabel}{' '}
                <span className={styles.req}>{t.feedback.form.emailReq}</span>
                <span className={styles.emailNote}> {t.feedback.form.emailNote}</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); }}
                placeholder={t.feedback.form.emailPlaceholder}
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              {t.feedback.form.messageLabel}{' '}
              <span className={styles.req}>{t.feedback.form.messageReq}</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); }}
              placeholder={t.feedback.form.messagePlaceholder}
              rows={6}
              required
              className={styles.textarea}
            />
          </div>

          {formState === FormState.Error && (
            <div className={styles.errorMsg}>{errorMsg}</div>
          )}

          <div className={styles.formFooter}>
            <div className={styles.privacyNote}>{t.feedback.form.privacyNote}</div>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={
                formState === FormState.Sending ||
                !name.trim() ||
                !email.trim() ||
                !message.trim()
              }
            >
              {formState === FormState.Sending
                ? t.feedback.form.submitSending
                : t.feedback.form.submitIdle}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
