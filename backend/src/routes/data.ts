import { Router, type Response } from 'express';
import { z } from 'zod';

import { db } from '../db.js';
import { authRequired, type AuthenticatedRequest } from '../middleware/auth.js';

const listingSchema = z.object({
  publicationMode: z.enum(['loan', 'request']),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.string().trim().min(1),
  photoUri: z.string().trim().optional(),
  targetPeriod: z.string().trim().optional(),
  requiresDeposit: z.boolean().optional(),
  linkedObjectId: z.string().uuid().optional(),
});

const listingPatchSchema = listingSchema.partial();
const loanStateSchema = z.object({
  state: z.enum(['pending', 'accepted', 'completed', 'refused']),
});

const loanRequestSchema = z.object({
  objectId: z.string().uuid(),
  lenderUserId: z.string().uuid(),
  dueText: z.string().trim().min(1).max(100),
});

const messageSchema = z.object({
  text: z.string().trim().min(1).max(280),
});

const proofStateSchema = z.object({
  pickupValidated: z.boolean().optional(),
  returnValidated: z.boolean().optional(),
  pickupReturnDateISO: z.string().datetime().nullable().optional(),
  returnHandbackDateISO: z.string().datetime().nullable().optional(),
  lenderCondition: z.enum(['conforme', 'partiel', 'abime']).nullable().optional(),
  borrowerPickupAccepted: z.boolean().optional(),
  borrowerReturnAccepted: z.boolean().optional(),
  pickupAcceptedAtISO: z.string().datetime().nullable().optional(),
  returnAcceptedAtISO: z.string().datetime().nullable().optional(),
});

