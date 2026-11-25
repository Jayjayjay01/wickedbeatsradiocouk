/**
 * Every editable value for the Wicked Beats Radio site lives here.
 */
export const CONFIG = {
  SITE_NAME: "Wicked Beats Radio",
  SITE_URL: "https://wickedbeatsradio.co.uk",
  /** Live stream (128kbps MP3) */
  STREAM_URL: "https://betelgeuse.nucast.co.uk/stream/8066",
  BITRATE: "128kbps",
  /** Google Analytics 4 measurement ID */
  GA_MEASUREMENT_ID: "G-98NZYHVLRE",
  /** Google Sheet published to the web as CSV. Leave empty to use the built-in schedule. */
  SCHEDULE_CSV_URL:
    "https://docs.google.com/spreadsheets/d/1NQuy_ebKawURrA8wSRtrs1EwzvkdaJ0aUEVd5XJyr2s/export?format=csv&gid=300904307",
  /** Optional JSON/text endpoint returning the current track. Leave empty to hide the line. */
  NOW_PLAYING_URL: "",
  RADIO_NET_URL: "https://uk.radio.net/s/wickedbeats",
  GOOGLE_PLAY_URL:
    "https://play.google.com/store/apps/details?id=uk.co.nuapps.mybuilder.android6968dac96ee2e",
  LOGO_URL:
    "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/a8fa03ac-7e03-43af-954d-49c2f5989a00/public",
  ABOUT_IMAGE:
    "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/eb10d1f5-c4ad-49b8-177e-3b320c07b100/publicContain",
  SOCIAL: {
    instagram: { label: "Instagram", handle: "@dj_danny0135", url: "https://www.instagram.com/dj_danny0135" },
    tiktok: { label: "TikTok", handle: "@djdanny237", url: "https://www.tiktok.com/@djdanny237" },
    facebook: { label: "Facebook", handle: "/wickedbeatsradio", url: "https://www.facebook.com/groups/942825120867914" },
  },
  PAYPAL: [
    { label: "£3", url: "https://www.paypal.com/paypalme/danbrown90/3" },
    { label: "£5", url: "https://www.paypal.com/paypalme/danbrown90/5" },
    { label: "£10", url: "https://www.paypal.com/paypalme/danbrown90/10" },
    { label: "Custom", url: "https://www.paypal.com/paypalme/danbrown90" },
  ],
  FLAG_COUNTER_LINK: "https://info.flagcounter.com/eSaF",
  FLAG_COUNTER_IMG:
    "https://s05.flagcounter.com/count2/eSaF/bg_000000/txt_0AFF12/border_FF491C/columns_8/maxflags_50/viewers_0/labels_1/pageviews_1/flags_0/percent_0/",
  /** Festive season: snow, fairy lights and the DJs' Christmas message on every page. Set ENABLED to false to switch it all off. */
  CHRISTMAS: {
    ENABLED: true,
    TITLE: "Merry Christmas from Wicked Beats Radio",
    MESSAGE:
      "From Danny and every Wicked Beats DJ, thank you for listening this year. Keep it locked for festive sets, big tunes and good vibes all the way into the New Year.",
    SIGN_OFF: "— The Wicked Beats Radio DJs",
  },
  GENRES: [
    { name: "Reggae", tag: "Roots & Culture", color: "#0AFF12", img: "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/4b382d36-1f1b-4f3f-c6b2-de96d7ffc600/public" },
    { name: "Dancehall", tag: "Island Energy", color: "#FFD60A", img: "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/f026a28f-b7a8-4d56-8c87-d56858862800/public" },
    { name: "House", tag: "Deep & Progressive", color: "#00E5FF", img: "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/e486a693-6016-4dd6-be78-2c4862dd6900/public" },
    { name: "Jungle", tag: "Drum & Bass", color: "#8A2BFF", img: "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/410e3411-bacf-4406-17a4-03e7b67a8f00/public" },
    { name: "Afrobeat", tag: "African Rhythms", color: "#FF491C", img: "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/b771a8b6-4dca-4ffa-c74c-18453784e300/public" },
  ],
} as const;

/** Canvas palette (mirrors the CSS design tokens; canvas can't read CSS vars cheaply). */
export const PALETTE = {
  pink: "#FF1F8E",
  white: "#F5F5F7",
  violet: "#8A2BFF",
  blue: "#2D6BFF",
  cyan: "#00E5FF",
  green: "#0AFF12",
  yellow: "#FFD60A",
  orange: "#FF491C",
};
