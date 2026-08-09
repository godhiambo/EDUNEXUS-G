import {
  VirtualFieldTripRoute,
  StudentExcursionProgress,
  ExitSlipAnswers,
  VirtualFieldTripLessonPlan,
  SocraticTravelJournal,
  SocraticJournalStopEntry,
  LeaderboardPrivacySettings,
  ClassroomLeaderboardEntry
} from '../types/virtualFieldTrip';

// Curated Educational Preset Field Trips
export const PRESET_FIELD_TRIPS: VirtualFieldTripRoute[] = [
  {
    id: 'brussels-french-tour',
    title: 'Brussels Architectural & Civic Exploration',
    destination: 'Brussels Grand Place & European Quarter',
    country: 'Belgium',
    subject: 'European History & French Language',
    gradeLevel: 'Junior Secondary (Grade 7 - 9)',
    coverImage: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=1200&q=80',
    description: 'Embark on an immersive digital excursion through historic Brussels. Follow French directional cues to navigate from the Royal Palace to the UNESCO Grand-Place and the Atomium.',
    primaryLanguage: 'French & English',
    isPreset: true,
    createdBy: 'EduNexus Curriculum Specialist',
    createdAt: '2026-01-15',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Palais Royal de Bruxelles (Royal Palace)',
        locationName: 'Palais Royal, Rue Royale, Brussels',
        lat: 50.8428,
        lng: 4.3625,
        zoom: 17,
        mapType: 'satellite',
        streetViewPov: { heading: 270, pitch: 10 },
        readingPassage: 'Welcome to Brussels! Standing at the gates of the Palais Royal, observe the grand Neoclassical façade constructed during King Leopold II’s reign. In European diplomacy, public architecture is designed to project stability and cultural heritage.',
        phenomenonHook: {
          title: 'The Neoclassical Acoustic Symmetry Anomaly',
          mysteryQuestion: 'Why does a voice spoken softly at the central royal gates resonate distinctly across the entire plaza, while ambient city street noise is muffled?',
          observableFacts: [
            'Concave limestone façade geometry forms a natural parabolic acoustic focuser.',
            'Precision pillar spacing creates destructive acoustic interference nodes for low-frequency urban carriage traffic.'
          ],
          inquiryChallenge: 'Examine how 19th-century royal architects engineered physical acoustics and geometric symmetry to project authority without electronic amplification.'
        },
        foreignLanguageCues: [
          {
            phrase: 'Tournez à gauche sur la Rue Royale',
            language: 'French',
            translation: 'Turn left onto Royal Street',
            phoneticSpelling: 'toor-nay ah gohsh soor lah roo woy-al',
            usageContext: 'Directional navigation clue for turning left towards Grand-Place'
          },
          {
            phrase: 'Regardez la façade néoclassique',
            language: 'French',
            translation: 'Look at the neoclassic façade',
            phoneticSpelling: 'ruh-gar-day lah fah-sahd',
            usageContext: 'Observational instruction for architectural scrutiny'
          }
        ],
        navigationInstruction: 'Follow the French cue "Tournez à gauche sur la Rue Royale" and proceed 400 meters West towards the historic guildhalls.',
        socraticGuidePrompts: [
          'Examine the symmetry of the front pillars on the satellite map. Why did 19th-century European architects favor symmetrical designs for government seats?',
          'Notice the cobblestone plaza in front of the palace gates. How does street width impact crowd movement during civic ceremonies?'
        ],
        checkpoints: [
          {
            id: 'bxl-chk-1',
            label: 'Locate the main palace entrance arch on the satellite map',
            hint: 'Center the viewer on the symmetrical central portico facing Brussels Park.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'bxl-chk-2',
            label: 'Translate the French navigation cue "Tournez à gauche"',
            hint: 'Use the interactive translation badge in the reader panel.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'bxl-chk-3',
            label: 'Respond to the Socratic Guide prompt about Neoclassical symmetry',
            hint: 'Type your observation into the Local Tour Guide AI panel.',
            isCompleted: false,
            rewardPoints: 30
          }
        ],
        educatorNotes: [
          {
            id: 'note-bxl-1',
            authorName: 'Dr. Sarah Johnson',
            role: 'Lead European History Specialist',
            noteText: 'Pedagogical Focus: Connect King Leopold II’s architectural overhaul with late 19th-century statecraft. Ask students to contrast monarchical symmetry with democratic urban spaces.',
            pedagogicalFocus: 'historical_context',
            isMilestoneLocked: false,
            addedAt: '2026-02-10'
          },
          {
            id: 'note-bxl-2',
            authorName: 'Mme. Claire Dubois',
            role: 'French Language & Cultural Consultant',
            noteText: 'Geographic Milestone Unlocked Note: Excellent observation! Notice how cardinal directions map to French imperatives like "Tournez à gauche" in official European civic signage.',
            pedagogicalFocus: 'discussion_prompt',
            isMilestoneLocked: true,
            requiredMilestoneCount: 1,
            addedAt: '2026-02-12'
          }
        ],
        annotations: [
          {
            id: 'ann-bxl-1',
            xPercentage: 48,
            yPercentage: 35,
            title: 'Neoclassical Main Gates',
            note: 'The central gates feature Corinthian columns made of regional Belgian limestone. Erected during King Leopold II’s expansion.',
            category: 'architectural_detail',
            mediaUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
            authorName: 'Dr. Sarah Johnson',
            createdAt: '2026-02-10',
            audioDescriptionText: 'Welcome to the Neoclassical Main Gates of the Royal Palace. Notice the majestic Corinthian columns sculpted from local Belgian limestone. These gates were commissioned in the late 19th century to project national unity and architectural permanence.',
            autoPlayOnArrive: true
          },
          {
            id: 'ann-bxl-2',
            xPercentage: 72,
            yPercentage: 62,
            title: 'Rue Royale Pedestrian Avenue',
            note: 'Follow French directional clues ("Tournez à gauche") along this royal avenue to reach Brussels Park and the Grand-Place.',
            category: 'historical_fact',
            authorName: 'Mme. Claire Dubois',
            createdAt: '2026-02-12',
            audioDescriptionText: 'You are looking along Rue Royale. Listen for the French directional command: Tournez à gauche sur la Rue Royale. This historic boulevard connects Brussels’ royal seat with its urban commercial center.',
            autoPlayOnArrive: false
          }
        ],
        mediaGallery: [
          {
            id: 'gal-bxl-1',
            type: 'panorama_360',
            url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
            caption: '360° Royal Palace Front Façade & Courtyard',
            credit: 'Belgian Heritage Archive'
          },
          {
            id: 'gal-bxl-2',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=80',
            caption: 'Neoclassical Corinthian Portico Detail',
            credit: 'Architecture Today'
          },
          {
            id: 'gal-bxl-3',
            type: 'detail_diagram',
            url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
            caption: '1879 Royal Expansion Site Plan & Axis Diagram',
            credit: 'Royal Geographic Society'
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: Grand-Place de Bruxelles (UNESCO World Heritage Site)',
        locationName: 'Grand-Place, Brussels',
        lat: 50.8467,
        lng: 4.3525,
        zoom: 18,
        mapType: 'streetview',
        streetViewPov: { heading: 110, pitch: 15 },
        panoramaUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
        readingPassage: 'Vous êtes arrivés à la Grand-Place! Surrounded by opulent 17th-century merchant guildhalls and the towering Gothic Town Hall (Hôtel de Ville), this square served as the commercial heartbeat of Brabant.',
        phenomenonHook: {
          title: 'The Guildhall Gold-Foil Competition Mystery',
          mysteryQuestion: 'Why did 17th-century baker, brewer, and archer trade guilds spend more gold leaf decorating exterior rooflines than interior administrative chambers?',
          observableFacts: [
            'Exterior guildhall façades face public street angles to capture direct sunlight reflections.',
            'Gold leaf foil layer thickness is only 0.1 micrometers yet survives 350+ years of rainfall.'
          ],
          inquiryChallenge: 'Analyze how competitive visual status signals in guild economics drove craftsmanship standards across early modern European trade markets.'
        },
        foreignLanguageCues: [
          {
            phrase: 'Suivez le chemin jusqu’à la Maison du Roi',
            language: 'French',
            translation: 'Follow the path up to the King’s House',
            phoneticSpelling: 'swee-vay luh shuh-man zhoo-skah lah my-zon doo rwah',
            usageContext: 'Navigating across the central square'
          },
          {
            phrase: 'L’Hôtel de Ville est magnifique',
            language: 'French',
            translation: 'The Town Hall is magnificent',
            phoneticSpelling: 'loo-tel duh veel ay mahn-yee-feek',
            usageContext: 'Describing civic gothic architecture'
          }
        ],
        navigationInstruction: 'Walk into the central square. Locate the 96-meter Gothic spire of the Hôtel de Ville pointing skyward.',
        socraticGuidePrompts: [
          'Compare the gold-leaf ornamentation on the Guildhalls with the stone carvings of the Town Hall. What does the gold foil reveal about the wealth of trade guilds in the 1600s?',
          'Why do you think UNESCO designated the Grand-Place as a world heritage site?'
        ],
        checkpoints: [
          {
            id: 'bxl-chk-4',
            label: 'Identify the Gothic spire of the Town Hall on the map/viewer',
            hint: 'Look for the tallest stone tower topped by Saint Michael slaying a dragon.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'bxl-chk-5',
            label: 'Decode the French sentence "suivez le chemin"',
            hint: 'It tells you which walking direction to follow next across the plaza.',
            isCompleted: false,
            rewardPoints: 25
          }
        ],
        educatorNotes: [
          {
            id: 'note-bxl-3',
            authorName: 'Prof. Marc Vane',
            role: 'UNESCO World Heritage Educator',
            noteText: 'Misconception Alert: Remind students that merchant guildhalls were private trade unions, not government buildings. The lavish gold foil was a competitive display of guild prosperity.',
            pedagogicalFocus: 'misconception_alert',
            isMilestoneLocked: false,
            addedAt: '2026-02-14'
          },
          {
            id: 'note-bxl-4',
            authorName: 'Ms. Helen Peterson',
            role: 'Geography & Urban Planning Lead',
            noteText: 'Geographic Milestone Unlocked Note: Ask students to measure the open rectangle dimensions of Grand-Place. Why were medieval market squares designed without central monuments to maximize pedestrian trade flow?',
            pedagogicalFocus: 'curriculum_connection',
            isMilestoneLocked: true,
            requiredMilestoneCount: 1,
            addedAt: '2026-02-15'
          }
        ]
      },
      {
        stopNumber: 3,
        title: 'Stop 3: The Atomium & Mini-Europe Civic Campus',
        locationName: 'Atomium Square, Heysel, Brussels',
        lat: 50.8949,
        lng: 4.3415,
        zoom: 17,
        mapType: 'satellite',
        readingPassage: 'Constructed for the 1958 Brussels World’s Fair (Expo 58), the Atomium represents an iron crystal cell magnified 165 billion times! It stands as a monument to post-WWII scientific optimism and European atomic energy collaboration.',
        phenomenonHook: {
          title: 'The 165-Billion-Times Iron Crystal Scaling Mystery',
          mysteryQuestion: 'How does a body-centered cubic (BCC) iron crystal structure remain structurally stable when scaled up 165 billion times into a 102-meter tall steel building?',
          observableFacts: [
            'BCC crystal unit cell has atoms at 8 corners plus 1 central atom.',
            'Connecting escalator tubes act as load-bearing atomic bond struts maintaining structural equilibrium.'
          ],
          inquiryChallenge: 'Investigate structural engineering parallels between subatomic electromagnetic force bonds and macroscopic steel truss tension systems.'
        },
        foreignLanguageCues: [
          {
            phrase: 'Avancez vers les sphères en acier inoxydable',
            language: 'French',
            translation: 'Advance towards the stainless steel spheres',
            phoneticSpelling: 'ah-vahn-say vair lay sfai-ruh zahn ah-syay',
            usageContext: 'Approaching the landmark structure'
          }
        ],
        navigationInstruction: 'Switch to satellite grid view to inspect the 9 interconnected steel spheres arranged in a body-centered cubic structure.',
        socraticGuidePrompts: [
          'Count the connecting tubes between the spheres. How does this physical model mirror atomic bonding in chemistry?',
          'How does 1950s architectural innovation contrast with the 17th-century Gothic style seen at Stop 2?'
        ],
        checkpoints: [
          {
            id: 'bxl-chk-6',
            label: 'Locate all 9 spheres of the Atomium on the satellite map',
            hint: 'Look at the metallic structure shaped like a 3D unit cube in the park.',
            isCompleted: false,
            rewardPoints: 30
          },
          {
            id: 'bxl-chk-7',
            label: 'Complete the Universal Exit Slip for the Brussels Excursion',
            hint: 'Submit your 2-question self-evaluation to earn your Field Trip Badge.',
            isCompleted: false,
            rewardPoints: 40
          }
        ]
      }
    ]
  },
  {
    id: 'nairobi-cbc-trail',
    title: 'Nairobi Heritage & Biodiversity Excursion',
    destination: 'Uhuru Park & Kenya National Museum, Nairobi',
    country: 'Kenya',
    subject: 'CBC Social Studies & Kiswahili',
    gradeLevel: 'Upper Primary / Junior Secondary',
    coverImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
    description: 'Explore the heart of Nairobi, Kenya’s capital city. Learn historical independence landmarks at Uhuru Park and biological artifacts at the National Museum using Kiswahili navigational cues.',
    primaryLanguage: 'Kiswahili & English',
    isPreset: true,
    createdBy: 'Kenya CBC Advisory Board',
    createdAt: '2026-02-01',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Uhuru Park Freedom Corner & Monument',
        locationName: 'Uhuru Park, Uhuru Highway, Nairobi',
        lat: -1.2882,
        lng: 36.8182,
        zoom: 17,
        mapType: 'satellite',
        readingPassage: 'Karibuni Nairobi! Uhuru Park is a vital green sanctuary in the bustling metropolis. Here, Nobel Peace Laureate Prof. Wangari Maathai famously championed environmental conservation and human rights.',
        foreignLanguageCues: [
          {
            phrase: 'Tembea kuelekea Pembe ya Uhuru',
            language: 'Kiswahili',
            translation: 'Walk towards Freedom Corner',
            phoneticSpelling: 'tem-beh-ah koo-eh-leh-keh-ah pem-beh yah oo-hoo-roo',
            usageContext: 'Directional clue for reaching Freedom Corner'
          },
          {
            phrase: 'Hifadhi mazingira yetu kwa kizazi kijacho',
            language: 'Kiswahili',
            translation: 'Protect our environment for future generations',
            phoneticSpelling: 'hee-fah-dhee mah-zee-ngee-rah yeh-too',
            usageContext: 'Conservation motto by Prof. Wangari Maathai'
          }
        ],
        navigationInstruction: 'Follow the Kiswahili prompt "Tembea kuelekea Pembe ya Uhuru" on the satellite map to locate the central ceremonial monument and artificial lake.',
        socraticGuidePrompts: [
          'Look at the high-rise buildings surrounding Uhuru Park. Why are urban green spaces essential for maintaining biodiversity and air quality in growing cities?',
          'How did Wangari Maathai’s Green Belt Movement combine environmental activism with civic education?'
        ],
        checkpoints: [
          {
            id: 'nrb-chk-1',
            label: 'Locate Uhuru Park lake and Freedom Corner on the map',
            hint: 'Find the green canopy adjacent to Uhuru Highway.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'nrb-chk-2',
            label: 'Practice the Kiswahili phrase "Hifadhi mazingira"',
            hint: 'Listen to the audio read-aloud playback in the reader.',
            isCompleted: false,
            rewardPoints: 25
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: Kenya National Museum & Cradle of Humankind Exhibition',
        locationName: 'Museum Hill, Nairobi',
        lat: -1.2736,
        lng: 36.8143,
        zoom: 18,
        mapType: 'roadmap',
        readingPassage: 'Located on Museum Hill, the Nairobi National Museum preserves East Africa’s rich paleontology, ethnography, and natural history, including hominid fossils discovered in the Great Rift Valley.',
        foreignLanguageCues: [
          {
            phrase: 'Tazama sanamu ya Tembo na Visukuku',
            language: 'Kiswahili',
            translation: 'Look at the elephant statue and ancient fossils',
            phoneticSpelling: 'tah-zah-mah sah-nah-moo yah tem-boh',
            usageContext: 'Exploring museum courtyard exhibits'
          }
        ],
        navigationInstruction: 'Navigate past Museum Hill Road to the central courtyard surrounded by indigenous trees.',
        socraticGuidePrompts: [
          'East Africa is widely known as the Cradle of Humankind. What archaeological evidence supports this classification?',
          'How do museum archives help preserve indigenous knowledge systems for young learners?'
        ],
        checkpoints: [
          {
            id: 'nrb-chk-3',
            label: 'Identify Museum Hill location on the interactive route map',
            hint: 'Follow the road north from the Nairobi River crossing.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'nrb-chk-4',
            label: 'Answer the Cradle of Humankind Socratic question',
            hint: 'Type your reflection into the Socratic AI Local Guide panel.',
            isCompleted: false,
            rewardPoints: 30
          }
        ]
      }
    ]
  },
  {
    id: 'paris-art-history',
    title: 'Paris Art, Gothic & Eiffel Engineering Excursion',
    destination: 'The Louvre Museum & Eiffel Tower, Paris',
    country: 'France',
    subject: 'Art History, World Geography & French',
    gradeLevel: 'Grade 8 - 12',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    description: 'Travel down the River Seine in Paris. Explore the Louvre Glass Pyramid, Notre-Dame Gothic architecture, and Gustave Eiffel’s iron lattice tower.',
    primaryLanguage: 'French & English',
    isPreset: true,
    createdBy: 'Global Humanities Institute',
    createdAt: '2026-01-20',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Musée du Louvre & Glass Pyramid',
        locationName: 'Musée du Louvre, Rue de Rivoli, Paris',
        lat: 48.8606,
        lng: 2.3376,
        zoom: 18,
        mapType: 'satellite',
        readingPassage: 'Bienvenue à Paris! The Louvre, originally built as a medieval fortress in 1190, evolved into a royal palace before becoming the world’s largest art museum. In 1989, architect I.M. Pei added the iconic Glass Pyramid.',
        foreignLanguageCues: [
          {
            phrase: 'Traversez la cour Napoléon jusqu’à la Pyramide',
            language: 'French',
            translation: 'Cross Napoleon Courtyard to the Pyramid',
            phoneticSpelling: 'trah-vair-say lah koor nah-poh-lay-ohn',
            usageContext: 'Walking towards the glass entrance'
          }
        ],
        navigationInstruction: 'Locate the square glass pyramid surrounded by reflecting pools in Cour Napoléon on the satellite map.',
        socraticGuidePrompts: [
          'Why did architect I.M. Pei select a glass pyramid design to contrast with the Renaissance stone wings of the palace?',
          'How does natural sunlight filtering through the glass pyramid illuminate the subterranean entrance hall?'
        ],
        checkpoints: [
          {
            id: 'prs-chk-1',
            label: 'Locate the Pei Glass Pyramid in Cour Napoléon',
            hint: 'Zoom into the central courtyard between Rue de Rivoli and the Seine River.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'prs-chk-2',
            label: 'Decode French cue "Traversez la cour"',
            hint: 'Use the interactive translation badge.',
            isCompleted: false,
            rewardPoints: 25
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: La Tour Eiffel (The Eiffel Tower & Champ de Mars)',
        locationName: 'Champ de Mars, Paris',
        lat: 48.8584,
        lng: 2.2945,
        zoom: 17,
        mapType: 'satellite',
        readingPassage: 'Erected for the 1889 World’s Fair to commemorate the centennial of the French Revolution, Gustave Eiffel’s 330-meter wrought-iron lattice tower was initially criticized by Paris artists before becoming an international symbol of engineering mastery.',
        foreignLanguageCues: [
          {
            phrase: 'Montez au sommet de la Tour Eiffel',
            language: 'French',
            translation: 'Climb to the summit of the Eiffel Tower',
            phoneticSpelling: 'mohn-tay oh soh-may duh lah toor ey-fel',
            usageContext: 'Ascending to the panoramic observation deck'
          }
        ],
        navigationInstruction: 'Inspect the four massive arched iron legs resting on Champ de Mars along the Banks of the Seine.',
        socraticGuidePrompts: [
          'How does the open lattice design of the Eiffel Tower allow wind forces to pass through safely during heavy storms?',
          'Why was puddle iron chosen over traditional cast iron for this massive structure in 1889?'
        ],
        checkpoints: [
          {
            id: 'prs-chk-3',
            label: 'Identify the shadow and footprint of the Eiffel Tower',
            hint: 'Center the satellite map view on Champ de Mars park.',
            isCompleted: false,
            rewardPoints: 30
          }
        ]
      }
    ]
  },
  {
    id: 'lille-flemish-heritage',
    title: 'Lille Grand Place & Flemish Renaissance Heritage',
    destination: 'Grand Place & Vieille Bourse, Lille',
    country: 'France',
    subject: 'European History & French Language Navigation',
    gradeLevel: 'Junior / Senior Secondary',
    coverImage: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80',
    description: 'Explore the vibrant northern French city of Lille. Follow French street directional clues from the Place du Général-de-Gaulle to the 17th-century Vieille Bourse stock exchange.',
    primaryLanguage: 'French & English',
    isPreset: true,
    createdBy: 'European Civic Education Exchange',
    createdAt: '2026-02-05',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Grand Place (Place du Général-de-Gaulle)',
        locationName: 'Place du Général-de-Gaulle, Lille',
        lat: 50.6368,
        lng: 3.0635,
        zoom: 18,
        mapType: 'satellite',
        readingPassage: 'Welcome to Lille! Situated near the Belgian border, Lille combines French elegance with Flemish Renaissance architecture. The Grand Place is dominated by the Column of the Goddess, erected in 1845 to honor the city’s defense during the 1792 Siege of Lille.',
        foreignLanguageCues: [
          {
            phrase: 'Prenez la rue de la Grande Chaussée',
            language: 'French',
            translation: 'Take High Cobblestone Street',
            phoneticSpelling: 'pruh-nay lah roo duh lah grahnd shoh-say',
            usageContext: 'Directional clue for navigating north into the historic old district (Vieux Lille)'
          },
          {
            phrase: 'Regardez les façades flamandes',
            language: 'French',
            translation: 'Observe the Flemish façades',
            phoneticSpelling: 'ruh-gar-day lay fah-sahd flah-mahnd',
            usageContext: 'Architectural instruction to inspect stepped gables'
          }
        ],
        navigationInstruction: 'Follow the French clue "Prenez la rue de la Grande Chaussée" to locate the cobblestone pedestrian boulevard leading toward the Vieille Bourse.',
        socraticGuidePrompts: [
          'How do the stepped gables of Flemish architecture reflect Lille’s historical trade connections with the Netherlands and Flanders?',
          'Notice the density of pedestrian walkways around Grand Place. How do urban car-free zones impact retail activity and community gathering?'
        ],
        checkpoints: [
          {
            id: 'lil-chk-1',
            label: 'Center the satellite view on the Column of the Goddess monument',
            hint: 'Look for the circular paved plaza in the center of Grand Place.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'lil-chk-2',
            label: 'Practice the French street navigation prompt "Prenez la rue..."',
            hint: 'Listen to the French audio pronunciation in the reader pane.',
            isCompleted: false,
            rewardPoints: 25
          }
        ],
        educatorNotes: [
          {
            id: 'note-lil-1',
            authorName: 'M. Henri Dupont',
            role: 'Lille Regional Cultural Historian',
            noteText: 'Pedagogical Focus: Ask students to compare the Flemish brickwork of Lille with the limestone Neoclassicism of Paris. Notice how regional building materials reflect local geology.',
            pedagogicalFocus: 'historical_context',
            isMilestoneLocked: false,
            addedAt: '2026-02-10'
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: La Vieille Bourse (17th-Century Stock Exchange)',
        locationName: 'Place du Général-de-Gaulle, 59000 Lille',
        lat: 50.6364,
        lng: 3.0642,
        zoom: 18,
        mapType: 'roadmap',
        readingPassage: 'Built between 1652 and 1653, the Old Stock Exchange comprises 24 identical houses enclosing a serene inner courtyard. Today, booksellers, chess players, and tango dancers gather under its ornate arches.',
        foreignLanguageCues: [
          {
            phrase: 'Entrez dans la cour intérieure',
            language: 'French',
            translation: 'Enter into the inner courtyard',
            phoneticSpelling: 'ahn-tray dahn lah koor ahn-tay-ree-yur',
            usageContext: 'Stepping into the arcade courtyard'
          }
        ],
        navigationInstruction: 'Zoom into the quadrangle building southeast of Grand Place to view the inner arcade.',
        socraticGuidePrompts: [
          'The Vieille Bourse was commissioned by Julien Destrée to compete with Flemish merchant exchanges. How did civic competition spur architectural innovation in 17th-century Europe?'
        ],
        checkpoints: [
          {
            id: 'lil-chk-3',
            label: 'Identify the inner courtyard quadrangle of Vieille Bourse',
            hint: 'Locate the rectangular enclosed courtyard surrounded by decorative arches.',
            isCompleted: false,
            rewardPoints: 30
          }
        ]
      }
    ]
  },
  {
    id: 'london-thames-heritage',
    title: 'London Civic Landmarks & Thames Supply Chain Trail',
    destination: 'Tower Bridge & Westminster, London',
    country: 'United Kingdom',
    subject: 'World Geography, Civic History & River Logistics',
    gradeLevel: 'Grade 6 - 10',
    coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    description: 'Journey along the River Thames in London. Examine how maritime trade routes, bascule bridges, and civic landmarks shaped London into a global financial capital.',
    primaryLanguage: 'English & Latin Cues',
    isPreset: true,
    createdBy: 'UK Historical Geography Council',
    createdAt: '2026-02-08',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Tower Bridge & River Thames Maritime Route',
        locationName: 'Tower Bridge Rd, London SE1 2UP',
        lat: 51.5055,
        lng: -0.0754,
        zoom: 18,
        mapType: 'satellite',
        readingPassage: 'Completed in 1894, Tower Bridge is a combined bascule and suspension bridge designed to allow large ocean vessels to access London’s upper pool docks while keeping river-crossing traffic moving.',
        foreignLanguageCues: [
          {
            phrase: 'Domine dirige nos',
            language: 'Latin',
            translation: 'Lord, guide us (Motto of the City of London)',
            phoneticSpelling: 'doh-mee-neh dee-ree-geh noh-s',
            usageContext: 'Motto inscribed on civic crests across London bridge spans'
          }
        ],
        navigationInstruction: 'Trace the River Thames eastward on the satellite map from London Bridge to the twin Gothic towers of Tower Bridge.',
        socraticGuidePrompts: [
          'Why was a bascule (drawbridge) design chosen over a fixed low-arch bridge for Tower Bridge in 1894?',
          'How did the River Thames serve as the primary supply chain artery connecting Britain to global markets?'
        ],
        checkpoints: [
          {
            id: 'ldn-chk-1',
            label: 'Locate the twin towers and walkways of Tower Bridge on satellite map',
            hint: 'Zoom into the span across the River Thames near the Tower of London.',
            isCompleted: false,
            rewardPoints: 25
          },
          {
            id: 'ldn-chk-2',
            label: 'Review the Latin civic motto "Domine dirige nos"',
            hint: 'Tap the audio translation card in the reader pane.',
            isCompleted: false,
            rewardPoints: 25
          }
        ]
      }
    ]
  },
  {
    id: 'art-museum-scanning-excursion',
    title: 'Art Museum Exhibits & Interactive QR Scanning Gallery',
    destination: 'Louvre & Metropolitan Museum Art Exhibits',
    country: 'International (France / USA)',
    subject: 'Art History, Scanning Technology & Visual Literacy',
    gradeLevel: 'Grade 7 - 12',
    coverImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    description: 'Bridge physical museum galleries with digital databases using interactive QR scanning technology. Explore masterpiece brushwork, provenance records, and 3D architectural renders.',
    primaryLanguage: 'Multilingual Art Cues',
    isPreset: true,
    createdBy: 'International Museum Educators Network',
    createdAt: '2026-02-12',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Physical Museum Gallery & QR Code Scanner Station',
        locationName: 'Grand Gallery Exhibit Hall',
        lat: 48.8606,
        lng: 2.3376,
        zoom: 19,
        mapType: 'roadmap',
        readingPassage: 'Modern museum curation integrates digital scanning tags directly alongside physical wall plaques. By scanning gallery QR tags or NFC barcodes, visitors instantly unlock high-resolution gigapixel renders, infrared underdrawing analysis, and primary artist correspondence.',
        foreignLanguageCues: [
          {
            phrase: 'Scannez le code QR de l’œuvre',
            language: 'French',
            translation: 'Scan the artwork’s QR code',
            phoneticSpelling: 'skah-nay luh kohd koo-er',
            usageContext: 'Instruction for activating digital exhibition tags'
          }
        ],
        navigationInstruction: 'Point your camera or click the simulated QR scanner in the toolbar to unlock the high-resolution artwork analysis.',
        socraticGuidePrompts: [
          'How does digital scanning technology democratize museum education for students unable to travel physically?',
          'Why do conservators use infrared reflectography scans to discover hidden sketches beneath famous oil paintings?'
        ],
        checkpoints: [
          {
            id: 'art-chk-1',
            label: 'Scan the virtual exhibit plaque QR code in the reader pane',
            hint: 'Click the QR Code icon in the top header toolbar.',
            isCompleted: false,
            rewardPoints: 30
          }
        ]
      }
    ]
  },
  {
    id: 'farm-agro-supply-chain',
    title: 'Agricultural Farm Excursion & Food Supply Chain Traceability',
    destination: 'Valley View Organic Dairy & Agro-Farm',
    country: 'United States',
    subject: 'Agricultural Science, Supply Chain Logistics & Biology',
    gradeLevel: 'Grade 5 - 9',
    coverImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80',
    description: 'Follow agricultural food products from seed to supermarket shelf. Visit pasture fields, automated milking parlors, processing plants, and cold-chain distribution hubs.',
    primaryLanguage: 'English & Scientific Terms',
    isPreset: true,
    createdBy: 'National Agri-STEM Foundation',
    createdAt: '2026-02-14',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Regenerative Pasture Fields & Crop Rotations',
        locationName: 'Valley View Agronomy Pasture',
        lat: 40.0379,
        lng: -76.3055,
        zoom: 17,
        mapType: 'satellite',
        readingPassage: 'Trace the beginning of the agricultural supply chain! Regenerative farming utilizes nitrogen-fixing cover crops like clover and alfalfa to maintain soil microbiome health without synthetic fertilizers.',
        foreignLanguageCues: [
          {
            phrase: 'De la ferme à la table',
            language: 'French',
            translation: 'From farm to table',
            phoneticSpelling: 'duh lah fairm ah lah tah-bluh',
            usageContext: 'Concept of sustainable local food traceability'
          }
        ],
        navigationInstruction: 'Inspect the circular pivot irrigation fields and contoured green pasture strips on the satellite map.',
        socraticGuidePrompts: [
          'Why is soil nitrogen retention crucial for high-yield organic dairy grazing?',
          'Trace the temperature-controlled steps required to transport dairy products from raw farm cooling tanks to urban grocery stores without refrigeration breakdown.'
        ],
        checkpoints: [
          {
            id: 'frm-chk-1',
            label: 'Locate pasture irrigation circles on the satellite map',
            hint: 'Observe the green circular crop fields surrounded by farm silos.',
            isCompleted: false,
            rewardPoints: 25
          }
        ]
      }
    ]
  },
  {
    id: 'campus-community-qr-tour',
    title: 'School Campus & Local Community Landmark QR Exploration',
    destination: 'Oakridge Campus Library & Neighborhood Civic Hub',
    country: 'United States',
    subject: 'Local Civic Orientation, Community Assets & QR Mapping',
    gradeLevel: 'Elementary & Junior Secondary',
    coverImage: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
    description: 'Map out your own school campus or local neighborhood! Educators place physical QR codes on library book shelves, historical plaques, and department signs to link physical spaces with digital databases.',
    primaryLanguage: 'English & Civic Orientation Cues',
    isPreset: true,
    createdBy: 'EduNexus Local Community Learning Lab',
    createdAt: '2026-02-16',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Campus Library Archives & QR Digital Shelves',
        locationName: 'Oakridge Library Media Center',
        lat: 37.7749,
        lng: -122.4194,
        zoom: 19,
        mapType: 'roadmap',
        readingPassage: 'Place QR stickers on physical library shelves and campus signs! When students scan a QR code mounted on a history book shelf or science lab door, they open contextual 3D diagrams and archive documents.',
        foreignLanguageCues: [
          {
            phrase: 'Orientación comunitaria',
            language: 'Spanish',
            translation: 'Community orientation',
            phoneticSpelling: 'oh-ree-en-tah-see-ohn koh-moo-nee-tah-ree-ah',
            usageContext: 'Navigating local civic department landmarks'
          }
        ],
        navigationInstruction: 'Scan the library shelf QR code to open the school digital archives schedule.',
        socraticGuidePrompts: [
          'How do physical QR codes transform static campus walkways into interactive learning labs?',
          'Design a 3-stop community landmark tour for new students entering your school campus.'
        ],
        checkpoints: [
          {
            id: 'cmp-chk-1',
            label: 'Identify the library media center layout on the campus blueprint',
            hint: 'Find the central quadrangle building on the roadmap view.',
            isCompleted: false,
            rewardPoints: 25
          }
        ]
      }
    ]
  },
  {
    id: 'science-timeline-chart-tour',
    title: 'Interactive Timeline & 3D Science Chart Mini-Tour',
    destination: 'Classroom Science Wall Chart & Cosmic Timeline Asset',
    country: 'Global Learning Asset',
    subject: 'Cosmic History, Molecular Genetics & Interactive Visualizations',
    gradeLevel: 'Middle & High School',
    coverImage: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Construct mini-tours around large physical classroom assets like wall maps, Periodic Tables, and DNA double-helix charts. Scanning physical charts triggers interactive 3D models and video tutorials.',
    primaryLanguage: 'Scientific Terminology',
    isPreset: true,
    createdBy: 'STEM Visual Learning Consortium',
    createdAt: '2026-02-18',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Physical DNA Double-Helix & Periodic Table Wall Chart',
        locationName: 'Classroom Science Innovation Hub',
        lat: 42.3601,
        lng: -71.0942,
        zoom: 19,
        mapType: 'roadmap',
        readingPassage: 'Transform wall posters into 3D AR learning hubs! By scanning specific milestone nodes on a physical wall timeline or periodic table, students launch interactive 3D simulations of molecular bonding and subatomic particles.',
        foreignLanguageCues: [
          {
            phrase: 'Estructura molecular en 3D',
            language: 'Spanish',
            translation: '3D Molecular Structure',
            phoneticSpelling: 'es-trook-too-rah moh-leh-koo-lar',
            usageContext: 'Activating 3D scientific visualization models'
          }
        ],
        navigationInstruction: 'Scan the milestone marker on the wall chart to load the interactive 3D DNA double helix.',
        socraticGuidePrompts: [
          'How does interacting with 3D spatial models improve student retention of abstract biological and chemical processes?',
          'What historical discoveries led Watson, Crick, and Rosalind Franklin to determine the helical structure of DNA?'
        ],
        checkpoints: [
          {
            id: 'sci-chk-1',
            label: 'Scan the DNA helix chart marker in the reader pane',
            hint: 'Click the QR Code button in the toolbar to simulate scanning the wall asset.',
            isCompleted: false,
            rewardPoints: 30
          }
        ]
      }
    ]
  },
  {
    id: 'serengeti-maasai-safari',
    title: 'Serengeti & Maasai Mara Great Migration Wildlife Excursion',
    destination: 'Serengeti National Park & Mara River Crossing',
    country: 'Tanzania & Kenya',
    subject: 'Ecology, Animal Behavior & Kiswahili Safari Cues',
    gradeLevel: 'Grade 5 - 12',
    coverImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    description: 'Experience Africa’s Great Migration across the Serengeti plains and Mara River in 4K NatGeo video format. Observe wildebeest, lions, cheetahs, and Nile crocodiles in their natural habitat.',
    primaryLanguage: 'Kiswahili, Maasai Cues & English',
    isPreset: true,
    createdBy: 'East African Wildlife Conservation Trust',
    createdAt: '2026-03-01',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Serengeti Savanna & Great Wildebeest Migration Corridor',
        locationName: 'Serengeti National Park Savanna, Tanzania',
        lat: -2.3333,
        lng: 34.8333,
        zoom: 14,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/S_8qM7W_Jm4',
        readingPassage: 'Jambo na Karibu Serengeti! Over 1.5 million wildebeest, 200,000 zebras, and 500,000 gazelles trek 800 kilometers across the endless plains following seasonal rains and fresh grazing grass.',
        foreignLanguageCues: [
          {
            phrase: 'Tazama kundi kubwa la Nyumbu na Pundamilia',
            language: 'Kiswahili',
            translation: 'Look at the giant herd of Wildebeests and Zebras',
            phoneticSpelling: 'tah-zah-mah koo-ndee koo-bwah lah nyoo-mboo',
            usageContext: 'Observing the Great Migration across the acacia grassland'
          },
          {
            phrase: 'Simba na Chui wanawinda',
            language: 'Kiswahili',
            translation: 'Lions and Leopards are hunting',
            phoneticSpelling: 'seem-bah nah choo-ee wah-nah-wee-ndah',
            usageContext: 'Identifying apex predators stalking grazing herds'
          }
        ],
        navigationInstruction: 'Switch to the NatGeo Video tab to watch 4K documentary footage of wildebeest herds crossing the open savanna.',
        socraticGuidePrompts: [
          'How do seasonal rain patterns dictate the circular migration path of ungulates across East Africa?',
          'Why are zebras and wildebeests mutualistic grazing partners on the Serengeti grassland?'
        ],
        checkpoints: [
          {
            id: 'ser-chk-1',
            label: 'Locate the Serengeti savanna migratory corridor on the satellite map',
            hint: 'Center the viewer on the golden acacia plains north of Seronera.',
            isCompleted: false,
            rewardPoints: 30
          },
          {
            id: 'ser-chk-2',
            label: 'Watch the NatGeo 4K Safari video documentary excerpt',
            hint: 'Click the "Video / NatGeo" tab in the viewer toolbar.',
            isCompleted: false,
            rewardPoints: 35
          }
        ],
        mediaGallery: [
          {
            id: 'gal-ser-1',
            type: 'video',
            url: 'https://www.youtube-nocookie.com/embed/S_8qM7W_Jm4',
            caption: 'NatGeo Documentary: The Great Serengeti Migration in 4K',
            credit: 'National Geographic Wild'
          },
          {
            id: 'gal-ser-2',
            type: 'video',
            url: 'https://www.youtube-nocookie.com/embed/5a3dJpM9o0A',
            caption: 'Serengeti Lion Pride & Apex Predator Dynamics',
            credit: 'African Wildlife Foundation'
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: Mara River Crossing & Crocodile Watering Hole',
        locationName: 'Mara River, Maasai Mara Game Reserve, Kenya',
        lat: -1.5000,
        lng: 35.1500,
        zoom: 15,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/x8A4q-X7Nbc',
        readingPassage: 'The Mara River crossing is the most dramatic milestone of the migration. Thousands of wildebeest leap into turbulent waters inhabited by massive Nile crocodiles up to 5 meters long.',
        foreignLanguageCues: [
          {
            phrase: 'Vuka Mto Mara kwa umakini',
            language: 'Kiswahili',
            translation: 'Cross the Mara River with care',
            phoneticSpelling: 'voo-kah mtoh mah-rah kwah oo-mah-kee-nee',
            usageContext: 'River crossing warning cue'
          }
        ],
        navigationInstruction: 'Trace the winding course of the Mara River where herds funnel into steep riverbanks.',
        socraticGuidePrompts: [
          'What physical adaptations make Nile crocodiles stealthy aquatic ambush predators during river crossings?'
        ],
        checkpoints: [
          {
            id: 'ser-chk-3',
            label: 'Identify the Mara River crossing loop on the satellite map',
            hint: 'Locate the dark ribbon of river cutting through the grassland.',
            isCompleted: false,
            rewardPoints: 30
          }
        ],
        mediaGallery: [
          {
            id: 'gal-ser-3',
            type: 'video',
            url: 'https://www.youtube-nocookie.com/embed/x8A4q-X7Nbc',
            caption: 'NatGeo 4K River Crossing & Nile Crocodile Ambush',
            credit: 'National Geographic Expedition'
          }
        ]
      },
      {
        stopNumber: 3,
        title: 'Stop 3: Ngorongoro Volcanic Caldera & Elephant Sanctuary',
        locationName: 'Ngorongoro Conservation Area, Tanzania',
        lat: -3.1600,
        lng: 35.5870,
        zoom: 14,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/7M_L_LwJ508',
        readingPassage: 'Ngorongoro is the world’s largest intact, unfilled volcanic caldera. Formed 2 to 3 million years ago when a giant volcano exploded and collapsed, this 260 sq km natural bowl hosts over 25,000 large mammals including endangered Black Rhinos.',
        foreignLanguageCues: [
          {
            phrase: 'Tazama bonde la volkano la Ngorongoro',
            language: 'Kiswahili',
            translation: 'Look at the Ngorongoro volcanic crater bowl',
            phoneticSpelling: 'tah-zah-mah boh-ndeh lah voh-l-kah-noh',
            usageContext: 'Observing crater geography from the rim'
          }
        ],
        navigationInstruction: 'Inspect the circular volcanic crater rim enclosing Lake Magadi in the caldera floor.',
        socraticGuidePrompts: [
          'How does the steep 600-meter volcanic crater wall create an enclosed micro-ecosystem for resident wildlife?'
        ],
        checkpoints: [
          {
            id: 'ser-chk-4',
            label: 'Zoom out to view the circular Ngorongoro crater ring on satellite view',
            hint: 'Locate the crater bowl surrounded by lush forested highlands.',
            isCompleted: false,
            rewardPoints: 35
          }
        ]
      }
    ]
  },
  {
    id: 'yellowstone-geothermal-park',
    title: 'Yellowstone National Park Geothermal & Grizzly Sanctuary',
    destination: 'Yellowstone National Park, Wyoming, USA',
    country: 'United States',
    subject: 'Geology, Extremophile Biology & Volcanology',
    gradeLevel: 'Grade 6 - 12',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    description: 'Explore America’s first National Park. Investigate the Grand Prismatic Spring’s rainbow microbial rings, Old Faithful’s subterranean hydrothermal pressure, and free-roaming bison herds in NatGeo video format.',
    primaryLanguage: 'English & Scientific Terms',
    isPreset: true,
    createdBy: 'National Park Service Educational Division',
    createdAt: '2026-03-02',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Grand Prismatic Spring & Microbial Extremophiles',
        locationName: 'Midway Geyser Basin, Yellowstone NP',
        lat: 44.5250,
        lng: -110.8382,
        zoom: 17,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/1vRzT_UvA9E',
        readingPassage: 'Grand Prismatic Spring is the largest hot spring in the US, measuring 110 meters across. Its vivid orange, yellow, and red rings are produced by mats of thermophilic (heat-loving) bacteria that thrive in 70°C mineral-rich water.',
        foreignLanguageCues: [
          {
            phrase: 'Bacterias termófilas extremófilas',
            language: 'Spanish',
            translation: 'Extremophile thermophilic bacteria',
            phoneticSpelling: 'bahk-teh-ree-ahs ter-moh-fee-lahs',
            usageContext: 'Microbiological classification of thermal mat organisms'
          }
        ],
        navigationInstruction: 'Switch to satellite or NatGeo Video tab to inspect the rainbow bacterial rings radiating from the deep azure central spring.',
        socraticGuidePrompts: [
          'How do pigment variations in thermophilic bacteria correlate with water temperature gradients from the center to the edge of the spring?',
          'Why do astrobiologists study Yellowstone extremophiles to search for potential microscopic life on icy moons like Europa and Enceladus?'
        ],
        checkpoints: [
          {
            id: 'yel-chk-1',
            label: 'Center satellite map on the rainbow rings of Grand Prismatic Spring',
            hint: 'Find the large vivid cyan and orange circular hot pool in Midway Geyser Basin.',
            isCompleted: false,
            rewardPoints: 30
          }
        ],
        mediaGallery: [
          {
            id: 'gal-yel-1',
            type: 'video',
            url: 'https://www.youtube-nocookie.com/embed/1vRzT_UvA9E',
            caption: 'NatGeo 4K: Yellowstone Geysers & Extremophile Biology',
            credit: 'National Geographic Science'
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: Old Faithful Geyser & Hydrothermal Plumbing System',
        locationName: 'Upper Geyser Basin, Yellowstone NP',
        lat: 44.4605,
        lng: -110.8281,
        zoom: 17,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/fW4oH2KqC9E',
        readingPassage: 'Old Faithful erupts every 60 to 110 minutes, shooting up to 30,000 liters of boiling water and superheated steam 55 meters into the air. Water deep underground is heated by Yellowstone’s magma chamber under immense pressure.',
        foreignLanguageCues: [
          {
            phrase: 'Gèiser hydrothermal en éruption',
            language: 'French',
            translation: 'Hydrothermal geyser erupting',
            phoneticSpelling: 'zhay-zair ee-droh-tair-meek',
            usageContext: 'Describing thermal volcanic eruptions'
          }
        ],
        navigationInstruction: 'Locate the boardwalk ring surrounding Old Faithful cone in Upper Geyser Basin.',
        socraticGuidePrompts: [
          'What three geological components are required to produce an active geyser: heat source, water supply, and what subterranean feature?'
        ],
        checkpoints: [
          {
            id: 'yel-chk-2',
            label: 'Locate Old Faithful eruption boardwalk loop on satellite view',
            hint: 'Find the oval visitor boardwalk surrounding the silica sinter cone.',
            isCompleted: false,
            rewardPoints: 30
          }
        ]
      },
      {
        stopNumber: 3,
        title: 'Stop 3: Lamar Valley Bison Herds & Wolf Reintroduction Corridor',
        locationName: 'Lamar Valley, Yellowstone NP',
        lat: 44.8667,
        lng: -110.2333,
        zoom: 15,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/d2-69j7i24c',
        readingPassage: 'Known as the Serengeti of North America, Lamar Valley is home to wild bison, grizzly bears, and gray wolf packs. The 1995 reintroduction of wolves triggered a famous trophic cascade that restored aspen forests and riverbanks.',
        foreignLanguageCues: [
          {
            phrase: 'Trophic cascade in ecosystem restoration',
            language: 'Scientific Cue',
            translation: 'Ecological domino effect triggered by top predators',
            phoneticSpelling: 'troh-feek kahs-kayd',
            usageContext: 'Explaining predator-prey ecosystem balance'
          }
        ],
        navigationInstruction: 'Trace the broad glacial floodplain of the Lamar River.',
        socraticGuidePrompts: [
          'How did reintroducing gray wolves alter elk browsing behavior and allow willow trees to regrow along riverbanks?'
        ],
        checkpoints: [
          {
            id: 'yel-chk-3',
            label: 'Identify Lamar River valley floor on satellite view',
            hint: 'Follow the river meandering through northern Yellowstone meadowlands.',
            isCompleted: false,
            rewardPoints: 35
          }
        ]
      }
    ]
  },
  {
    id: 'cern-particle-physics-lab',
    title: 'CERN Subterranean Particle Physics & ALICE Lab Excursion',
    destination: 'CERN Large Hadron Collider, Geneva, Switzerland',
    country: 'Switzerland & France',
    subject: 'Quantum Physics, Particle Accelerators & Supercomputing',
    gradeLevel: 'Grade 9 - 12 (Advanced Science)',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    description: 'Descend 100 meters beneath Geneva to explore CERN, the world’s largest particle physics lab. Inspect the 27km Large Hadron Collider (LHC), the ALICE detector, and the Higgs Boson discovery chamber in NatGeo video format.',
    primaryLanguage: 'French, English & Scientific Terminology',
    isPreset: true,
    createdBy: 'European Organization for Nuclear Research (CERN)',
    createdAt: '2026-03-03',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: CERN Globe of Science and Innovation & Surface Control Center',
        locationName: 'Route de Meyrin, 1211 Genève, Switzerland',
        lat: 46.2330,
        lng: 6.0557,
        zoom: 18,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/m8A8cK8XmSg',
        readingPassage: 'Bienvenue au CERN! The Globe of Science and Innovation symbolizes human curiosity. On the surface, scientists from over 100 nations operate the Control Center that monitors proton beams accelerating near the speed of light (99.9999991% c).',
        foreignLanguageCues: [
          {
            phrase: 'Accélérateur de particules souterrain',
            language: 'French',
            translation: 'Subterranean particle accelerator',
            phoneticSpelling: 'ahk-say-lay-rah-tur duh par-tee-kool',
            usageContext: 'Navigating CERN underground facilities'
          },
          {
            phrase: 'Chambre de collision subatomique',
            language: 'French',
            translation: 'Subatomic collision chamber',
            phoneticSpelling: 'shahm-bruh duh koh-lee-zyohn',
            usageContext: 'Describing particle detector caverns'
          }
        ],
        navigationInstruction: 'Inspect the wooden sphere of the Globe of Science on the satellite map, situated along the Franco-Swiss border.',
        socraticGuidePrompts: [
          'Why do particle physicists require a 27-kilometer circular ring of superconducting magnets to accelerate protons to high energy levels?',
          'Tim Berners-Lee invented the World Wide Web at CERN in 1989 to solve what scientific data-sharing challenge?'
        ],
        checkpoints: [
          {
            id: 'crn-chk-1',
            label: 'Center the viewer on the CERN Globe of Science near Geneva airport',
            hint: 'Locate the large spherical wooden dome across from CERN main reception.',
            isCompleted: false,
            rewardPoints: 30
          },
          {
            id: 'crn-chk-2',
            label: 'Watch the CERN Subterranean Particle Accelerator video tour',
            hint: 'Click the "Video / NatGeo" tab in the viewer toolbar.',
            isCompleted: false,
            rewardPoints: 35
          }
        ],
        mediaGallery: [
          {
            id: 'gal-crn-1',
            type: 'video',
            url: 'https://www.youtube-nocookie.com/embed/m8A8cK8XmSg',
            caption: 'CERN 360° Underground Virtual Tour: Large Hadron Collider',
            credit: 'CERN Education Office'
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: ALICE Experiment & Quark-Gluon Plasma Detector Cavern',
        locationName: 'ALICE Experiment Cavern, St. Genis-Pouilly, France',
        lat: 46.2520,
        lng: 6.0210,
        zoom: 18,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/pQhbhpU9Wrg',
        readingPassage: 'Located 50 meters underground at Point 2, ALICE (A Large Ion Collider Experiment) collides heavy lead ions to recreate Quark-Gluon Plasma—the primordial soup of matter that existed microseconds after the Big Bang at temperatures exceeding 4 trillion °C!',
        foreignLanguageCues: [
          {
            phrase: 'Plasma de quarks et de gluons',
            language: 'French',
            translation: 'Quark-gluon plasma',
            phoneticSpelling: 'plahs-mah duh kwark ay duh gloo-ohn',
            usageContext: 'State of matter recreated in ALICE collisions'
          }
        ],
        navigationInstruction: 'Locate the surface access hall for Point 2 on the satellite map near St. Genis-Pouilly in France.',
        socraticGuidePrompts: [
          'What happens to protons and neutrons when matter is heated beyond 4 trillion degrees in heavy ion collisions?'
        ],
        checkpoints: [
          {
            id: 'crn-chk-3',
            label: 'Identify ALICE Point 2 access hall on the satellite grid',
            hint: 'Find the red cavern shaft building along the LHC underground ring path.',
            isCompleted: false,
            rewardPoints: 35
          }
        ]
      },
      {
        stopNumber: 3,
        title: 'Stop 3: ATLAS Detector Cavern & Higgs Boson Discovery Hall',
        locationName: 'ATLAS Point 1, Meyrin, Switzerland',
        lat: 46.2339,
        lng: 6.0506,
        zoom: 18,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/328pw5Taeg0',
        readingPassage: 'ATLAS is a massive 7,000-ton detector as tall as a 5-story building! In 2012, ATLAS and CMS jointly discovered the Higgs Boson particle, confirming the Brout-Englert-Higgs mechanism that gives mass to fundamental particles.',
        foreignLanguageCues: [
          {
            phrase: 'Boson de Higgs et champ de masse',
            language: 'French',
            translation: 'Higgs boson and mass field',
            phoneticSpelling: 'boh-zohn duh eegs',
            usageContext: 'Fundamental physics principle discovered at CERN'
          }
        ],
        navigationInstruction: 'Observe the subterranean footprint of the ATLAS cavern opposite the CERN main campus.',
        socraticGuidePrompts: [
          'How does the Higgs field impart inertia and mass to elementary particles in the Standard Model?'
        ],
        checkpoints: [
          {
            id: 'crn-chk-4',
            label: 'Complete the CERN Socratic Particle Reflection',
            hint: 'Type your reflection into the Local Tour Guide AI panel.',
            isCompleted: false,
            rewardPoints: 40
          }
        ]
      }
    ]
  },
  {
    id: 'nasa-kennedy-space-center',
    title: 'NASA Kennedy Space Center & Artemis Space Exploration Lab',
    destination: 'Kennedy Space Center & Launch Complex 39A',
    country: 'United States',
    subject: 'Aerospace Engineering, Rocket Propulsion & Astronomy',
    gradeLevel: 'Grade 6 - 12',
    coverImage: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1200&q=80',
    description: 'Explore humanity’s gateway to space at Cape Canaveral. Inspect Artemis Launch Complex 39A, the Space Shuttle Atlantis, and the massive Vehicle Assembly Building in 4K NatGeo and NASA video format.',
    primaryLanguage: 'English & Technical Aerospace Terms',
    isPreset: true,
    createdBy: 'NASA STEM Engagement & Exploration Council',
    createdAt: '2026-03-04',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: Artemis Launch Complex 39A & Crawler-Transporter Way',
        locationName: 'Launch Complex 39A, Merritt Island, Florida',
        lat: 28.6083,
        lng: -80.6042,
        zoom: 17,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/21X5lGlDOfg',
        readingPassage: 'Launch Complex 39A is the historic launchpad for Apollo 11 moon missions, Space Shuttle launches, and modern Artemis Moon-to-Mars missions. Heavy rockets are carried to the pad along a gravel Crawlerway on a 3,000-ton Crawler-Transporter.',
        foreignLanguageCues: [
          {
            phrase: 'Rampa de lanzamiento aeroespacial',
            language: 'Spanish',
            translation: 'Aerospace launch pad',
            phoneticSpelling: 'ram-pah deh lah-nsah-myeh-ntoh',
            usageContext: 'Aerospace launch facility terminology'
          }
        ],
        navigationInstruction: 'Switch to satellite or NatGeo Video tab to inspect the octagonal concrete pad structure abutting the Atlantic Ocean.',
        socraticGuidePrompts: [
          'Why are major space launch complexes constructed along eastern coastlines near the equator?',
          'How does Earth’s rotational speed near the equator provide an initial kinetic boost for orbital rocket trajectories?'
        ],
        checkpoints: [
          {
            id: 'nas-chk-1',
            label: 'Locate Pad 39A flame trench and trench water sound suppression system',
            hint: 'Zoom into the concrete pad structure facing the ocean on satellite map.',
            isCompleted: false,
            rewardPoints: 30
          },
          {
            id: 'nas-chk-2',
            label: 'Watch the NASA Artemis Moon Mission video tour',
            hint: 'Click the "Video / NatGeo" tab in the viewer toolbar.',
            isCompleted: false,
            rewardPoints: 35
          }
        ],
        mediaGallery: [
          {
            id: 'gal-nas-1',
            type: 'video',
            url: 'https://www.youtube-nocookie.com/embed/21X5lGlDOfg',
            caption: 'NASA 4K: Artemis Moon Mission & Launch Complex 39A',
            credit: 'NASA Television'
          }
        ]
      },
      {
        stopNumber: 2,
        title: 'Stop 2: Vehicle Assembly Building (VAB) & Rocket Stacking Hall',
        locationName: 'VAB Way, Kennedy Space Center, Florida',
        lat: 28.5861,
        lng: -80.6508,
        zoom: 17,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/3R7KkK833aE',
        readingPassage: 'Covering 8 acres and standing 160 meters tall, the Vehicle Assembly Building is one of the largest buildings by volume in the world. It is so immense that rain clouds can form inside its ceiling without massive air dehumidifiers!',
        foreignLanguageCues: [
          {
            phrase: 'Ensamblaje de cohetes espaciales',
            language: 'Spanish',
            translation: 'Space rocket assembly building',
            phoneticSpelling: 'en-sahm-blah-heh deh koh-cheh-tes',
            usageContext: 'Describing rocket integration facilities'
          }
        ],
        navigationInstruction: 'Observe the giant American flag painted on the side of the VAB on satellite view.',
        socraticGuidePrompts: [
          'Why are high-capacity crane systems and vertical assembly bays required to integrate multi-stage rockets before roll-out?'
        ],
        checkpoints: [
          {
            id: 'nas-chk-3',
            label: 'Locate the VAB high bay footprint and crawlerway track',
            hint: 'Find the giant box-shaped building with crawler tracks running east.',
            isCompleted: false,
            rewardPoints: 35
          }
        ]
      }
    ]
  },
  {
    id: 'iter-fusion-energy-lab',
    title: 'ITER International Fusion Energy Laboratory & Tokamak Complex',
    destination: 'ITER Facility, Cadarache, Provence, France',
    country: 'France & International Consortium',
    subject: 'Nuclear Physics, Plasma Physics & Clean Energy Innovation',
    gradeLevel: 'Grade 9 - 12',
    coverImage: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    description: 'Visit ITER, the world’s largest magnetic confinement plasma physics experiment. 35 nations are building a 23,000-ton Tokamak reactor to harness nuclear fusion—the energy that powers the Sun.',
    primaryLanguage: 'French, English & Plasma Physics Cues',
    isPreset: true,
    createdBy: 'ITER International Fusion Energy Organization',
    createdAt: '2026-03-05',
    stops: [
      {
        stopNumber: 1,
        title: 'Stop 1: ITER Tokamak Reactor Complex & Cryostat Hall',
        locationName: 'Route de Vinon-sur-Verdon, 13115 Saint-Paul-lez-Durance, France',
        lat: 43.6872,
        lng: 5.7667,
        zoom: 18,
        mapType: 'satellite',
        videoUrl: 'https://www.youtube-nocookie.com/embed/Yp_MSpqPnoI',
        readingPassage: 'Bienvenue à l’ITER! Inside the doughnut-shaped Tokamak vacuum vessel, hydrogen isotopes (deuterium and tritium) are heated to 150 million °C—ten times hotter than the core of the Sun! Powerful superconducting magnets confine the burning plasma.',
        foreignLanguageCues: [
          {
            phrase: 'Réacteur de fusion nucléaire Tokamak',
            language: 'French',
            translation: 'Tokamak nuclear fusion reactor',
            phoneticSpelling: 'ray-ahk-tur duh foo-zyohn noo-klay-air',
            usageContext: 'Describing magnetic confinement fusion energy'
          }
        ],
        navigationInstruction: 'Switch to satellite or NatGeo Video tab to inspect the massive concrete Tokamak building and cryoplant complex.',
        socraticGuidePrompts: [
          'Why does nuclear fusion produce zero greenhouse gases and zero long-lived radioactive waste compared to traditional nuclear fission?',
          'How do magnetic field lines generated by D-shaped niobium-tin superconducting coils prevent 150-million-degree plasma from touching vessel walls?'
        ],
        checkpoints: [
          {
            id: 'itr-chk-1',
            label: 'Locate the circular Tokamak building pit on the satellite grid',
            hint: 'Center the viewer on the main Cadarache construction platform in Provence.',
            isCompleted: false,
            rewardPoints: 35
          },
          {
            id: 'itr-chk-2',
            label: 'Watch the ITER Fusion Energy video documentary tour',
            hint: 'Click the "Video / NatGeo" tab in the viewer toolbar.',
            isCompleted: false,
            rewardPoints: 40
          }
        ],
        mediaGallery: [
          {
            id: 'gal-itr-1',
            type: 'video',
            url: 'https://www.youtube-nocookie.com/embed/Yp_MSpqPnoI',
            caption: 'ITER 360° Video Tour: Harnessing the Power of the Sun',
            credit: 'ITER Organization Communications'
          }
        ]
      }
    ]
  }
];

