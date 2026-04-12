import emailjs from '@emailjs/browser';
import { config, log } from '../config';

/**
 * EmailJS Service
 *
 * The developer's TO email is set inside the EmailJS dashboard template only —
 * never in source code.
 *
 * Template variables used (update your EmailJS template to include all of these):
 *   {{from_name}}     — sender's name
 *   {{from_email}}    — sender's email (set as Reply-To in template)
 *   {{sent_time}}     — UTC timestamp of submission
 *   {{pilot_level}}   — their training level
 *   {{feedback_type}} — type of feedback
 *   {{message}}       — the feedback message
 */

export interface FeedbackPayload {
  from_name:     string;
  from_email:    string;
  sent_time:     string;
  pilot_level:   string;
  feedback_type: string;
  message:       string;
}

let initialised = false;

function init() {
  if (initialised) return;
  emailjs.init({ publicKey: config.contactus.emailjs.publicKey });
  initialised = true;
  log.info('EmailJS initialised');
}

export async function sendFeedback(payload: FeedbackPayload): Promise<void> {
  init();
  log.info('Sending feedback via EmailJS, type:', payload.feedback_type);

  const result = await emailjs.send(
    config.contactus.emailjs.serviceId,
    config.contactus.emailjs.templateId,
    payload as unknown as Record<string, unknown>
  );

  if (result.status !== 200) {
    throw new Error(`EmailJS returned status ${result.status}: ${result.text}`);
  }

  log.info('Feedback sent successfully');
}
