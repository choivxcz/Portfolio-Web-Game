import { useRef, useState, type FormEvent } from "react";
import { profile } from "../data/profile";
import { Corners } from "./Ornament";
import { SectionHeader } from "./SectionHeader";

/**
 * Private reviews, as on the main portfolio: the form emails each review to Karl
 * through Web3Forms. Nothing is stored or published on the site.
 */
const ENDPOINT = "https://api.web3forms.com/submit";
const MIN = 20;
const MAX = 1000;
const WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
const RELATIONSHIPS = ["Classmate", "Groupmate", "Schoolmate", "Client", "Recruiter", "Other"];

type Field = "rating" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Reviews() {
  const accessKey = profile.reviews.web3formsAccessKey;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [botcheck, setBotcheck] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState({ error: false, text: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const thanksRef = useRef<HTMLDivElement>(null);

  if (!accessKey) return null;

  const validate = () => {
    const next: Errors = {};
    if (!rating) next.rating = "Please choose a rating from 1 to 5 stars.";
    const e = email.trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) next.email = "That email doesn't look right. Check it, or leave it blank.";
    const m = message.trim();
    if (m.length < MIN) next.message = `Please write at least ${MIN} characters (${m.length} so far).`;
    setErrors(next);
    const first = (["rating", "email", "message"] as Field[]).find((k) => next[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    return !first;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus({ error: false, text: "" });
    if (!validate()) return;
    if (botcheck) return; // a bot filled the hidden field
    setBusy(true);
    setStatus({ error: false, text: "Sending…" });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: "New review from your portfolio game",
          from_name: "Portfolio reviews (3D world)",
          rating: `${rating} / 5`,
          name: name.trim(),
          relationship,
          email: email.trim(),
          message: message.trim(),
        }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || `HTTP ${response.status}`);
      setRating(0);
      setName("");
      setRelationship("");
      setEmail("");
      setMessage("");
      setStatus({ error: false, text: "" });
      setSent(true);
      window.setTimeout(() => thanksRef.current?.focus(), 0);
    } catch (error) {
      setStatus({
        error: true,
        text:
          (error as Error).name === "AbortError"
            ? "That took too long. Check your connection and try again; your review is still here."
            : "Sorry, your review couldn't be sent. Please try again in a moment; your review is still here.",
      });
    } finally {
      window.clearTimeout(timer);
      setBusy(false);
    }
  };

  const shown = hover || rating;

  return (
    <section id="reviews" className="section section--ivory on-ivory reviews" aria-labelledby="reviews-title">
      <div className="container">
        <SectionHeader
          id="reviews-title"
          chapter="Chapter VII · Traveler's Guestbook"
          title="Reviews"
          element="dendro"
          lede="Worked with me? Tell me how it went. Classmates, professors, teammates, and clients: honest feedback helps me get better."
        />

        <div className="reviews-grid reveal">
          <ul className="reviews-privacy" aria-label="About your review">
            <li>Your review goes straight to my inbox.</li>
            <li>Nothing you write is published on this site.</li>
            <li>Your email is optional and only used if I reply.</li>
          </ul>

          <div className="reviews-card frame">
            <Corners />
            {!sent ? (
              <form ref={formRef} className="review-form" noValidate onSubmit={onSubmit} aria-busy={busy}>
                <input
                  type="checkbox"
                  name="botcheck"
                  className="review-trap"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  checked={botcheck}
                  onChange={(e) => setBotcheck(e.target.checked)}
                />

                <fieldset className="review-field" aria-describedby="rating-error" aria-invalid={!!errors.rating}>
                  <legend>
                    Your rating <span className="review-req">(required)</span>
                  </legend>
                  <div className="review-stars" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className={`review-star ${n <= shown ? "is-on" : ""} ${n === rating ? "is-picked" : ""}`} onMouseEnter={() => setHover(n)}>
                        <input
                          type="radio"
                          name="rating"
                          value={n}
                          checked={rating === n}
                          onChange={() => {
                            setRating(n);
                            setErrors((x) => ({ ...x, rating: undefined }));
                          }}
                        />
                        <span className="visually-hidden">
                          {n} {n === 1 ? "star" : "stars"}
                        </span>
                        <Star filled={n <= shown} />
                      </label>
                    ))}
                    <span className="review-rating-word" aria-hidden="true">
                      {WORDS[shown]}
                    </span>
                  </div>
                  <p className="review-error" id="rating-error">
                    {errors.rating}
                  </p>
                </fieldset>

                <div className="review-row">
                  <div className="review-field">
                    <label htmlFor="review-name">
                      Name <span className="review-opt">(optional)</span>
                    </label>
                    <input id="review-name" name="name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="review-field">
                    <label htmlFor="review-relationship">How do you know me?</label>
                    <select id="review-relationship" name="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                      <option value="">Choose one (optional)</option>
                      {RELATIONSHIPS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="review-field">
                  <label htmlFor="review-email">
                    Email <span className="review-opt">(optional, only if you&apos;d like a reply)</span>
                  </label>
                  <input
                    id="review-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    value={email}
                    aria-invalid={!!errors.email}
                    aria-describedby="email-error"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="review-error" id="email-error">
                    {errors.email}
                  </p>
                </div>

                <div className="review-field">
                  <label htmlFor="review-message">
                    Your review <span className="review-req">(required)</span>
                  </label>
                  <textarea
                    id="review-message"
                    name="message"
                    rows={5}
                    maxLength={MAX}
                    value={message}
                    aria-invalid={!!errors.message}
                    aria-describedby="message-hint message-error"
                    placeholder="What was it like working with me? What should I keep doing, or do better?"
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message && e.target.value.trim().length >= MIN) setErrors((x) => ({ ...x, message: undefined }));
                    }}
                  />
                  <div className="review-hint-row">
                    <p className="review-error" id="message-error">
                      {errors.message}
                    </p>
                    <p className={`review-hint ${message.length > MAX * 0.9 ? "is-near" : ""}`} id="message-hint">
                      {message.length} / {MAX}
                    </p>
                  </div>
                </div>

                <div className="review-actions">
                  <button className={`btn btn--primary review-submit ${busy ? "is-busy" : ""}`} type="submit" disabled={busy}>
                    <span className="review-submit-label">Send review</span>
                    <span className="review-spinner" aria-hidden="true" />
                  </button>
                  <p className={`review-status ${status.error ? "is-error" : ""}`} role="status" aria-live="polite">
                    {status.text}
                  </p>
                </div>
              </form>
            ) : (
              <div className="review-thanks" tabIndex={-1} ref={thanksRef}>
                <span className="review-check" aria-hidden="true">
                  <svg viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="24" />
                    <path d="M15 27l7 7 15-16" />
                  </svg>
                </span>
                <h3>Thank you!</h3>
                <p>Your review is on its way to me. I read every one.</p>
                <button className="btn btn--ghost" type="button" onClick={() => setSent(false)}>
                  Write another review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