export class VirtualFieldTripService {
  private static LOCAL_STORAGE_KEY = 'edunexus_custom_field_trips';
  private static OFFLINE_CACHE_KEY = 'edunexus_offline_cached_field_trips';
  private static PROGRESS_KEY_PREFIX = 'edunexus_trip_progress_';

  /**
   * Cache a Virtual Field Trip for complete offline access
   */
  static cacheTripForOffline(trip: VirtualFieldTripRoute): void {
    try {
      const cachedMap = this.getCachedOfflineTripsMap();
      cachedMap[trip.id] = {
        ...trip,
        lastCachedAt: new Date().toISOString()
      };
      localStorage.setItem(this.OFFLINE_CACHE_KEY, JSON.stringify(cachedMap));
    } catch (e) {
      console.warn('Failed to cache virtual field trip for offline use:', e);
    }
  }

  /**
   * Get dictionary map of all cached offline trips
   */
  static getCachedOfflineTripsMap(): Record<string, VirtualFieldTripRoute & { lastCachedAt?: string }> {
    try {
      const raw = localStorage.getItem(this.OFFLINE_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading offline cached field trips:', e);
    }
    return {};
  }

  /**
   * Check if a specific trip is cached for offline use
   */
  static isTripCachedOffline(id: string): boolean {
    const cached = this.getCachedOfflineTripsMap();
    return Boolean(cached[id]);
  }

  /**
   * Get all available field trips (presets + custom saved trips + offline cached trips)
   */
  static getFieldTrips(): VirtualFieldTripRoute[] {
    const custom: VirtualFieldTripRoute[] = [];
    try {
      const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) custom.push(...parsed);
      }
    } catch (e) {
      console.warn('Failed to load custom field trips from localStorage:', e);
    }

