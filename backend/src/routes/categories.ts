import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { createCategorySchema } from '../validators/schemas.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, color, icon, is_default')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    categories: (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      isDefault: c.is_default,
    })),
  });
});

router.post('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = createCategorySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { name, color, icon } = parsed.data;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      color: color ?? '#0d9488',
      icon: icon ?? 'tag',
      is_default: false,
    })
    .select('id, name, color, icon, is_default')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({
    category: {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      isDefault: data.is_default,
    },
  });
});

export default router;