function formatLabel(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'récemment';
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function toCategory(value: string | null | undefined) {
  const allowed = new Set(['Bricolage', 'Jardin', 'Cuisine', 'Fête', 'Sport', 'Autre']);
  return value && allowed.has(value) ? value : 'Autre';
}

export const dataRouter = Router();

dataRouter.get('/snapshot', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const authUserId = req.user!.userId;

  const userResult = await db.query(
    `
      select id, first_name, last_name, avatar_url
      from users
      where id = $1
      limit 1
    `,
    [authUserId]
  );

  const profileUser = userResult.rowCount
    ? {
        firstName: String(userResult.rows[0].first_name ?? 'Utilisateur'),
        lastName: String(userResult.rows[0].last_name ?? 'Tooloop'),
        photoUri: String(userResult.rows[0].avatar_url ?? ''),
      }
    : {
        firstName: 'Utilisateur',
        lastName: 'Tooloop',
        photoUri: '',
      };

  const [
    objectsResult,
    loansResult,
    listingsResult,
    publicListingsResult,
    trustProfileResult,
    trustCommentsResult,
    storyRowsResult,
    storyMomentsResult,
    storyPhotosResult,
    successTagsResult,
    userSuccessesResult,
    feedbacksResult,
  ] = await Promise.all([
    db.query(
      `
        select o.id, o.title, o.description, o.image_url, o.distance_km, o.owner_user_id,
               o.response_time_label, o.loops_completed_snapshot, o.is_free, o.category,
               o.trust_score_snapshot, o.impact_kg_co2_snapshot,
               u.display_name as owner_display_name, u.avatar_url as owner_avatar_url
        from objects o
        left join users u on u.id = o.owner_user_id
        where o.is_active = true
        order by o.created_at desc
      `
    ),
    db.query(
      `
        select id, object_id, lender_user_id, borrower_user_id, state, due_text
        from loans
        where lender_user_id = $1 or borrower_user_id = $1
        order by created_at desc
      `,
      [authUserId]
    ),
    db.query(
      `
        select id, object_id, publication_mode, title, description, image_url, category, target_period, requires_deposit, archived_at
        from listings
        where user_id = $1
        order by created_at desc
      `,
      [authUserId]
    ),
    db.query(
      `
        select l.id, l.user_id, l.object_id, l.publication_mode, l.title, l.description,
               l.image_url, l.distance_km, l.requires_deposit, l.category,
               u.display_name as owner_display_name
        from listings l
        left join users u on u.id = l.user_id
        where l.archived_at is null
        order by l.created_at desc
      `
    ),
    db.query(
      `
        select trust_score, loops_validated, exchange_rate, active_weeks, story_contributions_approved, on_time_return_rate, response_rate
        from trust_profiles
        where user_id = $1
        limit 1
      `,
      [authUserId]
    ),
    db.query(
      `
        select id, author_name_snapshot, target_name_snapshot, loan_object_name_snapshot, comment, time_label, created_at
        from trust_exchange_comments
        order by created_at desc
      `
    ),
    db.query('select id, object_id, total_loans, anecdote from object_stories'),
    db.query('select id, object_story_id, label, detail from object_story_moments order by position asc'),
    db.query('select object_story_id, photo_url from object_story_photos order by position asc'),
    db.query('select id, label, condition_type, threshold, description, is_hidden from success_tags'),
    db.query('select success_tag_id from user_successes where user_id = $1', [authUserId]),
    db.query('select id from feedbacks where target_user_id = $1', [authUserId]),
  ]);

  const objectRows = objectsResult.rows as Array<Record<string, unknown>>;
  const publicListingsRows = publicListingsResult.rows as Array<Record<string, unknown>>;

  const discoverFromObjects = objectRows.map((item) => ({
    id: String(item.id),
    title: String(item.title ?? 'Objet'),
    description: String(item.description ?? ''),
    imageUrl: String(item.image_url ?? ''),
    distanceKm: Number(item.distance_km ?? 0),
    ownerUserId: item.owner_user_id ? String(item.owner_user_id) : undefined,
    ownerName: String(item.owner_display_name ?? 'Voisin'),
    responseTime: String(item.response_time_label ?? '—'),
    isPopular: Number(item.loops_completed_snapshot ?? 0) >= 10,
    isFree: Boolean(item.is_free),
    category: toCategory(item.category ? String(item.category) : null),
    trustScore: Number(item.trust_score_snapshot ?? 0),
    loopsCompleted: Number(item.loops_completed_snapshot ?? 0),
    impactKgCo2: Number(item.impact_kg_co2_snapshot ?? 0),
  }));

  const objectIds = new Set(discoverFromObjects.map((item) => item.id));

  const discoverFromListings = publicListingsRows
    .filter((item) => !item.object_id || !objectIds.has(String(item.object_id)))
    .map((item) => ({
      id: String(item.id),
      title: String(item.title ?? 'Objet'),
      description: String(item.description ?? ''),
      imageUrl: String(item.image_url ?? ''),
      distanceKm: Number(item.distance_km ?? 1.2),
      ownerUserId: item.user_id ? String(item.user_id) : undefined,
      ownerName: String(item.owner_display_name ?? 'Voisin'),
      responseTime: 'Réponse rapide',
      isPopular: false,
      isFree: !Boolean(item.requires_deposit),
      category: toCategory(item.category ? String(item.category) : null),
      trustScore: 0,
      loopsCompleted: 0,
      impactKgCo2: 0,
    }));

  const discoverObjects = [...discoverFromObjects, ...discoverFromListings];

  const personalizedSuggestions = discoverObjects
    .map((item) => {
      const reason = item.distanceKm <= 2
        ? 'Très proche de chez toi'
        : item.loopsCompleted >= 5
          ? 'Souvent demandé cette semaine'
          : item.trustScore >= 80
            ? 'Bon score de confiance'
            : null;

      return reason
        ? {
            id: `suggestion-${item.id}`,
            objectId: item.id,
            reason,
          }
        : null;
    })
    .filter(Boolean)
    .slice(0, 3);

  const loansRows = loansResult.rows as Array<Record<string, unknown>>;
  const loanIds = Array.from(new Set(loansRows.map((item) => String(item.id)).filter(Boolean)));

  const [passesResult, messagesResult, proofStateResult, loanUsersResult] = loanIds.length
    ? await Promise.all([
        db.query(
          `
            select loan_id, meetup_label, location_label, code_seed, verifier_code
            from exchange_passes
            where loan_id = any($1::uuid[])
          `,
          [loanIds]
        ),
        db.query(
          `
            select id, loan_id, sender_user_id, sender_kind, text, time_label, created_at
            from (
              select *, row_number() over (partition by loan_id order by created_at desc) as rn
              from exchange_messages
              where loan_id = any($1::uuid[])
            ) ranked
            where rn <= 50
            order by created_at asc
          `,
          [loanIds]
        ),
        db.query(
          `
            select loan_id, pickup_validated, return_validated, pickup_return_date_iso, return_handback_date_iso,
                   lender_condition, borrower_pickup_accepted, borrower_return_accepted, pickup_accepted_at_iso, return_accepted_at_iso
            from loan_proof_state
            where loan_id = any($1::uuid[])
          `,
          [loanIds]
        ),
        db.query(
          `select distinct u.id, u.display_name from users u
           inner join loans l on u.id = l.lender_user_id or u.id = l.borrower_user_id
           where l.id = any($1::uuid[])`,
          [loanIds]
        ),
      ])
    : [
        { rows: [] as Array<Record<string, unknown>> },
        { rows: [] as Array<Record<string, unknown>> },
        { rows: [] as Array<Record<string, unknown>> },
        { rows: [] as Array<Record<string, unknown>> },
      ];

  const loanUsersById = new Map<string, string>();
  loanUsersResult.rows.forEach((item) => {
    loanUsersById.set(String(item.id), String(item.display_name ?? 'Voisin'));
  });

  const objectsById = new Map(discoverObjects.map((item) => [item.id, item]));

  const inboxLoans = loansRows.map((loanItem) => {
    const borrowerUserId = String(loanItem.borrower_user_id ?? '');
    const lenderUserId = String(loanItem.lender_user_id ?? '');
    const isIncoming = borrowerUserId === authUserId;
    const otherUserId = isIncoming ? lenderUserId : borrowerUserId;

    return {
      id: String(loanItem.id),
      objectName: objectsById.get(String(loanItem.object_id ?? ''))?.title ?? 'Objet',
      otherUserName: loanUsersById.get(otherUserId) ?? 'Voisin',
      direction: isIncoming ? 'incoming' : 'outgoing',
      state: String(loanItem.state ?? 'pending'),
      dueText: String(loanItem.due_text ?? 'Mise à jour récente'),
    };
  });

  const exchangePasses = passesResult.rows.map((item) => ({
    loanId: String(item.loan_id),
    meetupLabel: String(item.meetup_label ?? ''),
    locationLabel: String(item.location_label ?? ''),
    codeSeed: String(item.code_seed ?? ''),
    verifierCode: String(item.verifier_code ?? ''),
  }));

  const exchangeChatMessages = messagesResult.rows.map((item) => ({
    id: String(item.id),
    loanId: String(item.loan_id),
    sender:
      item.sender_kind === 'system'
        ? 'system'
        : String(item.sender_user_id ?? '') === authUserId
          ? 'me'
          : 'other',
    text: String(item.text ?? ''),
    timeLabel: item.time_label ? String(item.time_label) : formatLabel(String(item.created_at ?? new Date().toISOString())),
  }));

  const loanProofStateByLoanId = Object.fromEntries(
    proofStateResult.rows.map((item) => [
      String(item.loan_id),
      {
        pickupValidated: Boolean(item.pickup_validated),
        returnValidated: Boolean(item.return_validated),
        pickupReturnDateISO: item.pickup_return_date_iso ? String(item.pickup_return_date_iso) : null,
        returnHandbackDateISO: item.return_handback_date_iso ? String(item.return_handback_date_iso) : null,
        lenderCondition: item.lender_condition ? String(item.lender_condition) : null,
        borrowerPickupAccepted: Boolean(item.borrower_pickup_accepted),
        borrowerReturnAccepted: Boolean(item.borrower_return_accepted),
        pickupAcceptedAtISO: item.pickup_accepted_at_iso ? String(item.pickup_accepted_at_iso) : null,
        returnAcceptedAtISO: item.return_accepted_at_iso ? String(item.return_accepted_at_iso) : null,
      },
    ])
  );

  const listings = listingsResult.rows as Array<Record<string, unknown>>;
  const myItems = listings
    .filter((item) => !item.archived_at)
    .map((item) => ({
      id: String(item.id),
      publicationMode: String(item.publication_mode ?? 'loan'),
      title: String(item.title ?? ''),
      description: String(item.description ?? ''),
      photoUri: item.image_url ? String(item.image_url) : undefined,
      category: toCategory(item.category ? String(item.category) : null),
      targetPeriod: item.target_period ? String(item.target_period) : undefined,
      requiresDeposit: item.requires_deposit === null ? undefined : Boolean(item.requires_deposit),
      linkedObjectId: item.object_id ? String(item.object_id) : undefined,
    }));

  const pastPublications = listings
    .filter((item) => Boolean(item.archived_at))
    .map((item) => ({
      id: String(item.id),
      publicationMode: String(item.publication_mode ?? 'loan'),
      title: String(item.title ?? ''),
      description: String(item.description ?? ''),
      photoUri: item.image_url ? String(item.image_url) : undefined,
      category: toCategory(item.category ? String(item.category) : null),
      targetPeriod: item.target_period ? String(item.target_period) : undefined,
      requiresDeposit: item.requires_deposit === null ? undefined : Boolean(item.requires_deposit),
      linkedObjectId: item.object_id ? String(item.object_id) : undefined,
      archivedAtLabel: item.archived_at ? formatLabel(String(item.archived_at)) : 'Archivée',
    }));

  const trustProfileRow = trustProfileResult.rows[0] as Record<string, unknown> | undefined;
  const trustProfile = trustProfileRow
    ? {
        level: Number(trustProfileRow.trust_score ?? 0) >= 80 ? 'Voisin fiable' : Number(trustProfileRow.trust_score ?? 0) >= 50 ? 'Voisin actif' : 'Nouveau membre',
        trustScore: Number(trustProfileRow.trust_score ?? 0),
        nextLevelAt: 100,
        loopsValidated: Number(trustProfileRow.loops_validated ?? 0),
        exchangeRate: Number(trustProfileRow.exchange_rate ?? 0),
        activeWeeks: Number(trustProfileRow.active_weeks ?? 0),
        storyContributionsApproved: Number(trustProfileRow.story_contributions_approved ?? 0),
        noIncidentMonths: 0,
        onTimeReturnRate: Number(trustProfileRow.on_time_return_rate ?? 0),
        responseRate: Number(trustProfileRow.response_rate ?? 0),
      }
    : {
        level: 'Voisin fiable',
        trustScore: 0,
        nextLevelAt: 100,
        loopsValidated: 0,
        exchangeRate: 0,
        activeWeeks: 0,
        storyContributionsApproved: 0,
        noIncidentMonths: 0,
        onTimeReturnRate: 0,
        responseRate: 0,
      };

  const trustProofs = [
    { id: 'proof-exchange-rate', label: 'Taux d’échange', value: `${trustProfile.exchangeRate}%` },
    { id: 'proof-loops', label: 'Prêts validés', value: `${trustProfile.loopsValidated}` },
    { id: 'proof-on-time', label: 'Retours à temps', value: `${trustProfile.onTimeReturnRate}%` },
  ];

  const trustExchangeComments = trustCommentsResult.rows.map((item) => ({
    id: String(item.id),
    authorName: String(item.author_name_snapshot ?? 'Voisin'),
    targetUserName: item.target_name_snapshot ? String(item.target_name_snapshot) : undefined,
    loanObjectName: String(item.loan_object_name_snapshot ?? 'Objet'),
    comment: String(item.comment ?? ''),
    timeLabel: item.time_label ? String(item.time_label) : formatLabel(String(item.created_at ?? new Date().toISOString())),
  }));

  const profileStats = {
    rating: 5,
    reviews: feedbacksResult.rows.length,
    objects: discoverObjects.filter((item) => item.ownerName === `${profileUser.firstName} ${profileUser.lastName}`).length,
    loans: inboxLoans.length,
  };

  const trustProfilePhotos: Record<string, string> = {
    [`${profileUser.firstName} ${profileUser.lastName}`]: profileUser.photoUri,
  };

  objectRows.forEach((item) => {
    const avatarUrl = item.owner_avatar_url ? String(item.owner_avatar_url) : null;
    if (avatarUrl) {
      trustProfilePhotos[String(item.owner_display_name ?? 'Voisin')] = avatarUrl;
    }
  });

  const storyRows = storyRowsResult.rows as Array<Record<string, unknown>>;
  const storyMoments = storyMomentsResult.rows as Array<Record<string, unknown>>;
  const storyPhotos = storyPhotosResult.rows as Array<Record<string, unknown>>;

  const objectStories = storyRows.map((storyRow) => ({
    objectId: String(storyRow.object_id),
    totalLoans: Number(storyRow.total_loans ?? 0),
    badges: [] as string[],
    anecdote: String(storyRow.anecdote ?? ''),
    moments: storyMoments
      .filter((item) => String(item.object_story_id) === String(storyRow.id))
      .map((item) => ({
        id: String(item.id),
        label: String(item.label ?? ''),
        detail: String(item.detail ?? ''),
      })),
    photoMemories: storyPhotos
      .filter((item) => String(item.object_story_id) === String(storyRow.id))
      .map((item) => String(item.photo_url ?? '')),
  }));

  const completedCount = inboxLoans.filter((item) => item.state === 'completed').length;
  const thisWeekCount = inboxLoans.filter((item) => item.state === 'accepted' || item.state === 'completed').length;

  const neighborhoodPulse = {
    activeNeighbors: loanUsersById.size,
    loopsThisWeek: thisWeekCount,
    co2SavedKgThisWeek: completedCount * 3,
  };

  const collectiveChallenges = [
    {
      id: 'challenge-loops',
      title: 'Boucles validées du quartier',
      progress: Math.max(thisWeekCount, 0),
      target: 50,
      badge: 'Pulse local',
    },
    {
      id: 'challenge-impact',
      title: 'Impact CO2 cumulé',
      progress: Math.max(completedCount * 3, 0),
      target: 200,
      badge: 'Impact vert',
    },
  ];

  const successTags = successTagsResult.rows.map((item) => ({
    id: String(item.id),
    label: String(item.label ?? ''),
    conditionType: String(item.condition_type ?? 'completed_loans'),
    threshold: Number(item.threshold ?? 0),
    description: String(item.description ?? ''),
    isHidden: Boolean(item.is_hidden),
  }));

  const userSuccesses = userSuccessesResult.rows.map((item) => String(item.success_tag_id));

  res.json({
    profileUser,
    discoverObjects,
    personalizedSuggestions,
    inboxLoans,
    profileStats,
    trustProfilePhotos,
    myItems,
    pastPublications,
    trustProfile,
    trustProofs,
    trustExchangeComments,
    exchangePasses,
    exchangeChatMessages,
    loanProofStateByLoanId,
    objectStories,
    collectiveChallenges,
    neighborhoodPulse,
    successTags,
    userSuccesses,
  });
});

