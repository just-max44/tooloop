import { z } from 'zod';

// Copie du schéma utilisé dans app/(tabs)/post.tsx
const publicationSchema = z.object({
  publicationMode: z.enum(['loan', 'request']),
  title: z.string().min(1, {
    message: 'Le nom de l’objet est requis.'
  }),
  description: z.string().min(1, {
    message: 'La description est requise.'
  }),
  photoUri: z.string().optional().or(z.literal('')),
  category: z.string(),
  targetPeriod: z.string().optional().or(z.literal('')),
  requiresDeposit: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.publicationMode === 'loan' && !data.photoUri) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La photo est obligatoire pour un prêt.',
      path: ['photoUri'],
    });
  }
  if (data.publicationMode === 'request' && (!data.targetPeriod || data.targetPeriod.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La période souhaitée est requise.',
      path: ['targetPeriod'],
    });
  }
});

describe('publicationSchema', () => {
  it('valide un prêt correct', () => {
    expect(() => publicationSchema.parse({
      publicationMode: 'loan',
      title: 'Perceuse',
      description: 'Bonne perceuse',
      photoUri: 'photo.jpg',
      category: 'Bricolage',
      targetPeriod: '',
      requiresDeposit: false,
    })).not.toThrow();
  });

  it('rejette un prêt sans photo', () => {
    expect(() => publicationSchema.parse({
      publicationMode: 'loan',
      title: 'Perceuse',
      description: 'Bonne perceuse',
      photoUri: '',
      category: 'Bricolage',
      targetPeriod: '',
      requiresDeposit: false,
    })).toThrow(/photo est obligatoire/);
  });

  it('valide une recherche correcte', () => {
    expect(() => publicationSchema.parse({
      publicationMode: 'request',
      title: 'Perceuse',
      description: 'Besoin urgent',
      photoUri: '',
      category: 'Bricolage',
      targetPeriod: 'ce weekend',
      requiresDeposit: undefined,
    })).not.toThrow();
  });

  it('rejette une recherche sans période', () => {
    expect(() => publicationSchema.parse({
      publicationMode: 'request',
      title: 'Perceuse',
      description: 'Besoin urgent',
      photoUri: '',
      category: 'Bricolage',
      targetPeriod: '',
      requiresDeposit: undefined,
    })).toThrow(/période souhaitée est requise/);
  });
});
