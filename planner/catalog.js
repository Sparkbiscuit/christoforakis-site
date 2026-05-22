/* =====================================================================
   Compass — Middlebury course catalog (curated subset)
   ---------------------------------------------------------------------
   This file is a hand-curated database of Middlebury courses with their
   official catalog data. It is loaded by planner/index.html via a plain
   <script> tag so it works on file:// and any static host (no fetch / CORS).

   To add a course:
     - Either append a new entry to COURSES below and reload, OR
     - Use the in-app "Catalog → + Add" button which stores user-added
       courses in localStorage so they survive without editing this file.

   `verified: true`  — sourced from catalog.middlebury.edu via search.
   `verified: false` — best-guess from department descriptions; double-check
                       before relying on tags.

   Tags reference:
     Distribution:  DIST_LIT DIST_ART DIST_PHL DIST_HIS
                    DIST_SCI DIST_DED DIST_SOC DIST_LNG
     C&C:           CC_EUR CC_AMR CC_NOR CC_NOA CC_SOA CC_MDE CC_SAF CC_AAL CC_CMP
     College admin: CW_FIRST CW_SECOND WINTER_TERM PE
     NSCI major:    NSCI_BG_PSYC NSCI_BG_BIO NSCI_BG_CHEM NSCI_BG_STATS
                    NSCI_FOUND_251 NSCI_FOUND_252
                    NSCI_ELEC_BIO NSCI_ELEC_PSYC NSCI_ELEC_PHIL NSCI_SENIOR
     Med prereqs:   MED_CHEM_GEN MED_CHEM_ORG MED_CHEM_BIO
                    MED_BIO MED_PHYS MED_PSYC MED_STATS MED_MATH MED_ENG
   ===================================================================== */