dataRouter.post('/listings', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const input = parsed.data;
  const userId = req.user!.userId;
  let objectId = input.linkedObjectId ?? null;

  // For loan listings, auto-create an object if none was linked
  if (input.publicationMode === 'loan' && !objectId) {
    const objResult = await db.query(
      `
        insert into objects (owner_user_id, title, description, category, image_url, is_free, requires_deposit)
        values ($1, $2, $3, $4, $5, $6, $7)
        returning id
      `,
      [
        userId,
        input.title,
        input.description,
        input.category,
        input.photoUri ?? null,
        true,
        typeof input.requiresDeposit === 'boolean' ? input.requiresDeposit : false,
      ]
    );
    objectId = objResult.rows[0]?.id ?? null;
  }

  const result = await db.query(
    `
      insert into listings (
        user_id,
        object_id,
        publication_mode,
        title,
        description,
        category,
        target_period,
        requires_deposit,
        image_url
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id
    `,
    [
      userId,
      objectId,
      input.publicationMode,
      input.title,
      input.description,
      input.category,
      input.targetPeriod ?? null,
      typeof input.requiresDeposit === 'boolean' ? input.requiresDeposit : null,
      input.photoUri ?? null,
    ]
  );

  res.status(201).json({ id: result.rows[0]?.id });
});

