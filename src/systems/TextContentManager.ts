import { TextContent, TextDifficulty } from "../types/interfaces"

export interface TextGenerationOptions {
  difficulty: TextDifficulty
  minWords: number
  maxWords: number
  theme?: string
  avoidRepeats?: boolean
}

export interface TextMetrics {
  averageWordLength: number
  commonWordsPercentage: number
  punctuationCount: number
  specialCharacterCount: number
  difficultyScore: number
}

export class TextContentManager implements TextContent {
  public sentences: string[] = []
  public currentSentenceIndex: number = 0
  public difficulty: TextDifficulty = TextDifficulty.EASY

  private usedSentences = new Set<string>()
  private themes = ['action', 'adventure', 'space', 'medieval', 'modern', 'fantasy']
  private lastTheme = ''
  
  // Mock sentence database organized by difficulty
  private sentenceDatabase = {
    [TextDifficulty.EASY]: [
      "The cat sat on the mat and looked at the sun.",
      "A dog ran in the park with his red ball today.",
      "She ate an apple and drank some cold water.",
      "The bird flew high over the green trees below.",
      "I like to read books and write in my room.",
      "The car moved fast down the long road ahead.",
      "Fish swim in the blue ocean all day long.",
      "Kids play games in the yard when it is warm.",
      "The moon is bright and full in the dark sky.",
      "We walk to the store to buy some fresh food.",
      "The rain falls on the roof and makes a sound.",
      "My friend has a pet that likes to play outside.",
      "The fire is hot and gives us light at night.",
      "She put on her coat and went out in the snow.",
      "The clock shows the time and helps us stay on track.",
    ],
    
    [TextDifficulty.MEDIUM]: [
      "The mysterious figure appeared suddenly from behind the ancient oak tree.",
      "Scientists discovered an unusual phenomenon deep beneath the ocean surface.",
      "The entrepreneur launched her innovative startup after months of careful planning.",
      "Children gathered around the storyteller to hear tales of distant lands.",
      "The detective examined the evidence with meticulous attention to detail.",
      "Astronomers observed a rare celestial event through their powerful telescopes.",
      "The mountain climbers faced challenging weather conditions during their ascent.",
      "Artists from around the world displayed their creative works at the exhibition.",
      "The archaeologist carefully excavated artifacts from the historical site.",
      "Students collaborated on a complex project requiring interdisciplinary knowledge.",
      "The chef prepared an exquisite meal using traditional cooking techniques.",
      "Engineers designed an innovative solution to address the infrastructure problem.",
      "The orchestra performed a magnificent symphony to an enthusiastic audience.",
      "Researchers published groundbreaking findings in the scientific journal.",
      "The librarian organized the extensive collection with systematic precision.",
    ],
    
    [TextDifficulty.HARD]: [
      "The quantum physicist elucidated the counterintuitive principles underlying superposition phenomena.",
      "Notwithstanding the bureaucratic impediments, the legislation progressed through parliamentary procedures.",
      "The epistemological implications of postmodern philosophy challenged traditional academic paradigms.",
      "Ecclesiastical architecture from the Byzantine period exemplifies intricate craftsmanship and theological symbolism.",
      "Neurobiologists investigated the sophisticated mechanisms governing synaptic plasticity in cognitive processes.",
      "The geopolitical ramifications of international trade agreements necessitate comprehensive analysis.",
      "Phenomenological approaches to consciousness studies require interdisciplinary methodological frameworks.",
      "Paleontologists hypothesized about evolutionary adaptations based on fossilized anatomical structures.",
      "The jurisprudential precedents established by constitutional courts influence contemporary legal interpretations.",
      "Thermodynamic equilibrium states emerge from stochastic molecular interactions in complex systems.",
      "Hermeneutical traditions in textual analysis emphasize contextual interpretation over literal meaning.",
      "The socioeconomic stratification within metropolitan areas reflects systemic institutional inequalities.",
      "Computational algorithms utilizing machine learning optimize multidimensional parameter spaces efficiently.",
      "Psychological resilience mechanisms enable individuals to navigate traumatic experiences successfully.",
      "The philosophical discourse surrounding existentialism examines authentic human experience.",
    ],
    
    [TextDifficulty.EXPERT]: [
      "The phenomenological-hermeneutical methodology presupposes an ontological commitment to intersubjective meaning-making.",
      "Deconstructionist critiques of logocentrism reveal the aporia inherent in metaphysical binary oppositions.",
      "Quantum entanglement demonstrates non-local correlations that transcend classical spacetime causality constraints.",
      "The epistemological underpinnings of poststructuralist theory challenge foundationalist assumptions about knowledge.",
      "Psychoanalytical interpretations of unconscious desire illuminate the constitutive role of lack in subjectification.",
      "Dialectical materialism posits that contradictory forces within socioeconomic structures generate historical transformation.",
      "The autopoietic organization of living systems exhibits emergent properties irreducible to mechanistic explanations.",
      "Semiotic analysis reveals the arbitrary relationship between signifiers and signified in linguistic structures.",
      "Phenomenological reduction brackets the natural attitude to investigate transcendental consciousness structures.",
      "The apophatic tradition in mystical theology emphasizes the ineffability of ultimate reality.",
      "Bioinformatics algorithms leverage stochastic modeling to predict protein folding conformations accurately.",
      "The hermeneutic circle demonstrates the recursive relationship between understanding and interpretation.",
      "Chaotic dynamical systems exhibit sensitive dependence on initial conditions across multiple temporal scales.",
      "Archaeological stratigraphy provides chronological frameworks for interpreting material culture sequences.",
      "The axiomatization of mathematical systems reveals foundational assumptions underlying formal reasoning.",
    ]
  }

