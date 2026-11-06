import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "de" | "en";

const STORAGE_KEY = "terravest.lang";

type Dict = Record<string, { de: string; en: string }>;

export const dict = {
  "nav.home": { de: "Startseite", en: "Home" },
  "nav.plans": { de: "Laufzeiten", en: "Plans" },
  "nav.markets": { de: "Märkte", en: "Markets" },
  "nav.dashboard": { de: "Übersicht", en: "Dashboard" },
  "nav.signin": { de: "Anmelden", en: "Sign in" },
  "nav.open": { de: "Konto eröffnen", en: "Open account" },
  "nav.menu": { de: "Menü öffnen", en: "Open menu" },

  "lang.switchToEn": { de: "Auf Englisch umschalten", en: "Switch to German" },
  "lang.de": { de: "Deutsch", en: "German" },
  "lang.en": { de: "Englisch", en: "English" },

  "home.badge": { de: "Tägliche Rendite wächst jede Sekunde", en: "Daily ROI accrues every second" },
  "home.h1a": { de: "Kapital binden.", en: "Lock your capital." },
  "home.h1b": { de: "Zusehen, wie es arbeitet.", en: "Watch it work." },
  "home.lead": {
    de: "Terravest macht aus einer festen Laufzeit eine sichtbare Rendite – Sekunde für Sekunde. Wählen Sie eine Laufzeit von einem Tag bis zwei Jahren, zahlen Sie in Krypto oder Bargeld ein und verfolgen Sie jeden Cent.",
    en: "Terravest turns a fixed lock period into a visible, second-by-second return. Choose a term from one day to two years, fund in crypto or cash, and follow every cent as it accrues.",
  },
  "home.cta": { de: "Konto eröffnen", en: "Open an account" },
  "home.rates": { de: "Zinssätze ansehen", en: "See the rates" },
  "home.stat.terms": { de: "Laufzeiten", en: "Terms" },
  "home.stat.termsV": { de: "1 T – 2 J", en: "1d – 2y" },
  "home.stat.top": { de: "Spitzensatz", en: "Top rate" },
  "home.stat.topV": { de: "0,90 %/Tag", en: "0.90%/day" },
  "home.stat.payout": { de: "Auszahlung", en: "Payout" },
  "home.stat.payoutV": { de: "Bei Freigabe", en: "At unlock" },
  "home.heroAlt": {
    de: "Wellen aus Nussbaumholz und gebürstetem Stahl, die ein steigendes Marktdiagramm bilden",
    en: "Sculpted walnut and brushed-steel waves forming a rising market chart",
  },
  "home.how": { de: "So funktioniert eine Terravest-Position", en: "How a Terravest position works" },
  "home.f1.t": { de: "Laufzeit wählen", en: "Pick a lock term" },
  "home.f1.b": {
    de: "Längere Laufzeiten bringen einen höheren Tagessatz – offen veröffentlicht und vom Plattform-Team festgelegt.",
    en: "Longer locks carry a higher daily rate, published openly and set by the platform team.",
  },
  "home.f2.t": { de: "Zuwachs beobachten", en: "Watch it accrue" },
  "home.f2.b": {
    de: "Ihre Position steigt live – kein Warten auf einen nächtlichen Abgleich.",
    en: "Your position ticks up live — no waiting for a nightly batch to tell you where you stand.",
  },
  "home.f3.t": { de: "Werte frei bewegen", en: "Move value freely" },
  "home.f3.b": {
    de: "Senden Sie Guthaben sofort per Benutzername an andere Mitglieder – mit Beleg auf beiden Seiten.",
    en: "Send funds to any other member by username, instantly, with a receipt on both sides.",
  },
  "home.f4.t": { de: "Auszahlung nach Prüfung", en: "Withdraw on review" },
  "home.f4.b": {
    de: "Anträge werden vom Team geprüft und dann an Ihr gewähltes Ziel ausgezahlt.",
    en: "Requests are held and reviewed by the team, then paid to your chosen destination.",
  },
  "home.calc.h": { de: "Erst rechnen, dann anlegen", en: "Run the numbers first" },
  "home.calc.b": {
    de: "Jeder Satz auf dieser Seite ist derselbe, der für eine echte Position gilt. Geben Sie Betrag und Laufzeit ein, um den Wert bei Freigabe zu sehen.",
    en: "Every rate on this page is the same rate applied to a live position. Try an amount and a term to see the unlock value before you commit anything.",
  },
  "home.terms.h": { de: "Aktuelle Laufzeiten", en: "Current terms" },
  "home.terms.cta": { de: "Mit jedem Betrag starten", en: "Start with any amount" },
  "home.perDay": { de: "/Tag", en: "/day" },

  "plans.h1": { de: "Laufzeiten", en: "Lock terms" },
  "plans.lead": {
    de: "Je länger Sie binden, desto höher der Tagessatz. Die Sätze legt das Plattform-Team fest und gelten ab der Sekunde, in der Ihre Position startet.",
    en: "The longer you lock, the higher the daily rate. Rates are set by the platform team and apply from the second your position opens.",
  },
  "plans.loading": { de: "Laufzeiten werden geladen…", en: "Loading terms…" },
  "plans.dayLock": { de: "Tage gebunden", en: "day lock" },
  "plans.perDay": { de: "pro Tag", en: "per day" },
  "plans.min": { de: "Mindestbetrag", en: "Minimum" },
  "plans.becomes": { de: "1.000 $ werden zu", en: "$1,000 becomes" },
  "plans.cta": { de: "Zu dieser Laufzeit anlegen", en: "Invest on this term" },

  "market.h1": { de: "Märkte", en: "Markets" },
  "market.lead": {
    de: "Die Kurse werden jede Minute aktualisiert. Nutzen Sie sie, um Ihre Position vor dem Binden zu bemessen.",
    en: "Live prices refresh every minute. Use them to size a position before you lock.",
  },

  "calc.amount": { de: "Betrag (USD)", en: "Amount (USD)" },
  "calc.term": { de: "Laufzeit", en: "Lock term" },
  "calc.dailyRate": { de: "Tagessatz", en: "Daily rate" },
  "calc.perDay": { de: "Pro Tag", en: "Per day" },
  "calc.totalRoi": { de: "Gesamtrendite", en: "Total ROI" },
  "calc.atUnlock": { de: "Bei Freigabe", en: "At unlock" },

  "footer.note": {
    de: "Terravest ist eine Demonstrations-Anlageplattform. Dargestellte Renditen sind beispielhaft, Kapital ist Risiken ausgesetzt.",
    en: "Terravest is a demonstration investment platform. Returns shown are illustrative and capital is at risk.",
  },

  "withdraw.mustDeposit": {
    de: "Bitte zahlen Sie zuerst Geld ein, bevor Sie eine Auszahlung anfordern.",
    en: "Please deposit funds first before requesting a withdrawal.",
  },
  "withdraw.fee": { de: "Auszahlungsgebühr", en: "Withdrawal fee" },
  "withdraw.receive": { de: "Sie erhalten", en: "You receive" },
  "deposit.amount": { de: "Betrag (EUR)", en: "Amount (USD)" },
  "deposit.firstMinimum": {
    de: "Ihre erste Einzahlung muss mindestens {amount} EUR betragen.",
    en: "Your first deposit must be at least {amount} USD.",
  },
  "deposit.highBalanceMinimum": {
    de: "Bei einem Guthaben über 10.000 ist für die erste Einzahlung ein Betrag zwischen 200 und 300 EUR vorgesehen.",
    en: "With a balance above 10,000, the suggested first-deposit range is $200–$300.",
  },

  "auth.welcome": { de: "Willkommen zurück", en: "Welcome back" },
  "auth.open": { de: "Konto eröffnen", en: "Open your account" },
  "auth.signinSub": { de: "Melden Sie sich bei Wallet und Positionen an.", en: "Sign in to your wallet and positions." },
  "auth.signupSub": {
    de: "Mit einem Benutzernamen können andere Mitglieder Ihnen Guthaben senden.",
    en: "A username lets other members send you funds.",
  },
  "auth.username": { de: "Benutzername", en: "Username" },
  "auth.fullName": { de: "Vollständiger Name", en: "Full name" },
  "auth.email": { de: "E-Mail", en: "Email" },
  "auth.password": { de: "Passwort", en: "Password" },
  "auth.wait": { de: "Bitte warten…", en: "Please wait…" },
  "auth.signin": { de: "Anmelden", en: "Sign in" },
  "auth.create": { de: "Konto erstellen", en: "Create account" },
  "auth.or": { de: "oder", en: "or" },
  "auth.google": { de: "Weiter mit Google", en: "Continue with Google" },
  "auth.newHere": { de: "Neu bei Terravest?", en: "New to Terravest?" },
  "auth.haveAccount": { de: "Sie haben bereits ein Konto?", en: "Already have an account?" },
  "auth.toSignup": { de: "Konto eröffnen", en: "Open an account" },
  "auth.checkInbox": {
    de: "Bitte bestätigen Sie Ihre E-Mail-Adresse und melden Sie sich dann an.",
    en: "Check your inbox to confirm your email, then sign in.",
  },
  "auth.googleFailed": {
    de: "Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
    en: "Google sign-in failed. Please try again.",
  },
  "auth.generic": { de: "Etwas ist schiefgelaufen", en: "Something went wrong" },
} satisfies Dict;

export type TKey = keyof typeof dict;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
}>({ lang: "de", setLang: () => {}, t: (k) => dict[k].de });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "de") {
      setLangState(stored);
      return;
    }

    let cancelled = false;
    fetch("https://ipapi.co/country/")
      .then((response) => (response.ok ? response.text() : ""))
      .then((countryCode) => {
        if (!cancelled) setLangState(countryCode.trim().toUpperCase() === "DE" ? "de" : "en");
      })
      .catch(() => {
        if (!cancelled) setLangState("en");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }

  const t = (k: TKey) => dict[k][lang];

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
