export const ACCESSIBILITY_FEATURE_MAP = {
  blindness: {
    label: 'Blindness',
    features: [
      { text: 'Voice commands for hands-free navigation', available: true },
    ],
  },
  low_vision: {
    label: 'Low Vision',
    features: [
      { text: 'Smart contrast fixer (AAA-level contrast)', available: true },
    ],
  },
  color_vision_deficiency: {
    label: 'Color Vision Deficiency',
    features: [
      { text: 'Color-blind aware contrast adjustments', available: true },
    ],
  },
  dyslexia: {
    label: 'Dyslexia',
    features: [
      { text: 'Syllable highlighting while reading', available: true },
      { text: 'Reading Ruler', available: true },
      
    ],
  },
  adhd_focus_difficulties: {
    label: 'ADHD / Focus Difficulties',
    features: [
      { text: 'Calm theme — reduced motion + decluttered layout', available: true },
       { text: 'Reading Ruler', available: true }
    ],
  },
  autism_sensory_sensitivity: {
    label: 'Autism / Sensory Sensitivity',
    features: [
      { text: 'Calm theme — desaturated colors + reduced motion', available: true },
    ],
  },
  motor_impairment: {
    label: 'Motor Impairment',
    features: [
      { text: 'Skip links for keyboard navigation', available: true },
      { text: 'Voice commands for hands-free control', available: true },
    ],
  },
  temporary_impairment: {
    label: 'Temporary Impairment',
    features: [
      { text: 'Calm theme — reduced motion for easier reading', available: true },
    ],
  },
  // deaf_hard_of_hearing: {
  //   label: 'Deaf / Hard of Hearing',
  //   features: [
  //     { text: 'Caption-first video playback', available: false },
  //   ],
  // },
};

/** Returns the matched feature groups for whichever needs the user selected. */
export function getMatchedFeatureGroups(accessibilityNeeds = []) {
  return accessibilityNeeds
    .map((need) => ({ need, ...ACCESSIBILITY_FEATURE_MAP[need] }))
    .filter((group) => group.label);
}