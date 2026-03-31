// Risk keywords and patterns for contract analysis
export interface RiskFlag {
  category: string;
  severity: 'red' | 'yellow' | 'green';
  keyword: string;
  explanation: string;
  position?: number;
}

export interface ClauseAnalysis {
  clauseText: string; // first 200 chars of the clause
  category: string;
  severity: 'red' | 'yellow' | 'green';
  explanation: string;
  suggestion?: string;
  pageNumber?: number;
  position: { start: number; end: number };
}

const RISK_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  severity: 'red' | 'yellow';
  explanation: string;
  suggestion?: string;
}> = [
  // Red flags — high risk
  { pattern: /unlimited liability/gi, category: 'liability', severity: 'red', explanation: 'Unlimited liability clause detected — may expose you to disproportionate risk', suggestion: 'Negotiate a reasonable liability cap (e.g., 12 months of fees or contract value)' },
  { pattern: /no\s+limitation\s+of\s+liability/gi, category: 'liability', severity: 'red', explanation: 'This removes any cap on damages you could owe', suggestion: 'Request to add specific liability limitations' },
  { pattern: /indemnif(?:y|ication)\s+(?:and\s+)?hold\s+harmless/gi, category: 'indemnification', severity: 'red', explanation: 'Broad indemnification clause — you agree to cover the other party\'s losses', suggestion: 'Limit indemnification to breaches you caused, not third-party actions' },
  { pattern: /non[- ]?compete.*(\d+)\s+year/gi, category: 'non-compete', severity: 'red', explanation: 'Non-compete clause exceeds typical duration — may restrict future activities', suggestion: 'Negotiate to 1-2 years maximum, with geographic/industry limitations' },
  { pattern: /automatic(?:ally)?\s+renew/gi, category: 'auto-renewal', severity: 'red', explanation: 'Auto-renewal clause — contract renews without explicit consent', suggestion: 'Require explicit renewal action; set advance notice requirement (e.g., 30 days)' },
  { pattern: /waive[s]?\s+right\s+to\s+jury\s+trial/gi, category: 'waiver', severity: 'red', explanation: 'You give up the right to a jury trial', suggestion: 'Consider negotiating to keep jury trial rights unless mutual agreement' },
  { pattern: /binding\s+arbitration\s+.*venue/gi, category: 'arbitration', severity: 'red', explanation: 'Mandatory binding arbitration in their preferred venue — limits your legal options', suggestion: 'If arbitration required, ensure neutral location and split arbitrator costs' },
  { pattern: /personal\s+guarantee/gi, category: 'guarantee', severity: 'red', explanation: 'Personal guarantee required — your personal assets may be at risk', suggestion: 'Limit to business entity liability; request exception if financially strong company' },
  { pattern: /unilateral\s+(?:amendment|modification|change)/gi, category: 'amendment', severity: 'red', explanation: 'Other party can change terms without your consent', suggestion: 'Require mutual written agreement for any amendments' },

  // Yellow flags — medium risk
  { pattern: /termination\s+(?:for\s+)?convenience/gi, category: 'termination', severity: 'yellow', explanation: 'Termination for convenience clause — either party can end without cause', suggestion: 'Add notice period requirement and wind-down obligations' },
  { pattern: /liquidated\s+damages/gi, category: 'damages', severity: 'yellow', explanation: 'Liquidated damages clause — pre-set penalty amounts', suggestion: 'Verify amounts are reasonable and reasonably foreseeable damages' },
  { pattern: /force\s+majeure/gi, category: 'force-majeure', severity: 'yellow', explanation: 'Force majeure clause — review what events excuse performance', suggestion: 'Ensure pandemic/epidemic/cybersecurity incidents are covered if relevant' },
  { pattern: /intellectual\s+property.*(?:assign|transfer|own)/gi, category: 'ip-transfer', severity: 'yellow', explanation: 'IP transfer clause — you may be giving up intellectual property rights', suggestion: 'Clarify that you retain ownership of pre-existing IP and derivatives' },
  { pattern: /confidential(?:ity)?\s+.*duration.*(\d+)\s+year/gi, category: 'confidentiality', severity: 'yellow', explanation: 'Long confidentiality period — review scope and duration', suggestion: 'Cap confidentiality to 3-5 years maximum; exclude public information' },
  { pattern: /liability.*cap.*(?:less than|below).*(?:contract value|annual fees)/gi, category: 'liability-cap', severity: 'yellow', explanation: 'Damages capped at less than contract is worth — may not cover your losses', suggestion: 'Ensure cap equals at least annual contract value' },
  { pattern: /governing\s+law.*(?:their state|their jurisdiction)/gi, category: 'jurisdiction', severity: 'yellow', explanation: 'Governing law in their jurisdiction — check which state/country applies', suggestion: 'Negotiate to neutral state or your home jurisdiction' },
  { pattern: /(?:late\s+)?payment\s+(?:penalty|fee|interest).*(?:[5-9]%|[1-9]\d%)/gi, category: 'penalties', severity: 'yellow', explanation: 'High late payment penalties (5%+ or higher)', suggestion: 'Negotiate to 1-2% monthly (12-24% annual) or industry standard' },
  { pattern: /(?:30|60|90|180)\s+days?\s+(?:notice|written\s+notice)/gi, category: 'notice-period', severity: 'yellow', explanation: 'Notice period requirement — check if timeline is manageable', suggestion: 'For service contracts, request 30-60 day notice; for others, negotiate shorter period' },
];