window.COMPASS_CATALOG = {
  version: "2026-05-22",
  source: "Middlebury College Course Catalog (catalog.middlebury.edu) + Health Professions advising pages, sampled.",
  courses: [
    /* -------------------- Neuroscience (NSCI) -------------------- */
    { code: "NSCI 0251", title: "Fundamentals of Cellular and Molecular Neuroscience", credits: 1,
      tags: ["NSCI_FOUND_251","DIST_SCI"], prereqs: ["BIOL 0145"],
      notes: "Open to non-majors and seniors by waiver only. AP biology does not satisfy the BIOL 0145 prereq.",
      verified: true },
    { code: "NSCI 0252", title: "Fundamentals of Behavioral Neuroscience", credits: 1,
      tags: ["NSCI_FOUND_252","DIST_SCI"], prereqs: ["PSYC 0105","NSCI 0251"],
      notes: "Open to NSCI majors only; others by approval.",
      verified: true },
    { code: "NSCI 0320", title: "Clinical Neuroscience", credits: 1,
      tags: ["NSCI_ELEC_BIO","DIST_SCI"], prereqs: ["NSCI 0251"],
      notes: "Biological grouping elective.",
      verified: true },
    { code: "NSCI 0410", title: "Neural Coding", credits: 1,
      tags: ["NSCI_ELEC_BIO","DIST_SCI"], prereqs: ["NSCI 0251"],
      notes: "Senior-seminar–level biological elective.",
      verified: true },
    { code: "NSCI 0418", title: "Psychobiology & Sex Differences", credits: 1,
      tags: ["NSCI_ELEC_PSYC","DIST_SCI"], prereqs: ["PSYC 0105"],
      notes: "Cross-listed with PSYC 0418. Psychological grouping elective / senior seminar.",
      verified: true },
    { code: "NSCI 0437", title: "Social and Emotional Brain", credits: 1,
      tags: ["NSCI_ELEC_PSYC","DIST_SCI"], prereqs: ["PSYC 0105"],
      notes: "Cross-listed with PSYC 0437. Psychological grouping elective.",
      verified: true },
    { code: "NSCI 0500", title: "Senior Research", credits: 1,
      tags: ["NSCI_SENIOR"], prereqs: [],
      notes: "One option for senior work; the others are NSCI 0700/0701.",
      verified: true },
    { code: "NSCI 0700", title: "Senior Thesis I", credits: 1,
      tags: ["NSCI_SENIOR"], prereqs: [], verified: true },
    { code: "NSCI 0701", title: "Senior Thesis II", credits: 1,
      tags: ["NSCI_SENIOR"], prereqs: ["NSCI 0700"], verified: true },

    /* -------------------- Biology (BIOL) -------------------- */
    { code: "BIOL 0140", title: "Ecology and Evolution", credits: 1,
      tags: ["DIST_SCI"], prereqs: [],
      notes: "Often paired with BIOL 0145 to complete the biology foundation.",
      verified: false },
    { code: "BIOL 0145", title: "Cell Biology and Genetics", credits: 1,
      tags: ["DIST_SCI","NSCI_BG_BIO","MED_BIO"], prereqs: [],
      notes: "Required for the NSCI major. 3 hrs lecture / 3 hrs lab.",
      verified: true },
    { code: "BIOL 0225", title: "Human Genetics", credits: 1,
      tags: ["DIST_SCI","MED_BIO"], prereqs: ["BIOL 0145"], verified: true },

    /* -------------------- Chemistry (CHEM) -------------------- */
    { code: "CHEM 0102", title: "Foundations of Chemistry", credits: 1,
      tags: ["DIST_SCI"], prereqs: [],
      notes: "Formerly CHEM 0103. For students with little/no prior chemistry.",
      verified: true },
    { code: "CHEM 0105", title: "General Chemistry", credits: 1,
      tags: ["DIST_SCI","NSCI_BG_CHEM","MED_CHEM_GEN"], prereqs: [],
      notes: "Formerly CHEM 0104. General chemistry with lab.",
      verified: true },
    { code: "CHEM 0205", title: "Organic Chemistry I", credits: 1,
      tags: ["DIST_SCI","MED_CHEM_GEN","MED_CHEM_ORG"], prereqs: ["CHEM 0105"],
      notes: "Formerly CHEM 0203. At Midd, CHEM 0105 + CHEM 0205 together complete the 2-credit Gen Chem med-school prereq.",
      verified: true },
    { code: "CHEM 0305", title: "Organic Chemistry II", credits: 1,
      tags: ["DIST_SCI","MED_CHEM_ORG"], prereqs: ["CHEM 0205"], verified: true },
    { code: "CHEM 0322", title: "Biochemistry of Macromolecules", credits: 1,
      tags: ["DIST_SCI","MED_CHEM_BIO","NSCI_ELEC_BIO"], prereqs: ["CHEM 0205"],
      notes: "Often counts as both the Biochemistry med-school prereq and an NSCI biological elective — confirm with the NSCI coordinator before relying on the dual count.",
      verified: true },

    /* -------------------- Psychology (PSYC) -------------------- */
    { code: "PSYC 0105", title: "Introduction to Psychology", credits: 1,
      tags: ["DIST_SOC","NSCI_BG_PSYC","MED_PSYC"], prereqs: [],
      verified: true },
    { code: "PSYC 0201", title: "Psychological Statistics", credits: 1,
      tags: ["DIST_DED","NSCI_BG_STATS","MED_STATS"], prereqs: ["PSYC 0105"],
      notes: "Not open to students who have completed MATH/STAT 0116, STAT 0201, or ECON 0210.",
      verified: true },
    { code: "PSYC 0203", title: "Social Psychology", credits: 1,
      tags: ["DIST_SOC"], prereqs: ["PSYC 0105"], verified: true },
    { code: "PSYC 0206", title: "Brain Plasticity", credits: 1,
      tags: ["DIST_SCI","NSCI_ELEC_PSYC"], prereqs: ["PSYC 0105"],
      notes: "Open to PSYC, ESCP, and NSCI majors. Open to seniors by waiver only.",
      verified: true },
    { code: "PSYC 0418", title: "Psychobiology and Sex Differences", credits: 1,
      tags: ["DIST_SCI","NSCI_ELEC_PSYC"], prereqs: ["PSYC 0105"],
      notes: "Cross-listed as NSCI 0418.", verified: true },
    { code: "PSYC 0437", title: "Social and Emotional Brain", credits: 1,
      tags: ["DIST_SCI","NSCI_ELEC_PSYC"], prereqs: ["PSYC 0105"],
      notes: "Cross-listed as NSCI 0437.", verified: true },

    /* -------------------- Physics (PHYS) -------------------- */
    { code: "PHYS 0108", title: "Physics of Motion", credits: 1,
      tags: ["DIST_SCI","MED_PHYS"], prereqs: [],
      notes: "Algebra-based intro mechanics. Cannot earn credit for both 0108 and 0109.",
      verified: true },
    { code: "PHYS 0109", title: "Introductory Mechanics", credits: 1,
      tags: ["DIST_SCI","MED_PHYS"], prereqs: ["MATH 0121"],
      notes: "Calculus-based. Required for the physics major. Cannot earn credit for both 0108 and 0109.",
      verified: true },
    { code: "PHYS 0110", title: "Introductory Electricity & Magnetism", credits: 1,
      tags: ["DIST_SCI","MED_PHYS"], prereqs: ["PHYS 0108"],
      notes: "Physics II — typical second-semester intro course.",
      verified: false },

    /* -------------------- Math (MATH) -------------------- */
    { code: "MATH 0116", title: "Introduction to Statistics", credits: 1,
      tags: ["DIST_DED","MED_STATS"], prereqs: [],
      notes: "Cross-listed as STAT 0116. Counts as the stats med-school prereq.",
      verified: false },
    { code: "MATH 0121", title: "Calculus I", credits: 1,
      tags: ["DIST_DED","MED_MATH"], prereqs: [],
      notes: "Prerequisite: MATH 0103 or 0105, or by placement.",
      verified: true },
    { code: "MATH 0122", title: "Calculus II", credits: 1,
      tags: ["DIST_DED","MED_MATH"], prereqs: ["MATH 0121"], verified: true },

    /* -------------------- English / Writing -------------------- */
    { code: "ENGL 0103", title: "Reading Literature", credits: 1,
      tags: ["DIST_LIT","CW_SECOND","MED_ENG"], prereqs: [],
      verified: false },

    /* -------------------- Philosophy (PHIL) -------------------- */
    { code: "PHIL 0156", title: "Contemporary Moral Issues", credits: 1,
      tags: ["DIST_PHL"], prereqs: [], verified: false },

    /* -------------------- Economics / Social Sci -------------------- */
    { code: "ECON 0150", title: "Introductory Macroeconomics", credits: 1,
      tags: ["DIST_SOC"], prereqs: [], verified: false },

    /* -------------------- Political Science -------------------- */
    { code: "PSCI 0109", title: "International Politics", credits: 1,
      tags: ["DIST_SOC"], prereqs: [],
      notes: "C&C region designation varies by section/semester — confirm with the registrar.",
      verified: false },
    { code: "PSCI 0239", title: "Future Great Power Relations", credits: 1,
      tags: ["CC_CMP"], prereqs: [],
      notes: "Comparative C&C. May also carry a regional designation depending on focus.",
      verified: false },

    /* -------------------- Arts / Architecture -------------------- */
    { code: "HARC 0130", title: "Introduction to Architectural Design", credits: 1,
      tags: ["DIST_ART"], prereqs: [], verified: false },

    /* -------------------- First-Year Seminars -------------------- */
    { code: "FYSE 1118", title: "Happiness", credits: 1,
      tags: ["CW_FIRST"], prereqs: [],
      notes: "First-Year Seminar — satisfies the FYS/college-writing requirement.",
      verified: false },

    /* -------------------- Languages (GRMN) -------------------- */
    { code: "GRMN 0101", title: "Beginning German", credits: 1,
      tags: ["DIST_LNG"], prereqs: [], verified: false },
    { code: "GRMN 0102", title: "Beginning German Continued (Winter)", credits: 1,
      tags: ["WINTER_TERM"], prereqs: ["GRMN 0101"],
      notes: "Winter term offering.", verified: false },
    { code: "GRMN 0103", title: "Beginning German Continued", credits: 1,
      tags: [], prereqs: ["GRMN 0102"], verified: false },
  ],
};
