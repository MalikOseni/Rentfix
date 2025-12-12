/**
 * AI Vision Service
 * Wrapper for OpenAI Vision API (GPT-4 Vision)
 * Analyzes maintenance issue photos to classify and triage
 */

import {
  AIClassificationResult,
  ImageAnalysisRequest,
  IssueTrade,
  IssueSeverity,
  AI_CONFIDENCE_THRESHOLD,
} from '@rentfix/types';

export class AIService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-4o'; // GPT-4 with vision capabilities

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';

    if (!this.apiKey) {
      console.warn(
        'OPENAI_API_KEY not set - AI service will return mock results'
      );
    }
  }

  /**
   * Analyze maintenance issue image using OpenAI Vision
   * Main entry point for image classification
   */
  async analyzeImage(
    request: ImageAnalysisRequest
  ): Promise<AIClassificationResult> {
    try {
      console.log(`Analyzing image for ticket ${request.ticketId}`);

      // If no API key, return mock result for development
      if (!this.apiKey) {
        return this.getMockClassification(request);
      }

      // Prepare the vision analysis prompt
      const prompt = this.buildAnalysisPrompt(request);

      // Call OpenAI Vision API
      const response = await this.callOpenAIVision(request.imageUrl, prompt);

      // Parse and structure the response
      const classification = this.parseAIResponse(response);

      console.log(
        `Classification complete: ${classification.issueType} (confidence: ${classification.confidence})`
      );

      return classification;
    } catch (error) {
      console.error('AI analysis failed:', error);

      // Fallback to conservative classification
      return this.getFallbackClassification(request, error);
    }
  }

  /**
   * Build the analysis prompt for OpenAI
   */
  private buildAnalysisPrompt(request: ImageAnalysisRequest): string {
    const contextParts: string[] = [];

    if (request.tenantDescription) {
      contextParts.push(`Tenant description: "${request.tenantDescription}"`);
    }

    if (request.propertyType) {
      contextParts.push(`Property type: ${request.propertyType}`);
    }

    const context = contextParts.length > 0 ? contextParts.join('\n') : '';

    return `You are an expert property maintenance inspector analyzing a photo submitted by a tenant.

${context}

Analyze this image and provide a detailed assessment in the following JSON format:

{
  "issueType": "Brief description of the issue (e.g., 'Leaky faucet', 'Broken window', 'Water damage')",
  "trade": "One of: plumbing, electrical, hvac, structural, pest_control, appliance, cosmetic, general_maintenance, unknown",
  "severity": "One of: critical, high, medium, low",
  "confidence": 0.0-1.0,
  "alternatives": [
    {"issueType": "Alternative diagnosis", "trade": "trade_type", "confidence": 0.0-1.0}
  ],
  "metadata": {
    "detectedObjects": ["list", "of", "visible", "objects"],
    "estimatedUrgencyHours": 24,
    "safetyConcerns": ["list", "of", "safety", "issues"],
    "suggestedMaterials": ["list", "of", "needed", "materials"]
  }
}

SEVERITY GUIDELINES:
- CRITICAL: Immediate danger (gas leak, flooding, electrical hazard, structural collapse)
- HIGH: Urgent repair needed within 24 hours (no heat/AC in extreme weather, major leak, broken lock)
- MEDIUM: Should fix within 1 week (minor leak, appliance malfunction, cosmetic damage)
- LOW: Can wait 2+ weeks (paint touch-up, squeaky door, minor wear)

CONFIDENCE GUIDELINES:
- 0.9-1.0: Very clear image, obvious issue
- 0.7-0.89: Good visibility, likely diagnosis
- 0.5-0.69: Unclear image or multiple possible issues
- Below 0.5: Cannot confidently diagnose, needs human review

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Call OpenAI Vision API
   */
  private async callOpenAIVision(
    imageUrl: string,
    prompt: string
  ): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high', // Request high-detail analysis
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent results
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse AI response into structured classification
   */
  private parseAIResponse(aiResponse: string): AIClassificationResult {
    try {
      // Extract JSON from response (AI might include markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;

      const parsed = JSON.parse(jsonString);

      return {
        issueType: parsed.issueType || 'Unknown issue',
        trade: this.normalizeTradeEnum(parsed.trade),
        severity: this.normalizeSeverityEnum(parsed.severity),
        confidence: Math.min(Math.max(parsed.confidence || 0, 0), 1),
        alternatives: parsed.alternatives || [],
        metadata: {
          detectedObjects: parsed.metadata?.detectedObjects || [],
          estimatedUrgencyHours: parsed.metadata?.estimatedUrgencyHours,
          safetyConcerns: parsed.metadata?.safetyConcerns || [],
          suggestedMaterials: parsed.metadata?.suggestedMaterials || [],
        },
        rawResponse: parsed,
        classifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  /**
   * Normalize trade string to enum
   */
  private normalizeTradeEnum(trade: string): IssueTrade {
    const normalized = trade?.toLowerCase().replace(/[_-]/g, '_');

    const tradeMap: Record<string, IssueTrade> = {
      plumbing: IssueTrade.PLUMBING,
      electrical: IssueTrade.ELECTRICAL,
      hvac: IssueTrade.HVAC,
      structural: IssueTrade.STRUCTURAL,
      pest_control: IssueTrade.PEST_CONTROL,
      appliance: IssueTrade.APPLIANCE,
      cosmetic: IssueTrade.COSMETIC,
      general_maintenance: IssueTrade.GENERAL_MAINTENANCE,
    };

    return tradeMap[normalized] || IssueTrade.UNKNOWN;
  }

  /**
   * Normalize severity string to enum
   */
  private normalizeSeverityEnum(severity: string): IssueSeverity {
    const normalized = severity?.toLowerCase();

    const severityMap: Record<string, IssueSeverity> = {
      critical: IssueSeverity.CRITICAL,
      high: IssueSeverity.HIGH,
      medium: IssueSeverity.MEDIUM,
      low: IssueSeverity.LOW,
    };

    return severityMap[normalized] || IssueSeverity.MEDIUM;
  }

  /**
   * Fallback classification when AI fails
   */
  private getFallbackClassification(
    request: ImageAnalysisRequest,
    error: unknown
  ): AIClassificationResult {
    console.warn('Using fallback classification due to error:', error);

    return {
      issueType: request.tenantDescription || 'Maintenance issue - requires review',
      trade: IssueTrade.UNKNOWN,
      severity: IssueSeverity.MEDIUM,
      confidence: 0.0,
      metadata: {
        detectedObjects: [],
        safetyConcerns: ['AI analysis failed - manual review required'],
      },
      rawResponse: { error: String(error) },
      classifiedAt: new Date(),
    };
  }

  /**
   * Mock classification for development (when no API key)
   */
  private getMockClassification(
    request: ImageAnalysisRequest
  ): AIClassificationResult {
    console.log('Using mock classification for development');

    // Simulate different scenarios based on tenant description
    const description = request.tenantDescription?.toLowerCase() || '';

    if (description.includes('leak') || description.includes('water')) {
      return {
        issueType: 'Leaky faucet',
        trade: IssueTrade.PLUMBING,
        severity: IssueSeverity.MEDIUM,
        confidence: 0.85,
        alternatives: [
          {
            issueType: 'Pipe corrosion',
            trade: IssueTrade.PLUMBING,
            confidence: 0.65,
          },
        ],
        metadata: {
          detectedObjects: ['faucet', 'sink', 'water droplets'],
          estimatedUrgencyHours: 48,
          safetyConcerns: [],
          suggestedMaterials: ['Faucet washer', 'Plumber\'s tape', 'Wrench'],
        },
        rawResponse: { mock: true },
        classifiedAt: new Date(),
      };
    }

    if (description.includes('electric') || description.includes('outlet')) {
      return {
        issueType: 'Faulty electrical outlet',
        trade: IssueTrade.ELECTRICAL,
        severity: IssueSeverity.HIGH,
        confidence: 0.92,
        metadata: {
          detectedObjects: ['outlet', 'wall plate', 'scorch marks'],
          estimatedUrgencyHours: 12,
          safetyConcerns: ['Electrical fire hazard', 'Shock risk'],
          suggestedMaterials: ['Outlet replacement', 'Wire nuts', 'Voltage tester'],
        },
        rawResponse: { mock: true },
        classifiedAt: new Date(),
      };
    }

    // Default mock
    return {
      issueType: 'General maintenance issue',
      trade: IssueTrade.GENERAL_MAINTENANCE,
      severity: IssueSeverity.MEDIUM,
      confidence: 0.75,
      metadata: {
        detectedObjects: ['room', 'wall', 'fixture'],
        estimatedUrgencyHours: 72,
        safetyConcerns: [],
        suggestedMaterials: [],
      },
      rawResponse: { mock: true },
      classifiedAt: new Date(),
    };
  }

  /**
   * Check if classification requires human review
   */
  isHumanReviewRequired(classification: AIClassificationResult): boolean {
    return (
      classification.confidence < AI_CONFIDENCE_THRESHOLD ||
      classification.severity === IssueSeverity.CRITICAL ||
      classification.trade === IssueTrade.UNKNOWN ||
      (classification.metadata.safetyConcerns?.length ?? 0) > 0
    );
  }
}
