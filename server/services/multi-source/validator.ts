/**
 * Research validation and quality scoring service
 * Validates research content for accuracy, completeness, and quality
 */

interface ValidationResult {
  isValid: boolean;
  qualityScore: number; // 1-10
  issues: ValidationIssue[];
  suggestions: string[];
}

interface ValidationIssue {
  severity: 'low' | 'medium' | 'high';
  type: 'citation' | 'generic' | 'incomplete' | 'hallucination' | 'formatting';
  message: string;
  location?: string;
}

interface Source {
  url: string;
  snippet: string;
  provider: string;
}

/**
 * Validate research content quality
 */
export async function validateResearchQuality(
  content: string,
  sources: Source[],
  companyUrl: string
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  let qualityScore = 10; // Start with perfect score, deduct for issues

  // 1. Check citation quality
  const citationCheck = validateCitations(content, sources);
  if (citationCheck.issues.length > 0) {
    issues.push(...citationCheck.issues);
    qualityScore -= citationCheck.penalty;
  }

  // 2. Detect generic/template responses
  const genericCheck = detectGenericContent(content);
  if (genericCheck.isGeneric) {
    issues.push({
      severity: 'high',
      type: 'generic',
      message: 'Content appears to be generic or template-based',
    });
    qualityScore -= 3;
    suggestions.push('Request more specific information about the company');
  }

  // 3. Check content specificity
  const specificityScore = calculateSpecificity(content, companyUrl);
  if (specificityScore < 5) {
    issues.push({
      severity: 'medium',
      type: 'incomplete',
      message: 'Content lacks specific details about the company',
    });
    qualityScore -= 2;
    suggestions.push('Add more company-specific facts and data');
  }

  // 4. Detect potential hallucinations
  const hallucinationCheck = detectPotentialHallucinations(content, sources);
  if (hallucinationCheck.suspiciousStatements.length > 0) {
    issues.push({
      severity: 'high',
      type: 'hallucination',
      message: `${hallucinationCheck.suspiciousStatements.length} statements lack source citations`,
    });
    qualityScore -= 2;
    suggestions.push('Verify all factual claims have sources');
  }

  // 5. Check formatting and structure
  const formattingCheck = validateFormatting(content);
  if (formattingCheck.issues.length > 0) {
    issues.push(...formattingCheck.issues);
    qualityScore -= 0.5;
  }

  // 6. Validate URLs are accessible (basic check)
  const urlCheck = await validateSourceUrls(sources);
  if (urlCheck.invalidUrls.length > 0) {
    issues.push({
      severity: 'medium',
      type: 'citation',
      message: `${urlCheck.invalidUrls.length} source URLs may be invalid`,
    });
    qualityScore -= 1;
  }

  // Ensure score stays in valid range
  qualityScore = Math.max(1, Math.min(10, qualityScore));

  return {
    isValid: qualityScore >= 6,
    qualityScore: Math.round(qualityScore * 10) / 10,
    issues,
    suggestions,
  };
}

/**
 * Validate citation quality
 */
function validateCitations(content: string, sources: Source[]): {
  issues: ValidationIssue[];
  penalty: number;
} {
  const issues: ValidationIssue[] = [];
  let penalty = 0;

  // Check if content has citations
  const hasCitations = content.includes('http') || content.includes('[') && content.includes(']');
  
  if (!hasCitations && sources.length === 0) {
    issues.push({
      severity: 'high',
      type: 'citation',
      message: 'No sources or citations found in content',
    });
    penalty += 3;
  }

  // Check if sources are relevant
  if (sources.length > 0) {
    const relevantSources = sources.filter(s => 
      s.url.includes('http') && s.snippet && s.snippet.length > 10
    );
    
    if (relevantSources.length < sources.length * 0.5) {
      issues.push({
        severity: 'medium',
        type: 'citation',
        message: 'Some sources lack proper descriptions',
      });
      penalty += 1;
    }
  }

  return { issues, penalty };
}

/**
 * Detect generic or template-based content
 */
function detectGenericContent(content: string): { isGeneric: boolean } {
  const genericPhrases = [
    'is a company',
    'is a leading',
    'is a global',
    'provides services',
    'offers solutions',
    'founded in [year]',
    'headquartered in',
    'information not available',
    'data not found',
    'unable to find',
    'no specific information',
  ];

  const lowerContent = content.toLowerCase();
  const genericCount = genericPhrases.filter(phrase => 
    lowerContent.includes(phrase)
  ).length;

  // If more than 30% of generic phrases are present, flag as generic
  return {
    isGeneric: genericCount > genericPhrases.length * 0.3,
  };
}

