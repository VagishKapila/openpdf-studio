import { db } from '../../shared/db';
import { documentPatterns } from '../../shared/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

// ===== TYPES =====
export interface DocumentStructure {
  pageCount: number;
  averageWordsPerPage: number;
  hasSignatureBlocks: boolean;
  signatureBlockCount: number;
  hasDateFields: boolean;
  hasInitialsFields: boolean;
  hasWitnessFields: boolean;
  hasNotaryFields: boolean;
  documentType: 'contract' | 'agreement' | 'nda' | 'lease' | 'invoice' | 'employment' | 'other';
  sections: string[]; // detected section headings
  keyTerms: string[]; // important terms found
}

export interface FieldSuggestion {
  type: string;
  keyword: string;
  confidence: number;
  matchType: 'structural' | 'heuristic' | 'exact';
}

// Generate a fingerprint from document text content (text-based)
export function generateFingerprint(textContent: string): string {
  // Normalize: lowercase, remove extra whitespace, strip numbers/dates
  const normalized = textContent
    .toLowerCase()
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '[DATE]')
    .replace(/\$[\d,]+\.?\d*/g, '[AMOUNT]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\s+/g, ' ')
    .trim();

  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

// ===== STRUCTURAL ANALYSIS =====

export function analyzeDocumentStructure(pages: { pageNumber: number; text: string }[]): DocumentStructure {
  const allText = pages.map(p => p.text).join('\n\n');
  const lowerText = allText.toLowerCase();

  // Count pages and words
  const pageCount = pages.length;
  const totalWords = allText.split(/\s+/).filter(w => w.length > 0).length;
  const averageWordsPerPage = pageCount > 0 ? Math.round(totalWords / pageCount) : 0;

  // Detect field blocks
  const hasSignatureBlocks = /signature\s*[:_\-]|sign\s+here|authorized\s+signature/i.test(allText);
  const signatureBlockCount = (allText.match(/signature\s*[:_\-]|sign\s+here|authorized\s+signature/gi) || []).length;
  const hasDateFields = /date\s*[:_\-]|dated|execution\s+date/i.test(allText);
  const hasInitialsFields = /initials\s*[:_\-]|initial\s+here/i.test(allText);
  const hasWitnessFields = /witness\s*[:_\-]|witness\s+signature/i.test(allText);
  const hasNotaryFields = /notary\s*[:_\-]|notary\s+public|notarized/i.test(allText);

  // Detect document type
  let documentType: DocumentStructure['documentType'] = 'other';
  if (/\b(non[- ]?disclosure|nda|confidentiality)\b/i.test(allText)) {
    documentType = 'nda';
  } else if (/\b(employment|employee|job)\b/i.test(allText)) {
    documentType = 'employment';
  } else if (/\b(lease|tenant|landlord|rental)\b/i.test(allText)) {
    documentType = 'lease';
  } else if (/\b(invoice|bill|payment|amount|due)\b/i.test(allText)) {
    documentType = 'invoice';
  } else if (/\b(agreement|terms and conditions|terms of service)\b/i.test(allText)) {
    documentType = 'agreement';
  } else if (/\b(contract|shall|party|parties)\b/i.test(allText)) {
    documentType = 'contract';
  }

  // Detect section headings (ALL CAPS or "Section X:" patterns)
  const sectionPattern = /^([A-Z][A-Z\s\d.,&-]*[A-Z]|Section\s+\d+|Article\s+\d+|Part\s+\d+)/gm;
  const sections: string[] = [];
  const matches = allText.matchAll(sectionPattern);
  for (const match of matches) {
    const section = match[0].trim().substring(0, 50);
    if (!sections.includes(section)) {
      sections.push(section);
    }
  }

  // Extract key terms (legal/financial keywords)
  const keyTermsList = [
    'indemnification', 'confidentiality', 'non-compete', 'limitation of liability',
    'termination', 'force majeure', 'arbitration', 'warranty', 'intellectual property',
    'payment', 'consideration', 'breach', 'default', 'remedies', 'severability',
  ];
  const keyTerms = keyTermsList.filter(term => lowerText.includes(term));

  return {
    pageCount,
    averageWordsPerPage,
    hasSignatureBlocks,
    signatureBlockCount,
    hasDateFields,
    hasInitialsFields,
    hasWitnessFields,
    hasNotaryFields,
    documentType,
    sections: sections.slice(0, 10), // limit to 10
    keyTerms,
  };
}

export function generateStructuralFingerprint(structure: DocumentStructure): string {
  // Create a fingerprint from document structure (type, page count, signature blocks, section headings)
  // This is more robust than text-based fingerprinting
  const fingerprintComponents = [
    structure.documentType,
    structure.pageCount.toString(),
    structure.signatureBlockCount.toString(),
    structure.sections.sort().join('|'),
  ];

  const fingerprintStr = fingerprintComponents.join(':');
  return crypto.createHash('sha256').update(fingerprintStr).digest('hex').substring(0, 32);
}

// Detect field positions based on keyword matching in text
export function detectFieldPositions(textContent: string): Array<{
  type: string;
  keyword: string;
  confidence: number;
}> {
  const fields: Array<{ type: string; keyword: string; confidence: number }> = [];

  const signaturePatterns = [
    { pattern: /signature[:\s]*_+|sign here|authorized signature/gi, type: 'signature', confidence: 0.9 },
    { pattern: /initial[s]?[:\s]*_+|initial here/gi, type: 'initials', confidence: 0.85 },
    { pattern: /date[:\s]*_+|dated this/gi, type: 'date', confidence: 0.8 },
    { pattern: /printed? name[:\s]*_+|full name/gi, type: 'name', confidence: 0.85 },
    { pattern: /title[:\s]*_+|position[:\s]*_+/gi, type: 'title', confidence: 0.7 },
    { pattern: /email[:\s]*_+/gi, type: 'email', confidence: 0.8 },
    { pattern: /address[:\s]*_+/gi, type: 'address', confidence: 0.7 },
    { pattern: /phone[:\s]*_+|telephone[:\s]*_+/gi, type: 'phone', confidence: 0.7 },
    { pattern: /witness[:\s]*_+/gi, type: 'witness_signature', confidence: 0.85 },
    { pattern: /notary[:\s]*_+/gi, type: 'notary_signature', confidence: 0.9 },
  ];

  for (const { pattern, type, confidence } of signaturePatterns) {
    const matches = textContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        fields.push({ type, keyword: match.trim(), confidence });
      }
    }
  }

  return fields;
}