dataRouter.patch('/listings/:id', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = listingPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const patch = parsed.data;
  const listingId = req.params.id;

  const currentResult = await db.query('select id from listings where id = $1 and user_id = $2 limit 1', [listingId, req.user!.userId]);
  if (!currentResult.rowCount) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  await db.query(
    `
      update listings
      set object_id = coalesce($1, object_id),
          publication_mode = coalesce($2, publication_mode),
          title = coalesce($3, title),
          description = coalesce($4, description),
          category = coalesce($5, category),
          target_period = coalesce($6, target_period),
          requires_deposit = coalesce($7, requires_deposit),
          image_url = coalesce($8, image_url),
          updated_at = now()
      where id = $9 and user_id = $10
    `,
    [
      patch.linkedObjectId ?? null,
      patch.publicationMode ?? null,
      patch.title ?? null,
      patch.description ?? null,
      patch.category ?? null,
      patch.targetPeriod ?? null,
      typeof patch.requiresDeposit === 'boolean' ? patch.requiresDeposit : null,
      patch.photoUri ?? null,
      listingId,
      req.user!.userId,
    ]
  );

  res.status(204).send();
});

dataRouter.delete('/listings/:id', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const listingId = req.params.id;
  const result = await db.query('delete from listings where id = $1 and user_id = $2 returning id', [listingId, req.user!.userId]);

  if (!result.rowCount) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  res.status(204).send();
});

