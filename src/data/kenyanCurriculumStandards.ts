export interface CurriculumRequirement {
  grade: string;
  subject: string;
  strand: string;
  subStrand: string;
  learningOutcomes: string[];
  coreCompetencies: string[];
  values: string[];
  pcis: string[]; // Pertinent and Contemporary Issues
  suggestedResources: string[];
  inquiryQuestions: string[];
}

export const KENYAN_CURRICULUM_REQUIREMENTS: CurriculumRequirement[] = [
  {
    grade: "Grade 4",
    subject: "Science & Technology",
    strand: "Living Things",
    subStrand: "Plants",
    learningOutcomes: [
      "Identify various parts of a plant and their functions",
      "Classify plants into flowering and non-flowering categories",
      "Demonstrate care and protection of plants in the school environment",
      "Investigate conditions necessary for plant germination"
    ],
    coreCompetencies: [
      "Communication and Collaboration",
      "Critical Thinking and Problem Solving",
      "Creativity and Imagination"
    ],
    values: [
      "Responsibility",
      "Respect",
      "Unity",
      "Love"
    ],
    pcis: [
      "Environmental Education",
      "Disaster Risk Reduction",
      "Health Education"
    ],
    suggestedResources: [
      "Real plants in the school yard",
      "Hand lenses / magnifying glasses",
      "Watering cans or improvised plastic bottles",
      "Germination containers, soil, and seeds (beans, maize)"
    ],
    inquiryQuestions: [
      "Why are plants important to the environment?",
      "How do different parts of a plant help it survive?",
      "What do plants need to grow healthy?"
    ]
  },
  {
    grade: "Grade 4",
    subject: "Mathematics",
    strand: "Numbers",
    subStrand: "Whole Numbers",
    learningOutcomes: [
      "Read and write numbers up to 100,000 in symbols and words",
      "Identify place value and total value of digits up to 100,000",
      "Round off whole numbers to the nearest ten, hundred, and thousand",
      "Arrange numbers in ascending and descending order"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving",
      "Learning to Learn",
      "Self-efficacy"
    ],
    values: [
      "Integrity",
      "Responsibility",
      "Social Justice"
    ],
    pcis: [
      "Financial Literacy (counting money, trade simulations)",
      "Life Skills Education"
    ],
    suggestedResources: [
      "Abacus",
      "Place value tins and counters",
      "Number charts",
      "Improvised tokens / play money"
    ],
    inquiryQuestions: [
      "How does place value help us read large numbers?",
      "Where do we use large numbers in daily life?",
      "Why do we round off numbers?"
    ]
  },
  {
    grade: "Grade 5",
    subject: "Agriculture & Nutrition",
    strand: "Conservation of Environment",
    subStrand: "Soil Conservation",
    learningOutcomes: [
      "Identify signs of soil erosion in the school environment",
      "Demonstrate methods of controlling soil erosion (mulching, cover crops)",
      "Construct a simple compost heap for organic waste recycling",
      "Appreciate the importance of soil conservation for food security"
    ],
    coreCompetencies: [
      "Communication and Collaboration",
      "Self-efficacy",
      "Creativity and Imagination"
    ],
    values: [
      "Patriotism",
      "Responsibility",
      "Respect"
    ],
    pcis: [
      "Food Security & Nutrition",
      "Environmental Sustainability",
      "Disaster Risk Reduction"
    ],
    suggestedResources: [
      "Dry grass / leaves for mulching",
      "Digging tools (jembes, spades)",
      "Compost materials (organic kitchen waste, dry twigs, manure)",
      "Improvised soil containers / trays"
    ],
    inquiryQuestions: [
      "How does soil erosion affect farming?",
      "What causes soil to be carried away by wind or water?",
      "How can we restore degraded soil in our community?"
    ]
  },
  {
    grade: "Grade 6",
    subject: "Social Studies",
    strand: "Resources and Economic Activities",
    subStrand: "Forestry in Kenya",
    learningOutcomes: [
      "Identify major forested areas on a map of Kenya",
      "Explain the importance of forests to Kenya's economy and climate",
      "Analyze problems facing forests in Kenya (deforestation, charcoal burning)",
      "Participate in a school tree-planting project"
    ],
    coreCompetencies: [
      "Citizenship",
      "Critical Thinking and Problem Solving",
      "Digital Literacy (using digital maps)"
    ],
    values: [
      "Patriotism",
      "Social Justice",
      "Responsibility",
      "Unity"
    ],
    pcis: [
      "Climate Change Education",
      "Citizenship Education",
      "Safety and Security"
    ],
    suggestedResources: [
      "Map of Kenya (physical and political)",
      "Tree seedlings",
      "Improvised watering bottles",
      "Digital devices for exploring forest reserves"
    ],
    inquiryQuestions: [
      "How do forests protect our water towers in Kenya?",
      "What are the consequences of destroying forests?",
      "What is your role in protecting trees in your community?"
    ]
  },
  {
    grade: "Grade 7 (Junior School)",
    subject: "Integrated Science",
    strand: "Mixtures, Elements and Compounds",
    subStrand: "Separation of Mixtures",
    learningOutcomes: [
      "Distinguish between pure substances and mixtures",
      "Demonstrate separation techniques (filtration, decantation, evaporation, simple distillation)",
      "Apply separation methods to obtain clean drinking water from muddy water",
      "Design an improvised water filter using locally available materials"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving",
      "Creativity and Imagination",
      "Communication and Collaboration"
    ],
    values: [
      "Responsibility",
      "Unity",
      "Respect"
    ],
    pcis: [
      "Water and Sanitation Education",
      "Health and Hygiene Promotion",
      "Consumer Awareness"
    ],
    suggestedResources: [
      "Sandy or muddy water",
      "Plastic water bottles, sand, gravel, charcoal for filtration column",
      "Sieves, filter papers, funnels",
      "Source of heat (improvised candle or spirit burner)"
    ],
    inquiryQuestions: [
      "How can we get clean water using simple materials?",
      "Why is decantation sometimes not sufficient for purifying water?",
      "Where are separation of mixtures applied in industries in Kenya?"
    ]
  },
  {
    grade: "Grade 8 (Junior School)",
    subject: "English",
    strand: "Reading and Comprehension",
    subStrand: "Critical Reading & Analysis",
    learningOutcomes: [
      "Identify themes and moral lessons in selected short stories",
      "Differentiate between facts and opinions in an editorial text",
      "Analyze characters, setting, and plot structure of a novel excerpt",
      "Write a critical summary or reflective journal entry on a chosen text"
    ],
    coreCompetencies: [
      "Communication and Collaboration",
      "Critical Thinking and Problem Solving",
      "Learning to Learn"
    ],
    values: [
      "Integrity",
      "Social Justice",
      "Respect"
    ],
    pcis: [
      "Human Rights and Democracy",
      "Gender Equality and Equity",
      "Peace Education"
    ],
    suggestedResources: [
      "Syllabus-approved readers / anthologies",
      "Newspaper clippings (editorial sections)",
      "Student journals",
      "Digital library resources"
    ],
    inquiryQuestions: [
      "How do we distinguish what is true from what is someone's viewpoint?",
      "How does the character's background affect their choices in the story?",
      "What lessons can we apply from this story to our Kenyan society?"
    ]
  },
  {
    grade: "Pre-Primary 1 (PP1)",
    subject: "Mathematical Activities",
    strand: "Classification and Numbers",
    subStrand: "Sorting and Grouping",
    learningOutcomes: [
      "Sort and group concrete objects in the immediate environment based on a single attribute such as color, size, or shape",
      "Match and pair objects based on identical features to develop pre-number relations",
      "Rote count numbers from 1 up to 10 in sequence using songs and physical objects",
      "Identify and trace numbers 1 to 9 using multi-sensory approaches (sand, clay, paper cuts)"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (sorting)",
      "Communication and Collaboration (shared group play)",
      "Learning to Learn (self-discovery and exploration)"
    ],
    values: [
      "Responsibility (cleaning up play items)",
      "Respect (sharing materials)",
      "Unity",
      "Love"
    ],
    pcis: [
      "Financial Literacy (sorting objects/coins)",
      "Environmental Sustainability (sorting reusable waste)"
    ],
    suggestedResources: [
      "Colorful bottle tops, beads, building blocks, and pebbles",
      "Number cutouts and tracing boards with sand trays",
      "Real-life sorting trays or egg cartons",
      "Sing-along audio tracks or charts with numbers 1-10"
    ],
    inquiryQuestions: [
      "Why do we group similar things together?",
      "How do shapes and colors help us find things in our classroom?",
      "Where do we see numbers around us?"
    ]
  },
  {
    grade: "Pre-Primary 1 (PP1)",
    subject: "Language Activities",
    strand: "Listening and Speaking",
    subStrand: "Auditory and Visual Discrimination",
    learningOutcomes: [
      "Listen and respond to simple verbal instructions, stories, and classroom commands",
      "Pronounce letter sounds correctly using phonic methods from 'a' to 'm'",
      "Identify and name familiar objects, animals, and people in surroundings to build oral vocabulary",
      "Trace basic pre-writing patterns (straight lines, curves, zig-zags) to build hand-eye coordination"
    ],
    coreCompetencies: [
      "Communication and Collaboration (conversing with peers)",
      "Self-efficacy (expressing needs and feelings clearly)",
      "Creativity and Imagination (story retelling)"
    ],
    values: [
      "Courage (speaking in front of peers)",
      "Respect (listening to others speaking)",
      "Unity"
    ],
    pcis: [
      "Life Skills (self-expression, confidence building)",
      "Safety (learning warning signs)"
    ],
    suggestedResources: [
      "Flashcards with pictures and corresponding words/letters",
      "Picture books, puppets, and felt boards",
      "Sand trays, finger-paints, and thick crayons for pre-writing",
      "Audio recordings of letter sounds and nursery rhymes"
    ],
    inquiryQuestions: [
      "How do we tell others what we need?",
      "What sounds do we hear when different animals cry?",
      "What letter sound does your name start with?"
    ]
  },
  {
    grade: "Pre-Primary 1 (PP1)",
    subject: "Environmental Activities",
    strand: "Caring for Self and Environment",
    subStrand: "Personal Hygiene and Safety",
    learningOutcomes: [
      "Demonstrate correct steps of washing hands with clean running water and soap",
      "Identify parts of the body and state basic uses (eyes for seeing, ears for hearing, hands for touching)",
      "Identify and avoid dangerous objects in classroom and home (scissors, broken glass, medicines)",
      "Name domestic animals and express appreciation for nature"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (identifying safe vs dangerous objects)",
      "Self-efficacy (taking care of personal cleanliness)",
      "Citizenship (protecting the immediate environment)"
    ],
    values: [
      "Responsibility (keeping body clean, disposing litter)",
      "Love (caring for pets and classmates)",
      "Respect"
    ],
    pcis: [
      "Health and Hygiene Education (disease prevention)",
      "Safety and Security (avoiding hazards)",
      "Environmental Sustainability"
    ],
    suggestedResources: [
      "Washing basins, soap, and clean towels",
      "Charts and models showing body parts",
      "Safe play scissors, toy kitchen sets for demonstrating safety",
      "Pictures of domestic animals and plants"
    ],
    inquiryQuestions: [
      "Why is it important to wash our hands with soap?",
      "How do we stay safe when playing outdoors?",
      "How can we help keep our classroom clean?"
    ]
  },
  {
    grade: "Pre-Primary 1 (PP1)",
    subject: "Psychomotor & Creative Activities",
    strand: "Creative Expression and Motor Skills",
    subStrand: "Molding and Locomotor Movements",
    learningOutcomes: [
      "Manipulate plasticine, clay, or papier-mache to mold simple shapes and familiar objects",
      "Perform basic gross motor locomotor movements (jumping, hopping, skipping, crawling)",
      "Color pre-drawn shapes with coordination, staying within borders",
      "Sing simple melodies and match movements to physical rhythm"
    ],
    coreCompetencies: [
      "Creativity and Imagination (molding and coloring)",
      "Communication and Collaboration (coordinated physical games)",
      "Self-efficacy (mastering body control and coordination)"
    ],
    values: [
      "Unity (playing physical games in teams)",
      "Responsibility (cleaning up molding tools)",
      "Love"
    ],
    pcis: [
      "Physical Health and Well-being (physical fitness, motor development)",
      "Creative Economy (introducing crafts early)"
    ],
    suggestedResources: [
      "Non-toxic modeling clay, plasticine, and dough",
      "Outdoor play area with soft grass, hula hoops, and balls",
      "Large crayons, finger paints, and drawing paper",
      "Percussion instruments like shakers, tambourines, and small drums"
    ],
    inquiryQuestions: [
      "How can we change the shape of clay with our fingers?",
      "How does it feel when we run, jump, or skip?",
      "What sounds can we make with our hands and feet?"
    ]
  },
  {
    grade: "Pre-Primary 1 (PP1)",
    subject: "Religious Education Activities",
    strand: "God's Love and Creation",
    subStrand: "Holy Books and Prayer",
    learningOutcomes: [
      "Express thankfulness to God for creating them, their families, and the natural world",
      "Recite simple, age-appropriate prayers of gratitude for food, protection, and family",
      "Demonstrate positive moral values such as sharing toys, telling truth, and helping classmates",
      "Listen to and retell simple Bible, Quran, or other holy stories focusing on love and obedience"
    ],
    coreCompetencies: [
      "Self-efficacy (building sense of identity and spiritual grounding)",
      "Communication and Collaboration (sharing and acting kindly)",
      "Citizenship (empathy towards others)"
    ],
    values: [
      "Love (for God, family, and classmates)",
      "Respect (for sacred places, books, and beliefs)",
      "Integrity (telling the truth)",
      "Peace (getting along with friends)"
    ],
    pcis: [
      "Moral and Spiritual Values (character formation)",
      "Peace Education (conflict resolution through sharing)"
    ],
    suggestedResources: [
      "Illustrated children's Bible or Quran storybooks",
      "Audio tracks of children's spiritual and value-based songs",
      "Puppets for role-playing positive situations (sharing, apologizing)",
      "Creation charts showing animals, plants, and families"
    ],
    inquiryQuestions: [
      "How do we know God loves us?",
      "Why is it good to share our toys with others?",
      "What do we say when we pray?"
    ]
  },
  {
    grade: "Pre-Primary 2 (PP2)",
    subject: "Mathematical Activities",
    strand: "Numbers and Operations",
    subStrand: "Number Concept and Basic Addition",
    learningOutcomes: [
      "Recognize, read, write, and order numbers 1 to 20 in symbols and match with concrete objects",
      "Rote count numbers from 1 to 50 in sequence confidently",
      "Demonstrate the concept of addition as combining two groups of objects (totals up to 10)",
      "Identify and name 2D geometric shapes (circle, triangle, rectangle, square)"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (combining groups, identifying shapes)",
      "Learning to Learn (applying math concepts to daily tasks)",
      "Digital Literacy (using simple counting math apps)"
    ],
    values: [
      "Responsibility",
      "Integrity (fair play in games)",
      "Unity"
    ],
    pcis: [
      "Financial Literacy (simulating purchasing using play money)",
      "Life Skills (using shapes to build or sketch)"
    ],
    suggestedResources: [
      "Abacus, place value blocks, multi-link cubes, and counters",
      "Shape cards and sorting stencils",
      "Flashcards with numbers 1 to 20 and number names",
      "Improvised shop corner with dummy items and play coins"
    ],
    inquiryQuestions: [
      "What happens when we put two groups of items together?",
      "How many corners and sides does a triangle have compared to a square?",
      "How can we count things quickly without losing track?"
    ]
  },
  {
    grade: "Pre-Primary 2 (PP2)",
    subject: "Language Activities",
    strand: "Reading and Writing Readiness",
    subStrand: "Phonics and Sentence Formation",
    learningOutcomes: [
      "Recognize and blend letter sounds 'a' to 'z' to read simple 2-letter and 3-letter words (CVC words)",
      "Construct and read simple sentences with three to four words (e.g. 'This is a cat')",
      "Write their own first name and surname correctly with proper letter orientation",
      "Develop reading interest through picture walks and pointing at words while reading"
    ],
    coreCompetencies: [
      "Communication and Collaboration (reading aloud, chatting with classmates)",
      "Self-efficacy (confidence in reading their name and writing words)",
      "Learning to Learn (using sound blending techniques to read new words)"
    ],
    values: [
      "Courage (expressing ideas and reading in front of others)",
      "Respect (valuing peers' efforts)",
      "Responsibility"
    ],
    pcis: [
      "Digital Literacy (viewing interactive phonics games)",
      "Human Rights (the right to expression and education)"
    ],
    suggestedResources: [
      "Magnetic letter boards, letter tiles, and sound blocks",
      "CVC word flashcards with corresponding drawings",
      "Lined writing exercise sheets with guidance indicators",
      "Big Books for classroom shared reading sessions"
    ],
    inquiryQuestions: [
      "What sound do we get when we put the letters 'c', 'a', and 't' together?",
      "Why do we have names and why is it important to write them?",
      "How can pictures help us tell a story?"
    ]
  },
  {
    grade: "Pre-Primary 2 (PP2)",
    subject: "Environmental Activities",
    strand: "My Community and Natural Science",
    subStrand: "Weather, Plants, and Safety",
    learningOutcomes: [
      "Identify and record daily weather conditions using simple symbols on a weather chart",
      "Differentiate between safe water for drinking (boiled, filtered) and unsafe water (river, puddle)",
      "Identify roles of common community helpers (teacher, doctor, police officer, farmer, firefighter)",
      "Practice garbage segregation (wet waste/dry waste) in the classroom"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (making decisions on safe drinking water)",
      "Citizenship (appreciating community helpers, conserving nature)",
      "Communication (sharing weather observations)"
    ],
    values: [
      "Patriotism (appreciating community helpers in Kenya)",
      "Responsibility (sorting rubbish, saving clean water)",
      "Unity"
    ],
    pcis: [
      "Environmental Sustainability (waste sorting, water preservation)",
      "Disaster Risk Reduction (avoiding open water pits, fire hazards)",
      "Health and Hygiene (preventing waterborne diseases)"
    ],
    suggestedResources: [
      "A classroom weather board with movable symbols",
      "Samples of clean, boiled water and raw muddy water in clear jars",
      "Pictures, uniforms, or tool models of community helpers",
      "Colored dustbins for waste sorting practice"
    ],
    inquiryQuestions: [
      "How does the weather affect the food we eat and clothes we wear?",
      "Who helps us when we are sick or when there is a fire?",
      "Why should we avoid throwing plastics on the school ground?"
    ]
  },
  {
    grade: "Pre-Primary 2 (PP2)",
    subject: "Psychomotor & Creative Activities",
    strand: "Fine/Gross Motor and Performing Arts",
    subStrand: "Paper Craft, Weaving, and Rhythmic Gymnastics",
    learningOutcomes: [
      "Tear, paste, and fold paper to create simple collage designs, mosaic patterns, or paper planes",
      "Demonstrate basic finger and hand agility by practicing simple weaving patterns",
      "Perform coordinated gross motor movements: throwing/catching a ball, kicking towards a goal, and skipping",
      "Role-play simple real-life scenarios (market shopping, hospital visits) with vocal expression"
    ],
    coreCompetencies: [
      "Creativity and Imagination (art crafting and mosaic design)",
      "Communication and Collaboration (drama play and team ball games)",
      "Self-efficacy (confidence in performing motor activities)"
    ],
    values: [
      "Responsibility (proper handling of child-friendly tools)",
      "Unity (working on collaborative large collage pieces)",
      "Social Justice (sharing play gear equally)"
    ],
    pcis: [
      "Physical Well-being (coordination and muscle tone)",
      "Life Skills (using creativity to make toys out of scrap)"
    ],
    suggestedResources: [
      "Old newspapers, colored paper sheets, non-toxic school glue, and kid-safe scissors",
      "Pre-cut paper strips or plastic mats for weaving",
      "Soft playballs, target goals, skipping ropes, and balancing beams",
      "Simple costume props for role-play activities"
    ],
    inquiryQuestions: [
      "How can we make beautiful pictures from torn bits of paper?",
      "How do our fingers work together to weave or tie a knot?",
      "How do we move our bodies to catch a ball?"
    ]
  },
  {
    grade: "Pre-Primary 2 (PP2)",
    subject: "Religious Education Activities",
    strand: "Our Family, Values, and Sharing",
    subStrand: "Caring for Others and Places of Worship",
    learningOutcomes: [
      "Identify members of the nuclear and extended family, and express appreciation for each family member's role",
      "Identify church, mosque, or temple as a holy place of worship, demonstrating respectful behavior",
      "Demonstrate positive traits such as sharing food, apologizing when wrong, and offering help to friends",
      "Explain the significance of religious celebrations in simple terms"
    ],
    coreCompetencies: [
      "Citizenship (belonging to family and community, respecting diverse faiths)",
      "Communication (sharing feelings, apologizing, expressing wishes)",
      "Self-efficacy (developing moral resilience)"
    ],
    values: [
      "Love (for family, friends, and neighbors)",
      "Respect (for different religions and places of worship)",
      "Unity (celebrating holy days together)",
      "Integrity (telling the truth)"
    ],
    pcis: [
      "Peace Education (coexisting peacefully with peers)",
      "Child Protection (knowing trusted family members and teachers)"
    ],
    suggestedResources: [
      "Pictures or posters showing churches, mosques, and temples",
      "Family tree charts where kids can draw their family members",
      "Role-play puppet theatre depicting kindness and conflict resolution",
      "Celebration charts for Christmas, Eid, and other holidays"
    ],
    inquiryQuestions: [
      "How can we show kindness to a friend who is sad or hurt?",
      "Why do we close our eyes or remain quiet in a place of worship?",
      "What makes our family special to us?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Agriculture",
    strand: "Agricultural Systems and Environment",
    subStrand: "Introduction to Farming Systems and Practices",
    learningOutcomes: [
      "Differentiate between various farming systems (intensive, extensive, organic, precision, smart farming) in the context of Kenya",
      "Analyze the role of Agriculture in the Kenyan economy, food security, and sustainable development",
      "Demonstrate understanding of safety practices and ethical considerations in agricultural operations",
      "Evaluate the impact of climate change on agricultural production and discuss adaptive mitigation strategies"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (analyzing systems)",
      "Digital Literacy (smart farming exploration)",
      "Citizenship (national food security considerations)"
    ],
    values: [
      "Responsibility (sustainable farming)",
      "Respect (protecting the ecosystem)",
      "Patriotism (supporting local agriculture)"
    ],
    pcis: [
      "Environmental Sustainability",
      "Climate Change Adaptation",
      "Disaster Risk Reduction"
    ],
    suggestedResources: [
      "Smart farming tools and sensors (or mobile farming apps)",
      "Case studies of successful organic and precision farms in Kenya",
      "Personal Protective Equipment (PPE) samples",
      "Weather charts and crop suitability maps"
    ],
    inquiryQuestions: [
      "How can smart farming technologies improve crop yield in Kenya?",
      "Why must modern agriculture adapt to climate change?",
      "What makes farming systems sustainable for future generations?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Agriculture",
    strand: "Soil Science and Land Management",
    subStrand: "Soil Properties, Chemistry and Fertilization",
    learningOutcomes: [
      "Assess soil physical properties (texture, structure, profile, moisture-holding capacity) and their influence on crop growth",
      "Conduct simple soil testing activities to determine soil pH and identify essential plant nutrients (macro and micronutrients)",
      "Compare organic manures and inorganic fertilizers and demonstrate correct application techniques",
      "Establish sustainable soil conservation layouts on sloped farmlands to prevent erosion and degradation"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (soil analysis)",
      "Learning to Learn (conducting soil tests)",
      "Self-efficacy (practical layout design)"
    ],
    values: [
      "Integrity (objective testing and reporting)",
      "Unity (group field assessments)",
      "Responsibility"
    ],
    pcis: [
      "Environmental Sustainability",
      "Financial Literacy (cost benefit of fertilizer types)"
    ],
    suggestedResources: [
      "Soil samples from different areas, soil testing kits (or litmas papers)",
      "Samples of organic manures and inorganic fertilizers",
      "Measuring tapes, pegs, and strings for setting up conservation contours",
      "Reference manuals on soil chemistry and nutrient deficiencies"
    ],
    inquiryQuestions: [
      "How does soil pH affect crop growth and nutrient availability?",
      "What is the difference between organic manures and synthetic fertilizers in long-term soil health?",
      "How do we restore a highly degraded soil system?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Agriculture",
    strand: "Crop Production and Protection",
    subStrand: "Crop Propagation, Nursery Management and Field Practices",
    learningOutcomes: [
      "Select suitable crop varieties and prepare various types of propagation materials (seeds, vegetative parts)",
      "Establish and manage a model seedling nursery, demonstrating proper shade control, watering, and pruning",
      "Perform essential cultural practices including weeding, mulching, thinning, staking, and training",
      "Identify common crop pests, diseases, and weeds, and implement integrated pest management (IPM) techniques safely"
    ],
    coreCompetencies: [
      "Creativity and Imagination (nursery design)",
      "Communication and Collaboration (group nursery maintenance)",
      "Self-efficacy (field task execution)"
    ],
    values: [
      "Responsibility (caring for growing crops)",
      "Respect",
      "Love"
    ],
    pcis: [
      "Food Security & Nutrition",
      "Safety and Security (safe pesticide handling)"
    ],
    suggestedResources: [
      "Seeds and vegetative vegetative materials (cuttings, tubers, suckers)",
      "Nursery beds, shade nets, watering cans, and potting bags",
      "Mulch, stakes, twine, and weeding tools",
      "Samples or images of common crop pests, diseases, and IPM charts"
    ],
    inquiryQuestions: [
      "Why is a seedling nursery preferred over direct planting for certain crops?",
      "How can crop rotational patterns reduce pests and diseases without chemicals?",
      "What cultural practices have the highest impact on crop yield?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Agriculture",
    strand: "Livestock Production and Health",
    subStrand: "Livestock Selection, Feeds, and Management Systems",
    learningOutcomes: [
      "Classify major livestock species and breeds in Kenya according to their production purposes (dairy, beef, poultry, small stock)",
      "Formulate simple feed rations using Pearson Square or other techniques to meet nutritional needs of different growth stages",
      "Design and describe structures required for various livestock management systems (zero grazing, free-range, semi-intensive)",
      "Identify signs of good health and ill health in livestock, and practice basic bio-security measures to prevent disease spread"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (ration formulation)",
      "Creativity and Imagination (livestock housing design)",
      "Communication and Collaboration"
    ],
    values: [
      "Responsibility (animal welfare and care)",
      "Love (kindness to domestic animals)",
      "Integrity"
    ],
    pcis: [
      "Animal Welfare and Safety",
      "Enterprise Education (poultry and dairy enterprises)"
    ],
    suggestedResources: [
      "Feed ingredients (maize germ, fishmeal, wheat bran, mineral licks)",
      "Scale, Pearson Square worksheets, feed calculators",
      "Blueprints or models of dairy units, poultry houses, and rabbit hutches",
      "Clinical thermometers, veterinary charts, and disinfectants"
    ],
    inquiryQuestions: [
      "How do we balance cost versus nutrition when feeding farm animals?",
      "What are the indicators of a healthy livestock animal?",
      "Why are biosecurity protocols vital in modern livestock farming?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Computer Science / ICT",
    strand: "Computer Systems & Infrastructure",
    subStrand: "Computer Hardware, Organization and Operating Systems",
    learningOutcomes: [
      "Explain the internal architecture and functional organization of a computer system (CPU, ALUs, Registers, Bus systems)",
      "Evaluate hardware specifications and make informed selections for various school and business user profiles",
      "Demonstrate correct installation, configuration, and troubleshooting of common operating systems and peripheral utility software",
      "Explain virtual memory, process scheduling, and disk partitioning concepts in modern operating systems"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (troubleshooting system failures)",
      "Digital Literacy (understanding OS and hardware interactions)",
      "Learning to Learn (identifying technical specifications)"
    ],
    values: [
      "Responsibility (handling computing devices safely)",
      "Respect (intellectual property rights for software license compliance)",
      "Integrity (honest diagnostic reporting)"
    ],
    pcis: [
      "E-Waste Management and Safety",
      "Financial Literacy (budgeting for computing infrastructure)",
      "Life Skills (hardware repair skills)"
    ],
    suggestedResources: [
      "Disassembled desktop CPU cabinets showing motherboards, RAM, power supplies, and hard drives",
      "Operating system bootable flash drives (GNU/Linux or Windows installation media)",
      "Device Manager utility panels or command-line system profilers",
      "Antivirus and system utility software suites"
    ],
    inquiryQuestions: [
      "How does a processor manage instructions from multiple applications simultaneously?",
      "Why are hardware configurations tailored to specific occupational profiles?",
      "What is the environmental cost of rapid technology obsolescence and how can we mitigate it?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Computer Science / ICT",
    strand: "Database Systems",
    subStrand: "Database Design, Management and SQL",
    learningOutcomes: [
      "Differentiate between flat-file databases and Relational Database Management Systems (RDBMS)",
      "Design an Entity-Relationship Diagram (ERD) with keys (primary, foreign) and appropriate relationship types (1:1, 1:M, M:N)",
      "Normalize database schemas up to the Third Normal Form (3NF) to eliminate data redundancy and anomalies",
      "Construct and execute basic Structured Query Language (SQL) statements (SELECT, INSERT, UPDATE, DELETE, JOINs) to retrieve and update records"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (normalizing schemas and structuring relational models)",
      "Digital Literacy (using database management applications)",
      "Communication and Collaboration (collaborating on multi-entity database setups)"
    ],
    values: [
      "Responsibility (ensuring data integrity)",
      "Integrity (fair practice in data entry and storage)",
      "Unity (shared data structure planning)"
    ],
    pcis: [
      "Data Protection and Privacy (observing privacy laws in Kenya)",
      "Enterprise Education (designing database inventories for small businesses)"
    ],
    suggestedResources: [
      "Database application clients (SQLite, PostgreSQL, MS Access, or phpMyAdmin)",
      "Database entity layout sheets and relational mapping whiteboard tools",
      "Sample CSV data sheets for import/export schema mapping activities",
      "Inquiry templates for practical SQL command writing labs"
    ],
    inquiryQuestions: [
      "Why is structured data storage more reliable than flat-file storage for large scale applications?",
      "How does database normalization protect organizations from transactional errors?",
      "What ethical considerations arise when storing personal customer data in a central database?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Computer Science / ICT",
    strand: "Computer Networks & Data Communication",
    subStrand: "Network Topologies, Protocols, and Cybersecurity",
    learningOutcomes: [
      "Analyze different network scales (LAN, WAN, MAN, PAN) and identify their practical applications in the Kenyan context",
      "Compare various physical transmission media (fiber optics, coaxial, twisted pair) and wireless communication channels",
      "Configure basic Local Area Network (LAN) properties, including IP addresses, subnet masks, and network sharing parameters",
      "Explain common cybersecurity threats (malware, phishing, DoS attacks) and demonstrate standard protection practices"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (troubleshooting local network disconnections)",
      "Digital Literacy (configuring physical networks and identifying scam protocols)",
      "Citizenship (practicing responsible digital communication and cybersecurity safety)"
    ],
    values: [
      "Responsibility (securing network nodes from unauthorized access)",
      "Integrity (ethical hacking awareness and cyber safety practices)",
      "Respect (respecting private communications and credentials)"
    ],
    pcis: [
      "Cybersecurity and Digital Citizenship",
      "Disaster Risk Reduction (securing digital backups against network ransomware)"
    ],
    suggestedResources: [
      "RJ45 connectors, Cat6 ethernet cables, crimping tools, and network cable testers",
      "Network switches, wireless routers, and active modems for physical labs",
      "Simulated packet-tracing platforms or network interface config panels",
      "Firewall configuration screens and cyber threat case diaries"
    ],
    inquiryQuestions: [
      "How do routers and switches guide data packets through the globally interconnected Web?",
      "Why is optical fiber technology critical for high-speed internet delivery in rural and urban Kenya?",
      "What are the responsibilities of a digital citizen in securing their networks and data footprint?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Computer Science / ICT",
    strand: "Software Development & Programming",
    subStrand: "Algorithms, Flowcharts, and Python Programming Foundations",
    learningOutcomes: [
      "Translate complex word problems into clear, step-by-step algorithms using pseudocode and standard ISO-symbol flowcharts",
      "Demonstrate proficiency in declaring and using elementary programming variables, constants, and basic data types (string, integer, float, boolean)",
      "Implement sequence, selection (if-elif-else branching), and iteration (for/while loops) control structures in Python",
      "Write, debug, and execute modular code structures using custom functions, parameter inputs, and return scopes"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (dry-running algorithms and resolving compile/logical bugs)",
      "Creativity and Imagination (designing logical scripts and custom educational interactive games)",
      "Learning to Learn (translating pseudocode into valid syntax in high-level programming languages)"
    ],
    values: [
      "Responsibility (writing clean, commented, and easily readable code assets)",
      "Integrity (producing authentic works; avoiding plagiarism in software coding)",
      "Courage (persisting through logical bugs and syntactic debug sessions)"
    ],
    pcis: [
      "Creative Economy (introducing programming and app development paths early)",
      "Financial Literacy (calculating accurate compounding interest models using Python algorithms)"
    ],
    suggestedResources: [
      "Python 3 installation environments (IDLE, VS Code, Jupyter, or online web sandboxes)",
      "Flowcharting vector software or stencils with dry-erase cards",
      "Step-by-step programming workbooks focusing on practical, local problem statements",
      "Code repositories containing standard algorithm templates (searching, sorting)"
    ],
    inquiryQuestions: [
      "How does structured thinking and algorithmic planning help solve everyday problems?",
      "Why do computers require precise syntax rules to run commands correctly?",
      "How do loops and conditions allow us to write highly efficient code with fewer commands?"
    ]
  },
  {
    grade: "Grade 1",
    subject: "Mathematical Activities",
    strand: "Classification and Numbers",
    subStrand: "Sorting, Grouping and Number Concept (1-50)",
    learningOutcomes: [
      "Sort and group concrete objects in their immediate environment based on attributes such as color, size, and shape",
      "Count objects up to 50 concretely and rote count numbers 1 to 100 using songs and chants",
      "Read, write, and model whole numbers from 1 to 20 in symbols and match with the correct quantities",
      "Identify the place value of digits in 2-digit numbers up to tens and ones"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (sorting and classifying attributes)",
      "Learning to Learn (applying counting to everyday transactions)",
      "Communication and Collaboration (cooperative number matching games)"
    ],
    values: [
      "Responsibility (restoring and cleaning mathematical tools after play)",
      "Respect (taking turns in sorting and sharing beads and bottle caps)",
      "Integrity (fair playing during counting games)"
    ],
    pcis: [
      "Financial Literacy (identifying coins and counting currency notes)",
      "Environmental Education (using clean reusable plastic bottle caps as counting objects)"
    ],
    suggestedResources: [
      "Colorful plastic bottle caps, beads, stones, and counters",
      "Abacus, place value tins, and pocket charts",
      "Number flashcards 1 to 50 with matching dot drawings",
      "Sand trays and clay for multi-sensory digit writing"
    ],
    inquiryQuestions: [
      "Why do we group similar objects together?",
      "How does place value help us read and write two-digit numbers?",
      "How can we count a large bundle of sticks quickly?"
    ]
  },
  {
    grade: "Grade 1",
    subject: "Language Activities",
    strand: "Listening and Speaking",
    subStrand: "Phonological Awareness and Oral Vocabulary",
    learningOutcomes: [
      "Differentiate and pronounce letter sounds 'a' to 'z' correctly using multi-sensory phonics",
      "Listen, respond, and follow simple 2-step verbal instructions and classroom commands",
      "Use polite greetings, apologies, and requests appropriately in daily interactions",
      "Name familiar objects, body parts, and animals to enrich spoken vocabulary in short dialogues"
    ],
    coreCompetencies: [
      "Communication and Collaboration (greeting and engaging in polite conversations)",
      "Self-efficacy (expressing wants and feelings with clear articulation)",
      "Creativity and Imagination (retelling stories with expressive body language)"
    ],
    values: [
      "Courage (speaking loudly and sharing views in front of classmates)",
      "Respect (listening silently and attentively while a peer or teacher speaks)",
      "Love (using kind and warm greetings with classmates)"
    ],
    pcis: [
      "Life Skills (personal confidence and constructive self-expression)",
      "Safety and Security (following safety instructions and warnings)"
    ],
    suggestedResources: [
      "Phonic sound charts, magnetic letters, and sandpaper alphabet curves",
      "Large picture books and felt boards with characters",
      "Puppets for role-playing dialogues and polite phrases",
      "Audio-visual clips of children's letter sounds and matching songs"
    ],
    inquiryQuestions: [
      "How do we let someone know we want to play with their toy?",
      "What letter sounds do you hear when saying your name?",
      "Why is it important to listen when others are talking?"
    ]
  },
  {
    grade: "Grade 3",
    subject: "Environmental Activities",
    strand: "Environment and its Resources",
    subStrand: "Plants, Animals, and Resource Preservation",
    learningOutcomes: [
      "Identify common types of plants and domestic animals in the locality and explain their benefits",
      "Analyze different weather patterns and keep a simple daily weather chart using symbols",
      "Differentiate between safe drinking water and contaminated water sources, practicing simple preservation",
      "Identify and demonstrate respect for community helpers (teachers, doctors, police officers, farmers)"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (identifying polluted water hazards)",
      "Citizenship (showing appreciation for diverse community helpers in Kenya)",
      "Digital Literacy (using interactive tablet apps to track local weather)"
    ],
    values: [
      "Patriotism (respecting public officers and supporting local farmers)",
      "Responsibility (conserving water sources and disposing classroom waste)",
      "Love (kindness to domestic animals and wild birds)"
    ],
    pcis: [
      "Environmental Sustainability (waste sorting and forest preservation)",
      "Health and Hygiene (preventing waterborne and hygiene-related diseases)",
      "Disaster Risk Reduction (safe behaviors near rivers, electrical posts, and fire)"
    ],
    suggestedResources: [
      "School gardens containing diverse herbs and plants",
      "Classroom weather calendar with weather icon pins",
      "Clear plastic jars showing purified boiled water vs raw pond water",
      "Toy fire trucks, stethoscope models, and farming tool replicas"
    ],
    inquiryQuestions: [
      "How does the change in weather affect the crops grown on local farms?",
      "Why must we boiled or filter river water before drinking it?",
      "How would our community survive without the services of a farmer or a doctor?"
    ]
  },
  {
    grade: "Grade 7 (Junior School)",
    subject: "Mathematics",
    strand: "Algebra",
    subStrand: "Algebraic Expressions and Linear Equations",
    learningOutcomes: [
      "Formulate single-variable algebraic expressions from practical word problems and scenarios",
      "Simplify algebraic expressions by grouping like terms and distributing positive/negative multipliers",
      "Solve single-variable linear equations containing integer and simple fractional coefficients",
      "Graph simple linear relationships on a two-dimensional Cartesian plane"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (translating word statements into equations)",
      "Learning to Learn (identifying generalizable mathematical patterns)",
      "Self-efficacy (building confidence through multi-step equation solutions)"
    ],
    values: [
      "Integrity (verifying algebraic solutions objectively by substitution)",
      "Unity (collaborative team brainstorming during math puzzle labs)",
      "Responsibility"
    ],
    pcis: [
      "Financial Literacy (algebraic modeling of costs, savings, and investments)",
      "Consumer Awareness (evaluating purchasing packages and rates)"
    ],
    suggestedResources: [
      "Algebra tile blocks representing variables and constant coefficients",
      "Cartesian coordinate grid whiteboards and colored dry-erase markers",
      "Practical word problem workbooks set in local Kenyan marketplace contexts",
      "Simple interactive graphing application platforms"
    ],
    inquiryQuestions: [
      "How can variables represent unknown factors in our daily shopping and budgeting?",
      "What is the difference between an algebraic expression and a mathematical equation?",
      "Why must we perform identical mathematical operations on both sides of an equation to keep it balanced?"
    ]
  },
  {
    grade: "Grade 8 (Junior School)",
    subject: "Pre-Technical Studies",
    strand: "Materials and Systems",
    subStrand: "Properties of Engineering Materials and Simple Systems",
    learningOutcomes: [
      "Classify common engineering materials (metals, plastics, wood, ceramics) based on properties like strength, density, and elasticity",
      "Identify technical drawing symbols and construct basic geometrical layouts using standard drawing instruments",
      "Explain the operational principles of simple machines (gears, levers, pulleys, inclined planes) in domestic and agricultural tools",
      "Identify potential safety hazards in a workstation and implement correct workspace security layouts"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (diagnosing machine failures and selecting proper materials)",
      "Creativity and Imagination (sketching technical mechanical assemblies)",
      "Self-efficacy (mastering practical hand-tool operations safely)"
    ],
    values: [
      "Responsibility (wearing appropriate protective equipment and returning tools to storage)",
      "Integrity (maintaining precision in structural layouts and scale drawings)",
      "Respect"
    ],
    pcis: [
      "Safety and Health Education (occupational safety regulations)",
      "E-Waste Management (safely sorting and recycling broken electrical and mechanical plastic housings)"
    ],
    suggestedResources: [
      "Samples of various materials (copper wire, hardwood blocks, PVC pipes, ceramic tiles)",
      "Drawing boards, T-squares, set squares, dividers, and drawing pencils",
      "Models of gear trains, bicycle chains, lever arms, and block-and-tackle pulley rigs",
      "Personal Protective Equipment (PPE) including safety goggles, gloves, and aprons"
    ],
    inquiryQuestions: [
      "Why do we select copper for electrical wiring and PVC for plumbing instead of wood or iron?",
      "How do simple machines like gears multiply our physical input force?",
      "Why is a standard drawing scale critical for engineers working in separate parts of the world?"
    ]
  },
  {
    grade: "Grade 9 (Junior School)",
    subject: "Integrated Science",
    strand: "Matter, Energy and Ecology",
    subStrand: "Acids, Bases, Force, Pressure, and Ecosystem Dynamics",
    learningOutcomes: [
      "Classify substances as acidic, basic, or neutral using plant-based indicators and litmus tests",
      "Demonstrate the effects of forces on motion, shape, and direction of moving bodies",
      "Investigate fluid pressure in liquids and demonstrate that pressure increases with depth",
      "Analyze ecosystem structures by tracing food chains and food webs, identifying the effects of pollution"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (analyzing environmental pollution effects on food webs)",
      "Learning to Learn (performing standard chemistry titration labs and observation recording)",
      "Digital Literacy (researching local ecosystems using search engine queries)"
    ],
    values: [
      "Responsibility (disposing lab chemicals safely and protecting local biological habitats)",
      "Respect (valuing the diversity of biological life in the surrounding ecosystem)",
      "Unity"
    ],
    pcis: [
      "Environmental Sustainability (habitat protection and waste water management)",
      "Health Education (understanding the hazards of direct chemical exposure)",
      "Climate Change Education"
    ],
    suggestedResources: [
      "Plant extracts (red cabbage, hibiscus leaves), litmus papers, weak household acids (lemon, vinegar) and bases (soap, baking soda)",
      "Spring balances, wood blocks, weights, and smooth surfaces",
      "Plastic bottles with vertical perforations to show water pressure jets",
      "Local field maps, ecological charts, and pollution diaries"
    ],
    inquiryQuestions: [
      "How do household acids and bases differ from chemical laboratory reagents?",
      "Why do deep-sea divers require highly reinforced suits compared to shallow swimmers?",
      "What happens to higher-tier predators in a food chain if the primary producer plants are destroyed by chemical runoff?"
    ]
  },
  {
    grade: "Grade 1",
    subject: "Environmental Activities",
    strand: "Weather and Environment",
    subStrand: "Weather Conditions and Sky Observations",
    learningOutcomes: [
      "Observe and describe different weather conditions (sunny, rainy, windy, cloudy) in their immediate surroundings",
      "Identify things found in the sky during the day (sun, clouds) and at night (moon, stars)",
      "Dress appropriately according to current weather conditions to maintain health and safety",
      "Appreciate weather variations as part of the natural environment"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (matching clothing to weather)",
      "Communication (describing weather symbols)",
      "Self-efficacy (dressing independently)"
    ],
    values: [
      "Responsibility (caring for personal weather protection gears like umbrellas)",
      "Respect (appreciating others' roles during varied weather)"
    ],
    pcis: [
      "Environmental Education",
      "Disaster Risk Reduction (staying safe during heavy rain or wind)"
    ],
    suggestedResources: [
      "Weather charts with pictorial symbols",
      "Umbrellas, raincoats, sunhats",
      "Drawings of the day and night sky"
    ],
    inquiryQuestions: [
      "What do we see in the sky during the day?",
      "How do we dress on a rainy day?",
      "Why does weather change?"
    ]
  },
  {
    grade: "Grade 1",
    subject: "Hygiene and Nutrition Activities",
    strand: "Personal Hygiene",
    subStrand: "Care of the Mouth, Teeth and Hands",
    learningOutcomes: [
      "Demonstrate correct teeth-brushing techniques using clean water, toothbrush, and toothpaste/chewing stick",
      "Demonstrate proper handwashing steps at critical times (after using the toilet, before eating)",
      "Identify items used for personal cleaning and maintain their hygienic storage",
      "State the importance of personal hygiene in preventing common infections"
    ],
    coreCompetencies: [
      "Self-efficacy (washing hands and brushing teeth independently)",
      "Learning to Learn (memorizing handwashing steps)"
    ],
    values: [
      "Responsibility (keeping personal items clean)",
      "Respect (not sharing personal items like toothbrushes)"
    ],
    pcis: [
      "Health Education and Hygiene Promotion",
      "Life Skills (self-care habits)"
    ],
    suggestedResources: [
      "Toothbrushes, chewing sticks, toothpaste, clean water",
      "Soap, handwashing facility / leaky tin",
      "Hygiene charts and flashcards"
    ],
    inquiryQuestions: [
      "Why must we wash our hands with soap?",
      "When should we brush our teeth?",
      "What happens if we do not wash our hands?"
    ]
  },
  {
    grade: "Grade 2",
    subject: "Mathematical Activities",
    strand: "Numbers and Operations",
    subStrand: "Addition and Subtraction (up to 100)",
    learningOutcomes: [
      "Perform addition of two-digit numbers with totals not exceeding 100 without regrouping",
      "Perform subtraction of two-digit numbers without regrouping",
      "Solve simple mathematical word problems involving addition and subtraction in real-life contexts",
      "Demonstrate mental addition and subtraction of single-digit numbers quickly"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (solving word problems)",
      "Learning to Learn (developing mental math strategies)"
    ],
    values: [
      "Integrity (fairness in trading and counting)",
      "Responsibility (care of math counters)"
    ],
    pcis: [
      "Financial Literacy (calculating simple change during shop play)",
      "Consumer Awareness"
    ],
    suggestedResources: [
      "Abacus, counters (seeds, beads, bottle caps)",
      "Number lines, flashcards 1 to 100",
      "Improvised shop items with price tags"
    ],
    inquiryQuestions: [
      "How does putting things together differ from taking things away?",
      "How do we solve a shopping word problem?",
      "What is the easiest way to add 9 to any number?"
    ]
  },
  {
    grade: "Grade 2",
    subject: "Language (English) Activities",
    strand: "Reading Comprehension",
    subStrand: "Phonics, Word Recognition and Simple Texts",
    learningOutcomes: [
      "Recognize and read words with consonant-vowel-consonant (CVC) patterns and basic blends",
      "Read short, illustrated stories of 4-6 sentences aloud with appropriate pronunciation and pacing",
      "Answer direct comprehension questions based on a read story",
      "Build oral sentence structures using standard pronouns (I, you, he, she, they, we)"
    ],
    coreCompetencies: [
      "Communication (reading aloud and speaking clearly)",
      "Self-efficacy (confidence in sounding out unfamiliar words)"
    ],
    values: [
      "Courage (reading in front of class)",
      "Love (reading stories together)"
    ],
    pcis: [
      "Life Skills (articulation and listening skills)",
      "Social cohesion through shared storytelling"
    ],
    suggestedResources: [
      "Grade-level reader storybooks",
      "Phonic charts, sight word cards",
      "Word building blocks and letter tiles"
    ],
    inquiryQuestions: [
      "How do we find out what happens next in a story?",
      "Which words help us talk about our friends?",
      "How does learning letter sounds help us read books?"
    ]
  },
  {
    grade: "Grade 2",
    subject: "Hygiene and Nutrition Activities",
    strand: "Food and Nutrition",
    subStrand: "Healthy Eating Habits and Basic Foods",
    learningOutcomes: [
      "Identify common foods available in their local community and classify them as healthy or unhealthy snacks",
      "Demonstrate appropriate table manners and hygiene before, during, and after meals",
      "Explain the importance of eating a balanced meal for growth, strength, and health",
      "Perform basic food preparation tasks safely (washing fruits, peeling bananas)"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (sorting healthy vs unhealthy food)",
      "Self-efficacy (cleaning and choosing healthy foods independently)"
    ],
    values: [
      "Responsibility (avoiding food wastage)",
      "Unity (sharing food respectfully with classmates)"
    ],
    pcis: [
      "Food Security & Nutrition",
      "Health Education"
    ],
    suggestedResources: [
      "Real food items or high-quality food models (fruits, vegetables, cereals)",
      "Plates, cups, clean water",
      "Nutrition wall charts showing balanced plates"
    ],
    inquiryQuestions: [
      "Why must we wash fruits before eating them?",
      "What makes a meal healthy?",
      "What are good manners when eating with others?"
    ]
  },
  {
    grade: "Grade 3",
    subject: "Mathematical Activities",
    strand: "Measurement and Geometry",
    subStrand: "Length, Mass, Capacity and Shapes",
    learningOutcomes: [
      "Measure length of objects using non-standard units (handspans, strides) and standard units (meters)",
      "Compare the mass of different objects using a simple beam balance (heavier, lighter, same mass)",
      "Measure capacity of containers using non-standard and standard units (liters)",
      "Identify, name, and draw 2D shapes (circle, triangle, rectangle, square) and find their lines of symmetry"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (measuring and comparing dimensions)",
      "Self-efficacy (building accuracy in practical measurements)"
    ],
    values: [
      "Integrity (accurate measurement reporting)",
      "Responsibility (returning measuring instruments to safety)"
    ],
    pcis: [
      "Financial Literacy (measuring out quantities of goods for sale)",
      "Enterprise Education"
    ],
    suggestedResources: [
      "Metre rules, measuring tapes, strings",
      "Improvised beam balance, varying weights",
      "One-litre bottles, cups, water, sand",
      "Cardboard shape cutouts, scissors for finding symmetry lines"
    ],
    inquiryQuestions: [
      "Why do we need standard units like meters or liters to measure?",
      "How can we determine which container holds more water?",
      "What is symmetry and where do we find it in nature?"
    ]
  },
  {
    grade: "Grade 3",
    subject: "Language (English) Activities",
    strand: "Writing and Vocabulary",
    subStrand: "Sentence Structure, Punctuation and Creative Writing",
    learningOutcomes: [
      "Construct grammatically correct sentences using proper capitalization and punctuation (full stop, question mark, comma)",
      "Write a short, cohesive paragraph of 4-5 sentences about a familiar topic (my school, my pet, my family)",
      "Use descriptive adjectives (big, beautiful, tall, red) and prepositions (on, in, under, next to) correctly",
      "Spell commonly used grade-appropriate sight words and academic terms correctly"
    ],
    coreCompetencies: [
      "Communication (cohesive written expression)",
      "Creativity and Imagination (composing personal paragraphs)"
    ],
    values: [
      "Responsibility (maintaining neat handwriting)",
      "Integrity (presenting original thoughts in writing)"
    ],
    pcis: [
      "Self-expression and identity building",
      "Information literacy (structuring ideas)"
    ],
    suggestedResources: [
      "Punctuation flashcards, sentence strip charts",
      "Adjective matching game boards",
      "Writing journals, vocabulary word walls"
    ],
    inquiryQuestions: [
      "Why do sentences start with capital letters and end with punctuation marks?",
      "How do adjectives help make our stories more interesting?",
      "How can we organize our sentences so they make sense together?"
    ]
  },
  {
    grade: "Grade 4",
    subject: "English Language Activities",
    strand: "Listening and Speaking",
    subStrand: "Aural Comprehension and Polite Forms",
    learningOutcomes: [
      "Listen to an audio or read-aloud narrative and retell key events, characters, and settings",
      "Use polite expressions, apologies, turn-taking cues, and invitations appropriately in group discussions",
      "Pronounce consonant clusters and digraphs (ch, sh, th, wh) correctly in spoken sentences",
      "Identify and state the main idea and supporting details from a short spoken text"
    ],
    coreCompetencies: [
      "Communication and Collaboration (active listening, respectful turn-taking)",
      "Critical Thinking (identifying main ideas in spoken discourse)"
    ],
    values: [
      "Respect (listening to peers during conversations)",
      "Love (using courteous and polite language)"
    ],
    pcis: [
      "Interpersonal Relationships",
      "Life Skills (assertive and polite communication)"
    ],
    suggestedResources: [
      "Audio players with recorded stories",
      "Role-play prompt cards, puppet theatres",
      "Phonic flashcards containing consonant clusters"
    ],
    inquiryQuestions: [
      "What makes someone an active and respectful listener?",
      "Why are polite expressions important when speaking with elders and peers?",
      "How do we figure out the main point of a spoken message?"
    ]
  },
  {
    grade: "Grade 4",
    subject: "Social Studies",
    strand: "Physical Environment",
    subStrand: "Map Work, Cardinal Points and Local Landforms",
    learningOutcomes: [
      "Identify and state the four main cardinal points (North, South, East, West) and their intermediate points",
      "Locate and describe key physical features in their county (hills, rivers, plains, valleys)",
      "Explain the relationship between local physical features and the economic activities of people",
      "Demonstrate care and conservation of the immediate environment and county resources"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (using cardinal directions to navigate)",
      "Citizenship (belonging to a county, resource conservation)"
    ],
    values: [
      "Patriotism (appreciation for local geography and county development)",
      "Responsibility (conserving local landforms and water bodies)"
    ],
    pcis: [
      "Environmental Sustainability",
      "Disaster Risk Reduction (staying safe near fast-flowing rivers or steep hills)"
    ],
    suggestedResources: [
      "County physical maps, compasses",
      "Clay or sand for modeling local landforms",
      "Photographs and diagrams of geographical features"
    ],
    inquiryQuestions: [
      "How do directions help us travel safely from one place to another?",
      "How does living near a river or a mountain influence what people do for work?",
      "How can we prevent soil from washing down the local hills?"
    ]
  },
  {
    grade: "Grade 5",
    subject: "Mathematics",
    strand: "Fractions and Decimals",
    subStrand: "Equivalent Fractions, Decimals and Percentages",
    learningOutcomes: [
      "Identify and write equivalent fractions using concrete models and mathematical procedures",
      "Convert common fractions into decimals and vice versa up to two decimal places",
      "Compare and order fractions with same or different denominators",
      "Apply the concept of fractions, decimals, and basic percentages to solve real-life sharing and trade problems"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (comparing fractional values)",
      "Learning to Learn (translating numerical formats)"
    ],
    values: [
      "Integrity (fair sharing and distribution)",
      "Social Justice (understanding equal portions)"
    ],
    pcis: [
      "Financial Literacy (calculating discount percentages and fractional shares of costs)",
      "Consumer Awareness"
    ],
    suggestedResources: [
      "Fraction strips, circles, grids, and decimal cards",
      "Play money, percentage charts",
      "Real-life objects like apples, bread, or strings for fractional cutting labs"
    ],
    inquiryQuestions: [
      "Why can different-looking fractions represent the exact same quantity?",
      "How are decimals and fractions connected?",
      "Where in a local market do we see fractions or percentages being used?"
    ]
  },
  {
    grade: "Grade 5",
    subject: "Science & Technology",
    strand: "Matter and Energy",
    subStrand: "States of Matter, Heat Transfer, and light",
    learningOutcomes: [
      "Classify substances as solids, liquids, or gases based on their physical properties (shape, volume, flow)",
      "Investigate and describe heat transfer in solids (conduction), liquids (convection), and gases (convection/radiation)",
      "Demonstrate reflection and refraction of light using plane mirrors, glass blocks, and water",
      "Explain the practical applications of heat conductors and insulators in daily life (cooking pots, thermal flasks)"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (designing thermal insulators)",
      "Creativity and Imagination (bending light experiments)"
    ],
    values: [
      "Responsibility (handling glass and hot liquids safely)",
      "Integrity (objective observation and recording of results)"
    ],
    pcis: [
      "Environmental Sustainability (energy conservation using insulation)",
      "Safety (preventing burns and optical hazards)"
    ],
    suggestedResources: [
      "Plane mirrors, glass prisms/blocks, bowls of water, torches",
      "Metal spoons, plastic spoons, wooden sticks, warm water",
      "Various solids, liquids, and gases in containers"
    ],
    inquiryQuestions: [
      "What causes materials to expand, melt, or evaporate?",
      "How does heat travel from a stove to our food?",
      "How can we bend light using water and glass?"
    ]
  },
  {
    grade: "Grade 6",
    subject: "Art & Craft / Creative Arts",
    strand: "Visual Arts and Crafts",
    subStrand: "Drawing, Painting, and Fabric Decoration",
    learningOutcomes: [
      "Create high-contrast drawings showing light and shade (shading techniques: cross-hatching, stippling, blending)",
      "Apply color theory (primary, secondary, warm, cool colors) to paint a scenery or descriptive still-life setup",
      "Design and execute simple fabric tie-and-dye or batik patterns using local dye sources and fabric pieces",
      "Examine and appreciate traditional and modern Kenyan art styles, displaying safety in craftwork"
    ],
    coreCompetencies: [
      "Creativity and Imagination (designing custom fabric patterns)",
      "Communication and Collaboration (critiquing artworks constructively)",
      "Self-efficacy (mastering dye-making and shading)"
    ],
    values: [
      "Patriotism (incorporating Kenyan heritage themes in paintings)",
      "Responsibility (cleaning workspaces and disposing chemicals safely)"
    ],
    pcis: [
      "Creative Economy (marketing simple tie-dye fabrics)",
      "Environmental Education (using natural pigments from flowers and soil)"
    ],
    suggestedResources: [
      "Drawing pencils (2B, 4B, 6B), sketchpads, charcoal",
      "Watercolors, brushes, mixing palettes",
      "Cotton fabric, string, rubber bands, local or synthetic dyes",
      "Examples of Kenyan visual arts, soap, and protective aprons"
    ],
    inquiryQuestions: [
      "How can we make flat drawings look three-dimensional?",
      "How does changing the placement of ties on a fabric change its final dyed pattern?",
      "What stories can we tell about Kenya through our paintings?"
    ]
  },
  {
    grade: "Grade 6",
    subject: "English Language Activities",
    strand: "Grammar and Sentence Structures",
    subStrand: "Parts of Speech and Complex Sentence Construction",
    learningOutcomes: [
      "Identify and use nouns, pronouns, verbs, adverbs, and adjectives correctly in complex paragraphs",
      "Construct sentences using active and passive voice correctly (e.g. 'The dog chased the cat' vs 'The cat was chased by the dog')",
      "Use coordinating conjunctions (and, but, or, so) and subordinating conjunctions (because, although, since) to link clauses",
      "Write a clear, structured narrative essay of 3 paragraphs with a logical introduction, body, and conclusion"
    ],
    coreCompetencies: [
      "Communication (coherent written and oral narration)",
      "Critical Thinking (structuring arguments in paragraphs)"
    ],
    values: [
      "Integrity (producing plagiarism-free written essays)",
      "Responsibility (checking spelling and grammatical errors)"
    ],
    pcis: [
      "Self-expression",
      "Digital Literacy (composing text on digital word processors)"
    ],
    suggestedResources: [
      "Grammar flowcharts, conjunction cards",
      "Sentence builders, transition word walls",
      "Peer review checklist rubrics"
    ],
    inquiryQuestions: [
      "How does voice (active vs passive) change the focus of our sentence?",
      "How do conjunctions help us express complex ideas or cause-and-effect?",
      "What are the key elements of an engaging narrative introduction?"
    ]
  },
  {
    grade: "Grade 7 (Junior School)",
    subject: "Social Studies",
    strand: "African Geography and Heritage",
    subStrand: "Weather and Climate of Africa",
    learningOutcomes: [
      "Describe the factors influencing the climate of Africa (latitude, altitude, distance from sea, ocean currents)",
      "Identify and locate major climatic zones of Africa on a physical map of the continent",
      "Analyze the impact of climatic zones on human activities (agriculture, pastoralism, tourism) across Africa",
      "Propose adaptive and sustainable practices to mitigate negative climate change impacts locally"
    ],
    coreCompetencies: [
      "Citizenship (regional continental awareness and citizenship)",
      "Critical Thinking and Problem Solving (linking climate to economic lifestyle)"
    ],
    values: [
      "Unity (regional cooperation for climate protection)",
      "Responsibility (local environmental stewardship)"
    ],
    pcis: [
      "Climate Change Adaptation",
      "Environmental Sustainability"
    ],
    suggestedResources: [
      "Physical and climatic maps of Africa",
      "Weather instruments, temperature and rainfall databases",
      "Case studies of desertification in the Sahel region"
    ],
    inquiryQuestions: [
      "Why does temperature decrease as we climb Mount Kenya?",
      "How do different ocean currents along the coast of Africa shape coastal weather?",
      "How can African nations work together to tackle food insecurity caused by drought?"
    ]
  },
  {
    grade: "Grade 7 (Junior School)",
    subject: "Agriculture & Nutrition",
    strand: "Crop and Livestock Production",
    subStrand: "Organic Farming and Poultry Management",
    learningOutcomes: [
      "Establish a kitchen garden using organic farming practices (intercropping, companion planting, natural pest repellents)",
      "Describe different poultry rearing systems (free-range, deep litter, battery cage) and their welfare implications",
      "Perform safe collection, sorting, cleaning, and storage of poultry eggs",
      "Identify common nutritional requirements of poultry and select suitable local feed ingredients"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (diagnosing nutrient deficiencies)",
      "Self-efficacy (managing a kitchen garden project)",
      "Creativity (improvising organic pest sprays)"
    ],
    values: [
      "Responsibility (caring for farm birds and crops daily)",
      "Love (showing kindness and welfare considerations for domestic poultry)"
    ],
    pcis: [
      "Food Security & Nutrition",
      "Enterprise Education (poultry enterprise planning)"
    ],
    suggestedResources: [
      "Kitchen garden site, organic seeds, mulch, compost",
      "Poultry housing model, feed samples, clinical chart",
      "Egg trays, weighing scale, sanitizer"
    ],
    inquiryQuestions: [
      "Why is organic farming becoming preferred over synthetic-reliant agriculture?",
      "How do housing systems affect the health and productivity of layers?",
      "What make eggs a highly valuable nutritional resource in our families?"
    ]
  },
  {
    grade: "Grade 8 (Junior School)",
    subject: "Integrated Science",
    strand: "Energy, Electricity and Optics",
    subStrand: "Static Electricity, Electric Circuits and Magnetism",
    learningOutcomes: [
      "Demonstrate the production of static charges through friction and explain their daily occurrences (lightning, clothing static)",
      "Construct a complete series and parallel electric circuit, measuring voltage and current using meters",
      "Construct a temporary electromagnet using an iron nail, copper wire, and dry cells",
      "Differentiate between magnetic and non-magnetic materials and plot magnetic field lines"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (troubleshooting circuit breaks)",
      "Creativity and Imagination (building a working electromagnet model)"
    ],
    values: [
      "Responsibility (handling electricity and batteries safely)",
      "Integrity (reporting precise circuit measurement readings)"
    ],
    pcis: [
      "Safety and Health Education (electrical shock hazards and lightning safety)",
      "Energy Conservation"
    ],
    suggestedResources: [
      "Ebonite rods, glass rods, fur, silk, electroscopes",
      "Dry cells, wires, switch switches, bulbs, voltmeters, ammeters",
      "Iron nails, copper wire, bar magnets, iron filings, compasses"
    ],
    inquiryQuestions: [
      "How does static charge buildup trigger a lightning strike?",
      "What is the difference in current flow between series and parallel household connections?",
      "How can electric current generate magnetic properties?"
    ]
  },
  {
    grade: "Grade 8 (Junior School)",
    subject: "Mathematics",
    strand: "Geometry and Mensuration",
    subStrand: "Pythagoras Theorem and Area of Polygons",
    learningOutcomes: [
      "Investigate and prove the Pythagoras Theorem using geometric squares and grids",
      "Apply the Pythagoras Theorem to calculate unknown lengths of sides in right-angled triangles",
      "Calculate the area of composite polygons (trapeziums, parallelograms, circles, and semicircles)",
      "Estimate the surface area of simple 3D solids (cuboids, cylinders, triangular prisms)"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (decomposing shapes to find area)",
      "Self-efficacy (building structural accuracy and calculation confidence)"
    ],
    values: [
      "Integrity (accurate dimensions reporting)",
      "Resilience (working through complex area calculations)"
    ],
    pcis: [
      "Financial Literacy (costing flooring materials or roofing sheets based on area)",
      "Environmental design"
    ],
    suggestedResources: [
      "Grid papers, geometry sets, scissors",
      "Cardboard cuboids, cylinders, nets of solids",
      "Scientific calculators, formula sheets"
    ],
    inquiryQuestions: [
      "How can the Pythagoras Theorem help builders ensure walls are perpendicular?",
      "How do we break down a highly irregular plot of land to find its total area?",
      "Why is understanding the 'net' of a 3D solid helpful in finding its surface area?"
    ]
  },
  {
    grade: "Grade 9 (Junior School)",
    subject: "Mathematics",
    strand: "Probability and Statistics",
    subStrand: "Data Presentation, Measures of Central Tendency and Simple Probability",
    learningOutcomes: [
      "Organize raw statistical data into frequency tables and construct bar graphs, pie charts, and line graphs",
      "Calculate the mean, median, and mode for both ungrouped and simple grouped datasets",
      "Determine the experimental and theoretical probability of simple single-stage events (tossing coins, rolling dice)",
      "Interpret charts and graphs in national newspapers and report on statistical biases or errors"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (detecting data misrepresentation)",
      "Digital Literacy (using spreadsheets to plot graphs)",
      "Learning to Learn (interpreting probabilities)"
    ],
    values: [
      "Integrity (ethical data reporting and representation)",
      "Responsibility"
    ],
    pcis: [
      "Consumer Awareness (evaluating false advertising or statistical bias)",
      "Disaster Risk Planning (using probability models to assess drought or flood occurrence)"
    ],
    suggestedResources: [
      "Frequency table worksheets, grid sheets",
      "Coins, dice, colored balls, spinners",
      "Spreadsheet software (Excel, Google Sheets), newspaper articles with data visuals"
    ],
    inquiryQuestions: [
      "Why are there different measures of central tendency, and when is median better than mean?",
      "How does theoretical probability compare to experimental probability as the number of trials increases?",
      "How can graphs be manipulated to mislead consumers or voters?"
    ]
  },
  {
    grade: "Grade 9 (Junior School)",
    subject: "Creative Arts & Sports",
    strand: "Music and Performing Arts",
    subStrand: "Scale Construction, Chords and Play Production",
    learningOutcomes: [
      "Construct major scales (C, G, F major) on the treble staff using appropriate accidentals (sharps, flats)",
      "Perform basic major and minor chords on a descant recorder, keyboard, or local acoustic instrument",
      "Design, rehearse, and stage a short dramatic play focusing on an active social theme in Kenya (integrity, health, unity)",
      "Demonstrate appropriate stage movements, vocal projection, and costume choices in dramatic arts"
    ],
    coreCompetencies: [
      "Creativity and Imagination (scriptwriting and score composing)",
      "Communication and Collaboration (rehearsing in theatrical ensembles)",
      "Self-efficacy (confident public stage performance)"
    ],
    values: [
      "Unity (collaborative crew coordination during drama stage management)",
      "Patriotism (showcasing Kenyan indigenous musical and folklore instruments)"
    ],
    pcis: [
      "Creative Arts Economy",
      "Social Integration and Cohesion"
    ],
    suggestedResources: [
      "Music manuscript books, descant recorders, keyboards, or acoustic guitars",
      "Stage props, costumes, theatrical lights setup",
      "Video recordings of classic Kenyan secondary school music festival performances"
    ],
    inquiryQuestions: [
      "How do key signatures alter the mood and pitches of a musical piece?",
      "How do we use physical gestures and vocal modulation to convey deep emotions in drama?",
      "What is the social responsibility of performance artists in shaping national morals?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Biology",
    strand: "Cell Biology and Genetics",
    subStrand: "Cell Structure, Functions, and Mendelian Genetics",
    learningOutcomes: [
      "Explain the structure and functions of plant and animal cells under a light microscope",
      "Differentiate between prokaryotic and eukaryotic cells, identifying key organelles (mitochondria, chloroplasts, nucleus)",
      "Apply Mendelian genetics to solve monohybrid crosses, explaining dominant, recessive, and codominant inheritance patterns",
      "Explain the cell cycle, mitosis, and meiosis, and their significance in growth, repair, and gamete formation"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (interpreting pedigree charts and genetic crosses)",
      "Learning to Learn (identifying cell components under microscope variations)"
    ],
    values: [
      "Integrity (unbiased recording of biological slide data)",
      "Responsibility (handling microscopic equipment carefully)"
    ],
    pcis: [
      "Health Education (understanding genetic disorders and counsel paths)",
      "Human Rights (ethical issues surrounding genetic editing and GMOs)"
    ],
    suggestedResources: [
      "Light microscopes, prepared slides (onion cell, cheek cell), staining dyes",
      "Cell 3D models, karyotype worksheets",
      "Genetic cross worksheets, pedigree layouts"
    ],
    inquiryQuestions: [
      "How do the specializations of plant cells differ from animal cells to support their lifestyles?",
      "Why is the division of genetic materials in meiosis critical to preventing chromosomal abnormalities in offspring?",
      "How does a single mutation in a nucleotide sequence alter the physical traits of a full organism?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Chemistry",
    strand: "Atomic Structure and Bonding",
    subStrand: "Periodic Table, Bonding, and Intermolecular Forces",
    learningOutcomes: [
      "Describe the electronic configuration of the first 20 elements in terms of shell energy levels",
      "Analyze the periodic trends in atomic radius, ionization energy, and electronegativity across periods and down groups",
      "Differentiate between ionic, covalent, metallic, and coordinate bonding based on electron sharing/transfer",
      "Relate physical properties of substances (melting point, conductivity, solubility) to their bonding types and intermolecular forces"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (deducing chemical behavior from periodic position)",
      "Learning to Learn (conceptualizing microscopic bonding models)"
    ],
    values: [
      "Responsibility (following laboratory safety protocols for corrosive/toxic reagents)",
      "Integrity"
    ],
    pcis: [
      "Safety and Health Education (safe handling of chemicals)",
      "E-waste recycling based on metallic element extraction"
    ],
    suggestedResources: [
      "Periodic Table wall chart, atomic model construction kits (balls and sticks)",
      "Conductivity testers, beakers, heating rigs, table salt, sugar, copper wire, wax",
      "Safety charts, hazard labels guidelines"
    ],
    inquiryQuestions: [
      "Why do elements in the same group of the periodic table exhibit identical chemical properties?",
      "How does chemical bonding stabilize unstable isolated atoms?",
      "Why does ice float on water, and how does this relate to intermolecular hydrogen bonds?"
    ]
  },
  {
    grade: "Senior School: Grade 10",
    subject: "Physics",
    strand: "Mechanics and Fluid Flow",
    subStrand: "Newtonian Motion, Force and Bernoulli's Principle",
    learningOutcomes: [
      "State and apply Newton's Three Laws of Motion to explain everyday mechanical interactions and calculate acceleration",
      "Explain fluid pressure variations in terms of density and depth, applying Archimedes' Principle to floating vessels",
      "Investigate and describe fluid flow dynamics, formulating and applying Bernoulli's Equation for streamlined flow",
      "Conduct practical labs to verify the laws of conservation of linear momentum in elastic and inelastic collisions"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (deriving formulas and resolving mechanics vectors)",
      "Self-efficacy (calibrating physical sensors and measuring tools)"
    ],
    values: [
      "Integrity (unbiased measurement reports)",
      "Courage (troubleshooting complex force vectors and experimental setups)"
    ],
    pcis: [
      "Road Safety Education (understanding momentum and inertia during braking)",
      "Aeronautical developments (Bernoulli's lift applications)"
    ],
    suggestedResources: [
      "Ticker-timers, trolley carts, acceleration tracks, photogates",
      "Spring balances, displacement cans, overflow cylinders, standard weights",
      "Venturi tubes, air foils, water jet nozzles",
      "Momentum balls, crash pads, velocity recorders"
    ],
    inquiryQuestions: [
      "How does inertial force protect or endanger passengers in a moving vehicle?",
      "Why does a heavily laden ship float on water while a small steel nail sinks?",
      "How does the shape of an aircraft wing generate a pressure difference to lift it off the ground?"
    ]
  },
  {
    grade: "Senior School: Grade 11",
    subject: "Mathematics",
    strand: "Calculus and Coordinate Geometry",
    subStrand: "Differential Calculus and Conic Sections",
    learningOutcomes: [
      "Differentiate polynomial functions from first principles and apply standard differentiation rules to find gradients",
      "Apply differential calculus to locate stationary points (maxima, minima, inflection) and solve real-world optimization problems",
      "Determine equations of straight lines, circles, parabolas, and ellipses on a coordinate plane given specific geometric properties",
      "Apply integration techniques to find the exact area under curves of simple polynomial functions"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (formulating optimization functions and integrating curves)",
      "Learning to Learn (identifying connections between geometrical positions and calculus derivatives)"
    ],
    values: [
      "Integrity (academic honesty in calculations)",
      "Courage (confronting abstract math proofs and derivation steps)"
    ],
    pcis: [
      "Financial Optimization (minimizing packing material costs or maximizing shipping volumes using differential formulas)",
      "Satellite signal mechanics (parabolic geometry applications)"
    ],
    suggestedResources: [
      "Graphing software (GeoGebra or Desmos) on tablet interfaces",
      "Conic section model kits (split cones, intersecting planes)",
      "Calculus workbooks focusing on structural optimization and curves"
    ],
    inquiryQuestions: [
      "How does the concept of a limit allow us to measure the exact rate of change at an instantaneous point?",
      "How can calculus help an agricultural firm determine the exact crop density that maximizes total yield?",
      "What is the mathematical connection between the geometric definition of a parabola and its algebraic equation?"
    ]
  },
  {
    grade: "Senior School: Grade 11",
    subject: "English Language and Literature",
    strand: "Advanced Literacy and Drama",
    subStrand: "Literary Analysis, Poetry, and Modern Theater",
    learningOutcomes: [
      "Critically analyze thematic constructs, stylistic devices, and socio-political themes in approved Kenyan and global novels",
      "Deconstruct complex poetic devices (imagery, metaphor, tone, rhythm, stanzaic layouts) in classical and modern verses",
      "Draft a structured literary critical essay using textual citations to support characterization arguments",
      "Write, rehearse, and direct a 10-minute dramatic monologue focusing on contemporary human rights themes in Kenya"
    ],
    coreCompetencies: [
      "Communication (articulate literary analysis and poetic recitation)",
      "Creativity and Imagination (scriptwriting and dramatic performance directions)",
      "Citizenship (empathizing with socio-political issues presented in literary works)"
    ],
    values: [
      "Social Justice (addressing equity and historical injustices through literature analysis)",
      "Patriotism (appreciating Kenyan narrative styles and post-colonial authors)"
    ],
    pcis: [
      "Human Rights and Democracy",
      "Peace Education"
    ],
    suggestedResources: [
      "Syllabus approved play texts and novels (e.g., works by Ngugi wa Thiong'o, Shakespeare, or modern poets)",
      "Poetry anthologies, literary critique databases",
      "Video recordings of live theatrical performances and expert literary discussions"
    ],
    inquiryQuestions: [
      "How does literature act as a mirror to reflect and correct the historical errors of a nation?",
      "How do poets use rhythm and imagery to convey complex emotions that regular prose cannot capture?",
      "Why do writers use satire and symbolism instead of direct language when criticizing leadership or social decays?"
    ]
  },
  {
    grade: "Senior School: Grade 11",
    subject: "Chemistry",
    strand: "Organic Chemistry and Kinetics",
    subStrand: "Alkanes, Alkenes, Alcohols, and Chemical Reaction Kinetics",
    learningOutcomes: [
      "Name, draw, and synthesize isomers of hydrocarbons (alkanes, alkenes, alkynes) using IUPAC nomenclature",
      "Describe the chemical properties, combustion profiles, and industrial applications of alcohols, carboxylic acids, and esters",
      "Determine chemical reaction rates experimentally and analyze factors affecting kinetics (temperature, concentration, surface area, catalysts)",
      "Formulate rate equations and explain activation energy profiles using transition state diagrams"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (deducing reaction mechanisms and balancing rate laws)",
      "Learning to Learn (memorizing organic synthesis steps and chemical pathways)"
    ],
    values: [
      "Responsibility (handling highly flammable alcohols and corrosive acids with extreme care)",
      "Integrity"
    ],
    pcis: [
      "Energy Sustainability (biodiesel and alternative bio-alcohol fuels research)",
      "Industrial Safety (preventing explosive gas buildup based on reaction kinetics)"
    ],
    suggestedResources: [
      "Organic molecular model kits (carbon bonds, hydrogen pins)",
      "Syringes, stopwatches, sodium thiosulfate solution, hydrochloric acid, magnesium ribbon",
      "Gas chromatography data sheets, catalysis charts"
    ],
    inquiryQuestions: [
      "How do minor shifts in carbon bond structure alter the chemical safety and usefulness of organic fuels?",
      "How does a catalyst decrease reaction times without being consumed in the process?",
      "Why is the control of temperature critical to preventing runaway reactions in biochemical and industrial plants?"
    ]
  },
  {
    grade: "Senior School: Grade 12",
    subject: "Mathematics",
    strand: "Probability, Statistics and Matrices",
    subStrand: "Probability Distributions, Linear Algebra, and Hypotheses",
    learningOutcomes: [
      "Apply probability distributions (binomial, normal) to solve industrial quality control and population genetics problems",
      "Perform matrix arithmetic and solve systems of three-variable linear equations using Cramer's Rule or Matrix Inversion",
      "Formulate null and alternative hypotheses, and conduct simple t-tests to evaluate the significance of experimental outcomes",
      "Analyze multi-variant regression models and interpret statistical scatter plots for scientific reports"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (resolving complex multidimensional matrix transformations and calculating probability distributions)",
      "Digital Literacy (running statistical tests on digital statistical packages)",
      "Learning to Learn"
    ],
    values: [
      "Integrity (strict compliance with statistical significance thresholds; avoiding data manipulation)",
      "Responsibility"
    ],
    pcis: [
      "Consumer Protection (verifying claimed advertising margins using statistical confidence intervals)",
      "Enterprise planning"
    ],
    suggestedResources: [
      "Normal distribution charts, z-score tables, t-distribution worksheets",
      "Spreadsheet statistical utilities, scientific matrix calculators",
      "Standard sample datasets representing agricultural yield variations"
    ],
    inquiryQuestions: [
      "How do matrices simplify the calculation of multi-variable economic interactions?",
      "Why is statistical hypothesis testing vital to verifying the effectiveness of medical drugs or agricultural seeds?",
      "What is the difference between a correlation coefficient and a causal relationship in scientific data?"
    ]
  },
  {
    grade: "Senior School: Grade 12",
    subject: "English Language and Literature",
    strand: "Critical Writing & Drama",
    subStrand: "Academic Writing, Rhetoric, and Comparative Drama",
    learningOutcomes: [
      "Construct high-quality argumentative and research essays with accurate references and persuasive rhetoric structures",
      "Deliver a 5-minute persuasive speech using rhetorical appeals (ethos, pathos, logos) and eloquent verbal delivery",
      "Analyze and compare theatrical structures, tragic themes, and character development in classical and contemporary drama",
      "Deconstruct media texts, advertising copy, and political speeches to identify rhetorical fallacies and biases"
    ],
    coreCompetencies: [
      "Communication (eloquent persuasive speaking, advanced academic writing)",
      "Critical Thinking and Problem Solving (detecting rhetoric fallacies, logical deconstruction)"
    ],
    values: [
      "Social Justice (advocating for community issues through rhetoric appeals)",
      "Integrity (academic referencing, objective argument construction)"
    ],
    pcis: [
      "Democratic Participation (identifying logical fallacies in political advertisements)",
      "Consumer Protection (detecting marketing half-truths)"
    ],
    suggestedResources: [
      "Rhetoric guides, logical fallacies flashcards",
      "Approved dramatic play scripts, comparison grids",
      "Exemplar academic research articles"
    ],
    inquiryQuestions: [
      "How do we balance emotional appeal (pathos) and logical evidence (logos) to convince a skeptical audience?",
      "How does drama allow us to explore conflicting views on morality in a safe, controlled setting?",
      "Why is academic integrity and accurate referencing critical to the credibility of scientific or social research?"
    ]
  },
  {
    grade: "Senior School: Grade 12",
    subject: "Physics",
    strand: "Electromagnetism and Modern Physics",
    subStrand: "Electromagnetic Induction, Quantum Theory and Nuclear Fusion",
    learningOutcomes: [
      "Explain the principles of electromagnetic induction, and apply Faraday's and Lenz's Laws to calculate induced EMF",
      "Analyze the construction and efficiency parameters of step-up and step-down AC power transformers",
      "Explain the photoelectric effect, and calculate threshold frequency and work function using Einstein's Photoelectric Equation",
      "Describe radioactivity, half-life equations, nuclear fission, and fusion, outlining practical energy generation and medical uses"
    ],
    coreCompetencies: [
      "Critical Thinking and Problem Solving (solving quantum energy equations and induction rate vectors)",
      "Learning to Learn (adapting to abstract particle physics and wave-particle duality concepts)"
    ],
    values: [
      "Responsibility (handling radiation data and high voltage circuit setups safely)",
      "Integrity"
    ],
    pcis: [
      "Clean Energy Developments (nuclear power plant safety and solar photovoltaic cell design)",
      "Health and Safety (radiation protection in radiological medical exams)"
    ],
    suggestedResources: [
      "Galvanometers, search coils, bar magnets, transformer models (primary/secondary windings)",
      "Photoelectric vacuum tube cells, spectrum light filters, microammeters",
      "Radioactivity simulation boards, half-life decay coin charts"
    ],
    inquiryQuestions: [
      "How does a changing magnetic field generate electrical current without physical contact?",
      "How does Einstein's quantum model of light resolve the contradictions that classical wave theory could not explain in the photoelectric effect?",
      "How can nuclear radiation be both a highly lethal hazard and a lifesaving diagnostic/treatment utility in modern oncology?"
    ]
  }
];

export function findRequirements(subject: string, grade: string, topic?: string): CurriculumRequirement | null {
  const normSubject = subject.toLowerCase().replace(/[^a-z]/g, '');
  const normGrade = grade.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Look for exact/partial match
  const matches = KENYAN_CURRICULUM_REQUIREMENTS.filter(req => {
    const rSubject = req.subject.toLowerCase().replace(/[^a-z]/g, '');
    const rGrade = req.grade.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const subjectMatch = normSubject.includes(rSubject) || rSubject.includes(normSubject);
    const gradeMatch = normGrade.includes(rGrade) || rGrade.includes(normGrade);
    
    return subjectMatch && gradeMatch;
  });

  if (matches.length > 0) {
    if (topic) {
      const normTopic = topic.toLowerCase();
      const topicMatch = matches.find(m => 
        m.strand.toLowerCase().includes(normTopic) || 
        m.subStrand.toLowerCase().includes(normTopic) ||
        normTopic.includes(m.strand.toLowerCase()) ||
        normTopic.includes(m.subStrand.toLowerCase())
      );
      if (topicMatch) return topicMatch;
    }
    return matches[0];
  }

  return null;
}
