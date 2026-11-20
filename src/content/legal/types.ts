export interface LegalSection {
  heading: string
  body: string[]
}

export interface LegalDocument {
  title: string
  intro: string
  sections: LegalSection[]
}

export type LegalDocId = 'terms' | 'privacy'
export type LegalLang = 'fr' | 'en'