dataRouter.post('/loans', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = loanRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const borrowerUserId = req.user!.userId;
  const { objectId, lenderUserId, dueText } = parsed.data;

  if (borrowerUserId === lenderUserId) {
    res.status(400).json({ error: 'Cannot borrow your own object' });
    return;
  }

  // Verify the object exists and get the real owner
  const objectCheck = await db.query('select id, owner_user_id from objects where id = $1 limit 1', [objectId]);
  if (!objectCheck.rowCount) {
    res.status(404).json({ error: 'Object not found' });
    return;
  }

  // Use the real owner from the objects table as lender
  const realLenderUserId = String(objectCheck.rows[0].owner_user_id);

  if (borrowerUserId === realLenderUserId) {
    res.status(400).json({ error: 'Cannot borrow your own object' });
    return;
  }

  // Verify lender user exists
  const lenderCheck = await db.query('select id from users where id = $1 limit 1', [realLenderUserId]);
  if (!lenderCheck.rowCount) {
    res.status(404).json({ error: 'Lender not found' });
    return;
  }

  const result = await db.query(
    `
      insert into loans (object_id, lender_user_id, borrower_user_id, state, due_text)
      values ($1, $2, $3, 'pending', $4)
      returning id
    `,
    [objectId, realLenderUserId, borrowerUserId, dueText]
  );

  if (!result.rowCount) {
    res.status(500).json({ error: 'Loan creation failed' });
    return;
  }

  const loanId = String(result.rows[0].id);

  await db.query(
    'insert into app_events (topic, payload) values ($1, $2::jsonb)',
    [
      `loan:${loanId}`,
      JSON.stringify({ type: 'loan_request_created', loanId, objectId, lenderUserId, borrowerUserId }),
    ]
  ).catch(() => {});

  res.status(201).json({ id: loanId });
});

