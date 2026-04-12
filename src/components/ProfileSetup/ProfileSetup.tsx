import React, { useState } from 'react';
import { detectCountry } from '../../services/userService';
import { t } from '../../locales';
import styles from './ProfileSetup.module.css';

interface Props {
    name: string;
    onComplete: (country: string, pilotLevel: string) => Promise<void>;
}

export function ProfileSetup({ name, onComplete }: Props) {
    const [country, setCountry] = useState(detectCountry());
    const [pilotLevel, setPilotLevel] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const firstName = name.split(' ')[0];

    const handleSubmit = async () => {
        if (!pilotLevel) { setError('Please select your pilot level.'); return; }
        setSaving(true);
        setError('');
        try {
            await onComplete(country, pilotLevel);
        } catch {
            setError('Failed to save. Please try again.');
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                <div className={styles.welcome}>
                    <span className={styles.wave}>✈</span>
                    <div>
                        <div className={styles.welcomeTitle}>Welcome, {firstName}</div>
                        <div className={styles.welcomeSub}>One quick step before you start training</div>
                    </div>
                </div>

                <div className={styles.fields}>

                    <div className={styles.field}>
                        <label className={styles.label}>{t.profileSetup.countryLabel}</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className={styles.select}
                            disabled={saving}
                        >
                            {t.profileSetup.countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className={styles.hint}>{t.profileSetup.countryHint}</div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            {t.profileSetup.levelLabel}
                            <span className={styles.req}> *</span>
                        </label>
                        <select
                            value={pilotLevel}
                            onChange={(e) => setPilotLevel(e.target.value)}
                            className={styles.select}
                            disabled={saving}
                        >
                            <option value="" disabled>{t.profileSetup.levelPlaceholder}</option>
                            {t.registration.pilotLevels.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                    className={styles.startBtn}
                    onClick={handleSubmit}
                    disabled={saving || !pilotLevel}
                >
                    {saving ? t.profileSetup.saving : t.profileSetup.startBtn}
                </button>

                <div className={styles.note}>{t.profileSetup.note}</div>

            </div>
        </div>
    );
}
