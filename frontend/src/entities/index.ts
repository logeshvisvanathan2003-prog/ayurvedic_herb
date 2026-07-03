/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: medicinalherbs
 * Interface for MedicinalHerbs
 */
export interface MedicinalHerbs {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  herbName?: string;
  /** @wixFieldType text */
  scientificName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  herbImage?: string;
  /** @wixFieldType text */
  traditionalUses?: string;
  /** @wixFieldType text */
  habitat?: string;
}


/**
 * Collection ID: portalfeatures
 * Interface for PortalFeatures
 */
export interface PortalFeatures {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  featureName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  stakeholderRole?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  icon?: string;
  /** @wixFieldType url */
  relatedPageURL?: string;
}


/**
 * Collection ID: qualitystandards
 * Interface for QualityStandards
 */
export interface QualityStandards {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  standardName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType text */
  issuingBody?: string;
  /** @wixFieldType date */
  effectiveDate?: Date | string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  certificateImage?: string;
}


/**
 * Collection ID: traceabilitysteps
 * Interface for TraceabilitySteps
 */
export interface TraceabilitySteps {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  stepTitle?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  stepNumber?: number;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  stepImage?: string;
  /** @wixFieldType url */
  learnMoreLink?: string;
}