dataRouter.patch('/loans/:id/state', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = loanStateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const loanId = req.params.id;
  const authUserId = req.user!.userId;

  const existing = await db.query(
    `
      select id
      from loans
      where id = $1
        and (lender_user_id = $2 or borrower_user_id = $2)
      limit 1
    `,
    [loanId, authUserId]
  );

  if (!existing.rowCount) {
    res.status(404).json({ error: 'Loan not found' });
    return;
  }

  await db.query(
    `
      update loans
      set state = $1,
          updated_at = now()
      where id = $2
    `,
    [parsed.data.state, loanId]
  );

  await db.query(
    'insert into app_events (topic, payload) values ($1, $2::jsonb)',
    [
      `loan:${loanId}`,
      JSON.stringify({ type: 'loan_state_updated', loanId, state: parsed.data.state, byUserId: authUserId }),
    ]
  );

  res.status(204).send();
});

// Paginated chat messages for a specific loan
dataRouter.get('/loans/:id/messages', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const loanId = req.params.id;
  const authUserId = req.user!.userId;
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const before = typeof req.query.before === 'string' ? req.query.before : undefined;

  const loanResult = await db.query(
    `select id, lender_user_id, borrower_user_id
     from loans where id = $1 limit 1`,
    [loanId]
  );

  if (!loanResult.rowCount) {
    res.status(404).json({ error: 'Loan not found' });
    return;
  }

  const loanRow = loanResult.rows[0] as { lender_user_id: string; borrower_user_id: string };
  const isParticipant = loanRow.lender_user_id === authUserId || loanRow.borrower_user_id === authUserId;
  if (!isParticipant) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const params: unknown[] = [loanId, limit + 1];
  let whereClause = 'loan_id = $1';
  if (before) {
    whereClause += ' and created_at < (select created_at from exchange_messages where id = $3 and loan_id = $1)';
    params.push(before);
  }

  const result = await db.query(
    `select id, loan_id, sender_user_id, sender_kind, text, time_label, created_at
     from exchange_messages
     where ${whereClause}
     order by created_at desc
     limit $2`,
    params
  );

  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;

  const messages = rows.reverse().map((item: Record<string, unknown>) => ({
    id: String(item.id),
    loanId: String(item.loan_id),
    sender:
      item.sender_kind === 'system'
        ? 'system'
        : String(item.sender_user_id ?? '') === authUserId
          ? 'me'
          : 'other',
    text: String(item.text ?? ''),
    timeLabel: item.time_label ? String(item.time_label) : formatLabel(String(item.created_at ?? new Date().toISOString())),
  }));

  res.json({ messages, hasMore });
});