export function analyzeContractRisk(textContent: string): {
  overallRisk: 'red' | 'yellow' | 'green';
  score: number;
  flags: RiskFlag[];
  summary: string;
} {
  const flags: RiskFlag[] = [];

  for (const { pattern, category, severity, explanation, suggestion } of RISK_PATTERNS) {
    const matches = textContent.matchAll(pattern);
    for (const match of matches) {
      flags.push({
        category,
        severity,
        keyword: match[0],
        explanation,
        position: match.index,
      });
    }
  }

  // Calculate risk score
  const redCount = flags.filter(f => f.severity === 'red').length;
  const yellowCount = flags.filter(f => f.severity === 'yellow').length;

  // Score: 0 = safe, 100 = very risky
  const score = Math.min(100, redCount * 20 + yellowCount * 8);

  const overallRisk: 'red' | 'yellow' | 'green' =
    redCount >= 2 || score >= 60 ? 'red' :
    redCount >= 1 || yellowCount >= 3 || score >= 30 ? 'yellow' :
    'green';

  const summary =
    overallRisk === 'green'
      ? `No significant risk flags detected. ${yellowCount > 0 ? `${yellowCount} minor items to review.` : 'Document appears straightforward.'}`
      : overallRisk === 'yellow'
      ? `${redCount + yellowCount} items flagged for review. ${redCount > 0 ? `${redCount} high-risk clause(s) require attention.` : 'Review yellow-flagged items before signing.'}`
      : `${redCount} high-risk clauses detected along with ${yellowCount} additional items. Careful legal review strongly recommended before signing.`;

  // Deduplicate by category (keep highest severity)
  const deduped = new Map<string, RiskFlag>();
  for (const flag of flags) {
    const existing = deduped.get(flag.category);
    if (!existing || (flag.severity === 'red' && existing.severity !== 'red')) {
      deduped.set(flag.category, flag);
    }
  }

  return {
    overallRisk,
    score,
    flags: Array.from(deduped.values()),
    summary,
  };
}

// ===== DEEP CLAUSE ANALYSIS =====

