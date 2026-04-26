export interface EmotionQuestion {
  q: string;
  opts: string[];
}

export interface EmotionInfo {
  ico: string;
  color: string;
  quotes: string[];
  activities: string[];
  insights: Record<string, string>;
}

export const EMO_QUESTIONS: Record<string, EmotionQuestion[]> = {
  Happy: [
    { q: "Is your baby smiling and making eye contact with you?", opts: ["Yes, lots of big smiles!", "A little bit", "Not really, just calm"] },
    { q: "How active is your baby feeling right now?", opts: ["Very active and energetic", "Calm and content", "Quiet and resting"] },
    { q: "When did your baby last feed?", opts: ["Very recently (under 1 hour)", "1–2 hours ago", "More than 2 hours ago"] },
    { q: "How did your baby sleep last night?", opts: ["Slept very well", "Slept okay with some waking", "Slept poorly or cried a lot"] },
  ],
  Sad: [
    { q: "Is your baby making soft whimpering sounds?", opts: ["Yes, continuously", "On and off", "Silent but looks sad"] },
    { q: "When was your baby's nappy last changed?", opts: ["Just changed it", "1–2 hours ago", "Not sure / it has been a while"] },
    { q: "Has your baby been fed recently?", opts: ["Yes, just fed", "About 2 hours ago", "Not fed in 3 or more hours"] },
    { q: "Is your baby reaching out to be held?", opts: ["Yes, wants to be held", "Sometimes", "Wants to be left alone"] },
  ],
  Suffocated: [
    { q: "Is the room well ventilated or air-conditioned?", opts: ["Yes, good airflow", "A bit stuffy", "No, very closed room"] },
    { q: "How is your baby dressed right now?", opts: ["Light and loose clothing", "Somewhat bundled", "Bundled up heavily"] },
    { q: "Has your baby been burped after the last feed?", opts: ["Yes, burped well", "Not burped recently", "Baby has not fed recently"] },
    { q: "Is your baby's nose clear and breathing freely?", opts: ["Completely clear", "Slightly runny or blocked", "Noticeably congested"] },
  ],
  Cry: [
    { q: "How intense is your baby's crying right now?", opts: ["Mild whimpering", "Moderate steady crying", "Very loud / inconsolable"] },
    { q: "Did the crying start suddenly or build up?", opts: ["Yes, out of nowhere", "Built up gradually", "On and off for a while"] },
    { q: "Have you checked nappy, hunger and temperature already?", opts: ["Checked all three, all fine", "Checked some of them", "Not checked yet"] },
    { q: "Is your baby arching their back while crying?", opts: ["Yes, back arching", "No arching", "Hard to tell"] },
  ],
};

export const EMO_DATA: Record<string, EmotionInfo> = {
  Happy: {
    ico: "😊", color: "#15803d",
    quotes: [
      "A happy baby is a growing baby — treasure every smile!",
      "Joy in tiny moments is what childhood is made of.",
      "Your love makes baby's world bright and safe.",
      "This smile is pure magic. Cherish it always.",
    ],
    activities: [
      "Engage in gentle play — peek-a-boo or soft colourful toys",
      "Maintain warm eye contact and mirror baby's smiles back",
      "Try tummy time to build strength during this good mood",
      "Sing or hum softly to extend this happy moment",
      "Take a short outdoor walk together if weather allows",
    ],
    insights: {
      "Very active and energetic": "An active happy baby is building motor skills! Encourage movement with safe toys and tummy time.",
      "Slept very well": "Good sleep directly impacts mood. Maintain this sleep routine — it's clearly working beautifully for your baby.",
      "More than 2 hours ago": "Baby is happy but may need feeding soon. Offer a feed proactively to keep the good mood going.",
    },
  },
  Sad: {
    ico: "😢", color: "#1e40af",
    quotes: [
      "A little comfort goes a very long way for baby.",
      "Babies feel deeply — your presence is the greatest remedy.",
      "Every tear is a word baby cannot yet say.",
      "Hold baby close — warmth heals more than we know.",
    ],
    activities: [
      "Gently pick baby up and hold skin-to-skin on your chest",
      "Check and change nappy immediately if needed",
      "Offer a feed if it has been 2 or more hours",
      "Softly hum or play a gentle lullaby",
      "Rock baby slowly in your arms or a rocking chair",
    ],
    insights: {
      "Yes, continuously": "Continuous whimpering often means baby needs comfort urgently. Skin-to-skin contact is the fastest remedy.",
      "Not sure / it has been a while": "A wet or soiled nappy is the #1 cause of mild sadness. Check and change immediately.",
      "Not fed in 3 or more hours": "Hunger is very likely the cause. Offer a feed right away — mood should improve within minutes.",
      "Yes, wants to be held": "Baby needs your warmth and reassurance. Pick them up and hold close — this is not spoiling, it's essential bonding.",
    },
  },
  Suffocated: {
    ico: "😫", color: "#92400e",
    quotes: [
      "Fresh air and open space bring peace to little ones.",
      "Baby's comfort starts with breathing freely.",
      "A cool calm environment is baby's best friend.",
      "Simple changes in the environment can transform baby's mood.",
    ],
    activities: [
      "Move baby to a well-ventilated, cooler room immediately",
      "Loosen tight clothing or remove extra layers",
      "Burp baby thoroughly to release trapped gas",
      "Use a saline nasal drop if congestion is present",
      "Fan the room gently — avoid direct airflow on baby",
    ],
    insights: {
      "No, very closed room": "Poor ventilation is a top cause of discomfort in babies. Open a window or move rooms immediately.",
      "Bundled up heavily": "Babies regulate temperature poorly — overheating is more dangerous than slight chill. Remove layers now.",
      "Noticeably congested": "Nasal congestion makes breathing hard for babies. Use saline drops and a soft nasal aspirator gently.",
    },
  },
  Cry: {
    ico: "😭", color: "#b91c1c",
    quotes: [
      "Tears are words the heart cannot yet say — listen closely.",
      "Every cry is communication — you are baby's whole world.",
      "Responding to cries builds trust that lasts a lifetime.",
      "You are doing the right thing by paying attention.",
    ],
    activities: [
      "Use HALT check: Hungry • Angry • Lonely • Tired",
      "Check body temperature — fever above 100.4°F needs doctor",
      "Try the 5 S's: Swaddle, Side, Shush, Swing, Suck",
      "Check nappy and change if wet or soiled",
      "Try skin-to-skin contact on your bare chest",
    ],
    insights: {
      "Very loud / inconsolable": "Inconsolable crying lasting more than 2 hours may signal colic or pain. Contact your paediatrician.",
      "Yes, out of nowhere": "Sudden intense crying can indicate gas pain or overstimulation. Try the 5 S's technique immediately.",
      "Yes, back arching": "Back arching during crying is a classic sign of reflux or gas discomfort. Keep baby upright after feeds.",
      "Not checked yet": "Start with the basics immediately: check nappy, offer feed, check temperature — most cries resolve with these steps.",
    },
  },
};