  private themeTemplates = {
    action: {
      easy: [
        "The hero fought the monster with courage.",
        "She jumped over the wall to escape danger.",
        "The soldier ran fast to reach the base.",
      ],
      medium: [
        "The warrior wielded her enchanted sword against the advancing horde.",
        "Special forces infiltrated the enemy compound under cover of darkness.",
        "The gladiator faced his opponent in the arena with unwavering determination.",
      ]
    },
    space: {
      easy: [
        "The rocket flew to the moon in space.",
        "Stars shine bright in the dark sky above.",
        "The planet is far from our home world.",
      ],
      medium: [
        "Astronauts explored the mysterious alien artifact discovered on Mars.",
        "The starship navigated through the treacherous asteroid belt carefully.",
        "Scientists detected unusual signals from a distant galaxy cluster.",
      ]
    },
    fantasy: {
      easy: [
        "The wizard cast a spell with his magic wand.",
        "Dragons fly high over the old castle walls.",
        "The fairy gave the child a magic gift.",
      ],
      medium: [
        "The enchantress summoned mystical creatures from the ethereal realm.",
        "Ancient runes glowed with powerful magic throughout the forgotten temple.",
        "The prophecy foretold of a chosen one who would restore balance.",
      ]
    }
  }

  constructor(initialDifficulty: TextDifficulty = TextDifficulty.EASY) {
    this.difficulty = initialDifficulty
    this.generateInitialSentences()
  }

  private generateInitialSentences(): void {
    // Pre-populate with sentences from the database
    const availableSentences = this.sentenceDatabase[this.difficulty]
    this.sentences = [...availableSentences]
    this.shuffleArray(this.sentences)
  }

  public getNextSentence(): string {
    // If we've used all sentences, generate more
    if (this.currentSentenceIndex >= this.sentences.length) {
      this.generateMoreSentences()
    }

    const sentence = this.sentences[this.currentSentenceIndex]
    this.usedSentences.add(sentence)
    this.currentSentenceIndex++
    
    return sentence
  }

  public adjustDifficulty(level: number): void {
    // Map player level to difficulty
    let newDifficulty: TextDifficulty
    
    if (level <= 3) {
      newDifficulty = TextDifficulty.EASY
    } else if (level <= 8) {
      newDifficulty = TextDifficulty.MEDIUM  
    } else if (level <= 15) {
      newDifficulty = TextDifficulty.HARD
    } else {
      newDifficulty = TextDifficulty.EXPERT
    }

    if (newDifficulty !== this.difficulty) {
      console.log(`Text difficulty changed from ${this.difficulty} to ${newDifficulty}`)
      this.difficulty = newDifficulty
      this.generateMoreSentences()
    }
  }