export function analyzeClausesInDepth(pages: { pageNumber: number; text: string }[]): ClauseAnalysis[] {
  const allText = pages.map(p => p.text).join('\n\n');
  const clauses: ClauseAnalysis[] = [];

  // Split into paragraphs/clauses (separated by double newlines or numbered items)
  const clauseBlocks = allText.split(/\n\s*\n+/).filter(c => c.trim().length > 20);

  for (const block of clauseBlocks) {
    const lines = block.split('\n');
    const firstLine = lines[0].trim();

    // Skip if it's just a heading
    if (firstLine.length < 20) {
      continue;
    }

    // RED FLAG CHECKS
    if (/unlimited\s+liability/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'liability',
        severity: 'red',
        explanation: 'This removes any cap on damages you could owe',
        suggestion: 'Negotiate a reasonable liability cap (e.g., 12 months of fees)',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/indemnif(?:y|ication).*hold\s+harmless/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'indemnification',
        severity: 'red',
        explanation: 'You agree to cover the other party\'s losses — review scope carefully',
        suggestion: 'Limit indemnification to breaches you caused, not third-party actions',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/non[- ]?compete/i.test(block) && /(\d+)\s*year/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'non-compete',
        severity: 'red',
        explanation: 'Non-compete exceeds typical duration — may restrict future activities',
        suggestion: 'Negotiate to 1-2 years maximum with geographic limitations',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/automatic(?:ally)?\s+renew/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'auto-renewal',
        severity: 'red',
        explanation: 'Contract auto-renews without clear cancellation process',
        suggestion: 'Require explicit renewal action; set advance notice requirement',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/waive.*right\s+to\s+jury\s+trial/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'waiver',
        severity: 'red',
        explanation: 'You give up the right to a jury trial',
        suggestion: 'Negotiate to keep jury trial rights',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/binding\s+arbitration/i.test(block) && /venue|location/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'arbitration',
        severity: 'red',
        explanation: 'Disputes must go through arbitration in their preferred location',
        suggestion: 'Ensure neutral location and negotiate split arbitrator costs',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/personal\s+guarantee/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'guarantee',
        severity: 'red',
        explanation: 'You are personally liable beyond the business entity',
        suggestion: 'Limit to business entity liability only',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/unilateral\s+amendment|either\s+party\s+may\s+modify/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'amendment',
        severity: 'red',
        explanation: 'Other party can change terms without your consent',
        suggestion: 'Require mutual written agreement for any amendments',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    // YELLOW FLAG CHECKS
    if (/termination\s+(?:for\s+)?convenience/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'termination',
        severity: 'yellow',
        explanation: 'Either party can end the contract without cause',
        suggestion: 'Add notice period requirement and wind-down obligations',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/liquidated\s+damages/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'damages',
        severity: 'yellow',
        explanation: 'Pre-set penalty amounts — verify they\'re reasonable',
        suggestion: 'Ensure amounts are proportionate to actual damages',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/force\s+majeure/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'force-majeure',
        severity: 'yellow',
        explanation: 'Review what events excuse performance',
        suggestion: 'Ensure pandemic/epidemic incidents are covered if relevant',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/intellectual\s+property/i.test(block) && /assign|transfer|own/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'ip-transfer',
        severity: 'yellow',
        explanation: 'You may be giving up intellectual property rights',
        suggestion: 'Clarify you retain ownership of pre-existing IP',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/confidential/i.test(block) && /(\d+)\s*year/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'confidentiality',
        severity: 'yellow',
        explanation: 'Long confidentiality period — review scope and duration',
        suggestion: 'Cap to 3-5 years maximum; exclude public information',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/limitation\s+of\s+liability/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'liability-cap',
        severity: 'yellow',
        explanation: 'Damages capped — verify the cap is reasonable',
        suggestion: 'Ensure cap equals at least annual contract value',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }

    if (/governing\s+law/i.test(block)) {
      clauses.push({
        clauseText: block.substring(0, 200),
        category: 'jurisdiction',
        severity: 'yellow',
        explanation: 'Check which state/country\'s laws apply',
        suggestion: 'Negotiate to neutral state or your home jurisdiction',
        position: { start: allText.indexOf(block), end: allText.indexOf(block) + block.length },
      });
    }
  }

  return clauses;
}

// ===== GENERATE RISK SUMMARY =====

export function generateRiskSummary(clauses: ClauseAnalysis[]): {
  overallRisk: 'red' | 'yellow' | 'green';
  score: number;
  summary: string;
  topConcerns: string[];
  positivePoints: string[];
} {
  const redCount = clauses.filter(c => c.severity === 'red').length;
  const yellowCount = clauses.filter(c => c.severity === 'yellow').length;

  const score = Math.min(100, redCount * 25 + yellowCount * 10);

  const overallRisk: 'red' | 'yellow' | 'green' =
    redCount >= 2 || score >= 70 ? 'red' :
    redCount >= 1 || yellowCount >= 3 || score >= 40 ? 'yellow' :
    'green';

  // Generate summary
  let summary = '';
  if (overallRisk === 'green') {
    summary = 'This document has minimal risk flags and appears to have standard terms. Standard review recommended.';
  } else if (overallRisk === 'yellow') {
    summary = `This document has ${redCount > 0 ? `${redCount} high-risk and ` : ''}${yellowCount} medium-risk items. Recommended to review highlighted clauses before signing.`;
  } else {
    summary = `This document has ${redCount} high-risk clauses. Strong legal review recommended before signing.`;
  }

  // Top concerns
  const topConcerns = clauses
    .filter(c => c.severity === 'red')
    .slice(0, 3)
    .map(c => c.explanation);

  // Positive points (standard clauses)
  const positivePoints: string[] = [];
  if (clauses.some(c => c.category === 'termination')) {
    positivePoints.push('Termination terms are defined');
  }
  if (clauses.some(c => c.category === 'confidentiality')) {
    positivePoints.push('Confidentiality obligations included');
  }
  if (!clauses.some(c => c.severity === 'red')) {
    positivePoints.push('No high-risk clauses detected');
  }

  return {
    overallRisk,
    score,
    summary,
    topConcerns,
    positivePoints,
  };
}
