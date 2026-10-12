/* =====================================================================
   SITE SETTINGS — the only file you need to edit.
   ---------------------------------------------------------------------
   Everything the guests read lives here. Change the words between the
   quote marks, save, and refresh the page. Keep the quote marks and the
   commas at the ends of lines — they're how the computer reads this.
   ===================================================================== */

window.SITE = {

  /* --- The couple ---------------------------------------------------- */
  names: ["Jean-Pierre", "Juan-Marie"], // first names (used all over the site)
  surnames: ["Grobler", "Van Zyl"],     // shown under the names on the opening screen
  photo: "images/couple.jpg",          // ← drop their photo in /images with this name
  venueNickname: "Out of Nature",

  /* --- The day ------------------------------------------------------- */
  dateISO: "2027-04-10T16:00:00+02:00", // used for the countdown (Namibian time)
  dateLong: "Saturday, 10 April 2027",
  dateShort: "10 · 04 · 2027",
  time: "16:00",
  arriveBy: "15:30",
  rsvpBy: "31 January 2027",            // ← EDIT if you want a different deadline

  /* --- The venue ----------------------------------------------------- */
  venue: {
    name: "Out of Nature Country Lodge",
    blurb:
      "Tucked into the camelthorn and the long golden grass, Out of Nature is the kind of place " +
      "that makes city folk go quiet and farm folk feel right at home. Big skies, a bigger " +
      "sunset, and enough space for the tannies to dance without anyone getting a heel in the shin.",
    address: "±30 km south of Windhoek, off the B1, Khomas Region, Namibia",
    directions: [
      "From Windhoek, take the B1 south towards Rehoboth.",
      "About 30 km out of town, keep an eye out for the Out of Nature signs on the B1.",
      "Follow the signs to the lodge. If you see Rehoboth, you've gone too far — turn around, nobody saw anything.",
      "There's gravel at the end. Drive like your oupa is in the back seat."
    ],
    mapsQuery: "Out of Nature Country Lodge, Windhoek, Namibia", // what Google Maps searches for
    accommodationNote:
      "Rooms and glamping tents on site are limited — book early if you'd like to stay over and skip the night drive."
  },

  /* --- Dress code ---------------------------------------------------- */
  dressCode: {
    title: "Garden Formal, Farm Sensible",
    lines: [
      "Think linen, soft florals, crisp shirts and your good boots.",
      "Ceremony is on grass — stilettos will aerate the lawn. Block heels are your friend.",
      "April evenings cool down quickly out there. Bring a shawl or a jacket (and maybe a spare for your plus-one).",
      "Please leave the white to the one who's earned it."
    ]
  },

  /* --- The gate (screen two) ---------------------------------------- */
  gate: {
    question: "Before we go any further… will you come and celebrate with us?",
    yes: "Ja, natuurlik!",
    no: "No",
    // The "No" button changes its mind as it runs away:
    noTaunts: [
      "No", "Are you sure?", "Really?", "Ag, come on", "Nope, not this one",
      "Try the other button", "Missed!", "Still no?", "Last chance…", "Fine, I'm tiny now"
    ],
    noCaught: "Impressive reflexes. Unfortunately that button is purely decorative.",
    afterYes: "Lekker! We knew you'd say that."
  },

  /* --- The quiz (screen three) ---------------------------------------
     One question per card. Each option has its own reply.
     Mark the right answer(s) with  right: true  — a question can have
     more than one. Wrong answers tease, then let the guest try again.
     {0} = groom's first name, {1} = bride's first name.                */
  quiz: [
    {
      tag: "The warm-up",
      q: "Who's always running late?",
      options: [
        { text: "{1}", right: true, reply: "Fashionably. Always fashionably." },
        { text: "{0}", right: true, reply: "He'll blame the dogs. Every time." }
      ]
    },
    {
      tag: "The dress code",
      q: "Are you planning on wearing white?",
      options: [
        { text: "Yes", reply: "Bold. There's only one woman in white here, and it isn't you. Try again." },
        { text: "No", right: true, reply: "Good. We're going to get along just fine." }
      ]
    },
    {
      tag: "The footwear",
      q: "Will the groom be wearing vellies with his suit?",
      options: [
        { text: "No", reply: "Have you met him? Try again." },
        { text: "Yes", right: true, reply: "Obviously. Dusted off and everything." }
      ]
    },
    {
      tag: "The planning",
      q: "Do you trust the groom to have planned this wedding?",
      options: [
        { text: "Yes", reply: "Brave. Misguided, but brave." },
        { text: "No", right: true, reply: "Smart. That's the bride's job." }
      ]
    },
    {
      tag: "The farm one",
      q: "What's he more attached to: his bakkie or his bride?",
      options: [
        { text: "His bakkie", reply: "We'll pretend you didn't say that." },
        { text: "His bride", right: true, reply: "Correct answer. Well done." }
      ]
    },
    {
      tag: "The dogs",
      q: "How many dogs does he consider his actual children?",
      options: [
        { text: "1", reply: "Lower than he'd like. Try again." },
        { text: "2", reply: "Technically correct. Emotionally? Lower than he'd like. Try again." },
        { text: "Just Lily & Peanut", reply: "Right names, wrong attitude. Try again." },
        { text: "All of them", right: true, reply: "Obviously. They come before you too." }
      ],
      // A little polaroid that drops in on the right answer.
      // Save the pug photo as images/pugs.jpg — until then, nothing shows.
      photo: "images/pugs.jpg",
      photoCaption: "Lily & Peanut, the firstborns"
    }
  ],

  // Shown after the last card.
  quizEnd: {
    eyebrow: "Results are in",
    title: "You passed.",
    text: "Barely. Now let's get you to the wedding.",
    button: "On to the wedding"
  },

  /* --- RSVP ---------------------------------------------------------- */
  rsvp: {
    maxPlusOnes: 4,
    dietary: [
      { value: "none",        label: "Nothing — I'll eat anything that stood still long enough" },
      { value: "vegetarian",  label: "Vegetarian (yes, at a farm wedding — we respect the bravery)" },
      { value: "halaal",      label: "Halaal" },
      { value: "no-nuts",     label: "No nuts, please — the ones at our table are quite enough 😉" }
    ],
    thanksYes: "Baie dankie! Your seat is warm and waiting. Practise your langarm.",
    thanksNo: "We're sad, but we understand. We'll raise a glass for you — and maybe talk about you a little."
  },

  /* --- Scrapbook ----------------------------------------------------- */
  scrapbook: {
    maxVideoSeconds: 15,
    maxFileMB: 50
  },

  /* =====================================================================
     BEHIND-THE-SCENES CONNECTIONS (see README.md for step-by-step setup)
     Leave these blank and the site runs in "demo mode": everything works
     on screen, but nothing is saved or emailed.
     ===================================================================== */
  backend: {
    // 1) Google Apps Script web-app URL (handles RSVP spreadsheet + emails)
    googleScriptUrl: "",

    // 2) Supabase project (stores scrapbook photos & videos)
    supabaseUrl: "",       // looks like https://abcdefgh.supabase.co
    supabaseKey: "",       // the "anon" / "publishable" key — safe to put here
    bucket: "scrapbook"
  }
};
