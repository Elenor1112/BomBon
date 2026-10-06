/* ==========================================================================
   Bombon Spa — site data (single source of truth)
   --------------------------------------------------------------------------
   Edit prices, durations and copy here; the menu, rituals, gallery and
   booking flow are all rendered from this file.

   ⚠ PLACEHOLDER: every price/duration marked `placeholder: true` is an
     estimate. Replace with the real price list before launch.
     The four Ritual Collection package prices are real (from the posters);
     their durations are estimates.
   ========================================================================== */
window.BOMBON = (function () {
  "use strict";

  const BUSINESS = {
    name: "Bombòn Spa",
    address: "3 El-Safa, Sheraton, Cairo, Egypt",
    phones: ["01101015899", "01101015895"],
    whatsapp: "201101015899", // international format, no "+"
    instagram: "bombonspa1",
    facebook: "Bombonspa",
    open: "10:00",
    close: "20:00",
    slotMinutes: 30,
    bookingDays: 14,
  };

  /* Responsive image registry: name -> available widths + intrinsic size of the largest */
  const IMAGES = {
    "cover":            { widths: [480, 960, 1024], w: 1024, h: 1536 },
    "services":         { widths: [480, 960, 1024], w: 1024, h: 1536 },
    "cover-face":       { widths: [400], w: 400, h: 580 },
    "cover-turban":     { widths: [340], w: 340, h: 460 },
    "wide-bowls":       { widths: [480, 566], w: 566, h: 360 },
    "cover-magazine":   { widths: [480, 770], w: 770, h: 560 },
    "poster-pure":      { widths: [480, 960], w: 960, h: 1280 },
    "poster-reset":     { widths: [480, 960], w: 960, h: 1280 },
    "poster-glow":      { widths: [480, 960], w: 960, h: 1280 },
    "poster-silence":   { widths: [480, 960], w: 960, h: 1280 },
    "photo-massage":    { widths: [480, 566], w: 566, h: 772 },
    "photo-hammam":     { widths: [480, 566], w: 566, h: 772 },
    "photo-moroccan":   { widths: [480, 566], w: 566, h: 772 },
    "photo-facial":     { widths: [480, 566], w: 566, h: 772 },
    "detail-back":      { widths: [248], w: 248, h: 232 },
    "detail-nails":     { widths: [248], w: 248, h: 237 },
    "detail-chocolate": { widths: [315], w: 315, h: 190 },
    "detail-foam":      { widths: [400], w: 400, h: 240 },
    "detail-brush":     { widths: [398], w: 398, h: 340 },
  };

  const CATEGORIES = [
    { id: "massage", label: "Massage" },
    { id: "hair", label: "Japanese Hair Ritual" },
    { id: "facial", label: "Facials & Skincare" },
    { id: "body", label: "Body Treatments" },
    { id: "nails", label: "Hands & Feet" },
    { id: "package", label: "Pamper Packages" },
  ];

  /* Individual services — prices are PLACEHOLDERS */
  const SERVICES = [
    { id: "aromatic-massage", feature: true, category: "massage", name: "Aromatic Massage", duration: 50, price: 650, placeholder: true,
      image: "photo-massage", alt: "Therapist's hands massaging a woman's oiled back under an olive towel",
      blurb: "Warm essential oils, slow long strokes, and fifty quiet minutes that belong only to you." },
    { id: "relaxing-massage", category: "massage", name: "Deep Relaxing Massage", duration: 60, price: 750, placeholder: true,
      image: "detail-back", alt: "Close-up of hands pressing gently into a relaxed back",
      blurb: "Full-body Swedish-style massage that melts tension from neck to toes." },
    { id: "head-neck", category: "massage", name: "Head, Neck & Shoulders", duration: 30, price: 400, placeholder: true,
      image: "photo-massage", alt: "Therapist's hands working warm oil into a woman's shoulders",
      blurb: "A focused fix for desk-tired shoulders. Short, sweet and seriously effective." },

    { id: "japanese-hair-ritual", category: "hair", name: "Japanese Hair Ritual", duration: 60, price: 850, placeholder: true,
      image: "cover-turban", alt: "Woman with her hair wrapped in a white towel turban",
      blurb: "The famous Japanese head spa: deep scalp cleanse, steam, mask and a hypnotic head massage." },
    { id: "hair-mask", category: "hair", name: "Nourishing Hair Mask", duration: 30, price: 350, placeholder: true,
      image: "detail-foam", alt: "Ceramic bowls of white foam and chocolate mask beside a towel",
      blurb: "Rich conditioning mask and scalp treatment for soft, glossy lengths." },

    { id: "golden-facial", feature: true, category: "facial", name: "Golden Facial", duration: 60, price: 900, placeholder: true,
      image: "photo-facial", alt: "Woman with eyes closed as a golden mask is brushed onto her cheek",
      blurb: "Our signature glow: a luminous gold mask that leaves skin bright, plump and dewy." },
    { id: "dermaplaning", category: "facial", name: "Dermaplaning Facial", duration: 45, price: 750, placeholder: true,
      image: "detail-brush", alt: "Brush applying a golden facial mask to the cheek",
      blurb: "Gentle exfoliation that sweeps away dullness and peach fuzz for a glass-smooth finish." },
    { id: "underarm-facial", category: "facial", name: "Underarm Facial", duration: 30, price: 350, placeholder: true,
      image: "detail-brush", alt: "Facial brush applying a treatment mask",
      blurb: "Brightening, smoothing care for an area that deserves a little love too." },

    { id: "moroccan-bath", category: "body", name: "Moroccan Bath", duration: 60, price: 600, placeholder: true,
      image: "photo-moroccan", alt: "Bowls of Moroccan black soap and green mud on warm stone beside an olive towel",
      blurb: "Black soap, kessa scrub and mud mask, with sauna and steam included." },
    { id: "turkish-bath", feature: true, category: "body", name: "Turkish Bath", duration: 75, price: 750, placeholder: true,
      image: "photo-hammam", alt: "Steam rising in a stone hammam with bowls of foam and chocolate mask",
      blurb: "The full hammam experience: sauna, steam, foam and a head-to-toe polish." },
    { id: "chocolate-mask", category: "body", name: "Chocolate Body Mask", duration: 45, price: 650, placeholder: true,
      image: "detail-chocolate", alt: "Speckled ceramic bowl filled with glossy chocolate body mask",
      blurb: "A cocoa wrap that's as indulgent as it sounds. Silky skin, sweet scent." },

    { id: "manicure", category: "nails", name: "Hand Manicure", duration: 30, price: 250, placeholder: true,
      image: "detail-nails", alt: "Freshly manicured hands resting on bare feet over a soft towel",
      blurb: "Shape, cuticle care and a hand massage. Without color." },
    { id: "mani-pedi", category: "nails", name: "Pedicure & Manicure", duration: 75, price: 500, placeholder: true,
      image: "detail-nails", alt: "Soft, cared-for hands and feet on a plush towel",
      blurb: "The full hands-and-feet treat with soak, scrub and massage. Without color." },
  ];

  /* The Ritual Collection — prices are REAL (from the posters); durations are estimates */
  const PACKAGES = [
    { id: "pure", category: "package", name: "Pure", title: "The Pure Package", duration: 120, price: 950,
      poster: "poster-pure", image: "photo-moroccan",
      alt: "Bombòn Spa poster: Pure Package, 950 EGP. Moroccan bath standard with sauna and steam, Moroccan soap, Moroccan mud mask and hand manicure without color.",
      tagline: "Back to basics, beautifully.",
      items: ["Moroccan Bath, Standard (includes sauna + steam)", "Moroccan Soap", "Moroccan Mud Mask", "Hand Manicure (without color)"] },
    { id: "reset", category: "package", name: "Reset", title: "The Reset Package", duration: 110, price: 1250,
      poster: "poster-reset", image: "photo-massage",
      alt: "Bombòn Spa poster: Reset Package, 1,250 EGP. Aromatic massage 50 minutes and pedicure and manicure without color.",
      tagline: "For when you need to press restart.",
      items: ["Aromatic Massage (50 minutes)", "Pedicure & Manicure (without color)"] },
    { id: "glow", category: "package", name: "Glow", title: "The Glow Package", duration: 120, price: 1400,
      poster: "poster-glow", image: "photo-facial",
      alt: "Bombòn Spa poster: Glow Package, 1,400 EGP. Golden facial, dermaplaning facial and underarm facial.",
      tagline: "Lit from within. Literally golden.",
      items: ["Golden Facial", "Dermaplaning Facial", "Underarm Facial"] },
    { id: "silence", category: "package", name: "Silence", title: "The Silence Package", duration: 180, price: 1900,
      poster: "poster-silence", image: "photo-hammam",
      alt: "Bombòn Spa poster: Silence Package, 1,900 EGP. Turkish bath with sauna and steam, Moroccan soap, Moroccan mud mask, foam mask, chocolate mask, hair mask and aromatic massage 50 minutes.",
      tagline: "The whole day, the whole ritual, total quiet.",
      items: ["Turkish Bath (includes sauna + steam)", "Moroccan Soap", "Moroccan Mud Mask", "Foam Mask", "Chocolate Mask", "Hair Mask", "Aromatic Massage (50 minutes)"] },
  ];

  const SERVICES_POSTER_ALT = "Bombòn Spa services menu: Baths, Body Wraps, Massage, Japanese Head Spa, Body Sugaring & Waxing, Pedicure & Manicure, Nails, Facial & Skin Care and Bridal Packages";

  /* Gallery order is designed for a gap-free 4-column grid (tall = 2 rows, wide = 2 columns) */
  const LOOKBOOK = [
    { image: "cover", caption: "The cover: Your Little Escape", size: "tall", alt: "Bombòn Spa menu cover: a woman in a towel turban and sage robe reads a Self Care magazine by candlelight, hand to her mouth in surprise" },
    { image: "photo-massage", caption: "Aromatic massage, fifty minutes", size: "tall", alt: "Therapist's hands massaging a woman's oiled back under an olive towel" },
    { image: "wide-bowls", caption: "Foam, chocolate & golden oil", size: "wide", alt: "Speckled ceramic bowls of white foam mask and chocolate mask beside a bottle of amber oil on warm stone" },
    { image: "cover-magazine", caption: "Required reading: Self Care", size: "wide", alt: "Close-up of hands holding an open magazine titled Self Care" },
    { image: "photo-facial", caption: "The Golden Facial", size: "tall", alt: "Woman with eyes closed as a golden mask is brushed onto her cheek" },
    { image: "poster-silence", caption: "Ritual Nº 4: Silence", size: "tall", alt: PACKAGES[3].alt },
    { image: "detail-nails", caption: "Hands & feet, without color", size: "tall", alt: "Freshly manicured hands resting on bare feet over a soft towel" },
    { image: "photo-hammam", caption: "Steam, stone & foam", size: "tall", alt: "Steam rising in a stone hammam with bowls of foam and chocolate mask" },
    { image: "photo-moroccan", caption: "Black soap & green mud", size: "tall", alt: "Bowls of Moroccan black soap and green mud on warm stone beside an olive towel" },
    { image: "cover-face", caption: "Oh, that glow", size: "tall", alt: "A woman in a white towel turban touches her lips in delighted surprise" },
    { image: "poster-glow", caption: "Ritual Nº 3: Glow", size: "tall", alt: PACKAGES[2].alt },
    { image: "poster-pure", caption: "Ritual Nº 1: Pure", size: "tall", alt: PACKAGES[0].alt },
    { image: "services", caption: "Our Services", size: "tall", alt: SERVICES_POSTER_ALT },
    { image: "poster-reset", caption: "Ritual Nº 2: Reset", size: "tall", alt: PACKAGES[1].alt },
    { image: "detail-foam", caption: "Foam mask, freshly whipped", size: "wide", alt: "Ceramic bowls of white foam and chocolate mask beside a towel" },
    { image: "detail-chocolate", caption: "The chocolate mask", size: "wide", alt: "Speckled ceramic bowl filled with glossy chocolate body mask" },
  ];


  /* ⚠ PLACEHOLDER testimonials: replace with real guest reviews before launch */
  const TESTIMONIALS = [
    { quote: "I walked in stressed and walked out floating. The Japanese hair ritual is pure magic.", name: "Guest review", detail: "Japanese Hair Ritual" },
    { quote: "Finally a ladies-only space where I can truly switch off. The Silence package is worth every pound.", name: "Guest review", detail: "Silence Package" },
    { quote: "The Golden Facial gave me a glow that lasted all week. Booking my sister in next.", name: "Guest review", detail: "Golden Facial" },
    { quote: "Warm, spotless and so calm. The Buy 1 Take 1 offer made it a perfect girls' day.", name: "Guest review", detail: "Buy 1, Take 1" },
  ];

  return { BUSINESS, IMAGES, SERVICES_POSTER_ALT, CATEGORIES, SERVICES, PACKAGES, LOOKBOOK, TESTIMONIALS,
    ALL: SERVICES.concat(PACKAGES) };
})();