  private generateMoreSentences(): void {
    const newSentences: string[] = []
    
    // Add sentences from the database for current difficulty
    const availableSentences = this.sentenceDatabase[this.difficulty].filter(
      sentence => !this.usedSentences.has(sentence)
    )
    
    if (availableSentences.length > 0) {
      newSentences.push(...availableSentences)
    }
    
    // Add themed sentences
    const themedSentences = this.generateThemedSentences(5)
    newSentences.push(...themedSentences)
    
    // If we still don't have enough, generate procedural sentences
    while (newSentences.length < 10) {
      const proceduralSentence = this.generateProceduralSentence()
      if (proceduralSentence && !this.usedSentences.has(proceduralSentence)) {
        newSentences.push(proceduralSentence)
      }
    }
    
    this.shuffleArray(newSentences)
    this.sentences.push(...newSentences)
  }

  private generateThemedSentences(count: number): string[] {
    const sentences: string[] = []
    const availableThemes = this.themes.filter(theme => theme !== this.lastTheme)
    
    for (let i = 0; i < count && availableThemes.length > 0; i++) {
      const theme = availableThemes[Math.floor(Math.random() * availableThemes.length)]
      const themeData = this.themeTemplates[theme as keyof typeof this.themeTemplates]
      
      if (themeData) {
        let difficultyKey: keyof typeof themeData
        
        if (this.difficulty === TextDifficulty.EASY) {
          difficultyKey = 'easy'
        } else {
          difficultyKey = 'medium'
        }
        
        const templates = themeData[difficultyKey]
        if (templates && templates.length > 0) {
          const sentence = templates[Math.floor(Math.random() * templates.length)]
          sentences.push(sentence)
        }
      }
      
      this.lastTheme = theme
    }
    
    return sentences
  }

  private generateProceduralSentence(): string {
    // Simple procedural sentence generation based on patterns
    const patterns = {
      [TextDifficulty.EASY]: [
        () => `The ${this.getRandomWord('noun')} ${this.getRandomWord('verb')} ${this.getRandomWord('adverb')}.`,
        () => `${this.getRandomWord('adjective')} ${this.getRandomWord('noun')} ${this.getRandomWord('verb')} in the ${this.getRandomWord('noun')}.`,
      ],
      [TextDifficulty.MEDIUM]: [
        () => `The ${this.getRandomWord('adjective')} ${this.getRandomWord('noun')} ${this.getRandomWord('verb')} ${this.getRandomWord('adverb')} through the ${this.getRandomWord('noun')}.`,
        () => `${this.getRandomWord('noun')} ${this.getRandomWord('verb')} ${this.getRandomWord('adjective')} ${this.getRandomWord('noun')} with ${this.getRandomWord('adjective')} ${this.getRandomWord('noun')}.`,
      ],
      [TextDifficulty.HARD]: [
        () => `The ${this.getRandomWord('adjective')} ${this.getRandomWord('noun')} ${this.getRandomWord('verb')} ${this.getRandomWord('adverb')} ${this.getRandomWord('preposition')} the ${this.getRandomWord('adjective')} ${this.getRandomWord('noun')}.`,
      ],
      [TextDifficulty.EXPERT]: [
        () => `${this.getRandomWord('adjective')} ${this.getRandomWord('noun')} ${this.getRandomWord('verb')} ${this.getRandomWord('adjective')} ${this.getRandomWord('noun')} through ${this.getRandomWord('adjective')} ${this.getRandomWord('noun')}.`,
      ]
    }
    
    const patternList = patterns[this.difficulty]
    if (patternList.length > 0) {
      const pattern = patternList[Math.floor(Math.random() * patternList.length)]
      return pattern()
    }
    
    return "The quick brown fox jumps over the lazy dog."
  }

  private wordLists = {
    noun: ['cat', 'dog', 'house', 'tree', 'car', 'book', 'person', 'city', 'mountain', 'ocean'],
    verb: ['runs', 'jumps', 'walks', 'flies', 'swims', 'reads', 'writes', 'thinks', 'speaks', 'listens'],
    adjective: ['big', 'small', 'red', 'blue', 'fast', 'slow', 'happy', 'bright', 'dark', 'quiet'],
    adverb: ['quickly', 'slowly', 'carefully', 'loudly', 'quietly', 'suddenly', 'gently', 'smoothly', 'rapidly', 'calmly'],
    preposition: ['over', 'under', 'through', 'around', 'beside', 'between', 'among', 'within', 'beyond', 'across']
  }

