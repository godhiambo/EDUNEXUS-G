export interface CbcConcept {
  name: string;
  description: string;
}

export interface CbcSubStrand {
  name: string;
  concepts: CbcConcept[];
}

export interface CbcStrand {
  name: string;
  subStrands: CbcSubStrand[];
}

export interface CbcSubject {
  name: string;
  strands: CbcStrand[];
}

export const cbcSubjectsData: CbcSubject[] = [
  {
    name: "Mathematics",
    strands: [
      {
        name: "Algebra",
        subStrands: [
          {
            name: "Simultaneous Equations",
            concepts: [
              { name: "Elimination Method", description: "Adding or subtracting equations to eliminate one variable." },
              { name: "Substitution Method", description: "Solving for one variable in terms of another and substituting." },
              { name: "Graphical Method", description: "Plotting lines on a grid to find their point of intersection." },
              { name: "Simultaneous Word Problems", description: "Formulating linear equations from real-world scenario descriptions." }
            ]
          },
          {
            name: "Quadratic Equations",
            concepts: [
              { name: "Factorization Method", description: "Splitting the middle term to express quadratics as linear products." },
              { name: "Completing the Square", description: "Modifying the equation structure to create a perfect square trinomial." },
              { name: "Quadratic Formula", description: "Using the general formula x = (-b ± √(b² - 4ac)) / 2a." },
              { name: "Graphing Quadratics", description: "Plotting parabolas and identifying roots, vertices, and axes of symmetry." }
            ]
          }
        ]
      },
      {
        name: "Calculus",
        subStrands: [
          {
            name: "Differentiation",
            concepts: [
              { name: "Power Rule", description: "Finding derivatives of xⁿ as n*xⁿ⁻¹." },
              { name: "Rates of Change", description: "Analyzing real-world derivatives as physical or monetary rates." },
              { name: "Tangents and Normals", description: "Computing equations of tangent and perpendicular normal lines at points." },
              { name: "Stationary Points", description: "Finding local maxima, minima, and points of inflection using derivatives." }
            ]
          },
          {
            name: "Integration",
            concepts: [
              { name: "Indefinite Integrals", description: "Finding anti-derivatives including the constant of integration C." },
              { name: "Definite Integrals", description: "Evaluating integrals between limits to compute net area." },
              { name: "Area Under a Curve", description: "Applying definite integration to calculate visual area on coordinate axes." },
              { name: "Trapezoidal Rule", description: "Approximating areas under curves using sum of trapezoids." }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Physics",
    strands: [
      {
        name: "Kinematics & Motion",
        subStrands: [
          {
            name: "Linear Motion",
            concepts: [
              { name: "Speed and Velocity", description: "Differentiating scalar speed from vector velocity in direct movement." },
              { name: "Acceleration", description: "Measuring rate of change of velocity over time." },
              { name: "Equations of Motion", description: "Applying formulas: v = u + at, s = ut + 0.5at², v² = u² + 2as." },
              { name: "Motion Graphs", description: "Interpreting slopes/areas on distance-time and velocity-time charts." }
            ]
          },
          {
            name: "Newton's Laws of Motion",
            concepts: [
              { name: "First Law (Inertia)", description: "Objects remain at rest or constant velocity unless acted upon by a net force." },
              { name: "Second Law (F = ma)", description: "The acceleration of an object is directly proportional to the net force." },
              { name: "Third Law (Action-Reaction)", description: "For every action, there is an equal and opposite reaction force." },
              { name: "Momentum and Impulse", description: "Analyzing collisions, conservation of momentum, and safety impact times." }
            ]
          }
        ]
      },
      {
        name: "Electricity & Magnetism",
        subStrands: [
          {
            name: "Current Electricity",
            concepts: [
              { name: "Ohm's Law", description: "Verifying current is proportional to voltage across a conductor at constant temperature." },
              { name: "Resistors in Circuits", description: "Combining components in Series and Parallel configuration networks." },
              { name: "Electrical Power", description: "Calculating heating power output via P = VI, P = I²R, or P = V²/R." },
              { name: "Kirchhoff's Rules", description: "Applying Junction rule (current) and Loop rule (voltage) to complex systems." }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Business Studies",
    strands: [
      {
        name: "Entrepreneurship",
        subStrands: [
          {
            name: "Starting a Business",
            concepts: [
              { name: "Business Idea Generation", description: "Identifying market needs, gaps, and personal talents." },
              { name: "Business Plan Formulation", description: "Drafting structural components: marketing, operations, and finance." },
              { name: "Sources of Capital", description: "Contrasting personal savings, bank loans, grants, and family financing." },
              { name: "Market Research", description: "Gathering information about target consumers, competitors, and environments." }
            ]
          },
          {
            name: "Business Calculations",
            concepts: [
              { name: "Cost and Selling Price", description: "Determining wholesale cost price, retail price, and discount rates." },
              { name: "Markup and Margin", description: "Calculating profit percentage relative to cost vs. selling price." },
              { name: "Profit and Loss", description: "Analyzing positive and negative margins on aggregate sales transactions." },
              { name: "Breakeven Analysis", description: "Locating the exact output level where total revenues equal fixed/variable costs." }
            ]
          }
        ]
      },
      {
        name: "Financial Literacy",
        subStrands: [
          {
            name: "Books of Original Entry",
            concepts: [
              { name: "Double Entry Ledger", description: "Debiting the receiving account and crediting the giving account." },
              { name: "Cash Book", description: "Recording liquid cash and bank cash receipts and ledger outflows." },
              { name: "Journal Entries", description: "Chronologically logging daily transactions with narrative explanations." },
              { name: "Trial Balance", description: "Verifying arithmetical accuracy by summing credit and debit ledger balances." }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Chemistry",
    strands: [
      {
        name: "Inorganic Chemistry",
        subStrands: [
          {
            name: "Acids, Bases and Indicators",
            concepts: [
              { name: "pH Scale", description: "Measuring acidity and alkalinity from range 1 (strong acid) to 14 (strong base)." },
              { name: "Properties of Acids", description: "Analyzing metal reactions, oxide neutralizations, and litmus changes." },
              { name: "Neutralization", description: "Reacting hydronium ions with hydroxide ions to yield salt and water." },
              { name: "Universal Indicator", description: "Using mixed solutions to display a spectrum of pH-dependent colors." }
            ]
          },
          {
            name: "Periodic Table",
            concepts: [
              { name: "Alkali Metals (Group I)", description: "Investigating highly reactive metals that form alkaline solutions with water." },
              { name: "Halogens (Group VII)", description: "Analyzing diatomic nonmetals that form acidic salts with metals." },
              { name: "Noble Gases (Group VIII)", description: "Studying unreactive monatomic elements with fully stable electron outer shells." },
              { name: "Periodicity Trends", description: "Understanding variations in atomic radius, ionization energy, and electronegativity." }
            ]
          }
        ]
      },
      {
        name: "Physical Chemistry",
        subStrands: [
          {
            name: "Mole Concept",
            concepts: [
              { name: "Molar Mass", description: "Calculating sum of atomic weights in grams per mole of a compound." },
              { name: "Empirical Formula", description: "Determining the simplest whole-number ratio of elements in a chemical substance." },
              { name: "Stoichiometry of Reactions", description: "Balancing equations and calculating reactant-to-product mass ratios." },
              { name: "Ideal Gas Laws", description: "Analyzing temperature, volume, and pressure via PV = nRT." }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Biology",
    strands: [
      {
        name: "Cytology & Cells",
        subStrands: [
          {
            name: "Cell Structure",
            concepts: [
              { name: "Plant vs Animal Cells", description: "Contrasting cellulose walls and chloroplasts with flexible animal membranes." },
              { name: "Cell Organelles", description: "Identifying mitochondrion, nucleus, ribosomes, and vacuoles functions." },
              { name: "Light Microscope", description: "Focusing parts: objective lenses, stage, diaphragm, and adjustment knobs." },
              { name: "Magnification Calculations", description: "Formulating total enlargement: Eyepiece magnification × Objective lens magnification." }
            ]
          },
          {
            name: "Cell Physiology",
            concepts: [
              { name: "Diffusion", description: "Passive net movement of particles down a concentration gradient." },
              { name: "Osmosis", description: "Diffusion of solvent water molecules through a semi-permeable membrane." },
              { name: "Active Transport", description: "Energy-dependent pumping of molecules against a concentration gradient." },
              { name: "Turgor and Plasmolysis", description: "Investigating cell rigid pressure in pure water vs. cell shrinking in saline." }
            ]
          }
        ]
      },
      {
        name: "Genetics",
        subStrands: [
          {
            name: "Inheritance",
            concepts: [
              { name: "Monohybrid Crosses", description: "Charting Punnett squares for a single trait to predict offspring ratios." },
              { name: "Dominance Patterns", description: "Comparing complete dominance with incomplete/codominant hybrid expressions." },
              { name: "Sex Determination", description: "Understanding how X and Y chromosomes align to determine biological sex." },
              { name: "Gene Mutations", description: "Investigating DNA replication errors and environmental mutagens effects." }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "History & Citizenship",
    strands: [
      {
        name: "Governance & Constitution",
        subStrands: [
          {
            name: "Kenyan Constitution",
            concepts: [
              { name: "Organs of State", description: "Delineating power divisions of Executive, Legislature, and Judiciary." },
              { name: "Bill of Rights", description: "Reviewing fundamental human rights and freedoms secured by the Constitution." },
              { name: "Devolution & Counties", description: "Understanding local governing structures, county assemblies, and governors." },
              { name: "Citizenship Responsibilities", description: "Reviewing legal duties, voting privileges, community services, and tax obligations." }
            ]
          }
        ]
      }
    ]
  }
];
