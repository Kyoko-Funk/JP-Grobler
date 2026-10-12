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
     `answer` is the position of the right option, counting from 0
     (so 0 = first option, 1 = second, and so on).
     EDIT these to real facts about the couple!                         */
  quiz: [
    {
      q: "Where did these two first meet?",
      options: ["At a church bazaar", "Leaning on the same farm fence", "A rugby match in Windhoek", "A dating app (they'll deny it)"],
      answer: 2,
      right: "Spot on. Some love stories start under the stars — theirs started next to a boerewors roll.",
      wrong: "Ag nee. That's a lovely story, but it's not theirs."
    },
    {
      q: "Who said “I love you” first?",
      options: ["{0}", "{1}", "Both at once — very rom-com", "The dog, honestly"],
      answer: 0,
      right: "Correct! And they've been unbearable ever since.",
      wrong: "Wrong — and {1} would like that on the record."
    },
    {
      q: "What's the couple's ultimate Sunday plan?",
      options: ["Brunch in town", "A braai that starts at 11 and ends at sunset", "Hiking at sunrise", "Church, then a very long nap"],
      answer: 1,
      right: "Of course. Fire, meat, family, repeat.",
      wrong: "Nice try, but there was definitely a braai involved."
    },
    {
      q: "Who is the better driver on a gravel road?",
      options: ["{0}", "{1}", "Whoever isn't holding the coffee", "Neither — the bakkie drives itself"],
      answer: 1,
      right: "Correct. {0} has accepted this. Mostly.",
      wrong: "Bold guess. We'll pretend you didn't say that in front of them."
    },
    {
      q: "Which of these would they most likely name their first dog?",
      options: ["Boerewors", "Kudu", "Ouma", "Sir Wagsalot"],
      answer: 1,
      right: "Kudu it is. Majestic, slightly stubborn — the dog, not the couple.",
      wrong: "Cute, but no. The dog has more dignity than that."
    },
    {
      q: "How many cattle would {0} trade for {1}?",
      options: ["Ten", "A hundred", "The whole herd", "Not one — {1} is priceless"],
      answer: 3,
      right: "Correct, and very diplomatic of you. Have some confetti.",
      wrong: "Careful… {1} is reading this over your shoulder."
    }
  ],

  // What they see after the quiz, depending on how many they got right first time.
  quizVerdicts: [
    { min: 6, text: "A perfect score. Are you the maid of honour, or just very nosy?" },
    { min: 4, text: "Very respectable. You've clearly been paying attention at family braais." },
    { min: 2, text: "Not bad! A few more coffees with the couple and you'll get there." },
    { min: 0, text: "Hmm. Have you two actually met? Don't worry — you're still invited." }
  ],

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