/**
 * Calculate content specificity score (1-10)
 */
function calculateSpecificity(content: string, companyUrl: string): number {
  let score = 5; // Base score

  // Extract domain name
  const domain = companyUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const companyName = domain.split('.')[0];

  // Check if company name appears frequently
  const nameMatches = (content.match(new RegExp(companyName, 'gi')) || []).length;
  if (nameMatches > 5) score += 2;
  else if (nameMatches > 2) score += 1;

  // Check for specific data points (numbers, dates, percentages)
  const hasNumbers = /\d+/.test(content);
  const hasDates = /\d{4}|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(content);
  const hasPercentages = /%/.test(content);
  
  if (hasNumbers) score += 1;
  if (hasDates) score += 1;
  if (hasPercentages) score += 1;

  // Check content length (more detailed content is usually more specific)
  if (content.length > 2000) score += 1;
  else if (content.length < 500) score -= 2;

  return Math.max(1, Math.min(10, score));
}

/**
 * Detect potential hallucinations
 */
function detectPotentialHallucinations(content: string, _sources: Source[]): {
  suspiciousStatements: string[];
} {
  const suspiciousStatements: string[] = [];

  // Look for definitive statements without citations
  const sentences = content.split(/[.!?]+/);
  const definitivePatterns = [
    /\b(founded|established|created) in \d{4}\b/i,
    /\b(headquartered|based|located) in\b/i,
    /\b\d+\s*(million|billion|thousand)\b/i,
    /\b(CEO|founder|president) is\b/i,
    /\bhas \d+\s*(employees|customers|users)\b/i,
  ];

  sentences.forEach(sentence => {
    definitivePatterns.forEach(pattern => {
      if (pattern.test(sentence)) {
        // Check if this sentence has a nearby citation
        const hasCitation = sentence.includes('http') || 
                          sentence.includes('[') || 
                          sentence.includes('(source:');
        
        if (!hasCitation) {
          suspiciousStatements.push(sentence.trim());
        }
      }
    });
  });

  return { suspiciousStatements };
}

/**
 * Validate markdown formatting
 */
function validateFormatting(content: string): { issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  // Check for proper markdown structure
  const hasHeadings = /^#{1,6}\s/m.test(content);
  if (!hasHeadings) {
    issues.push({
      severity: 'low',
      type: 'formatting',
      message: 'Content lacks proper heading structure',
    });
  }

  // Check for broken markdown links
  const brokenLinks = content.match(/\[([^\]]+)\]\(\s*\)/g);
  if (brokenLinks && brokenLinks.length > 0) {
    issues.push({
      severity: 'medium',
      type: 'formatting',
      message: `${brokenLinks.length} broken markdown links found`,
    });
  }

  return { issues };
}

/**
 * Validate source URLs (basic check)
 */
async function validateSourceUrls(sources: Source[]): Promise<{
  invalidUrls: string[];
}> {
  const invalidUrls: string[] = [];

  // Basic URL validation (not making actual HTTP requests to avoid slowdown)
  for (const source of sources) {
    try {
      new URL(source.url);
      
      // Check for common invalid patterns
      if (source.url.includes('example.com') || 
          source.url.includes('localhost') ||
          source.url.length < 10) {
        invalidUrls.push(source.url);
      }
    } catch {
      invalidUrls.push(source.url);
    }
  }

  return { invalidUrls };
}

/**
 * Generate validation report
 */
export function generateValidationReport(validation: ValidationResult): string {
  let report = `# Research Quality Report\n\n`;
  report += `**Quality Score:** ${validation.qualityScore}/10\n`;
  report += `**Status:** ${validation.isValid ? '✅ Valid' : '⚠️ Needs Improvement'}\n\n`;

  if (validation.issues.length > 0) {
    report += `## Issues Found\n\n`;
    validation.issues.forEach((issue, index) => {
      const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      report += `${index + 1}. ${emoji} **${issue.type}**: ${issue.message}\n`;
    });
    report += `\n`;
  }

  if (validation.suggestions.length > 0) {
    report += `## Suggestions\n\n`;
    validation.suggestions.forEach((suggestion, index) => {
      report += `${index + 1}. ${suggestion}\n`;
    });
  }

  return report;
}

