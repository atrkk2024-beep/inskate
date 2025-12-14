// Shared types and constants for InSkate

// User roles
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  SUBSCRIBER = 'subscriber',
  COACH = 'coach',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

// Lesson status
export enum LessonStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
}

// Subscription status
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

// Booking status
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  NO_SHOW = 'no_show',
}

// Booking type
export enum BookingType {
  SINGLE = 'single',
  PACKAGE = 'package',
}

// Payment status
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Video review status
export enum VideoReviewStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  REJECTED = 'rejected',
}

// Comment status
export enum CommentStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
}

// Support ticket status
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// Push notification segments
export enum PushSegment {
  ALL = 'all',
  SUBSCRIBERS = 'subscribers',
  NON_SUBSCRIBERS = 'non_subscribers',
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SendCodeRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

// User types
export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  country: string | null;
  createdAt: Date;
}

// Lesson types
export interface LessonCategory {
  id: string;
  title: string;
  order: number;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  categoryId: string;
  title: string;
  description: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  videoUrl: string;
  isFree: boolean;
  status: LessonStatus;
  order: number;
  publishedAt: Date | null;
  createdAt: Date;
}

// Plan/Subscription types
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  trialDays: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
  active: boolean;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  trialEndAt: Date | null;
  currentPeriodEndAt: Date | null;
  createdAt: Date;
}

// Coach types
export interface Coach {
  id: string;
  name: string;
  level: string | null;
  bio: string | null;
  avatarUrl: string | null;
  socials: Record<string, string>;
  active: boolean;
  createdAt: Date;
}

export interface CoachSlot {
  id: string;
  coachId: string;
  startAt: Date;
  endAt: Date;
  isAvailable: boolean;
}

// Booking types
export interface Booking {
  id: string;
  userId: string;
  coachId: string;
  slotId: string;
  type: BookingType;
  status: BookingStatus;
  price: number;
  currency: string;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

// Video review types
export interface VideoReview {
  id: string;
  userId: string;
  coachId: string | null;
  videoUrl: string;
  status: VideoReviewStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface VideoReviewMessage {
  id: string;
  reviewId: string;
  authorRole: 'user' | 'coach';
  text: string;
  createdAt: Date;
}

// Constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const MOSCOW_TIMEZONE = 'Europe/Moscow';
export const DEFAULT_PUSH_HOUR_MSK = 5; // 05:00 MSK

