import mongoose, { Schema, Document } from 'mongoose';

export interface ICV extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  rawText: string;
  parsedData: {
    email?: string;
    phone?: string;
    skills: string[];
    name?: string;
    education: string[];
    experience: string[];
    wordCount: number;
  };
  analysis?: {
    score: number;
    maxScore: number;
    percentage: number;
    status: string;
    statusMessage: string;
    categories: Record<string, any>;
    mistakes: string[];
    suggestions: string[];
    wordCount: number;
    skillsCount: number;
  };
  aiAnalysis?: {
    atsScore: Record<string, any>;
    mistakeDetector: Record<string, any>;
    templateSuggestion: Record<string, any>;
  };
  skillGap?: Record<string, any>;
  jobMatches?: any[];
  learningRecommendations?: Record<string, any>;
  mockInterview?: Record<string, any>;
  salaryEstimate?: Record<string, any>;
  careerPath?: Record<string, any>;
  coverLetters?: Array<{
    jobTitle: string;
    companyName: string;
    coverLetter: string;
    subject: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CVSchema = new Schema<ICV>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    parsedData: {
      email: String,
      phone: String,
      skills: [String],
      name: String,
      education: [String],
      experience: [String],
      wordCount: Number,
    },
    analysis: {
      score: Number,
      maxScore: Number,
      percentage: Number,
      status: String,
      statusMessage: String,
      categories: Schema.Types.Mixed,
      mistakes: [String],
      suggestions: [String],
      wordCount: Number,
      skillsCount: Number,
    },
    aiAnalysis: {
      atsScore: Schema.Types.Mixed,
      mistakeDetector: Schema.Types.Mixed,
      templateSuggestion: Schema.Types.Mixed,
    },
    skillGap: Schema.Types.Mixed,
    jobMatches: [Schema.Types.Mixed],
    learningRecommendations: Schema.Types.Mixed,
    mockInterview: Schema.Types.Mixed,
    salaryEstimate: Schema.Types.Mixed,
    careerPath: Schema.Types.Mixed,
    coverLetters: [
      {
        jobTitle: String,
        companyName: String,
        coverLetter: String,
        subject: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent recompiling model in development
const CV = mongoose.models.CV || mongoose.model<ICV>('CV', CVSchema);

export default CV;