    const cachedMap = this.getCachedOfflineTripsMap();
    const cachedTrips = Object.values(cachedMap);

    // Merge preset, custom, and offline cached trips without duplicates
    const combinedMap = new Map<string, VirtualFieldTripRoute>();
    
    // Add presets (and auto-cache them for offline availability)
    PRESET_FIELD_TRIPS.forEach(p => {
      combinedMap.set(p.id, p);
      if (!cachedMap[p.id]) {
        this.cacheTripForOffline(p);
      }
    });

    // Add custom trips
    custom.forEach(c => combinedMap.set(c.id, c));

    // Add offline cached trips
    cachedTrips.forEach(ct => {
      if (!combinedMap.has(ct.id)) {
        combinedMap.set(ct.id, ct);
      }
    });

    return Array.from(combinedMap.values());
  }

  /**
   * Get a specific field trip route by ID, checking memory/presets, custom storage, and offline cache
   */
  static getFieldTripById(id: string): VirtualFieldTripRoute | null {
    // Check cached map first for fast offline access
    const cachedMap = this.getCachedOfflineTripsMap();
    if (cachedMap[id]) {
      return cachedMap[id];
    }

    const all = this.getFieldTrips();
    return all.find(t => t.id === id) || null;
  }

  /**
   * Save a newly created custom Virtual Field Trip
   */
  static saveCustomFieldTrip(trip: VirtualFieldTripRoute): void {
    try {
      const allCustom = this.getCustomFieldTrips();
      const existingIdx = allCustom.findIndex(t => t.id === trip.id);
      if (existingIdx >= 0) {
        allCustom[existingIdx] = trip;
      } else {
        allCustom.unshift(trip);
      }
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(allCustom));
    } catch (e) {
      console.error('Error saving custom field trip:', e);
    }
  }

  static getCustomFieldTrips(): VirtualFieldTripRoute[] {
    try {
      const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading custom trips:', e);
    }
    return [];
  }

  /**
   * Student Excursion Progress Tracker
   */
  static getStudentProgress(routeId: string): StudentExcursionProgress {
    const key = `${this.PROGRESS_KEY_PREFIX}${routeId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading student progress:', e);
    }

    // Default fresh progress
    return {
      routeId,
      currentStopIndex: 0,
      completedStopIndices: [],
      completedCheckpointIds: [],
      streakCount: 1,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
  }

  /**
   * Calculate Learning XP for a given trip progress
   * - 50 XP per completed checkpoint milestone
   * - 200 XP for submitting an Exit Slip
   * - 150 XP bonus for completing Socratic Travel Journal
   * - 50 XP bonus for rating the trip
   * - 100 XP bonus for completing all stops
   */
  static calculateTripXP(progress: StudentExcursionProgress, totalStopsCount: number = 0): number {
    const checkpointXP = (progress.completedCheckpointIds?.length || 0) * 50;
    const exitSlipXP = progress.exitSlip ? 200 : 0;
    const ratingXP = progress.tripRating ? 50 : 0;
    const journalXP = (progress.journal && Object.keys(progress.journal.stopEntries || {}).length > 0) ? 150 : 0;
    const isTripMastered = totalStopsCount > 0 && (progress.completedStopIndices?.length || 0) >= totalStopsCount;
    const bonusXP = isTripMastered ? 100 : 0;
    return checkpointXP + exitSlipXP + ratingXP + journalXP + bonusXP;
  }

  /**
   * Get Total Student XP and Level Profile across all excursions
   */
  static getTotalStudentProfile(): {
    totalXP: number;
    milestonesCompleted: number;
    exitSlipsCompleted: number;
    level: number;
    levelTitle: string;
    xpToNextLevel: number;
    levelProgressPercent: number;
  } {
    let totalXP = 0;
    let milestonesCompleted = 0;
    let exitSlipsCompleted = 0;

    try {
      const trips = this.getFieldTrips();
      trips.forEach(trip => {
        const prog = this.getStudentProgress(trip.id);
        const xp = this.calculateTripXP(prog, trip.stops.length);
        totalXP += xp;
        milestonesCompleted += prog.completedCheckpointIds?.length || 0;
        if (prog.exitSlip) exitSlipsCompleted += 1;
      });
    } catch (e) {
      console.warn('Error aggregating student XP profile:', e);
    }

    // Level calculation (200 XP per level)
    const level = Math.floor(totalXP / 200) + 1;
    const currentLevelBaseXP = (level - 1) * 200;
    const currentLevelXP = totalXP - currentLevelBaseXP;
    const xpToNextLevel = 200 - currentLevelXP;
    const levelProgressPercent = Math.min(100, Math.round((currentLevelXP / 200) * 100));

    // Level Titles
    const titles = [
      'Junior Explorer',
      'Global Voyager',
      'Cultural Scholar',
      'Master Expeditionist',
      'Grand Field Explorer',
      'Universal Cartographer',
      'Legendary Pathfinder'
    ];
    const levelTitle = titles[Math.min(level - 1, titles.length - 1)];

    return {
      totalXP,
      milestonesCompleted,
      exitSlipsCompleted,
      level,
      levelTitle,
      xpToNextLevel,
      levelProgressPercent
    };
  }

  /**
   * Save student progress
   */
  static saveStudentProgress(progress: StudentExcursionProgress): void {
    const key = `${this.PROGRESS_KEY_PREFIX}${progress.routeId}`;
    try {
      progress.lastActiveAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving student excursion progress:', e);
    }
  }

  /**
   * Submit Universal Exit Slip Answers
   */
  static submitExitSlip(routeId: string, answers: ExitSlipAnswers): StudentExcursionProgress {
    const progress = this.getStudentProgress(routeId);
    progress.exitSlip = answers;
    progress.streakCount = (progress.streakCount || 1) + 1; // Increment streak!
    this.saveStudentProgress(progress);
    return progress;
  }

  /**
   * Submit Star Rating and Comment for a Virtual Field Trip
   */
  static submitTripRating(routeId: string, rating: { stars: number; comment: string }): StudentExcursionProgress {
    const progress = this.getStudentProgress(routeId);
    progress.tripRating = {
      stars: rating.stars,
      comment: rating.comment,
      ratedAt: new Date().toISOString()
    };
    this.saveStudentProgress(progress);
    return progress;
  }

  /**
   * Save or Update Student Socratic Travel Journal
   */
  static saveJournal(routeId: string, journal: SocraticTravelJournal): StudentExcursionProgress {
    const progress = this.getStudentProgress(routeId);
    progress.journal = {
      ...journal,
      lastSavedAt: new Date().toISOString()
    };
    this.saveStudentProgress(progress);
    return progress;
  }

  /**
   * Export Socratic Travel Journal as formatted Markdown
   */
  static exportJournalAsMarkdown(journal: SocraticTravelJournal, tripTitle: string): string {
    let md = `# 📖 Socratic Travel Journal: ${tripTitle}\n`;
    md += `**Student Expeditionist**: ${journal.studentName || 'Student Voyager'}\n`;
    md += `**Last Updated**: ${new Date(journal.lastSavedAt || Date.now()).toLocaleDateString()}\n\n`;
    
    if (journal.summaryReflection) {
      md += `## 🌟 Overall Excursion Socratic Reflection\n`;
      md += `${journal.summaryReflection}\n\n`;
    }

    md += `## 📍 Stop-by-Stop Socratic Observations & Inquiry Notes\n\n`;
    const entries = Object.values(journal.stopEntries || {}).sort((a, b) => a.stopNumber - b.stopNumber);

    if (entries.length === 0) {
      md += `*No stop reflections recorded yet.*\n`;
    } else {
      entries.forEach(entry => {
        md += `### Stop ${entry.stopNumber}: ${entry.stopTitle}\n`;
        md += `*Location*: ${entry.locationName}\n\n`;
        if (entry.observations) md += `**🎯 Key Observations**:\n${entry.observations}\n\n`;
        if (entry.hypothesis) md += `**💡 Formulated Hypothesis / Analysis**:\n${entry.hypothesis}\n\n`;
        if (entry.causeAndEffect) md += `**⚙️ Systems & Cause-and-Effect Relationships**:\n${entry.causeAndEffect}\n\n`;
        if (entry.vocabularyLearned && entry.vocabularyLearned.length > 0) md += `**🗣️ Foreign Language Cues / Terms**:\n- ${entry.vocabularyLearned.join('\n- ')}\n\n`;
        if (entry.questionsRemaining) md += `**❓ Remaining Socratic Inquiries**:\n${entry.questionsRemaining}\n\n`;
        md += `---\n\n`;
      });
    }

    return md;
  }

  /**
   * Generate AI-powered Educator Lesson Plan for a Virtual Field Trip
   */
  static async generateLessonPlan(fieldTrip: VirtualFieldTripRoute): Promise<VirtualFieldTripLessonPlan> {
    const response = await fetch('/api/virtual-field-trip/generate-lesson-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fieldTrip }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to generate field trip lesson plan.');
    }

    const data = await response.json();
    return data.lessonPlan;
  }

  /**
   * Save or Update a Custom Field Trip Route (including updated Educator Notes)
   */
  static saveCustomRoute(route: VirtualFieldTripRoute): void {
    const key = `edunexus_vft_custom_route_${route.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(route));
    } catch (e) {
      console.error('Error saving custom field trip route:', e);
    }
  }

  private static LEADERBOARD_PRIVACY_KEY = 'edunexus_vft_leaderboard_privacy';

  /**
   * Get Student Leaderboard Privacy Settings
   */
  static getLeaderboardPrivacySettings(): LeaderboardPrivacySettings {
    try {
      const stored = localStorage.getItem(this.LEADERBOARD_PRIVACY_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      isPublicOnLeaderboard: true,
      showFullName: true,
      allowBadgeSharing: true,
      anonymousAlias: 'Explorer #' + Math.floor(100 + Math.random() * 900)
    };
  }

  /**
   * Save Student Leaderboard Privacy Settings
   */
  static saveLeaderboardPrivacySettings(settings: LeaderboardPrivacySettings): void {
    try {
      localStorage.setItem(this.LEADERBOARD_PRIVACY_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving leaderboard privacy settings:', e);
    }
  }

  /**
   * Get Classroom-wide Field Trip Leaderboard Data
   */
  static getClassroomLeaderboardData(): ClassroomLeaderboardEntry[] {
    const studentProf = this.getTotalStudentProfile();
    const privacy = this.getLeaderboardPrivacySettings();

    // Classroom peers
    const peers: ClassroomLeaderboardEntry[] = [
      {
        id: 'peer-1',
        studentName: 'Sofia Rossi',
        totalXP: 950,
        level: 5,
        levelTitle: 'Grand Field Explorer',
        milestonesCompleted: 14,
        exitSlipsCompleted: 3,
        isCurrentUser: false,
        isAnonymous: false,
        badgeCount: 5,
        badges: ['European Architecture', 'Socratic Thinker', 'Geographic Pioneer', 'Polyglot Cue Master', 'Expedition Speedster'],
        lastActive: '10 mins ago'
      },
      {
        id: 'peer-2',
        studentName: 'Kassim Mwangi',
        totalXP: 800,
        level: 5,
        levelTitle: 'Grand Field Explorer',
        milestonesCompleted: 12,
        exitSlipsCompleted: 2,
        isCurrentUser: false,
        isAnonymous: false,
        badgeCount: 4,
        badges: ['Swahili Heritage', 'Safari Pathfinder', 'Socratic Thinker', 'Exit Slip Scholar'],
        lastActive: '1 hr ago'
      },
      {
        id: 'peer-3',
        studentName: 'Amara Okafor',
        totalXP: 650,
        level: 4,
        levelTitle: 'Master Expeditionist',
        milestonesCompleted: 10,
        exitSlipsCompleted: 2,
        isCurrentUser: false,
        isAnonymous: false,
        badgeCount: 3,
        badges: ['Cultural Scholar', '360° Observer', 'Landmark Audio Listener'],
        lastActive: '3 hrs ago'
      },
      {
        id: 'peer-4',
        studentName: 'Explorer #184',
        totalXP: 550,
        level: 3,
        levelTitle: 'Cultural Scholar',
        milestonesCompleted: 8,
        exitSlipsCompleted: 1,
        isCurrentUser: false,
        isAnonymous: true,
        badgeCount: 2,
        badges: ['Secret Cartographer', 'Milestone Master'],
        lastActive: '5 hrs ago'
      },
      {
        id: 'peer-5',
        studentName: 'Liam Chen',
        totalXP: 450,
        level: 3,
        levelTitle: 'Cultural Scholar',
        milestonesCompleted: 7,
        exitSlipsCompleted: 1,
        isCurrentUser: false,
        isAnonymous: false,
        badgeCount: 2,
        badges: ['Asian Trade Routes', 'Junior Cartographer'],
        lastActive: '1 day ago'
      },
      {
        id: 'peer-6',
        studentName: 'Fatima Al-Hassan',
        totalXP: 300,
        level: 2,
        levelTitle: 'Global Voyager',
        milestonesCompleted: 5,
        exitSlipsCompleted: 1,
        isCurrentUser: false,
        isAnonymous: false,
        badgeCount: 1,
        badges: ['Global Voyager'],
        lastActive: '2 days ago'
      }
    ];

    if (privacy.isPublicOnLeaderboard) {
      const currentEntry: ClassroomLeaderboardEntry = {
        id: 'current-user',
        studentName: privacy.showFullName ? 'You (Current Student)' : (privacy.anonymousAlias || 'Explorer (You)'),
        totalXP: studentProf.totalXP,
        level: studentProf.level,
        levelTitle: studentProf.levelTitle,
        milestonesCompleted: studentProf.milestonesCompleted,
        exitSlipsCompleted: studentProf.exitSlipsCompleted,
        isCurrentUser: true,
        isAnonymous: !privacy.showFullName,
        badgeCount: privacy.allowBadgeSharing ? Math.min(6, studentProf.milestonesCompleted + studentProf.exitSlipsCompleted) : 0,
        badges: privacy.allowBadgeSharing
          ? ['Junior Explorer', studentProf.levelTitle, 'Socratic Journaler', 'Landmark Audio Scholar'].slice(0, Math.max(1, studentProf.level))
          : [],
        lastActive: 'Just now'
      };
      peers.push(currentEntry);
    }

    return peers.sort((a, b) => b.totalXP - a.totalXP);
  }
}
