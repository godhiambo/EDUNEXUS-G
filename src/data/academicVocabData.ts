export interface ContextExample {
  context: string;
  sentence: string;
}

export interface AcademicTerm {
  word: string;
  type: string; // e.g., "noun", "verb", "adjective"
  definition: string;
  example?: string;
  examples?: ContextExample[];
  category: 'STEM' | 'Humanities' | 'General Academic' | 'Analysis & Inquiry';
}

export const ACADEMIC_VOCAB_MAP: Record<string, AcademicTerm> = {
  photosynthesis: {
    word: "Photosynthesis",
    type: "noun",
    definition: "The biological process by which green plants turn sunlight, carbon dioxide, and water into chemical energy (glucose) and release oxygen.",
    example: "Leaves contain chlorophyll which absorbs sunlight for photosynthesis.",
    category: "STEM"
  },
  mitochondria: {
    word: "Mitochondria",
    type: "noun",
    definition: "Membrane-bound cell organelles that generate most of the chemical energy (ATP) needed to power the cell's biochemical reactions.",
    example: "Mitochondria are often referred to as the powerhouse of the cell.",
    category: "STEM"
  },
  chlorophyll: {
    word: "Chlorophyll",
    type: "noun",
    definition: "The primary green pigment found in plants and algae that captures light energy during photosynthesis.",
    example: "In autumn, leaves lose chlorophyll and change color.",
    category: "STEM"
  },
  hypothesis: {
    word: "Hypothesis",
    type: "noun",
    definition: "A testable prediction or proposed explanation made on the basis of limited evidence as a starting point for scientific investigation.",
    example: "The student formulated a hypothesis that higher temperatures increase reaction rates.",
    category: "Analysis & Inquiry"
  },
  methodology: {
    word: "Methodology",
    type: "noun",
    definition: "A system of principles, rules, and procedures employed in a particular field of research or study.",
    example: "The research team detailed their data collection methodology in the appendix.",
    category: "Analysis & Inquiry"
  },
  empirical: {
    word: "Empirical",
    type: "adjective",
    definition: "Based on, concerned with, or verifiable by observation or experiment rather than theory or logic alone.",
    example: "The scientist gathered empirical evidence through repeated lab trials.",
    category: "Analysis & Inquiry"
  },
  synthesis: {
    word: "Synthesis",
    type: "noun",
    definition: "The combination of multiple ideas, components, or pieces of evidence into a coherent whole.",
    example: "Her essay presented a synthesis of primary historical sources and modern analysis.",
    category: "General Academic"
  },
  paradigm: {
    word: "Paradigm",
    type: "noun",
    definition: "A typical model, pattern, or foundational conceptual framework in a discipline.",
    example: "The discovery of DNA created a new paradigm in biological sciences.",
    category: "General Academic"
  },
  correlation: {
    word: "Correlation",
    type: "noun",
    definition: "A mutual relationship or statistical connection between two or more variables.",
    example: "Researchers observed a strong positive correlation between study time and exam scores.",
    category: "Analysis & Inquiry"
  },
  quantitative: {
    word: "Quantitative",
    type: "adjective",
    definition: "Relating to, measuring, or expressed in numerical terms or quantities.",
    example: "Quantitative analysis relies on measurable numbers and statistical metrics.",
    category: "Analysis & Inquiry"
  },
  qualitative: {
    word: "Qualitative",
    type: "adjective",
    definition: "Relating to descriptions, characteristics, or qualities rather than numerical measurements.",
    example: "Interviews provided qualitative insights into how students felt during the experiment.",
    category: "Analysis & Inquiry"
  },
  ecosystem: {
    word: "Ecosystem",
    type: "noun",
    definition: "A biological community of interacting organisms and their physical environment.",
    example: "Coral reefs support a vibrant and delicate marine ecosystem.",
    category: "STEM"
  },
  thermodynamics: {
    word: "Thermodynamics",
    type: "noun",
    definition: "The branch of physical science dealing with heat, work, temperature, and their relation to energy and physical properties.",
    example: "The first law of thermodynamics states that energy cannot be created or destroyed.",
    category: "STEM"
  },
  osmosis: {
    word: "Osmosis",
    type: "noun",
    definition: "The net movement of water molecules across a semipermeable membrane from lower to higher solute concentration.",
    example: "Plant roots absorb soil moisture through the process of osmosis.",
    category: "STEM"
  },
  juxtaposition: {
    word: "Juxtaposition",
    type: "noun",
    definition: "Placing two contrasting elements or ideas side by side to highlight their differences.",
    example: "The poem uses the juxtaposition of dark winter and bright spring imagery.",
    category: "Humanities"
  },
  rhetoric: {
    word: "Rhetoric",
    type: "noun",
    definition: "The art of effective or persuasive speaking or writing, using figures of speech and structural techniques.",
    example: "The speech employed powerful rhetoric to convince the audience.",
    category: "Humanities"
  },
  metaphor: {
    word: "Metaphor",
    type: "noun",
    definition: "A figure of speech where a word or phrase is applied to an object or action to which it is not literally applicable.",
    example: "Describing time as a thief is a classic literary metaphor.",
    category: "Humanities"
  },
  algorithm: {
    word: "Algorithm",
    type: "noun",
    definition: "A finite step-by-step procedure or set of rules followed to solve a problem or perform a computation.",
    example: "The search algorithm sorts millions of records in milliseconds.",
    category: "STEM"
  },
  derivative: {
    word: "Derivative",
    type: "noun",
    definition: "In calculus, a measure of how a function changes as its input changes (instantaneous rate of change).",
    example: "The derivative of position with respect to time represents velocity.",
    category: "STEM"
  },
  infrastructure: {
    word: "Infrastructure",
    type: "noun",
    definition: "The basic physical and organizational structures (e.g., roads, power grids, networks) needed for society or systems.",
    example: "The country invested heavily in renewable energy infrastructure.",
    category: "General Academic"
  },
  catalyst: {
    word: "Catalyst",
    type: "noun",
    definition: "A substance that speeds up a chemical reaction without being consumed; figuratively, an agent that triggers change.",
    example: "Enzymes act as biological catalysts in digestive processes.",
    category: "STEM"
  },
  equilibrium: {
    word: "Equilibrium",
    type: "noun",
    definition: "A state of balance where opposing forces or influences offset each other equally.",
    example: "The chemical reaction reached equilibrium when forward and reverse rates matched.",
    category: "STEM"
  },
  inference: {
    word: "Inference",
    type: "noun",
    definition: "A logical conclusion or deduction reached on the basis of evidence, clues, and prior knowledge.",
    example: "Readers draw inferences about the protagonist's motives based on her actions.",
    category: "Analysis & Inquiry"
  },
  perspective: {
    word: "Perspective",
    type: "noun",
    definition: "A particular point of view, cognitive lens, or way of regarding a topic.",
    example: "Historical analysis requires evaluating events from multiple perspectives.",
    category: "Humanities"
  },
  substantiate: {
    word: "Substantiate",
    type: "verb",
    definition: "To provide solid evidence or proof to support and validate a claim or hypothesis.",
    example: "The author included statistical charts to substantiate her main thesis.",
    category: "Analysis & Inquiry"
  },
  delineate: {
    word: "Delineate",
    type: "verb",
    definition: "To describe, outline, or portray precisely in words or diagrams.",
    example: "The teacher asked the class to delineate the causes of the revolution.",
    category: "General Academic"
  },
  articulate: {
    word: "Articulate",
    type: "verb",
    definition: "To express an idea, thought, or argument fluently, clearly, and effectively.",
    example: "The student was able to articulate a nuanced perspective during the debate.",
    category: "General Academic"
  },
  ambiguity: {
    word: "Ambiguity",
    type: "noun",
    definition: "The quality of being open to more than one interpretation; vagueness or uncertainty in meaning.",
    example: "Clear scientific definitions eliminate ambiguity in experiment instructions.",
    category: "General Academic"
  },
  benchmark: {
    word: "Benchmark",
    type: "noun",
    definition: "A standard or reference point against which performance or quality can be measured and assessed.",
    example: "The reading comprehension test served as a diagnostic benchmark.",
    category: "Analysis & Inquiry"
  },
  cognitive: {
    word: "Cognitive",
    type: "adjective",
    definition: "Relating to mental processes including perception, memory, reasoning, problem-solving, and learning.",
    example: "Cognitive development in adolescence involves abstract reasoning skills.",
    category: "Humanities"
  },
  prerequisite: {
    word: "Prerequisite",
    type: "noun",
    definition: "A required prior condition, course, or element that must be fulfilled before proceeding.",
    example: "Basic algebra is a prerequisite for advanced physics courses.",
    category: "General Academic"
  },
  comprehensive: {
    word: "Comprehensive",
    type: "adjective",
    definition: "Complete and inclusive of all or nearly all elements, aspects, or scope of a subject.",
    example: "The review chapter offers a comprehensive overview of molecular genetics.",
    category: "General Academic"
  },
  discrepancy: {
    word: "Discrepancy",
    type: "noun",
    definition: "An unexpected variance, inconsistency, or lack of agreement between two facts or figures.",
    example: "The accountant noticed a discrepancy between the receipts and total expenditure.",
    category: "Analysis & Inquiry"
  },
  fundamental: {
    word: "Fundamental",
    type: "adjective",
    definition: "Serving as an essential foundation, core principle, or primary basis.",
    example: "Understanding atomic structure is fundamental to studying chemistry.",
    category: "General Academic"
  },
  variable: {
    word: "Variable",
    type: "noun",
    definition: "A factor, quantity, or condition that can be changed, controlled, or measured in an experiment.",
    example: "The independent variable in this experiment was the amount of sunlight provided.",
    category: "Analysis & Inquiry"
  },
  consensus: {
    word: "Consensus",
    type: "noun",
    definition: "General agreement or collective opinion reached by a group or scientific community.",
    example: "The scientific consensus confirms that climate patterns are changing rapidly.",
    category: "General Academic"
  },
  hierarchy: {
    word: "Hierarchy",
    type: "noun",
    definition: "A system or organization where elements or individuals are ranked according to status or authority.",
    example: "Taxonomy arranges biological organisms in a hierarchical structure.",
    category: "General Academic"
  },
  implementation: {
    word: "Implementation",
    type: "noun",
    definition: "The process of putting a decision, plan, policy, or design into active effect.",
    example: "Effective implementation of lesson plans improves learning outcomes.",
    category: "General Academic"
  },
  precedent: {
    word: "Precedent",
    type: "noun",
    definition: "An earlier event, decision, or legal case that serves as an example or rule to guide future actions.",
    example: "The court ruling set a historic precedent for environmental protection.",
    category: "Humanities"
  },
  spectrum: {
    word: "Spectrum",
    type: "noun",
    definition: "A continuous range or sequence of related phenomena, colors, frequencies, or opinions.",
    example: "Visible light is a small portion of the electromagnetic spectrum.",
    category: "STEM"
  },
  trajectory: {
    word: "Trajectory",
    type: "noun",
    definition: "The curved path described by a projectile or object moving under force; or a path of development.",
    example: "Engineers calculated the orbital trajectory of the satellite.",
    category: "STEM"
  },
  validate: {
    word: "Validate",
    type: "verb",
    definition: "To confirm, check, or prove the accuracy, truth, or official acceptability of something.",
    example: "Further experiments were needed to validate the initial findings.",
    category: "Analysis & Inquiry"
  },
  homeostasis: {
    word: "Homeostasis",
    type: "noun",
    definition: "The state of steady internal, physical, and chemical conditions maintained by living systems.",
    example: "Sweating helps the human body maintain temperature homeostasis.",
    category: "STEM"
  },
  biodiversity: {
    word: "Biodiversity",
    type: "noun",
    definition: "The variety of plant and animal life in the world or in a particular habitat or ecosystem.",
    example: "Rainforests are famous for holding rich global biodiversity.",
    category: "STEM"
  },
  velocity: {
    word: "Velocity",
    type: "noun",
    definition: "The rate of change of an object's position with respect to time, specifying both speed and direction.",
    example: "The rocket reached an escape velocity of over 11 kilometers per second.",
    category: "STEM"
  },
  acceleration: {
    word: "Acceleration",
    type: "noun",
    definition: "The rate of change of velocity per unit of time.",
    example: "Gravity causes free-falling objects to undergo uniform acceleration.",
    category: "STEM"
  },
  friction: {
    word: "Friction",
    type: "noun",
    definition: "The resistance that one surface or object encounters when moving over another.",
    example: "Air resistance is a form of fluid friction acting on moving vehicles.",
    category: "STEM"
  },
  gravity: {
    word: "Gravity",
    type: "noun",
    definition: "The natural force that pulls mass toward the center of the earth, or toward any other physical body having mass.",
    example: "Lunar gravity causes ocean tides on Earth.",
    category: "STEM"
  },
  genome: {
    word: "Genome",
    type: "noun",
    definition: "The complete set of genetic material or DNA present in a cell or living organism.",
    example: "The Human Genome Project mapped over 20,000 human genes.",
    category: "STEM"
  },
  chromosome: {
    word: "Chromosome",
    type: "noun",
    definition: "A threadlike structure of nucleic acids and protein found in the nucleus, carrying genetic information.",
    example: "Human body cells typically contain 23 pairs of chromosomes.",
    category: "STEM"
  },
  cytoplasm: {
    word: "Cytoplasm",
    type: "noun",
    definition: "The thick jelly-like fluid solution that fills each cell and is enclosed by the cell membrane.",
    example: "Organelles float within the cytoplasm of eukaryotic cells.",
    category: "STEM"
  },
  mitosis: {
    word: "Mitosis",
    type: "noun",
    definition: "A process of cell duplication where one cell divides into two genetically identical daughter cells.",
    example: "Mitosis allows tissues to grow and repair damaged cells.",
    category: "STEM"
  },
  meiosis: {
    word: "Meiosis",
    type: "noun",
    definition: "A specialized type of cell division that reduces chromosome number by half, creating gametes.",
    example: "Meiosis produces egg and sperm cells with unique genetic variation.",
    category: "STEM"
  },
  radiation: {
    word: "Radiation",
    type: "noun",
    definition: "The emission of energy as electromagnetic waves or as moving subatomic particles through space or a medium.",
    example: "Solar radiation provides light and warmth to planet Earth.",
    category: "STEM"
  },
  solubility: {
    word: "Solubility",
    type: "noun",
    definition: "The maximum amount of solute that can dissolve in a given amount of solvent at a specific temperature.",
    example: "Salt has high water solubility compared to chalk powder.",
    category: "STEM"
  }
};