  private getRandomWord(type: keyof typeof this.wordLists): string {
    const words = this.wordLists[type]
    return words[Math.floor(Math.random() * words.length)]
  }

  public analyzeTextMetrics(text: string): TextMetrics {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const totalChars = text.replace(/\s/g, '').length
    
    const averageWordLength = totalChars / words.length || 0
    const punctuationCount = (text.match(/[.!?,:;]/g) || []).length
    const specialCharacterCount = (text.match(/[^a-zA-Z0-9\s.!?,:;]/g) || []).length
    
    // Calculate common words percentage (simplified)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'is', 'was', 'are', 'were'])
    const commonWordsCount = words.filter(word => 
      commonWords.has(word.toLowerCase().replace(/[^a-zA-Z]/g, ''))
    ).length
    const commonWordsPercentage = (commonWordsCount / words.length) * 100 || 0
    
    // Calculate difficulty score
    let difficultyScore = 0
    difficultyScore += Math.max(0, averageWordLength - 4) * 10 // Longer words = harder
    difficultyScore += Math.max(0, 15 - commonWordsPercentage) * 2 // Fewer common words = harder
    difficultyScore += specialCharacterCount * 5 // Special characters = harder
    difficultyScore += punctuationCount * 2 // More punctuation = slightly harder
    
    return {
      averageWordLength,
      commonWordsPercentage,
      punctuationCount,
      specialCharacterCount,
      difficultyScore
    }
  }

  public getDifficultyRecommendation(playerStats: {
    accuracy: number
    wpm: number
    level: number
  }): TextDifficulty {
    // Recommend difficulty based on player performance
    if (playerStats.accuracy < 80 || playerStats.wpm < 30) {
      return TextDifficulty.EASY
    } else if (playerStats.accuracy < 90 || playerStats.wpm < 50) {
      return TextDifficulty.MEDIUM
    } else if (playerStats.accuracy < 95 || playerStats.wpm < 70) {
      return TextDifficulty.HARD
    } else {
      return TextDifficulty.EXPERT
    }
  }

  public setCustomDifficulty(difficulty: TextDifficulty): void {
    this.difficulty = difficulty
    this.generateMoreSentences()
  }

  public generateCustomText(options: TextGenerationOptions): string {
    // Scaffold for future LLM integration
    console.log('Generating custom text with options:', options)
    
    // For now, return a sentence from the database that matches criteria
    const sentences = this.sentenceDatabase[options.difficulty]
    const validSentences = sentences.filter(sentence => {
      const wordCount = sentence.split(' ').length
      return wordCount >= options.minWords && wordCount <= options.maxWords
    })
    
    if (validSentences.length > 0) {
      return validSentences[Math.floor(Math.random() * validSentences.length)]
    }
    
    return this.generateProceduralSentence()
  }

  // Scaffolded method for future LLM integration
  public async generateLLMText(options: TextGenerationOptions): Promise<string> {
    // This would integrate with an LLM API in the future
    console.log('LLM text generation requested:', options)
    
    // For now, return a promise that resolves to generated text
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.generateCustomText(options))
      }, 100)
    })
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }

  public reset(): void {
    this.currentSentenceIndex = 0
    this.usedSentences.clear()
    this.sentences = []
    this.generateInitialSentences()
  }

  public getStats(): {
    totalSentences: number
    usedSentences: number
    currentDifficulty: TextDifficulty
    averageDifficulty: number
  } {
    const metrics = this.sentences.map(sentence => this.analyzeTextMetrics(sentence))
    const averageDifficulty = metrics.reduce((sum, m) => sum + m.difficultyScore, 0) / metrics.length || 0
    
    return {
      totalSentences: this.sentences.length,
      usedSentences: this.usedSentences.size,
      currentDifficulty: this.difficulty,
      averageDifficulty
    }
  }
}