// Learn from a processed document — store or update pattern (upgraded)
export async function learnFromDocument(
  orgId: string,
  name: string,
  textContent: string,
  fieldPositions: unknown[],
  pages?: { pageNumber: number; text: string }[],
) {
  const textFingerprint = generateFingerprint(textContent);

  // Analyze structure if pages provided
  let structure: DocumentStructure | null = null;
  let structuralFingerprint: string | null = null;

  if (pages && pages.length > 0) {
    structure = analyzeDocumentStructure(pages);
    structuralFingerprint = generateStructuralFingerprint(structure);
  }

  try {
    // Try structural fingerprint match first (more robust)
    let existing = null;
    if (structuralFingerprint) {
      const [match] = await db
        .select()
        .from(documentPatterns)
        .where(and(
          eq(documentPatterns.orgId, orgId),
          eq(documentPatterns.fingerprint, structuralFingerprint),
        ))
        .limit(1);
      existing = match;
    }

    // Fall back to text fingerprint match
    if (!existing) {
      const [match] = await db
        .select()
        .from(documentPatterns)
        .where(and(
          eq(documentPatterns.orgId, orgId),
          eq(documentPatterns.fingerprint, textFingerprint),
        ))
        .limit(1);
      existing = match;
    }

    if (existing) {
      // Update frequency and field positions
      const newConfidence = Math.min(0.99, existing.confidence + 0.05);
      await db
        .update(documentPatterns)
        .set({
          frequency: existing.frequency + 1,
          lastSeenAt: new Date(),
          fieldPositions: fieldPositions as any,
          commonEdits: structure ? (existing.commonEdits || []) : (existing.commonEdits || []),
          confidence: newConfidence,
        })
        .where(eq(documentPatterns.id, existing.id));

      return {
        ...existing,
        frequency: existing.frequency + 1,
        isNew: false,
        confidence: newConfidence,
        structure,
      };
    } else {
      // Create new pattern with structural metadata
      const [pattern] = await db
        .insert(documentPatterns)
        .values({
          orgId,
          name,
          fingerprint: structuralFingerprint || textFingerprint,
          fieldPositions: fieldPositions as any,
          commonEdits: structure ? (structure as any) : [],
          frequency: 1,
          confidence: 0.5,
        })
        .returning();

      return { ...pattern, isNew: true, structure };
    }
  } catch (error) {
    console.error('[ai:pattern] Failed to learn from document:', error);
    return null;
  }
}

// Suggest fields for a new document based on fingerprint match (upgraded)
export async function suggestFieldsForDocument(
  orgId: string,
  textContent: string,
  pages?: { pageNumber: number; text: string }[],
) {
  const textFingerprint = generateFingerprint(textContent);

  try {
    // Try structural fingerprint match first
    let structuralMatch = null;
    if (pages && pages.length > 0) {
      const structure = analyzeDocumentStructure(pages);
      const structuralFingerprint = generateStructuralFingerprint(structure);

      const [match] = await db
        .select()
        .from(documentPatterns)
        .where(and(
          eq(documentPatterns.orgId, orgId),
          eq(documentPatterns.fingerprint, structuralFingerprint),
        ))
        .limit(1);

      structuralMatch = match;
    }

    if (structuralMatch && structuralMatch.confidence >= 0.7) {
      return {
        matchType: 'structural' as const,
        pattern: structuralMatch,
        suggestedFields: structuralMatch.fieldPositions,
        confidence: structuralMatch.confidence,
      };
    }

    // Try exact text fingerprint match
    const [exactMatch] = await db
      .select()
      .from(documentPatterns)
      .where(and(
        eq(documentPatterns.orgId, orgId),
        eq(documentPatterns.fingerprint, textFingerprint),
      ))
      .limit(1);

    if (exactMatch && exactMatch.confidence >= 0.6) {
      return {
        matchType: 'exact' as const,
        pattern: exactMatch,
        suggestedFields: exactMatch.fieldPositions,
        confidence: exactMatch.confidence,
      };
    }

    // Fallback: keyword-based detection (heuristic)
    const detectedFields = detectFieldPositions(textContent);

    return {
      matchType: 'heuristic' as const,
      pattern: null,
      suggestedFields: detectedFields.map(f => ({ ...f, matchType: 'heuristic' })),
      confidence: detectedFields.length > 0 ? 0.5 : 0,
    };
  } catch (error) {
    console.error('[ai:pattern] Failed to suggest fields:', error);
    return { matchType: 'heuristic' as const, pattern: null, suggestedFields: [], confidence: 0 };
  }
}

// Get patterns for an org
export async function getOrgPatterns(orgId: string) {
  return db
    .select()
    .from(documentPatterns)
    .where(eq(documentPatterns.orgId, orgId))
    .orderBy(desc(documentPatterns.frequency))
    .limit(50);
}