// Helper to count how many academic terms are detected in a body of text
export function getDetectedAcademicTermsCount(text: string): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let count = 0;
  for (const termKey in ACADEMIC_VOCAB_MAP) {
    const regex = new RegExp(`\\b${termKey}\\b`, 'i');
    if (regex.test(lower)) {
      count++;
    }
  }
  return count;
}

// Helper to guarantee 3 example sentences demonstrating how a word is used in different academic contexts
export function get3ContextExamplesForTerm(term: AcademicTerm): ContextExample[] {
  if (term.examples && term.examples.length >= 3) {
    return term.examples.slice(0, 3);
  }

  const examples: ContextExample[] = term.examples ? [...term.examples] : [];
  const word = term.word;
  const primaryEx = term.example || `The concept of ${word.toLowerCase()} is vital across modern academic discourse.`;

  if (term.category === 'STEM') {
    if (!examples.some(e => e.context.includes('STEM') || e.context.includes('Science'))) {
      examples.push({ context: 'STEM / Natural Sciences', sentence: primaryEx });
    }
    if (!examples.some(e => e.context.includes('Humanities') || e.context.includes('Social'))) {
      examples.push({
        context: 'Humanities & Social Studies',
        sentence: `Scholars apply the metaphor of ${word.toLowerCase()} when analyzing systemic socio-economic changes.`
      });
    }
    if (!examples.some(e => e.context.includes('Research') || e.context.includes('Inquiry'))) {
      examples.push({
        context: 'Academic Research & Essay',
        sentence: `Recent peer-reviewed literature highlights how ${word.toLowerCase()} serves as a key parameter in experimental designs.`
      });
    }
  } else if (term.category === 'Humanities') {
    if (!examples.some(e => e.context.includes('Humanities') || e.context.includes('Literature'))) {
      examples.push({ context: 'Humanities & Literature', sentence: primaryEx });
    }
    if (!examples.some(e => e.context.includes('STEM') || e.context.includes('Science'))) {
      examples.push({
        context: 'STEM / Interdisciplinary Analysis',
        sentence: `Data scientists examine how ${word.toLowerCase()} influences pattern recognition in computational models.`
      });
    }
    if (!examples.some(e => e.context.includes('Research') || e.context.includes('Inquiry'))) {
      examples.push({
        context: 'Academic Essay & Rhetoric',
        sentence: `Constructing a persuasive argument requires evaluating the nuanced historical context of ${word.toLowerCase()}.`
      });
    }
  } else {
    if (!examples.some(e => e.context.includes('Research') || e.context.includes('Inquiry'))) {
      examples.push({ context: 'Academic Research & Inquiry', sentence: primaryEx });
    }
    if (!examples.some(e => e.context.includes('STEM') || e.context.includes('Science'))) {
      examples.push({
        context: 'STEM / Scientific Methodology',
        sentence: `In laboratory trials, establishing a rigorous ${word.toLowerCase()} ensures reproducible empirical findings.`
      });
    }
    if (!examples.some(e => e.context.includes('Humanities') || e.context.includes('Social'))) {
      examples.push({
        context: 'Humanities & Philosophy',
        sentence: `Philosophers and historians examine how ${word.toLowerCase()} reshapes ethical and societal paradigms.`
      });
    }
  }

  return examples.slice(0, 3);
}