dataRouter.post('/loans/:id/messages', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const loanId = req.params.id;
  const authUserId = req.user!.userId;

  const loanResult = await db.query(
    `
      select id, lender_user_id, borrower_user_id
      from loans
      where id = $1
      limit 1
    `,
    [loanId]
  );

  if (!loanResult.rowCount) {
    res.status(404).json({ error: 'Loan not found' });
    return;
  }

  const loanRow = loanResult.rows[0] as { lender_user_id: string; borrower_user_id: string };
  const isParticipant = loanRow.lender_user_id === authUserId || loanRow.borrower_user_id === authUserId;
  if (!isParticipant) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const insertResult = await db.query(
    `
      insert into exchange_messages (loan_id, sender_user_id, sender_kind, text, time_label)
      values ($1, $2, $3, $4, $5)
      returning id, loan_id, sender_kind, text, time_label, created_at
    `,
    [loanId, authUserId, 'me', parsed.data.text, 'Maintenant']
  );

  const row = insertResult.rows[0] as {
    id: string;
    loan_id: string;
    sender_kind: string;
    text: string;
    time_label: string | null;
    created_at: string;
  };

  await db.query(
    'insert into app_events (topic, payload) values ($1, $2::jsonb)',
    [
      `loan:${loanId}`,
      JSON.stringify({ type: 'loan_message_created', loanId, messageId: row.id, byUserId: authUserId }),
    ]
  );

  res.status(201).json({
    id: row.id,
    loanId: row.loan_id,
    sender: row.sender_kind,
    text: row.text,
    timeLabel: row.time_label ?? formatLabel(row.created_at),
  });
});

dataRouter.patch('/loans/:id/proof-state', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = proofStateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const loanId = req.params.id;
  const authUserId = req.user!.userId;

  const loanResult = await db.query(
    `
      select id
      from loans
      where id = $1 and (lender_user_id = $2 or borrower_user_id = $2)
      limit 1
    `,
    [loanId, authUserId]
  );

  if (!loanResult.rowCount) {
    res.status(404).json({ error: 'Loan not found' });
    return;
  }

  const payload = parsed.data;

  await db.query(
    `
      insert into loan_proof_state (
        loan_id,
        pickup_validated,
        return_validated,
        pickup_return_date_iso,
        return_handback_date_iso,
        lender_condition,
        borrower_pickup_accepted,
        borrower_return_accepted,
        pickup_accepted_at_iso,
        return_accepted_at_iso,
        updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      on conflict (loan_id) do update
      set pickup_validated = coalesce(excluded.pickup_validated, loan_proof_state.pickup_validated),
          return_validated = coalesce(excluded.return_validated, loan_proof_state.return_validated),
          pickup_return_date_iso = coalesce(excluded.pickup_return_date_iso, loan_proof_state.pickup_return_date_iso),
          return_handback_date_iso = coalesce(excluded.return_handback_date_iso, loan_proof_state.return_handback_date_iso),
          lender_condition = coalesce(excluded.lender_condition, loan_proof_state.lender_condition),
          borrower_pickup_accepted = coalesce(excluded.borrower_pickup_accepted, loan_proof_state.borrower_pickup_accepted),
          borrower_return_accepted = coalesce(excluded.borrower_return_accepted, loan_proof_state.borrower_return_accepted),
          pickup_accepted_at_iso = coalesce(excluded.pickup_accepted_at_iso, loan_proof_state.pickup_accepted_at_iso),
          return_accepted_at_iso = coalesce(excluded.return_accepted_at_iso, loan_proof_state.return_accepted_at_iso),
          updated_at = now()
    `,
    [
      loanId,
      payload.pickupValidated ?? null,
      payload.returnValidated ?? null,
      payload.pickupReturnDateISO ?? null,
      payload.returnHandbackDateISO ?? null,
      payload.lenderCondition ?? null,
      payload.borrowerPickupAccepted ?? null,
      payload.borrowerReturnAccepted ?? null,
      payload.pickupAcceptedAtISO ?? null,
      payload.returnAcceptedAtISO ?? null,
    ]
  );

  await db.query(
    'insert into app_events (topic, payload) values ($1, $2::jsonb)',
    [
      `loan:${loanId}`,
      JSON.stringify({ type: 'loan_proof_state_updated', loanId, byUserId: authUserId }),
    ]
  );

  res.status(204).send();
});