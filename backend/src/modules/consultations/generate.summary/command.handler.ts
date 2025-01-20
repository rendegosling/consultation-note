import { ConsultationSession, SummaryStatus } from '@/modules/consultations/models';
import { ConsultationSessionRepository } from '@/modules/consultations';
import { logger } from '@/infrastructure/logging';
import { storageService } from '@/infrastructure/storage';
import { AudioProcessingIncomplete } from '@/modules/consultations/errors';
import { config } from '@/config/app.config';

const COMPONENT_NAME = 'GenerateSummaryCommandHandler';

// Command type definition
export interface GenerateSummaryCommand {
  sessionId: string;
}

// Command result type definition
export interface GenerateSummaryResult {
  url: string;
  generatedAt: string;
}

export class GenerateSummaryCommandHandler {
  constructor(
    private readonly sessionRepository: ConsultationSessionRepository
  ) {}

  async execute(command: GenerateSummaryCommand): Promise<GenerateSummaryResult> {
    try {
      // 1. Get session
      const session = await this.sessionRepository.findById(command.sessionId);
      if (!session) {
        throw new Error(`Session not found: ${command.sessionId}`);
      }

      // 2. Check if all chunks are processed
      if (!session.isAudioProcessingComplete) {
        throw new AudioProcessingIncomplete(command.sessionId);
      }

      // 3. Generate and upload summary
      const summary = this.generatePlaceholderSummary(session);
      const summaryKey = `summaries/${command.sessionId}/consultation-summary.txt`;
      
      await storageService.uploadFile(summaryKey, Buffer.from(summary), {
        bucket: config.aws.s3.reportBucket,
        metadata: {
          contentType: 'text/plain; charset=utf-8',
          sessionId: command.sessionId,
          generatedAt: new Date().toISOString()
        }
      });

      // 4. Generate signed URL
      const signedUrl = await storageService.getSignedUrl(summaryKey, {
        bucket: config.aws.s3.reportBucket,
        expiresIn: config.storage.signedUrls.summary.expirySeconds
      });

      // 5. Update session with summary info
      session.summary = {
        status: SummaryStatus.COMPLETED,
        url: signedUrl,
        generatedAt: new Date().toISOString()
      };

      // 6. Persist updated session
      await this.sessionRepository.save(session);

      logger.info(COMPONENT_NAME, 'Summary generated successfully', {
        sessionId: command.sessionId,
        summaryKey
      });

      return {
        url: signedUrl,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to generate summary', {
        sessionId: command.sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private generatePlaceholderSummary(session: ConsultationSession): string {
    const today = new Date().toISOString().split('T')[0];
    
    return `CONSULTATION SUMMARY
Date: ${today}
Session ID: ${session.id}

CHIEF COMPLAINT
Patient presents with persistent lower back pain lasting 2 weeks.

HISTORY OF PRESENT ILLNESS
- Onset: Gradual, started after lifting heavy boxes
- Duration: 2 weeks
- Location: Lower back, primarily on the right side
- Severity: Moderate (6/10 on pain scale)
- Aggravating factors: Prolonged sitting, bending
- Alleviating factors: Rest, over-the-counter pain medication

PHYSICAL EXAMINATION
- Gait: Normal
- Range of motion: Limited in forward flexion
- Tenderness: Present in right lumbar region
- Neurological: Intact sensations and reflexes

ASSESSMENT
Mechanical lower back pain, likely due to muscle strain

PLAN
1. Rest and activity modification
2. NSAIDs for pain management
3. Physical therapy referral
4. Follow-up in 2 weeks if not improving
5. Return immediately if symptoms worsen

NOTES DURING CONSULTATION
${session.notes?.map(note => `- ${note.note}`).join('\n') || '- No notes recorded'}

RECOMMENDATIONS
1. Ice/heat therapy
2. Gentle stretching exercises
3. Ergonomic workplace assessment
4. Avoid heavy lifting for 2 weeks

Next appointment scheduled for follow-up evaluation.`;
  }
}